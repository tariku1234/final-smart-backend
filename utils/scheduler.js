const cron = require("node-cron")
const Complaint = require("../models/Complaint")
const OfficePerformance = require("../models/OfficePerformance")
const User = require("../models/User")
const {
  COMPLAINT_STAGES,
  COMPLAINT_HANDLERS,
  COMPLAINT_STATUS,
  ESCALATION_TIMEFRAMES,
  USER_ROLES,
} = require("../config/constants")

// Schedule a job to run every hour to check for complaints that need escalation
const scheduleEscalationJobs = () => {
  cron.schedule("0 * * * *", async () => {
    try {
      console.log("Running automatic escalation check...")

      const now = new Date()

      // Find complaints that need escalation based on due dates
      const complaints = await Complaint.find({
        status: { $ne: COMPLAINT_STATUS.RESOLVED },
        $or: [
          {
            currentStage: COMPLAINT_STAGES.STAKEHOLDER_FIRST,
            stakeholderFirstResponseDue: { $lt: now },
          },
          {
            currentStage: COMPLAINT_STAGES.STAKEHOLDER_SECOND,
            stakeholderSecondResponseDue: { $lt: now },
          },
          {
            currentStage: COMPLAINT_STAGES.WEREDA_FIRST,
            weredaFirstResponseDue: { $lt: now },
          },
          {
            currentStage: COMPLAINT_STAGES.WEREDA_SECOND,
            weredaSecondResponseDue: { $lt: now },
          },
          {
            currentStage: COMPLAINT_STAGES.KIFLEKETEMA_FIRST,
            kifleketemaFirstResponseDue: { $lt: now },
          },
          {
            currentStage: COMPLAINT_STAGES.KIFLEKETEMA_SECOND,
            kifleketemaSecondResponseDue: { $lt: now },
          },
        ],
      })

      console.log(`Found ${complaints.length} complaints to escalate`)

      for (const complaint of complaints) {
        let nextStage = ""
        let nextHandler = ""
        let fromStage = ""
        let toStage = ""
        let dueDateField = ""
        let dueDate = null

        // Determine next stage and handler based on current stage
        switch (complaint.currentStage) {
          case COMPLAINT_STAGES.STAKEHOLDER_FIRST:
            nextStage = COMPLAINT_STAGES.STAKEHOLDER_SECOND
            nextHandler = COMPLAINT_HANDLERS.STAKEHOLDER_OFFICE
            dueDateField = "stakeholderSecondResponseDue"
            dueDate = new Date(now.getTime() + ESCALATION_TIMEFRAMES.STAKEHOLDER_RESPONSE)
            break

          case COMPLAINT_STAGES.STAKEHOLDER_SECOND:
            nextStage = COMPLAINT_STAGES.WEREDA_FIRST
            nextHandler = COMPLAINT_HANDLERS.WEREDA_ANTI_CORRUPTION
            fromStage = COMPLAINT_STAGES.STAKEHOLDER_SECOND
            toStage = COMPLAINT_STAGES.WEREDA_FIRST
            dueDateField = "weredaFirstResponseDue"
            dueDate = new Date(now.getTime() + ESCALATION_TIMEFRAMES.WEREDA_RESPONSE)
            break

          case COMPLAINT_STAGES.WEREDA_FIRST:
            nextStage = COMPLAINT_STAGES.WEREDA_SECOND
            nextHandler = COMPLAINT_HANDLERS.WEREDA_ANTI_CORRUPTION
            dueDateField = "weredaSecondResponseDue"
            dueDate = new Date(now.getTime() + ESCALATION_TIMEFRAMES.WEREDA_RESPONSE)
            break

          case COMPLAINT_STAGES.WEREDA_SECOND:
            nextStage = COMPLAINT_STAGES.KIFLEKETEMA_FIRST
            nextHandler = COMPLAINT_HANDLERS.KIFLEKETEMA_ANTI_CORRUPTION
            fromStage = COMPLAINT_STAGES.WEREDA_SECOND
            toStage = COMPLAINT_STAGES.KIFLEKETEMA_FIRST
            dueDateField = "kifleketemaFirstResponseDue"
            dueDate = new Date(now.getTime() + ESCALATION_TIMEFRAMES.KIFLEKETEMA_RESPONSE)
            break

          case COMPLAINT_STAGES.KIFLEKETEMA_FIRST:
            nextStage = COMPLAINT_STAGES.KIFLEKETEMA_SECOND
            nextHandler = COMPLAINT_HANDLERS.KIFLEKETEMA_ANTI_CORRUPTION
            dueDateField = "kifleketemaSecondResponseDue"
            dueDate = new Date(now.getTime() + ESCALATION_TIMEFRAMES.KIFLEKETEMA_RESPONSE)
            break

          case COMPLAINT_STAGES.KIFLEKETEMA_SECOND:
            nextStage = COMPLAINT_STAGES.KENTIBA
            nextHandler = COMPLAINT_HANDLERS.KENTIBA_BIRO
            fromStage = COMPLAINT_STAGES.KIFLEKETEMA_SECOND
            toStage = COMPLAINT_STAGES.KENTIBA
            break

          default:
            continue // Skip to next complaint if already at final stage
        }

        // Update complaint
        complaint.currentStage = nextStage
        complaint.currentHandler = nextHandler
        complaint.status = COMPLAINT_STATUS.PENDING
        complaint.updatedAt = now

        // Set new due date if applicable
        if (dueDateField && dueDate) {
          complaint[dueDateField] = dueDate
        }

        // Add to escalation history if moving to a new handler
        if (fromStage && toStage) {
          const reason = "Automatically escalated due to response deadline passing"

          complaint.escalationHistory.push({
            from:
              complaint.currentHandler === COMPLAINT_HANDLERS.WEREDA_ANTI_CORRUPTION
                ? COMPLAINT_HANDLERS.STAKEHOLDER_OFFICE
                : COMPLAINT_HANDLERS.WEREDA_ANTI_CORRUPTION,
            to: nextHandler,
            reason,
            date: now,
          })

          // Record failure for the office
          let officeId
          let officeRole

          if (fromStage === COMPLAINT_STAGES.STAKEHOLDER_SECOND) {
            officeId = complaint.stakeholderOffice
            officeRole = COMPLAINT_HANDLERS.STAKEHOLDER_OFFICE
          } else if (fromStage === COMPLAINT_STAGES.WEREDA_SECOND) {
            // Find a Wereda officer
            const weredaOfficer = await User.findOne({ role: USER_ROLES.WEREDA_ANTI_CORRUPTION })
            if (weredaOfficer) {
              officeId = weredaOfficer._id
              officeRole = COMPLAINT_HANDLERS.WEREDA_ANTI_CORRUPTION
            }
          } else if (fromStage === COMPLAINT_STAGES.KIFLEKETEMA_SECOND) {
            // Find a Kifleketema officer
            const kifleketemaOfficer = await User.findOne({ role: USER_ROLES.KIFLEKETEMA_ANTI_CORRUPTION })
            if (kifleketemaOfficer) {
              officeId = kifleketemaOfficer._id
              officeRole = COMPLAINT_HANDLERS.KIFLEKETEMA_ANTI_CORRUPTION
            }
          }

          if (officeId && officeRole) {
            let officePerformance = await OfficePerformance.findOne({
              office: officeId,
              officeRole,
            })

            if (!officePerformance) {
              officePerformance = new OfficePerformance({
                office: officeId,
                officeRole,
              })
            }

            officePerformance.escalatedComplaints += 1
            officePerformance.failureRecords.push({
              complaint: complaint._id,
              escalatedFrom: fromStage,
              escalatedTo: toStage,
              reason,
              date: now,
            })

            officePerformance.updatedAt = now
            await officePerformance.save()
          }
        }

        await complaint.save()
        console.log(`Escalated complaint ${complaint._id} from ${complaint.currentStage} to ${nextStage}`)
      }

      console.log("Automatic escalation check completed")
    } catch (err) {
      console.error("Automatic escalation error:", err)
    }
  })
}

module.exports = { scheduleEscalationJobs }

