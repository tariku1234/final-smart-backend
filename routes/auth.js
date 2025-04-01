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

module.exports = router

