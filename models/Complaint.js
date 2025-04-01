const mongoose = require("mongoose")

const ComplaintSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  // The office this complaint is directed to
  stakeholderOffice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // Current stage of the complaint
  currentStage: {
    type: String,
    enum: [
      "stakeholder_first",
      "stakeholder_second",
      "wereda_first",
      "wereda_second",
      "kifleketema_first",
      "kifleketema_second",
      "kentiba",
    ],
    default: "stakeholder_first",
  },
  // Current handler of the complaint
  currentHandler: {
    type: String,
    enum: ["stakeholder_office", "wereda_anti_corruption", "kifleketema_anti_corruption", "kentiba_biro"],
    default: "stakeholder_office",
  },
  status: {
    type: String,
    enum: ["pending", "in_progress", "resolved", "escalated"],
    default: "pending",
  },
  location: {
    type: String,
    required: true,
  },
  attachments: {
    type: [String],
  },
  // Timestamps for escalation tracking
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  stakeholderFirstResponseDue: {
    type: Date,
  },
  stakeholderSecondResponseDue: {
    type: Date,
  },
  weredaFirstResponseDue: {
    type: Date,
  },
  weredaSecondResponseDue: {
    type: Date,
  },
  kifleketemaFirstResponseDue: {
    type: Date,
  },
  kifleketemaSecondResponseDue: {
    type: Date,
  },
  // Escalation history
  escalationHistory: [
    {
      from: {
        type: String,
        enum: ["stakeholder_office", "wereda_anti_corruption", "kifleketema_anti_corruption"],
      },
      to: {
        type: String,
        enum: ["wereda_anti_corruption", "kifleketema_anti_corruption", "kentiba_biro"],
      },
      reason: String,
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  // Responses from different offices
  responses: [
    {
      responder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      responderRole: {
        type: String,
        enum: ["stakeholder_office", "wereda_anti_corruption", "kifleketema_anti_corruption", "kentiba_biro"],
      },
      response: String,
      status: {
        type: String,
        enum: ["pending", "in_progress", "resolved", "escalated"],
      },
      internalComment: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  // Final resolution details
  resolution: {
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolverRole: {
      type: String,
      enum: ["stakeholder_office", "wereda_anti_corruption", "kifleketema_anti_corruption", "kentiba_biro"],
    },
    resolution: String,
    resolvedAt: Date,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  // For second stage complaints
  additionalDetails: {
    type: String,
  },
  relatedComplaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Complaint",
  },
  secondStageComplaint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Complaint",
  },
})

// Set due dates for responses when a complaint is created
ComplaintSchema.pre("save", function (next) {
  if (this.isNew) {
    const now = new Date()

    // Set stakeholder office response due dates (3 days)
    this.stakeholderFirstResponseDue = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    // Other due dates will be set when escalated
  }

  this.updatedAt = new Date()
  next()
})

module.exports = mongoose.model("Complaint", ComplaintSchema)

