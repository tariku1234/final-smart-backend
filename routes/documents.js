const express = require("express")
const router = express.Router()
const Document = require("../models/Document")
const auth = require("../middleware/auth")

// @route   GET api/documents
// @desc    Get all documents
// @access  Public
router.get("/", async (req, res) => {
  try {
    const documents = await Document.find().sort({ category: 1, title: 1 })

    res.json({ documents })
  } catch (err) {
    console.error("Get documents error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET api/documents/:id
// @desc    Get document by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)

    if (!document) {
      return res.status(404).json({ message: "Document not found" })
    }

    res.json({ document })
  } catch (err) {
    console.error("Get document error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   POST api/documents
// @desc    Create a new document
// @access  Private (Admin only)
router.post("/", auth, async (req, res) => {
  try {
    // Check if user is an admin
    if (req.user.role === "citizen") {
      return res.status(403).json({ message: "Not authorized" })
    }

    const { title, description, category, requirements, procedure, contactInfo } = req.body

    // Create new document
    const document = new Document({
      title,
      description,
      category,
      requirements,
      procedure,
      contactInfo,
    })

    await document.save()

    res.status(201).json({
      message: "Document created successfully",
      document,
    })
  } catch (err) {
    console.error("Create document error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT api/documents/:id
// @desc    Update a document
// @access  Private (Admin only)
router.put("/:id", auth, async (req, res) => {
  try {
    // Check if user is an admin
    if (req.user.role === "citizen") {
      return res.status(403).json({ message: "Not authorized" })
    }

    const { title, description, category, requirements, procedure, contactInfo } = req.body

    const document = await Document.findById(req.params.id)

    if (!document) {
      return res.status(404).json({ message: "Document not found" })
    }

    // Update document
    document.title = title
    document.description = description
    document.category = category
    document.requirements = requirements
    document.procedure = procedure
    document.contactInfo = contactInfo
    document.updatedAt = Date.now()

    await document.save()

    res.json({
      message: "Document updated successfully",
      document,
    })
  } catch (err) {
    console.error("Update document error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   DELETE api/documents/:id
// @desc    Delete a document
// @access  Private (Admin only)
router.delete("/:id", auth, async (req, res) => {
  try {
    // Check if user is an admin
    if (req.user.role === "citizen") {
      return res.status(403).json({ message: "Not authorized" })
    }

    const document = await Document.findById(req.params.id)

    if (!document) {
      return res.status(404).json({ message: "Document not found" })
    }

    await document.remove()

    res.json({ message: "Document removed" })
  } catch (err) {
    console.error("Delete document error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router

