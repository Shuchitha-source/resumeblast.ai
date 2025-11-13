import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import LandingPage from './components/LandingPage'
import GoogleAnalytics from './components/GoogleAnalytics'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSignup, setShowSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

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
          setShowSignup(false) // Close signup modal if open
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleSignUp = async (e) => {
    e.preventDefault()
    setAuthLoading(true)
    setMessage('')
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}`
        }
      })
      
      if (error) throw error
      
      setMessage('✅ Success! Check your email for verification link.')
      setEmail('')
      setPassword('')
    } catch (error) {
      setMessage('❌ Error: ' + error.message)
    } finally {
      setAuthLoading(false)
    }
  }

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
              
              <div className="dashboard-actions">
                <h3>What's Next?</h3>
                <ul>
                  <li>Upload your resume</li>
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

  // Signup modal
  if (showSignup) {
    return (
      <>
        <GoogleAnalytics />
        <div className="modal-overlay" onClick={() => setShowSignup(false)}>
          <div className="container" onClick={(e) => e.stopPropagation()}>
            <div className="card">
              <button className="close-button" onClick={() => setShowSignup(false)}>×</button>
              <h1>🚀 Get Started</h1>
              <p className="subtitle">Create your account to begin</p>
              
              <form onSubmit={handleSignUp} className="form">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={authLoading}
                  />
                </div>
                
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="Create a password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={authLoading}
                    minLength={6}
                  />
                </div>
                
                <button type="submit" disabled={authLoading} className="btn-primary">
                  {authLoading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>
              
              {message && (
                <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
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