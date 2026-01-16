import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import LandingPage from './components/LandingPage'
import GoogleAnalytics from './components/GoogleAnalytics'
import ResumeUpload from './components/ResumeUpload'
import ResumeBuilder from './components/ResumeBuilder'
import AuthModal from './components/AuthModal'
import ResumeOptimizer from "./pages/ResumeOptimizer"
import ErrorBoundary from './components/ErrorBoundary'
import { testErrorLogging } from './utils/errorLogger'  // ← ADDED THIS
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSignup, setShowSignup] = useState(false)
  const [message, setMessage] = useState('')
  const [uploadedResumeText, setUploadedResumeText] = useState('')
  const [uploadedResumeUrl, setUploadedResumeUrl] = useState('')

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        setUser(session?.user ?? null)
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
        console.log('Auth event:', event, 'Session:', session)
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user ?? null)
          setShowSignup(false)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
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
      setShowSignup(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <ErrorBoundary componentName="App-Loading">
        <GoogleAnalytics />
        <div className="container">
          <div className="card">
            <h1>🚀 ResumeBlast.ai</h1>
            <p>Loading...</p>
          </div>
        </div>
      </ErrorBoundary>
    )
  }

  // Dashboard for logged-in users
  if (user) {
    return (
      <ErrorBoundary componentName="App-Dashboard">
        <GoogleAnalytics />
        <div className="container">
          <div className="card">
            <h1>🎉 Welcome to ResumeBlast.ai!</h1>
            <p className="subtitle">You're successfully logged in</p>
            
            <div className="dashboard">
              <div className="user-info">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Email Verified:</strong> {user.email_confirmed_at ? '✅ Yes' : '⏳ Pending'}</p>
                <p><strong>Last Sign In:</strong> {new Date(user.last_sign_in_at).toLocaleString()}</p>
              </div>

              {/* Resume Upload Component */}
              <ResumeUpload 
                user={user} 
                onUploadSuccess={({ text, url, name }) => {
                  console.log('=== UPLOAD SUCCESS ===')
                  console.log('Text length:', text?.length, 'characters')
                  console.log('URL:', url)
                  console.log('Name:', name)
                  
                  setUploadedResumeText(text)
                  setUploadedResumeUrl(url)
                  setMessage('✅ Resume uploaded! Ready for optimization and distribution.')
                }} 
              />

              {/* OR Divider */}
              <div className="divider">
                <span>OR</span>
              </div>

              {/* Resume Builder Component */}
              <ResumeBuilder
                user={user}
                onGenerateSuccess={({ text, url, name }) => {
                  console.log('=== GENERATE SUCCESS ===')
                  console.log('Generated text length:', text?.length, 'characters')
                  
                  setUploadedResumeText(text)
                  setUploadedResumeUrl(url)
                  setMessage('✅ Resume generated! Ready for optimization and distribution.')
                }}
              />

              {/* Show optimizer only when resume text exists */}
              {uploadedResumeText && (
                <>
                  <div className="divider">
                    <span>OPTIMIZE</span>
                  </div>

                  <ResumeOptimizer
                    user={user}
                    resumeText={uploadedResumeText}
                    resumeUrl={uploadedResumeUrl}
                  />
                </>
              )}

              {/* Success/Error Message */}
              {message && (
                <div className={`message ${message.includes('Error') || message.includes('❌') ? 'error' : 'success'}`}>
                  {message}
                </div>
              )}
              
              {/* What's Next Section */}
              <div className="dashboard-actions">
                <h3>What's Next?</h3>
                <ul>
                  <li>✅ Upload or build your resume</li>
                  <li>✅ Optimize with AI</li>
                  <li>Pay $149 for optimization & distribution</li>
                  <li>Distribute to 500+ recruiters</li>
                  <li>Track your results</li>
                </ul>
              </div>
              
              {/* Sign Out Button */}
              <button onClick={handleSignOut} className="btn-secondary">
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* TEMPORARY: Test Error Logging Button - REMOVE AFTER TESTING */}
        <button 
          onClick={async () => {
            console.clear()
            console.log('🧪 Starting error logging test...')
            
            const results = await testErrorLogging()
            
            if (results.testError && results.testAction) {
              alert('✅ SUCCESS!\n\nBoth error logging and action logging work!\n\n👉 Next Steps:\n1. Check browser console (F12)\n2. Go to Supabase Table Editor\n3. View error_logs and user_actions tables')
            } else {
              alert('❌ FAILED!\n\nSomething went wrong.\n\n👉 Check:\n1. Browser console (F12) for errors\n2. Supabase connection\n3. Table permissions')
            }
          }}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '16px 24px',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            zIndex: 9999,
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: '0 8px 16px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.2s ease',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-4px)'
            e.target.style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.5)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = '0 8px 16px rgba(102, 126, 234, 0.4)'
          }}
        >
          🧪 Test Error Logging
        </button>
      </ErrorBoundary>
    )
  }

  // Auth modal (Login/Signup)
  if (showSignup) {
    return (
      <ErrorBoundary componentName="App-AuthModal">
        <GoogleAnalytics />
        <AuthModal 
          onClose={() => setShowSignup(false)}
          onSuccess={() => {
            setMessage('✅ Successfully logged in!')
            setShowSignup(false)
          }}
        />
      </ErrorBoundary>
    )
  }

  // Landing page
  return (
    <ErrorBoundary componentName="App-Landing">
      <GoogleAnalytics />
      <LandingPage onGetStarted={() => setShowSignup(true)} />
    </ErrorBoundary>
  )
}

export default App