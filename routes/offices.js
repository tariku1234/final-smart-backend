const express = require("express")
const router = express.Router()
const Office = require("../models/Office")
const auth = require("../middleware/auth")

// @route   GET api/offices
// @desc    Get all offices
// @access  Public
router.get("/", async (req, res) => {
  try {
    const query = {}

    // Filter by status if provided
    if (req.query.status && req.query.status !== "all") {
      query.status = req.query.status
    }

    // Limit results if specified
    const limit = req.query.limit ? Number.parseInt(req.query.limit) : 0

    const offices = await Office.find(query).sort({ name: 1 }).limit(limit)

    res.json({ offices })
  } catch (err) {
    console.error("Get offices error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET api/offices/:id
// @desc    Get office by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const office = await Office.findById(req.params.id)

    if (!office) {
      return res.status(404).json({ message: "Office not found" })
    }

    res.json({ office })
  } catch (err) {
    console.error("Get office error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   POST api/offices
// @desc    Create a new office
// @access  Private (Admin only)
router.post("/", auth, async (req, res) => {
  try {
    // Check if user is an admin
    if (req.user.role === "citizen") {
      return res.status(403).json({ message: "Not authorized" })
    }

    const { name, description, location, hours, contact, status } = req.body

    // Create new office
    const office = new Office({
      name,
      description,
      location,
      hours,
      contact,
      status,
    })

    await office.save()

    res.status(201).json({
      message: "Office created successfully",
      office,
    })
  } catch (err) {
    console.error("Create office error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT api/offices/:id
// @desc    Update an office
// @access  Private (Admin only)
router.put("/:id", auth, async (req, res) => {
  try {
    // Check if user is an admin
    if (req.user.role === "citizen") {
      return res.status(403).json({ message: "Not authorized" })
    }

    const { name, description, location, hours, contact, status } = req.body

    const office = await Office.findById(req.params.id)

    if (!office) {
      return res.status(404).json({ message: "Office not found" })
    }

    // Update office
    office.name = name
    office.description = description
    office.location = location
    office.hours = hours
    office.contact = contact
    office.status = status
    office.updatedAt = Date.now()

    await office.save()

    res.json({
      message: "Office updated successfully",
      office,
    })
  } catch (err) {
    console.error("Update office error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   DELETE api/offices/:id
// @desc    Delete an office
// @access  Private (Admin only)
router.delete("/:id", auth, async (req, res) => {
  try {
    // Check if user is an admin
    if (req.user.role === "citizen") {
      return res.status(403).json({ message: "Not authorized" })
    }

    const office = await Office.findById(req.params.id)

    if (!office) {
      return res.status(404).json({ message: "Office not found" })
    }

    await office.remove()

    res.json({ message: "Office removed" })
  } catch (err) {
    console.error("Delete office error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router

