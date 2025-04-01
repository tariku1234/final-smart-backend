const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")
const path = require("path")
const fs = require("fs")

// Load environment variables
dotenv.config()

// Import routes
const authRoutes = require("./routes/auth")
const complaintRoutes = require("./routes/complaints")
const documentRoutes = require("./routes/documents")
const alertRoutes = require("./routes/alerts")
const officeRoutes = require("./routes/offices")
const stakeholderRoutes = require("./routes/stakeholders")
const blogRoutes = require("./routes/blog")
const adminRoutes = require("./routes/admin")

// Initialize Express app
const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Create upload directories if they don't exist
const uploadDirs = ["uploads", "uploads/complaints", "uploads/blog"]
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")))

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/complaints", complaintRoutes)
app.use("/api/documents", documentRoutes)
app.use("/api/alerts", alertRoutes)
app.use("/api/offices", officeRoutes)
app.use("/api/stakeholders", stakeholderRoutes)
app.use("/api/blog", blogRoutes)

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../build")))

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../build", "index.html"))
  })
}

// Scheduled tasks for automatic escalation
const { scheduleEscalationJobs } = require("./utils/scheduler")
scheduleEscalationJobs()

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: "Something went wrong!" })
})

// Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

