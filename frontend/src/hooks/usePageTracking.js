import { useEffect } from 'react'

/**
 * Custom hook to track page views in Google Analytics
 * Simplified version for apps without react-router
 */
const usePageTracking = () => {
  useEffect(() => {
    // Track page view when app loads
    if (window.gtag) {
      window.gtag('config', 'G-6NHVZMSX04', {
        page_path: window.location.pathname + window.location.search,
      })
      
      console.log('📊 GA Page View:', window.location.pathname)
    }
  }, [])

  return null
}

export default usePageTracking