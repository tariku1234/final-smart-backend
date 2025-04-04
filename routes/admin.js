const express = require("express")
const router = express.Router()
const User = require("../models/User")
const auth = require("../middleware/auth")
const { USER_ROLES, ADMIN_REGISTRATION_CODES } = require("../config/constants")

// @route   POST api/admin/register-admin
// @desc    Register a new administrator
// @access  Public
router.post("/register-admin", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, idNumber, address, role, adminCode, kifleketema, wereda } =
      req.body

    // Validate admin role
    if (!["wereda_anti_corruption", "kifleketema_anti_corruption", "kentiba_biro"].includes(role)) {
      return res.status(400).json({ message: "Invalid administrator role" })
    }

    // Verify admin registration code
    if (adminCode !== ADMIN_REGISTRATION_CODES[role]) {
      return res.status(400).json({ message: "Invalid administrator registration code" })
    }

    // Check if user already exists
    let user = await User.findOne({ email })

    if (user) {
      return res.status(400).json({ message: "User already exists" })
    }

    // Check if ID number is already registered
    user = await User.findOne({ idNumber })

    if (user) {
      return res.status(400).json({ message: "ID number is already registered" })
    }

    // Create new admin user
    user = new User({
      firstName,
      lastName,
      email,
      phone,
      password,
      idNumber,
      address,
      role,
      kifleketema,
      wereda,
      // Kentiba Biro is automatically approved, others need approval
      isApproved: role === "kentiba_biro",
    })

    await user.save()

    res.status(201).json({
      message:
        role === "kentiba_biro"
          ? "Administrator registered successfully"
          : "Administrator registered successfully. Pending approval from Kentiba Biro.",
    })
  } catch (err) {
    console.error("Admin registration error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET api/admin/pending-admins
// @desc    Get all pending admin approvals
// @access  Private (Kentiba Biro only)
router.get("/pending-admins", auth, async (req, res) => {
  try {
    // Check if user is Kentiba Biro
    if (req.user.role !== USER_ROLES.KENTIBA_BIRO) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const pendingAdmins = await User.find({
      role: { $in: [USER_ROLES.WEREDA_ANTI_CORRUPTION, USER_ROLES.KIFLEKETEMA_ANTI_CORRUPTION] },
      isApproved: false,
    }).select("-password")

    res.json({ pendingAdmins })
  } catch (err) {
    console.error("Get pending admins error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT api/admin/:id/approve
// @desc    Approve an administrator
// @access  Private (Kentiba Biro only)
router.put("/:id/approve", auth, async (req, res) => {
  try {
    // Check if user is Kentiba Biro
    if (req.user.role !== USER_ROLES.KENTIBA_BIRO) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const admin = await User.findById(req.params.id)

    if (!admin) {
      return res.status(404).json({ message: "Administrator not found" })
    }

    if (![USER_ROLES.WEREDA_ANTI_CORRUPTION, USER_ROLES.KIFLEKETEMA_ANTI_CORRUPTION].includes(admin.role)) {
      return res.status(400).json({ message: "User is not a Wereda or Kifleketema administrator" })
    }

    admin.isApproved = true
    await admin.save()

    res.json({
      message: "Administrator approved successfully",
      admin: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role,
        kifleketema: admin.kifleketema,
        wereda: admin.wereda,
        isApproved: admin.isApproved,
      },
    })
  } catch (err) {
    console.error("Approve admin error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT api/admin/:id/reject
// @desc    Reject an administrator
// @access  Private (Kentiba Biro only)
router.put("/:id/reject", auth, async (req, res) => {
  try {
    // Check if user is Kentiba Biro
    if (req.user.role !== USER_ROLES.KENTIBA_BIRO) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const { reason } = req.body

    if (!reason) {
      return res.status(400).json({ message: "Rejection reason is required" })
    }

    const admin = await User.findById(req.params.id)

    if (!admin) {
      return res.status(404).json({ message: "Administrator not found" })
    }

    if (![USER_ROLES.WEREDA_ANTI_CORRUPTION, USER_ROLES.KIFLEKETEMA_ANTI_CORRUPTION].includes(admin.role)) {
      return res.status(400).json({ message: "User is not a Wereda or Kifleketema administrator" })
    }

    // Delete the admin
    await admin.remove()

    res.json({ message: "Administrator rejected and removed" })
  } catch (err) {
    console.error("Reject admin error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET api/admin/user-statistics
// @desc    Get user statistics
// @access  Private (Kentiba Biro only)
router.get("/user-statistics", auth, async (req, res) => {
  try {
    // Check if user is Kentiba Biro
    if (req.user.role !== USER_ROLES.KENTIBA_BIRO) {
      return res.status(403).json({ message: "Not authorized" })
    }

    // Get counts for different user types
    const citizensCount = await User.countDocuments({ role: USER_ROLES.CITIZEN })

    const stakeholdersTotal = await User.countDocuments({ role: USER_ROLES.STAKEHOLDER_OFFICE })
    const stakeholdersApproved = await User.countDocuments({
      role: USER_ROLES.STAKEHOLDER_OFFICE,
      isApproved: true,
    })
    const stakeholdersPending = await User.countDocuments({
      role: USER_ROLES.STAKEHOLDER_OFFICE,
      isApproved: false,
    })

    const weredaAdminsTotal = await User.countDocuments({ role: USER_ROLES.WEREDA_ANTI_CORRUPTION })
    const weredaAdminsApproved = await User.countDocuments({
      role: USER_ROLES.WEREDA_ANTI_CORRUPTION,
      isApproved: true,
    })
    const weredaAdminsPending = await User.countDocuments({
      role: USER_ROLES.WEREDA_ANTI_CORRUPTION,
      isApproved: false,
    })

    const kifleketemaAdminsTotal = await User.countDocuments({ role: USER_ROLES.KIFLEKETEMA_ANTI_CORRUPTION })
    const kifleketemaAdminsApproved = await User.countDocuments({
      role: USER_ROLES.KIFLEKETEMA_ANTI_CORRUPTION,
      isApproved: true,
    })
    const kifleketemaAdminsPending = await User.countDocuments({
      role: USER_ROLES.KIFLEKETEMA_ANTI_CORRUPTION,
      isApproved: false,
    })

    const kentibaAdminsCount = await User.countDocuments({ role: USER_ROLES.KENTIBA_BIRO })

    // Get statistics by location
    // Stakeholders by location
    const stakeholdersByLocation = {}
    const stakeholders = await User.find({ role: USER_ROLES.STAKEHOLDER_OFFICE })

    stakeholders.forEach((stakeholder) => {
      if (stakeholder.kifleketema && stakeholder.wereda) {
        if (!stakeholdersByLocation[stakeholder.kifleketema]) {
          stakeholdersByLocation[stakeholder.kifleketema] = {}
        }

        if (!stakeholdersByLocation[stakeholder.kifleketema][stakeholder.wereda]) {
          stakeholdersByLocation[stakeholder.kifleketema][stakeholder.wereda] = {
            total: 0,
            approved: 0,
            pending: 0,
          }
        }

        stakeholdersByLocation[stakeholder.kifleketema][stakeholder.wereda].total++

        if (stakeholder.isApproved) {
          stakeholdersByLocation[stakeholder.kifleketema][stakeholder.wereda].approved++
        } else {
          stakeholdersByLocation[stakeholder.kifleketema][stakeholder.wereda].pending++
        }
      }
    })

    // Wereda admins by location
    const weredaAdminsByLocation = {}
    const weredaAdmins = await User.find({ role: USER_ROLES.WEREDA_ANTI_CORRUPTION })

    weredaAdmins.forEach((admin) => {
      if (admin.kifleketema && admin.wereda) {
        if (!weredaAdminsByLocation[admin.kifleketema]) {
          weredaAdminsByLocation[admin.kifleketema] = {}
        }

        if (!weredaAdminsByLocation[admin.kifleketema][admin.wereda]) {
          weredaAdminsByLocation[admin.kifleketema][admin.wereda] = {
            total: 0,
            approved: 0,
            pending: 0,
          }
        }

        weredaAdminsByLocation[admin.kifleketema][admin.wereda].total++

        if (admin.isApproved) {
          weredaAdminsByLocation[admin.kifleketema][admin.wereda].approved++
        } else {
          weredaAdminsByLocation[admin.kifleketema][admin.wereda].pending++
        }
      }
    })

    // Kifleketema admins by location
    const kifleketemaAdminsByLocation = {}
    const kifleketemaAdmins = await User.find({ role: USER_ROLES.KIFLEKETEMA_ANTI_CORRUPTION })

    kifleketemaAdmins.forEach((admin) => {
      if (admin.kifleketema) {
        if (!kifleketemaAdminsByLocation[admin.kifleketema]) {
          kifleketemaAdminsByLocation[admin.kifleketema] = {
            total: 0,
            approved: 0,
            pending: 0,
          }
        }

        kifleketemaAdminsByLocation[admin.kifleketema].total++

        if (admin.isApproved) {
          kifleketemaAdminsByLocation[admin.kifleketema].approved++
        } else {
          kifleketemaAdminsByLocation[admin.kifleketema].pending++
        }
      }
    })

    const stats = {
      citizens: {
        total: citizensCount,
      },
      stakeholders: {
        total: stakeholdersTotal,
        approved: stakeholdersApproved,
        pending: stakeholdersPending,
        byLocation: stakeholdersByLocation,
      },
      weredaAdmins: {
        total: weredaAdminsTotal,
        approved: weredaAdminsApproved,
        pending: weredaAdminsPending,
        byLocation: weredaAdminsByLocation,
      },
      kifleketemaAdmins: {
        total: kifleketemaAdminsTotal,
        approved: kifleketemaAdminsApproved,
        pending: kifleketemaAdminsPending,
        byLocation: kifleketemaAdminsByLocation,
      },
      kentibaAdmins: {
        total: kentibaAdminsCount,
      },
    }

    res.json({ stats })
  } catch (err) {
    console.error("Get user statistics error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET api/admin/performance-stats
// @desc    Get performance statistics for all offices and administrators
// @access  Private (Kentiba Biro only)
router.get("/performance-stats", auth, async (req, res) => {
  try {
    // Check if user is Kentiba Biro
    if (req.user.role !== USER_ROLES.KENTIBA_BIRO) {
      return res.status(403).json({ message: "Not authorized" })
    }

    // Get stakeholder office performance stats
    const stakeholderOffices = await User.aggregate([
      { $match: { role: USER_ROLES.STAKEHOLDER_OFFICE, isApproved: true } },
      {
        $lookup: {
          from: "officeperformances",
          localField: "_id",
          foreignField: "office",
          as: "performance",
        },
      },
      {
        $project: {
          _id: 1,
          officeName: 1,
          officeType: 1,
          kifleketema: 1,
          wereda: 1,
          totalComplaints: { $ifNull: [{ $arrayElemAt: ["$performance.totalComplaints", 0] }, 0] },
          resolvedComplaints: { $ifNull: [{ $arrayElemAt: ["$performance.resolvedComplaints", 0] }, 0] },
          escalatedComplaints: { $ifNull: [{ $arrayElemAt: ["$performance.escalatedComplaints", 0] }, 0] },
          averageResolutionTime: { $ifNull: [{ $arrayElemAt: ["$performance.averageResolutionTime", 0] }, 0] },
        },
      },
    ])

    // Get Wereda admin performance stats
    const weredaAdmins = await User.aggregate([
      { $match: { role: USER_ROLES.WEREDA_ANTI_CORRUPTION, isApproved: true } },
      {
        $lookup: {
          from: "officeperformances",
          localField: "_id",
          foreignField: "office",
          as: "performance",
        },
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          kifleketema: 1,
          wereda: 1,
          totalComplaints: { $ifNull: [{ $arrayElemAt: ["$performance.totalComplaints", 0] }, 0] },
          resolvedComplaints: { $ifNull: [{ $arrayElemAt: ["$performance.resolvedComplaints", 0] }, 0] },
          escalatedComplaints: { $ifNull: [{ $arrayElemAt: ["$performance.escalatedComplaints", 0] }, 0] },
          averageResolutionTime: { $ifNull: [{ $arrayElemAt: ["$performance.averageResolutionTime", 0] }, 0] },
        },
      },
    ])

    // Get Kifleketema admin performance stats
    const kifleketemaAdmins = await User.aggregate([
      { $match: { role: USER_ROLES.KIFLEKETEMA_ANTI_CORRUPTION, isApproved: true } },
      {
        $lookup: {
          from: "officeperformances",
          localField: "_id",
          foreignField: "office",
          as: "performance",
        },
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          kifleketema: 1,
          totalComplaints: { $ifNull: [{ $arrayElemAt: ["$performance.totalComplaints", 0] }, 0] },
          resolvedComplaints: { $ifNull: [{ $arrayElemAt: ["$performance.resolvedComplaints", 0] }, 0] },
          escalatedComplaints: { $ifNull: [{ $arrayElemAt: ["$performance.escalatedComplaints", 0] }, 0] },
          averageResolutionTime: { $ifNull: [{ $arrayElemAt: ["$performance.averageResolutionTime", 0] }, 0] },
        },
      },
    ])

    // Group performance stats by location
    const stakeholderOfficesByLocation = {}
    stakeholderOffices.forEach((office) => {
      if (office.kifleketema && office.wereda) {
        if (!stakeholderOfficesByLocation[office.kifleketema]) {
          stakeholderOfficesByLocation[office.kifleketema] = {}
        }

        if (!stakeholderOfficesByLocation[office.kifleketema][office.wereda]) {
          stakeholderOfficesByLocation[office.kifleketema][office.wereda] = []
        }

        stakeholderOfficesByLocation[office.kifleketema][office.wereda].push(office)
      }
    })

    const weredaAdminsByLocation = {}
    weredaAdmins.forEach((admin) => {
      if (admin.kifleketema && admin.wereda) {
        if (!weredaAdminsByLocation[admin.kifleketema]) {
          weredaAdminsByLocation[admin.kifleketema] = {}
        }

        if (!weredaAdminsByLocation[admin.kifleketema][admin.wereda]) {
          weredaAdminsByLocation[admin.kifleketema][admin.wereda] = []
        }

        weredaAdminsByLocation[admin.kifleketema][admin.wereda].push(admin)
      }
    })

    const kifleketemaAdminsByLocation = {}
    kifleketemaAdmins.forEach((admin) => {
      if (admin.kifleketema) {
        if (!kifleketemaAdminsByLocation[admin.kifleketema]) {
          kifleketemaAdminsByLocation[admin.kifleketema] = []
        }

        kifleketemaAdminsByLocation[admin.kifleketema].push(admin)
      }
    })

    res.json({
      stats: {
        stakeholderOffices,
        weredaAdmins,
        kifleketemaAdmins,
        byLocation: {
          stakeholderOffices: stakeholderOfficesByLocation,
          weredaAdmins: weredaAdminsByLocation,
          kifleketemaAdmins: kifleketemaAdminsByLocation,
        },
      },
    })
  } catch (err) {
    console.error("Get performance stats error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router

