const mongoose = require("mongoose")

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  requirements: {
    type: [String],
    required: true,
  },
  procedure: {
    type: [String],
    required: true,
  },
  contactInfo: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("Document", DocumentSchema)

