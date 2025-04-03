const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const auth = require("../middleware/auth")

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, idNumber, address, role } = req.body

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

    // Create new user
    user = new User({
      firstName,
      lastName,
      email,
      phone,
      password,
      idNumber,
      address,
      role: role || "citizen", // Default to citizen if no role provided
    })

    await user.save()

    res.status(201).json({ message: "User registered successfully" })
  } catch (err) {
    console.error("Registration error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Check if user exists
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Check password
    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Create and sign JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    }

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" }, (err, token) => {
      if (err) throw err

      // Return user info and token
      res.json({
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      })
    })
  } catch (err) {
    console.error("Login error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({ user })
  } catch (err) {
    console.error("Get user error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   POST api/auth/forgot-password
// @desc    Send password reset code
// @access  Public
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body

    // Check if user exists
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Generate a random 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Store the reset code and expiration time (1 hour from now)
    user.resetCode = resetCode
    user.resetCodeExpires = new Date(Date.now() + 3600000) // 1 hour
    await user.save()

    // In a real application, you would send an email with the reset code
    // For this demo, we'll just return success
    console.log(`Reset code for ${email}: ${resetCode}`)

    res.json({ message: "Reset code sent to your email" })
  } catch (err) {
    console.error("Forgot password error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   POST api/auth/verify-reset-code
// @desc    Verify reset code
// @access  Public
router.post("/verify-reset-code", async (req, res) => {
  try {
    const { email, resetCode } = req.body

    // Find user by email and check if reset code is valid and not expired
    const user = await User.findOne({
      email,
      resetCode,
      resetCodeExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset code" })
    }

    res.json({ message: "Reset code verified successfully" })
  } catch (err) {
    console.error("Verify reset code error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   POST api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post("/reset-password", async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body

    // Find user by email and check if reset code is valid and not expired
    const user = await User.findOne({
      email,
      resetCode,
      resetCodeExpires: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset code" })
    }

    // Update password
    user.password = newPassword

    // Clear reset code and expiration
    user.resetCode = undefined
    user.resetCodeExpires = undefined

    await user.save()

    res.json({ message: "Password reset successfully" })
  } catch (err) {
    console.error("Reset password error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router

