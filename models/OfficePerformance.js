const mongoose = require("mongoose")

const OfficePerformanceSchema = new mongoose.Schema({
  office: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  officeRole: {
    type: String,
    enum: ["stakeholder_office", "wereda_anti_corruption", "kifleketema_anti_corruption"],
    required: true,
  },
  // Performance metrics
  totalComplaints: {
    type: Number,
    default: 0,
  },
  resolvedComplaints: {
    type: Number,
    default: 0,
  },
  escalatedComplaints: {
    type: Number,
    default: 0,
  },
  averageResolutionTime: {
    type: Number, // in days
    default: 0,
  },
  // Records of failures (escalations)
  failureRecords: [
    {
      complaint: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Complaint",
      },
      escalatedFrom: {
        type: String,
        enum: [
          "stakeholder_first",
          "stakeholder_second",
          "wereda_first",
          "wereda_second",
          "kifleketema_first",
          "kifleketema_second",
        ],
      },
      escalatedTo: {
        type: String,
        enum: ["wereda_first", "kifleketema_first", "kentiba"],
      },
      reason: String,
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("OfficePerformance", OfficePerformanceSchema)

