/**
 * Centralized message constants for the application
 * Used for success messages, error messages, and user-facing notifications
 */

export const MESSAGES = {
  // Authentication & Authorization Messages
  AUTH: {
    SESSION_EXPIRED: "Your session has expired or you are not authorized. Please log in to continue.",
    SESSION_LOGGED_OUT: "This session has been logged out.",
    INVALID_TOKEN: "Invalid or expired token.",
    USER_NOT_FOUND: "User not found",
    INVALID_CREDENTIALS: "Invalid username or password",
    USER_CREATED: "User created successfully.",
    ACCOUNT_DEACTIVATED: "Your account has been deactivated. Please contact a system administrator.",
    USER_ROLE_NOT_FOUND: "User role not found.",
    ROLE_NOT_FOUND: "Role not found.",
    PERMISSION_DENIED: "You do not have permission to access this resource.",
    USER_ID_REQUIRED: "User ID is required.",
    USER_ALREADY_LOGGED_IN: "User already logged in"
  },

  // Success Messages
  SUCCESS: {
    // User Management
    USER_CREATED: "User created successfully.",
    USER_MODIFIED: "User modified successfully!",
    USER_INACTIVATED: "User successfully inactivated.",
    PROFILE_UPDATED: "Profile updated successfully!",
    
    // Admin - Cards
    CARD_ADDED: "Card added successfully!",
    CARD_MODIFIED: "Card modified successfully!",
    CARD_DELETED: "Card successfully deleted.",
    
    // Admin - Permissions
    PERMISSION_CREATED: "Permission created successfully.",
    PERMISSION_UPDATED: "Permission updated successfully.",
    PERMISSION_DELETED: "Permission successfully deleted.",
    
    // Admin - Roles
    ROLE_CREATED: "Role created successfully.",
    ROLE_UPDATED: "Role updated successfully.",
    ROLE_DELETED: "Role successfully deleted.",
    
    // Alerts
    ALERT_CREATED: "Alert created successfully!",
    ALERT_UPDATED: "Alert updated successfully!",
    ALERT_DELETED: "Alert deleted successfully",
    ALERTS_CREATED: "Alerts created successfully!",
    
    // Categories
    CATEGORY_CREATED: "Category created successfully!",
    CATEGORY_UPDATED: "Category updated successfully!",
    CATEGORY_DELETED: "Category deleted successfully",
    
    // Daily Timetable
    DAILY_TIMETABLE_CREATED: "DailyTimeTable created successfully!",
    DAILY_TIMETABLE_UPDATED: "DailyTimeTable updated successfully!",
    TIMETABLE_ELEMENT_CREATED: "Timetable element created successfully!",
    TIMETABLE_ELEMENT_UPDATED: "Timetable element updated successfully!",
    
    // Events
    EVENT_CREATED: "Event created successfully!",
    EVENT_UPDATED: "Event updated successfully!",
    EVENT_SELECTED: "Event selected successfully!", // + event name appended
    
    // Entries
    ENTRY_CREATED: "Entry created successfully!",
    ENTRY_UPDATED: "Entry updated successfully!",
    
    // Horse
    HORSE_CREATED: "Horse created successfully!",
    HORSE_UPDATED: "Horse updated successfully!",
    
    // Lunger
    LUNGER_CREATED: "Lunger created successfully!",
    LUNGER_UPDATED: "Lunger updated successfully!",
    
    // Mapping
    MAPPING_CREATED: "Mapping created successfully!",
    MAPPING_UPDATED: "Mapping updated successfully!",
    MAPPING_DELETED: "Mapping deleted successfully!",
    
    // Orders
    STARTING_ORDER_UPDATED: "Starting order updated successfully.",
    CONFLICTS_CONFIRMED: "Conflicts confirmed. You can now create the starting order.",
    
    // Results
    RESULT_CALC_TEMPLATE_CREATED: "Result calculation template created successfully.",
    RESULT_CALC_TEMPLATE_EDITED: "Result calculation template edited successfully.",
    RESULT_GENERATOR_CREATED: "Result generator created successfully.",
    RESULT_GENERATOR_EDITED: "Result generator edited successfully.",
    RESULT_GENERATOR_STATUS_UPDATED: "Result generator status updated successfully.",
    RESULT_GENERATOR_DELETED: "Result generator deleted successfully.",
    RESULT_GROUP_CREATED: "Result group created successfully.",
    RESULT_GROUP_EDITED: "Result group edited successfully.",
    RESULT_GROUP_DELETED: "Result group deleted successfully.",
    RESULT_GROUPS_GENERATED: "Result groups generated successfully.",
    
    // Score Sheets
    SCORE_SHEET_TEMPLATE_CREATED: "Template created successfully!",
    SCORE_SHEET_TEMPLATE_UPDATED: "Template updated successfully!",
    SCORE_SHEET_SAVED: "Score sheet saved successfully!",
    SCORE_RECALCULATED: "Score recalculated successfully",
    
    // Vaulter
    VAULTER_CREATED: "Vaulter created successfully!",
    VAULTER_UPDATED: "Vaulter updated successfully!",
    ARM_NUMBER_UPDATED: "Arm number updated successfully!",
    
    // Cards, Permissions, Roles, Users (DELETE responses)
    CARD_DELETE_RESPONSE: "Card deleted.",
    PERMISSION_DELETE_RESPONSE: "Permission deleted.",
    ROLE_DELETE_RESPONSE: "Role deleted.",
    USER_DELETE_RESPONSE: "User deleted.",
    
    // Alert & Entry
    ALERT_DELETED: "Alert deleted successfully",
    INCIDENT_DELETED: "Incident deleted successfully",
    VET_STATUS_UPDATED: "Vet status updated successfully",
    
    // Horse
    NOTE_DELETED: "Note deleted successfully",
    NOTE_ADDED: "Note added successfully!",
    NUMBERS_UPDATED: "Numbers updated successfully!",
    
    // Responsible Person & Events
    RESPONSIBLE_PERSON_DELETED: "responsible person deleted successfully by ",
    RESPONSIBLE_PERSON_ADDED: "Responsible person added successfully!",
    EVENT_DELETED: "Event deleted successfully",
    
    // DailyTimeTable
    DAILY_TIMETABLE_DELETED: "DailyTimeTable deleted successfully",
    TIMETABLE_ELEMENT_DELETED: "Timetable element deleted successfully",
    
    // Result Calc Template
    RESULT_CALC_TEMPLATE_DELETED: "Calculation template deleted successfully.",
    
    // Entry
    ENTRY_DELETED: "Entry deleted successfully",
    VAULTER_UPDATED: "Vaulter updated successfully!",
    INCIDENT_ADDED: "Incident added successfully!",
    
    // Judges
    JUDGE_INPUT_RECEIVED: "Judge input received successfully!"
  },

  // Error/Failure Messages
  ERROR: {
    // Permissions & Not Found
    PERMISSION_NOT_FOUND: "Permission not found.",
    ROLE_NOT_FOUND: "Role not found.",
    CATEGORY_NOT_FOUND: "Category not found",
    DAILY_TIMETABLE_NOT_FOUND: "DailyTimeTable not found",
    TIMETABLE_ELEMENT_NOT_FOUND: "Timetable element not found",
    PARENT_DAY_MISSING: "Parent day missing",
    VAULTER_NOT_FOUND: "Vaulter not found",
    SCORE_NOT_FOUND: "Score not found",
    RESULT_GROUP_NOT_FOUND: "Result group not found.",
    TEMPLATE_NOT_FOUND: "Template not found",
    PAGE_NOT_FOUND: "Page not found",
    NO_EVENT_SELECTED: "No event selected",
    
    // Timetable & Order
    NO_TIMETABLE_TODAY: "No timetable for today",
    DRAWING_NOT_DONE: "Drawing not done yet for this timetable part",
    CONFLICTS_NOT_CHECKED: "Conflicts not checked yet for this timetable part",
    TIMETABLE_PART_NOT_FOUND: "Timetable part not found",
    NO_STARTING_ORDER: "No starting order set for this timetable part.",
    INVALID_TIMETABLE_PART: "Invalid timetable part specified.",
    TIMETABLE_PART_NOT_DEFINED: "Selected timetable part is not defined for this result group.",
    
    // Scoring & Judges
    SCORE_ALREADY_SUBMITTED: "You have already submitted a score sheet for this entry in this timetable part",
    NOT_ASSIGNED_AS_JUDGE: "You are not assigned as a judge for this timetable part",
    NO_ROLE_MAPPING: "No role mapping found for your judge table in this timetable part",
    ENTRY_NOT_FOUND: "Entry not found",
    NO_SCORE_SHEET_TEMPLATE: "No score sheet template found for this configuration",
    
    // Validation
    PERCENTAGE_SUM_ERROR: "The sum of the percentages must be 100%.",
    INVALID_CREATION_METHOD: "Invalid creation method selected.",
    COPY_METHOD_NOT_IMPLEMENTED: "Copy method not implemented yet."
  },

  // Validation Messages
  VALIDATION: {
    REQUIRED_FIELD: "This field is required",
    INVALID_FORMAT: "Invalid format",
    PERCENTAGE_SUM_ERROR: "The sum of the percentages must be 100%."
  }
};
