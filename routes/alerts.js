const express = require("express")
const router = express.Router()
const Alert = require("../models/Alert")
const auth = require("../middleware/auth")

// @route   GET api/alerts
// @desc    Get all alerts
// @access  Public
router.get("/", async (req, res) => {
  try {
    const query = {}

    // Filter by priority if provided
    if (req.query.priority && req.query.priority !== "all") {
      query.priority = req.query.priority
    }

    // Only show active alerts (not expired)
    query.expiresAt = { $gt: new Date() }

    // Limit results if specified
    const limit = req.query.limit ? Number.parseInt(req.query.limit) : 0

    const alerts = await Alert.find(query).sort({ priority: 1, createdAt: -1 }).limit(limit)

    res.json({ alerts })
  } catch (err) {
    console.error("Get alerts error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET api/alerts/:id
// @desc    Get alert by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" })
    }

    res.json({ alert })
  } catch (err) {
    console.error("Get alert error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   POST api/alerts
// @desc    Create a new alert
// @access  Private (Admin only)
router.post("/", auth, async (req, res) => {
  try {
    // Check if user is an admin
    if (req.user.role === "citizen") {
      return res.status(403).json({ message: "Not authorized" })
    }

    const { title, description, priority, location, expiresAt } = req.body

    // Create new alert
    const alert = new Alert({
      title,
      description,
      priority,
      location,
      createdBy: req.user.id,
      expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
    })

    await alert.save()

    res.status(201).json({
      message: "Alert created successfully",
      alert,
    })
  } catch (err) {
    console.error("Create alert error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT api/alerts/:id
// @desc    Update an alert
// @access  Private (Admin only)
router.put("/:id", auth, async (req, res) => {
  try {
    // Check if user is an admin
    if (req.user.role === "citizen") {
      return res.status(403).json({ message: "Not authorized" })
    }

    const { title, description, priority, location, expiresAt } = req.body

    const alert = await Alert.findById(req.params.id)

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" })
    }

    // Update alert
    alert.title = title
    alert.description = description
    alert.priority = priority
    alert.location = location

    if (expiresAt) {
      alert.expiresAt = expiresAt
    }

    await alert.save()

    res.json({
      message: "Alert updated successfully",
      alert,
    })
  } catch (err) {
    console.error("Update alert error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   DELETE api/alerts/:id
// @desc    Delete an alert
// @access  Private (Admin only)
router.delete("/:id", auth, async (req, res) => {
  try {
    // Check if user is an admin
    if (req.user.role === "citizen") {
      return res.status(403).json({ message: "Not authorized" })
    }

    const alert = await Alert.findById(req.params.id)

    if (!alert) {
      return res.status(404).json({ message: "Alert not found" })
    }

    await alert.remove()

    res.json({ message: "Alert removed" })
  } catch (err) {
    console.error("Delete alert error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router

