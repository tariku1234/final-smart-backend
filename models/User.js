const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  idNumber: {
    type: String,
    required: true,
    unique: true,
  },
  address: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["citizen", "stakeholder_office", "wereda_anti_corruption", "kifleketema_anti_corruption", "kentiba_biro"],
    default: "citizen",
  },
  // For stakeholder offices
  officeName: {
    type: String,
  },
  officeType: {
    type: String,
    enum: [
      "trade_office",
      "id_office",
      "land_office",
      "tax_office",
      "court_office",
      "police_office",
      "education_office",
      "health_office",
      "transport_office",
      "water_office",
      "electricity_office",
      "telecom_office",
      "immigration_office",
      "social_affairs_office",
      "other",
    ],
  },
  officeAddress: {
    type: String,
  },
  officePhone: {
    type: String,
  },
  // New fields for Kifleketema and Wereda
  kifleketema: {
    type: String,
    enum: [
      "Lemi Kura",
      "Arada",
      "Addis Ketema",
      "Lideta",
      "Kirkos",
      "Yeka",
      "Bole",
      "Akaky Kaliti",
      "Nifas Silk-Lafto",
      "Kolfe Keranio",
      "Gulele",
    ],
  },
  wereda: {
    type: String,
  },
  resetCode: {
    type: String,
  },
  resetCodeExpires: {
    type: Date,
  },
  isApproved: {
    type: Boolean,
    default: function () {
      // Kentiba Biro is automatically approved
      return this.role === "kentiba_biro"
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next()
  }

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (err) {
    next(err)
  }
})

// Method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.model("User", UserSchema)

