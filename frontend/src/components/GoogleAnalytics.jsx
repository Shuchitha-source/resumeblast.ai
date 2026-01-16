import { useEffect } from 'react'

function GoogleAnalytics() {
  useEffect(() => {
    // Your GA Measurement ID
    const GA_ID = 'G-6NHVZMSX04'
    
    // Check if script is already loaded
    if (window.gtag) {
      console.log('Google Analytics already initialized')
      return
    }

    console.log('🔍 Initializing Google Analytics with ID:', GA_ID)

    // Load Google Analytics script
    const script1 = document.createElement('script')
    script1.async = true
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
    document.head.appendChild(script1)

    // Initialize Google Analytics
    const script2 = document.createElement('script')
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_ID}', {
        page_path: window.location.pathname,
      });
    `
    document.head.appendChild(script2)

    console.log('✅ Google Analytics scripts loaded')

    // Cleanup function
    return () => {
      // Remove scripts if component unmounts (optional)
      if (script1.parentNode) script1.parentNode.removeChild(script1)
      if (script2.parentNode) script2.parentNode.removeChild(script2)
    }
  }, [])

  return null
}

export default GoogleAnalytics