import { useEffect } from 'react'

function GoogleAnalytics() {
  useEffect(() => {
    const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID
    
    if (!GA_ID) {
      console.warn('Google Analytics ID not found')
      return
    }

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
      gtag('config', '${GA_ID}');
    `
    document.head.appendChild(script2)
  }, [])

  return null
}

export default GoogleAnalytics