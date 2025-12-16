import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import LandingPage from './components/LandingPage'
import GoogleAnalytics from './components/GoogleAnalytics'
import ResumeUpload from './components/ResumeUpload'
import AuthModal from './components/AuthModal'
import ResumeAnalysis from './components/ResumeAnalysis'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSignup, setShowSignup] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  
  // State for Uploaded Content
  const [resumeText, setResumeText] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        setUser(session?.user ?? null)
        
        // ✅ NEW: Check if returning from payment
        const params = new URLSearchParams(window.location.search)
        if (session?.user && params.get('payment')) {
            console.log('💳 Payment return detected, opening dashboard...')
            setShowDashboard(true)
        }

      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user ?? null)
          setShowSignup(false)
          
          // ✅ NEW: Open dashboard on login if payment param exists
          const params = new URLSearchParams(window.location.search)
          if (params.get('payment')) {
             setShowDashboard(true)
          }

        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setShowDashboard(false)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      setMessage('❌ Error signing out: ' + error.message)
    } else {
      setShowDashboard(false)
      setShowSignup(false)
    }
  }

  // Navigation Handler
  const handleGetStarted = () => {
    if (user) {
      setShowDashboard(true)
    } else {
      setShowSignup(true)
    }
  }

  // 1. LOADING VIEW
  if (loading) {
    return (
      <div className="container center-content">
        <div className="spinner"></div>
      </div>
    )
  }

  // 2. DASHBOARD VIEW
  if (user && showDashboard) {
    return (
      <ErrorBoundary componentName="App-Dashboard">
        <GoogleAnalytics />
        <div className="container">
          <div className="card">
            {/* Dashboard Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h1>🚀 Distribution Dashboard</h1>
              <button onClick={handleSignOut} className="btn-secondary">
                Sign Out
              </button>
            </div>
            
            <div className="dashboard">
               <div className="user-info-bar" style={{marginBottom: '20px', color: '#666'}}>
                  <span>Logged in as: <strong>{user.email}</strong></span>
               </div>

              {/* STEP 1: UPLOAD */}
              {!resumeUrl && (
                <div className="fade-in">
                  <ResumeUpload 
                    user={user} 
                    onUploadSuccess={({ text, url }) => {
                      setResumeText(text)
                      setResumeUrl(url)
                      setMessage('✅ Resume uploaded! Analyzing...')
                    }} 
                  />
                </div>
              )}

              {/* STEP 2: ANALYSIS & BLAST */}
              {resumeUrl && (
                <div className="slide-in">
                  <div className="upload-success-bar" style={{ 
                      background: '#ecfdf5', 
                      padding: '15px 20px', 
                      borderRadius: '8px',
                      border: '1px solid #10b981',
                      color: '#065f46',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '30px'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      ✅ <strong>Resume Uploaded Successfully</strong>
                    </span>
                    <button 
                      onClick={() => { setResumeUrl(''); setResumeText(''); }}
                      style={{ 
                        background: 'white', 
                        border: '1px solid #10b981', 
                        color: '#059669', 
                        padding: '5px 15px',
                        borderRadius: '4px',
                        cursor: 'pointer', 
                        fontWeight: '600'
                      }}
                    >
                      Upload Different File
                    </button>
                  </div>

                  <ResumeAnalysis
                    user={user}
                    resumeText={resumeText}
                    resumeUrl={resumeUrl}
                  />
                </div>
              )}

              {/* Global Message Display */}
              {message && (
                <div className={`message ${message.includes('Error') || message.includes('❌') ? 'error' : 'success'}`}>
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  // 3. AUTH MODAL
  if (showSignup) {
    return (
      <ErrorBoundary componentName="App-AuthModal">
        <AuthModal 
          onClose={() => setShowSignup(false)}
          onSuccess={() => {
            setShowSignup(false)
            setShowDashboard(true)
          }}
        />
      </ErrorBoundary>
    )
  }

  // 4. LANDING PAGE
  return (
    <ErrorBoundary componentName="App-Landing">
      <GoogleAnalytics />
      <LandingPage 
        user={user}
        onGetStarted={handleGetStarted} 
        onLogout={handleSignOut}
      />
    </ErrorBoundary>
  )
}

export default App