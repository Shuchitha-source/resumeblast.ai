// frontend/src/hooks/useBlacklistCheck.js - CHECK BLACKLIST BEFORE SIGNUP/LOGIN

import { useState } from 'react'

export const useBlacklistCheck = () => {
  const [isChecking, setIsChecking] = useState(false)
  const [isBlacklisted, setIsBlacklisted] = useState(false)
  const [blacklistMessage, setBlacklistMessage] = useState('')

  const checkBlacklist = async (email) => {
    setIsChecking(true)
    setIsBlacklisted(false)
    setBlacklistMessage('')

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

    try {
      const response = await fetch(`${API_URL}/api/auth/check-blacklist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      })

      const data = await response.json()

      if (response.status === 403 || data.is_blacklisted) {
        setIsBlacklisted(true)
        setBlacklistMessage(
          data.message || 
          'Your account has been suspended. Please contact support@resumeblast.ai for assistance.'
        )
        return {
          allowed: false,
          isBlacklisted: true,
          message: data.message || 'Account suspended'
        }
      }

      return {
        allowed: true,
        isBlacklisted: false,
        message: 'Account in good standing'
      }

    } catch (error) {
      console.error('Error checking blacklist:', error)
      // Fail open - allow access if check fails
      return {
        allowed: true,
        isBlacklisted: false,
        message: 'Check completed'
      }
    } finally {
      setIsChecking(false)
    }
  }

  return {
    checkBlacklist,
    isChecking,
    isBlacklisted,
    blacklistMessage
  }
}