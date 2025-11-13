import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import LandingPage from './components/LandingPage'
import GoogleAnalytics from './components/GoogleAnalytics'
import ResumeUpload from './components/ResumeUpload'
import AuthModal from './components/AuthModal'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSignup, setShowSignup] = useState(false)
  const [message, setMessage] = useState('')

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
      <>
        <GoogleAnalytics />
        <div className="container">
          <div className="card">
            <h1>🚀 ResumeBlast.ai</h1>
            <p>Loading...</p>
          </div>
        </div>
      </>
    )
  }

  // Dashboard for logged-in users
  if (user) {
    return (
      <>
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

              <ResumeUpload 
                user={user} 
                onUploadSuccess={() => {
                  setMessage('✅ Resume uploaded! Ready for optimization and distribution.')
                }} 
              />

              {message && (
                <div className={`message ${message.includes('Error') || message.includes('❌') ? 'error' : 'success'}`}>
                  {message}
                </div>
              )}
              
              <div className="dashboard-actions">
                <h3>What's Next?</h3>
                <ul>
                  <li>✅ Upload your resume</li>
                  <li>Pay $149 for optimization & distribution</li>
                  <li>Get AI optimization</li>
                  <li>Distribute to 500+ recruiters</li>
                  <li>Track your results</li>
                </ul>
              </div>
              
              <button onClick={handleSignOut} className="btn-secondary">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Auth modal (Login/Signup)
  if (showSignup) {
    return (
      <>
        <GoogleAnalytics />
        <AuthModal 
          onClose={() => setShowSignup(false)}
          onSuccess={() => {
            setMessage('✅ Successfully logged in!')
            setShowSignup(false)
          }}
        />
      </>
    )
  }

  // Landing page
  return (
    <>
      <GoogleAnalytics />
      <LandingPage onGetStarted={() => setShowSignup(true)} />
    </>
  )
}

export default App