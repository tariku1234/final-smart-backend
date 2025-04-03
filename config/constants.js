// User roles
exports.USER_ROLES = {
  CITIZEN: "citizen",
  STAKEHOLDER_OFFICE: "stakeholder_office",
  WEREDA_ANTI_CORRUPTION: "wereda_anti_corruption",
  KIFLEKETEMA_ANTI_CORRUPTION: "kifleketema_anti_corruption",
  KENTIBA_BIRO: "kentiba_biro",
}

// Stakeholder office types
exports.OFFICE_TYPES = {
  TRADE_OFFICE: "trade_office",
  ID_OFFICE: "id_office",
  LAND_OFFICE: "land_office",
  TAX_OFFICE: "tax_office",
  COURT_OFFICE: "court_office",
  POLICE_OFFICE: "police_office",
  EDUCATION_OFFICE: "education_office",
  HEALTH_OFFICE: "health_office",
  TRANSPORT_OFFICE: "transport_office",
  WATER_OFFICE: "water_office",
  ELECTRICITY_OFFICE: "electricity_office",
  TELECOM_OFFICE: "telecom_office",
  IMMIGRATION_OFFICE: "immigration_office",
  SOCIAL_AFFAIRS_OFFICE: "social_affairs_office",
  OTHER: "other",
}

// Admin registration codes
exports.ADMIN_REGISTRATION_CODES = {
  wereda_anti_corruption: "wereda-code-123",
  kifleketema_anti_corruption: "kifleketema-code-456",
  kentiba_biro: "kentiba-code-789",
}

// Complaint stages
exports.COMPLAINT_STAGES = {
  STAKEHOLDER_FIRST: "stakeholder_first",
  STAKEHOLDER_SECOND: "stakeholder_second",
  WEREDA_FIRST: "wereda_first",
  WEREDA_SECOND: "wereda_second",
  KIFLEKETEMA_FIRST: "kifleketema_first",
  KIFLEKETEMA_SECOND: "kifleketema_second",
  KENTIBA: "kentiba",
}

// Complaint handlers
exports.COMPLAINT_HANDLERS = {
  STAKEHOLDER_OFFICE: "stakeholder_office",
  WEREDA_ANTI_CORRUPTION: "wereda_anti_corruption",
  KIFLEKETEMA_ANTI_CORRUPTION: "kifleketema_anti_corruption",
  KENTIBA_BIRO: "kentiba_biro",
}

// Complaint status
exports.COMPLAINT_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
  ESCALATED: "escalated",
}

// Escalation timeframes (in milliseconds)
exports.ESCALATION_TIMEFRAMES = {
  STAKEHOLDER_RESPONSE: 3 * 24 * 60 * 60 * 1000, // 3 days
  WEREDA_RESPONSE: 5 * 24 * 60 * 60 * 1000, // 5 days
  KIFLEKETEMA_RESPONSE: 7 * 24 * 60 * 60 * 1000, // 7 days
}

// Blog post categories
exports.BLOG_CATEGORIES = {
  ANNOUNCEMENT: "announcement",
  NEWS: "news",
  GUIDE: "guide",
  SUCCESS_STORY: "success_story",
  OTHER: "other",
}

