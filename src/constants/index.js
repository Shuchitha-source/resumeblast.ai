// ==========================================
// APPLICATION CONFIGURATION
// ==========================================

export const APP_CONFIG = {
  APP_NAME: 'ResumeBlast.ai',
  APP_VERSION: '1.0.0-mvp',
  SUPPORT_EMAIL: 'support@resumeblast.ai',
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_FILE_TYPES: ['.pdf', '.docx', '.doc', '.txt'],
  OPTIMIZATION_TIMEOUT: 30000, // 30 seconds
  MAX_RESUME_LENGTH: 10000, // characters
  MIN_RESUME_LENGTH: 100 // characters
}

// ==========================================
// ERROR MESSAGES
// ==========================================

export const ERROR_MESSAGES = {
  // Upload Errors
  UPLOAD_FAILED: 'Failed to upload resume. Please try again.',
  FILE_TOO_LARGE: 'File size exceeds 5MB limit. Please upload a smaller file.',
  INVALID_FILE_TYPE: 'Please upload a PDF, Word (.docx), or TXT file.',
  FILE_EMPTY: 'The file appears to be empty. Please upload a valid resume.',
  FILE_CORRUPTED: 'Unable to read file. The file may be corrupted.',
  
  // Optimization Errors
  OPTIMIZATION_FAILED: 'Optimization failed. Please try again.',
  NO_RESUME: 'Please upload or generate a resume first.',
  NO_JOB_TITLE: 'Please enter a target job title.',
  OPTIMIZATION_TIMEOUT: 'Optimization timed out. Please try again.',
  
  // Network Errors
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  AUTH_ERROR: 'Authentication failed. Please sign in again.',
  
  // Generic
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
}

// ==========================================
// SUCCESS MESSAGES
// ==========================================

export const SUCCESS_MESSAGES = {
  UPLOAD_SUCCESS: '✅ Resume uploaded successfully!',
  GENERATION_SUCCESS: '✅ Resume generated successfully!',
  OPTIMIZATION_COMPLETE: '✅ Optimization complete!',
  SUGGESTIONS_APPLIED: '✅ All suggestions applied successfully!',
  REPORT_DOWNLOADED: '📥 Report downloaded successfully!',
  RESUME_DOWNLOADED: '📥 Resume downloaded successfully!',
  PDF_DOWNLOADED: '📥 PDF downloaded successfully!',
  TXT_DOWNLOADED: '📥 TXT file downloaded successfully!'
}

// ==========================================
// UI CONSTANTS
// ==========================================

export const UI_CONFIG = {
  ANIMATION_DURATION: 2000, // 2 seconds
  TOAST_DURATION: 3000, // 3 seconds
  DEBOUNCE_DELAY: 500, // 500ms
  SCROLL_OFFSET: 100 // pixels
}

// ==========================================
// OPTIMIZATION STAGES
// ==========================================

export const OPTIMIZATION_STAGES = {
  ANALYZING: {
    message: '🤖 Bot analyzing job market...',
    progress: 20
  },
  MATCHING: {
    message: '🤖 Bot matching keywords...',
    progress: 40
  },
  OPTIMIZING: {
    message: '🤖 Bot optimizing resume with AI...',
    progress: 60
  },
  FINALIZING: {
    message: '🤖 Bot finalizing ATS optimization...',
    progress: 90
  },
  COMPLETE: {
    message: '✅ Optimization complete!',
    progress: 100
  }
}

// ==========================================
// FILE VALIDATION
// ==========================================

export const FILE_MIME_TYPES = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  txt: 'text/plain'
}

// ==========================================
// REGEX PATTERNS
// ==========================================

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\d\s\-\+\(\)]+$/,
  URL: /^https?:\/\/.+/
}