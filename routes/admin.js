const express = require("express")
const router = express.Router()
const User = require("../models/User")
const auth = require("../middleware/auth")
const { USER_ROLES } = require("../config/constants")

// Admin registration code (should be stored securely in environment variables in production)
const ADMIN_REGISTRATION_CODES = {
  wereda_anti_corruption: "wereda-code-123",
  kifleketema_anti_corruption: "kifleketema-code-456",
  kentiba_biro: "kentiba-code-789",
}

// @route   POST api/admin/register-admin
// @desc    Register an administrator
// @access  Public (but requires admin code)
router.post("/register-admin", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, idNumber, address, role, adminCode } = req.body

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
    })

    await user.save()

    res.status(201).json({ message: "Administrator registered successfully" })
  } catch (err) {
    console.error("Admin registration error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router

