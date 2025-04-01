const express = require("express")
const router = express.Router()
const multer = require("multer")
const path = require("path")
const BlogPost = require("../models/BlogPost")
const auth = require("../middleware/auth")
const { USER_ROLES } = require("../config/constants")

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/blog")
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (extname && mimetype) {
      return cb(null, true)
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and GIF files are allowed."))
    }
  },
})

// @route   POST api/blog
// @desc    Create a new blog post
// @access  Private (Kentiba Biro only)
router.post("/", auth, upload.single("featuredImage"), async (req, res) => {
  try {
    // Check if user is Kentiba Biro
    if (req.user.role !== USER_ROLES.KENTIBA_BIRO) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const { title, content, category, tags, isPublished } = req.body

    // Create new blog post
    const blogPost = new BlogPost({
      title,
      content,
      author: req.user.id,
      category,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
      isPublished: isPublished === "true",
    })

    // Add featured image if uploaded
    if (req.file) {
      blogPost.featuredImage = req.file.path
    }

    await blogPost.save()

    res.status(201).json({
      message: "Blog post created successfully",
      blogPost,
    })
  } catch (err) {
    console.error("Create blog post error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET api/blog
// @desc    Get all blog posts
// @access  Public
router.get("/", async (req, res) => {
  try {
    // Filter by published status for non-admin users
    let query = { isPublished: true }

    // If authenticated as Kentiba Biro, can see all posts
    if (req.user && req.user.role === USER_ROLES.KENTIBA_BIRO) {
      if (req.query.published === "all") {
        query = {}
      } else if (req.query.published === "false") {
        query = { isPublished: false }
      }
    }

    // Filter by category if provided
    if (req.query.category) {
      query.category = req.query.category
    }

    // Filter by tag if provided
    if (req.query.tag) {
      query.tags = req.query.tag
    }

    // Pagination
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const blogPosts = await BlogPost.find(query)
      .populate("author", "firstName lastName")
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await BlogPost.countDocuments(query)

    res.json({
      blogPosts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error("Get blog posts error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET api/blog/:id
// @desc    Get blog post by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const blogPost = await BlogPost.findById(req.params.id).populate("author", "firstName lastName")

    if (!blogPost) {
      return res.status(404).json({ message: "Blog post not found" })
    }

    // Check if post is published or user is Kentiba Biro
    if (!blogPost.isPublished && (!req.user || req.user.role !== USER_ROLES.KENTIBA_BIRO)) {
      return res.status(404).json({ message: "Blog post not found" })
    }

    res.json({ blogPost })
  } catch (err) {
    console.error("Get blog post error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT api/blog/:id
// @desc    Update a blog post
// @access  Private (Kentiba Biro only)
router.put("/:id", auth, upload.single("featuredImage"), async (req, res) => {
  try {
    // Check if user is Kentiba Biro
    if (req.user.role !== USER_ROLES.KENTIBA_BIRO) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const { title, content, category, tags, isPublished } = req.body

    const blogPost = await BlogPost.findById(req.params.id)

    if (!blogPost) {
      return res.status(404).json({ message: "Blog post not found" })
    }

    // Update blog post
    blogPost.title = title
    blogPost.content = content
    blogPost.category = category
    blogPost.tags = tags ? tags.split(",").map((tag) => tag.trim()) : []
    blogPost.isPublished = isPublished === "true"
    blogPost.updatedAt = new Date()

    // Update featured image if uploaded
    if (req.file) {
      blogPost.featuredImage = req.file.path
    }

    await blogPost.save()

    res.json({
      message: "Blog post updated successfully",
      blogPost,
    })
  } catch (err) {
    console.error("Update blog post error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   DELETE api/blog/:id
// @desc    Delete a blog post
// @access  Private (Kentiba Biro only)
router.delete("/:id", auth, async (req, res) => {
  try {
    // Check if user is Kentiba Biro
    if (req.user.role !== USER_ROLES.KENTIBA_BIRO) {
      return res.status(403).json({ message: "Not authorized" })
    }

    const blogPost = await BlogPost.findById(req.params.id)

    if (!blogPost) {
      return res.status(404).json({ message: "Blog post not found" })
    }

    await blogPost.remove()

    res.json({ message: "Blog post removed" })
  } catch (err) {
    console.error("Delete blog post error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router

