// frontend/src/utils/authValidation.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/**
 * Check if user is allowed to login/signup
 * @param {string} email - User email to validate
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export async function validateUserAuth(email) {
  try {
    if (!email || !email.trim()) {
      return { valid: true }
    }

    const response = await fetch(`${API_URL}/api/auth/validate-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.trim().toLowerCase() })
    })

    const result = await response.json()

    if (response.status === 403) {
      // User is deleted
      return {
        valid: false,
        error: result.error || 'This account has been deleted. Please contact support.'
      }
    }

    return { valid: true }
  } catch (error) {
    console.error('Error validating user:', error)
    // Fail open - don't block if validation fails
    return { valid: true }
  }
}

/**
 * Display user-friendly error message
 * @param {string} message - Error message to display
 */
export function showAuthError(message) {
  alert(`🚫 Access Denied\n\n${message}\n\nIf you believe this is an error, please contact:\nsupport@shirotechnologies.com`)
}