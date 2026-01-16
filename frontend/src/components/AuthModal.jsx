import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { trackUserLogin, trackUserSignup } from '../services/activityTrackingService'
import { generateVerificationCode, sendVerificationEmail } from '../services/brevoEmailService'
import { storeVerificationCode, verifyCode, clearVerificationCode } from '../utils/verificationStorage'
import './AuthModal.css'

function AuthModal({ onClose, onSuccess }) {
  const [view, setView] = useState('login') // 'login', 'signup', 'forgot_password'
  
  // Login/Signup States
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  
  // Forgot Password States
  const [resetStep, setResetStep] = useState('email') // 'email', 'verify', 'new_password'
  const [verificationCode, setVerificationCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // ✅ FIXED: Login Handler with Proper Tracking
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    try {
      console.log('🔐 Attempting login...')
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      })
      
      if (error) throw error
      
      if (data?.user) {
        console.log('✅ Login successful, user:', data.user.email)
        
        // ✅ TRACK LOGIN - With proper error handling
        try {
          console.log('📊 Tracking login...')
          const trackingResult = await trackUserLogin(data.user.id, data.user.email, {
            login_method: 'password',
            timestamp: new Date().toISOString()
          })
          
          if (trackingResult.success) {
            console.log('✅ Login tracked successfully')
          } else {
            console.error('⚠️ Login tracking failed:', trackingResult.error)
          }
        } catch (trackError) {
          // Don't let tracking errors block login
          console.error('⚠️ Login tracking error:', trackError)
        }
        
        setMessage('✅ Login successful!')
        setTimeout(() => onSuccess(data.user), 800)
      }
    } catch (error) {
      console.error('❌ Login error:', error)
      setMessage('❌ ' + (error.message === 'Invalid login credentials' ? 'Invalid email or password' : error.message))
    } finally {
      setLoading(false)
    }
  }

  // ✅ FIXED: Signup Handler with Proper Tracking
  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    try {
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }
      if (!fullName.trim()) {
        throw new Error('Please enter your full name')
      }
      
      console.log('📝 Attempting signup...')
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: { 
          data: { 
            full_name: fullName, 
            role: 'job_seeker' 
          } 
        }
      })
      
      if (error) throw error
      
      if (data?.user) {
        console.log('✅ Signup successful, user:', data.user.email)
        
        // ✅ TRACK SIGNUP
        try {
          console.log('📊 Tracking signup...')
          const trackingResult = await trackUserSignup(data.user.id, data.user.email, {
            full_name: fullName,
            signup_method: 'email',
            timestamp: new Date().toISOString()
          })
          
          if (trackingResult.success) {
            console.log('✅ Signup tracked successfully')
          } else {
            console.error('⚠️ Signup tracking failed:', trackingResult.error)
          }
        } catch (trackError) {
          console.error('⚠️ Signup tracking error:', trackError)
        }
        
        if (data.session) {
          setMessage('✅ Account created successfully!')
          setTimeout(() => onSuccess(data.user), 1000)
        } else {
          setMessage('✅ Account created! Please check your email to verify.')
        }
      }
    } catch (error) {
      console.error('❌ Signup error:', error)
      setMessage('❌ ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Forgot Password Handlers - UNCHANGED
  const handleSendCode = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const code = generateVerificationCode()
      storeVerificationCode(email, code)
      await sendVerificationEmail(email, code)
      setMessage('✅ Verification code sent to your email')
      setResetStep('verify')
    } catch (error) {
      setMessage('❌ ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = (e) => {
    e.preventDefault()
    const result = verifyCode(email, verificationCode)
    if (result.valid) {
      setMessage('✅ Code verified')
      setResetStep('new_password')
    } else {
      setMessage('❌ ' + result.error)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      
      const response = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, new_password: newPassword })
      })
      
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error || 'Failed to update password')
      
      clearVerificationCode(email)
      setMessage('✅ Password updated! Please log in.')
      setTimeout(() => {
        setView('login')
        setResetStep('email')
        setPassword('')
      }, 2000)
      
    } catch (error) {
      console.error('Reset error:', error)
      setMessage('❌ ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="auth-modal">
          <h1>
            {view === 'login' && 'Job Seeker Login'}
            {view === 'signup' && 'Create Account'}
            {view === 'forgot_password' && 'Reset Password'}
          </h1>
          
          {view !== 'forgot_password' && (
            <div className="auth-toggle">
              <button 
                className={`toggle-btn ${view === 'login' ? 'active' : ''}`} 
                onClick={() => setView('login')}
              >
                Login
              </button>
              <button 
                className={`toggle-btn ${view === 'signup' ? 'active' : ''}`} 
                onClick={() => setView('signup')}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* LOGIN FORM */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="form">
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                <div style={{textAlign: 'right', marginTop: '5px'}}>
                   <button 
                     type="button" 
                     onClick={() => setView('forgot_password')} 
                     style={{
                       background:'none', 
                       border:'none', 
                       color:'#667eea', 
                       cursor:'pointer', 
                       fontSize:'12px'
                     }}
                   >
                     Forgot Password?
                   </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Processing...' : 'Login'}
              </button>
            </form>
          )}

          {/* SIGNUP FORM */}
          {view === 'signup' && (
            <form onSubmit={handleSignUp} className="form">
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  placeholder="e.g. John Doe" 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  minLength={6} 
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Processing...' : 'Sign Up'}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD FLOW */}
          {view === 'forgot_password' && (
            <div className="form">
              {resetStep === 'email' && (
                <form onSubmit={handleSendCode}>
                  <p className="subtitle">Enter your email to receive a verification code.</p>
                  <div className="form-group">
                    <label>Email</label>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                    />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Sending Code...' : 'Send Verification Code'}
                  </button>
                </form>
              )}

              {resetStep === 'verify' && (
                <form onSubmit={handleVerifyCode}>
                  <p className="subtitle">Enter the 6-digit code sent to {email}</p>
                  <div className="form-group">
                    <label>Verification Code</label>
                    <input 
                      type="text" 
                      value={verificationCode} 
                      onChange={(e) => setVerificationCode(e.target.value)} 
                      placeholder="123456" 
                      required 
                    />
                  </div>
                  <button type="submit" className="btn-primary">Verify Code</button>
                </form>
              )}

              {resetStep === 'new_password' && (
                <form onSubmit={handleResetPassword}>
                  <p className="subtitle">Create a new password</p>
                  <div className="form-group">
                    <label>New Password</label>
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      required 
                      minLength={6} 
                    />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              )}
              
              <button 
                type="button" 
                onClick={() => { setView('login'); setResetStep('email'); }} 
                className="btn-text" 
                style={{width: '100%', marginTop: '10px'}}
              >
                ← Back to Login
              </button>
            </div>
          )}

          {message && (
            <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthModal