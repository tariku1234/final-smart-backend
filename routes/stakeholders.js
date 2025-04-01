const express = require("express")
const router = express.Router()
const User = require("../models/User")
const auth = require("../middleware/auth")
const { USER_ROLES } = require("../config/constants")

// @route   GET api/stakeholders/approved
// @desc    Get all approved stakeholder offices
// @access  Public
router.get("/approved", async (req, res) => {
  try {
    const stakeholders = await User.find({
      role: USER_ROLES.STAKEHOLDER_OFFICE,
      isApproved: true,
    }).select("_id officeName officeType officeAddress")

    res.json({ stakeholders })
  } catch (err) {
    console.error("Get approved stakeholders error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   POST api/stakeholders/register
// @desc    Register a new stakeholder office
// @access  Public
router.post("/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      idNumber,
      address,
      officeName,
      officeType,
      officeAddress,
      officePhone,
    } = req.body

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

    // Create new stakeholder office user
    user = new User({
      firstName,
      lastName,
      email,
      phone,
      password,
      idNumber,
      address,
      role: USER_ROLES.STAKEHOLDER_OFFICE,
      officeName,
      officeType,
      officeAddress,
      officePhone,
      isApproved: false, // Requires approval from Kentiba Biro
    })

    await user.save()

    res.status(201).json({
      message: "Stakeholder office registered successfully. Pending approval from Kentiba Biro.",
    })
  } catch (err) {
    console.error("Stakeholder registration error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET api/stakeholders
// @desc    Get all stakeholder offices
// @access  Private (Kentiba Biro only)
router.get("/", auth, async (req, res) => {
  try {
    // Check if user is Kentiba Biro
    if (req.user.role !== USER_ROLES.KENTIBA_BIRO) {
      return res.status(403).json({ message: "Not authorized" })
    }

    // Filter by approval status if provided
    const query = { role: USER_ROLES.STAKEHOLDER_OFFICE }

    if (req.query.approved === "true") {
      query.isApproved = true
    } else if (req.query.approved === "false") {
      query.isApproved = false
    }

    const stakeholders = await User.find(query).select("-password").sort({ createdAt: -1 })

    res.json({ stakeholders })
  } catch (err) {
    console.error("Get stakeholders error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT api/stakeholders/:id/approve
// @desc    Approve a stakeholder office
// @access  Private (Kentiba Biro only)
router.put("/:id/approve", auth, async (req, res) => {
  try {
    // Check if user is Kentiba Biro
    if (req.user.role !== USER_ROLES.KENTIBA_BIRO) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const stakeholder = await User.findById(req.params.id)

    if (!stakeholder) {
      return res.status(404).json({ message: "Stakeholder office not found" })
    }

    if (stakeholder.role !== USER_ROLES.STAKEHOLDER_OFFICE) {
      return res.status(400).json({ message: "User is not a stakeholder office" })
    }

    stakeholder.isApproved = true
    await stakeholder.save()

    res.json({
      message: "Stakeholder office approved successfully",
      stakeholder: {
        id: stakeholder._id,
        firstName: stakeholder.firstName,
        lastName: stakeholder.lastName,
        email: stakeholder.email,
        officeName: stakeholder.officeName,
        officeType: stakeholder.officeType,
        isApproved: stakeholder.isApproved,
      },
    })
  } catch (err) {
    console.error("Approve stakeholder error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT api/stakeholders/:id/reject
// @desc    Reject a stakeholder office
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

    const stakeholder = await User.findById(req.params.id)

    if (!stakeholder) {
      return res.status(404).json({ message: "Stakeholder office not found" })
    }

    if (stakeholder.role !== USER_ROLES.STAKEHOLDER_OFFICE) {
      return res.status(400).json({ message: "User is not a stakeholder office" })
    }

    // Delete the stakeholder
    await stakeholder.remove()

    res.json({ message: "Stakeholder office rejected and removed" })
  } catch (err) {
    console.error("Reject stakeholder error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router

