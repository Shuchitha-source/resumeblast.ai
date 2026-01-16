import { supabase } from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/**
 * Log recruiter activity
 */
export const logRecruiterActivity = async (recruiterId, activityType, activityDetails = {}) => {
  try {
    console.log(`📊 Logging recruiter activity: ${activityType}`)
    
    const response = await fetch(`${API_URL}/api/recruiter-activity/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recruiter_id: recruiterId,
        activity_type: activityType,
        activity_details: {
          ...activityDetails,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          screen_resolution: `${window.screen.width}x${window.screen.height}`,
        }
      })
    })

    const data = await response.json()
    
    if (data.success) {
      console.log(`✅ Activity logged: ${activityType}`)
      return { success: true, data: data.data }
    } else {
      console.error('❌ Failed to log activity:', data.error)
      return { success: false, error: data.error }
    }
  } catch (error) {
    console.error('❌ Error logging recruiter activity:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get recruiter activities
 */
export const getRecruiterActivities = async (recruiterId, limit = 50, activityType = null) => {
  try {
    let url = `${API_URL}/api/recruiter-activity/${recruiterId}?limit=${limit}`
    if (activityType) {
      url += `&activity_type=${activityType}`
    }

    const response = await fetch(url)
    const data = await response.json()
    
    if (data.success) {
      return { success: true, data: data.data }
    } else {
      return { success: false, error: data.error }
    }
  } catch (error) {
    console.error('❌ Error fetching recruiter activities:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all recruiter activities (admin only)
 */
export const getAllRecruiterActivities = async (limit = 100) => {
  try {
    const response = await fetch(`${API_URL}/api/recruiter-activity/admin/all?limit=${limit}`)
    const data = await response.json()
    
    if (data.success) {
      return { success: true, data: data.data }
    } else {
      return { success: false, error: data.error }
    }
  } catch (error) {
    console.error('❌ Error fetching all recruiter activities:', error)
    return { success: false, error: error.message }
  }
}

// Activity type constants
export const ACTIVITY_TYPES = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  DISCLAIMER_ACCEPTED: 'disclaimer_accepted',
  PROFILE_VIEWED: 'profile_viewed',
  PROFILE_UPDATED: 'profile_updated',
  RESUME_VIEWED: 'resume_viewed',
  RESUME_DOWNLOADED: 'resume_downloaded',
  CANDIDATE_CONTACTED: 'candidate_contacted',
  SEARCH_PERFORMED: 'search_performed',
  FILTER_APPLIED: 'filter_applied',
}