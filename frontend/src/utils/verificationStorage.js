// /src/utils/verificationStorage.js
// Manages temporary storage of verification codes

const STORAGE_PREFIX = 'verify_'
const CODE_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes

/**
 * Store verification code with expiration timestamp
 */
export const storeVerificationCode = (email, code) => {
  const expiresAt = Date.now() + CODE_EXPIRY_MS
  const data = {
    code,
    expiresAt,
    email,
    createdAt: Date.now()
  }
  
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${email}`, JSON.stringify(data))
    console.log('✅ Verification code stored for:', email)
    console.log('⏱️ Expires at:', new Date(expiresAt).toLocaleString())
    return true
  } catch (error) {
    console.error('❌ Failed to store verification code:', error)
    return false
  }
}

/**
 * Verify if the entered code matches and hasn't expired
 */
export const verifyCode = (email, inputCode) => {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${email}`)
    
    if (!stored) {
      console.log('❌ No verification code found for:', email)
      return { 
        valid: false, 
        error: 'No verification code found. Please request a new code.' 
      }
    }
    
    const data = JSON.parse(stored)
    const now = Date.now()
    
    // Check if code has expired
    if (now > data.expiresAt) {
      localStorage.removeItem(`${STORAGE_PREFIX}${email}`)
      console.log('❌ Verification code expired for:', email)
      console.log('⏱️ Expired at:', new Date(data.expiresAt).toLocaleString())
      return { 
        valid: false, 
        error: 'Verification code has expired. Please request a new code.' 
      }
    }
    
    // Check if code matches
    if (data.code !== inputCode.trim()) {
      console.log('❌ Invalid verification code entered')
      console.log('Expected:', data.code)
      console.log('Received:', inputCode.trim())
      return { 
        valid: false, 
        error: 'Invalid verification code. Please check and try again.' 
      }
    }
    
    // Success - code is valid
    console.log('✅ Verification code validated successfully!')
    
    // Don't remove yet - keep for password reset step
    return { 
      valid: true,
      email: data.email
    }
    
  } catch (error) {
    console.error('❌ Error verifying code:', error)
    return { 
      valid: false, 
      error: 'Verification failed. Please try again.' 
    }
  }
}

/**
 * Clear verification code after successful password reset
 */
export const clearVerificationCode = (email) => {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${email}`)
    console.log('✅ Verification code cleared for:', email)
    return true
  } catch (error) {
    console.error('❌ Failed to clear verification code:', error)
    return false
  }
}

/**
 * Check if verification code exists and is still valid
 */
export const hasValidCode = (email) => {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${email}`)
    if (!stored) return false
    
    const data = JSON.parse(stored)
    return Date.now() < data.expiresAt
  } catch (error) {
    return false
  }
}

/**
 * Get remaining time for verification code
 */
export const getRemainingTime = (email) => {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${email}`)
    if (!stored) return 0
    
    const data = JSON.parse(stored)
    const remaining = data.expiresAt - Date.now()
    return remaining > 0 ? remaining : 0
  } catch (error) {
    return 0
  }
}