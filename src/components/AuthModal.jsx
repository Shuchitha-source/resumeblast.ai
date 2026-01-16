import { useState } from 'react'
import { supabase } from '../lib/supabase'
import './AuthModal.css'

function AuthModal({ onClose, onSuccess }) {
  const [isLogin, setIsLogin] = useState(true) // true = login, false = signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      setMessage('✅ Login successful!')
      setEmail('')
      setPassword('')
      
      // Close modal and trigger success callback
      setTimeout(() => {
        if (onSuccess) onSuccess()
        if (onClose) onClose()
      }, 1000)
      
    } catch (error) {
      if (error.message.includes('Invalid login credentials')) {
        setMessage('❌ Invalid email or password')
      } else {
        setMessage('❌ Error: ' + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
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
      
      // Check if user already exists
      if (data?.user?.identities?.length === 0) {
        setMessage('❌ An account with this email already exists. Please login instead.')
        setTimeout(() => setIsLogin(true), 2000) // Switch to login after 2 seconds
        return
      }
      
      setMessage('✅ Success! Check your email for verification link.')
      setEmail('')
      setPassword('')
      
    } catch (error) {
      setMessage('❌ Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = isLogin ? handleLogin : handleSignUp

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="auth-modal">
          <h1>🚀 {isLogin ? 'Welcome Back' : 'Get Started'}</h1>
          <p className="subtitle">
            {isLogin ? 'Login to your account' : 'Create your account to begin'}
          </p>

          {/* Toggle between Login and Signup */}
          <div className="auth-toggle">
            <button
              className={`toggle-btn ${isLogin ? 'active' : ''}`}
              onClick={() => {
                setIsLogin(true)
                setMessage('')
              }}
            >
              Login
            </button>
            <button
              className={`toggle-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => {
                setIsLogin(false)
                setMessage('')
              }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder={isLogin ? 'Enter your password' : 'Create a password (min 6 characters)'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
            </button>
          </form>
          
          {message && (
            <div className={`message ${message.includes('Error') || message.includes('❌') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          {/* Forgot Password Link (only show on login) */}
          {isLogin && (
            <div className="forgot-password">
              <a href="#" onClick={(e) => {
                e.preventDefault()
                // TODO: Add forgot password functionality
                alert('Password reset feature coming soon!')
              }}>
                Forgot password?
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthModal