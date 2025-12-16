import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { sendVerificationEmail, generateVerificationCode } from '../services/brevoEmailService'
import { storeVerificationCode, verifyCode, clearVerificationCode } from '../utils/verificationStorage'
import './AuthModal.css'

function AuthModal({ onClose, onSuccess }) {
  // Views: 'login', 'signup', 'forgot', 'verify-code', 'reset-password'
  const [view, setView] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setMessage('✅ Login successful!')
      setTimeout(() => onSuccess && onSuccess(), 1000)
    } catch (error) {
      setMessage('❌ ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle Sign Up
  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}` }
      })
      if (error) throw error
      if (data?.user?.identities?.length === 0) {
        setMessage('❌ Account exists. Please login.')
        setTimeout(() => setView('login'), 2000)
        return
      }
      setMessage('✅ Check your email for verification link.')
    } catch (error) {
      setMessage('❌ ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Send Verification Code via Brevo
  const handleSendVerificationCode = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    try {
      console.log('📧 Initiating password reset for:', email)
      
      // Generate 6-digit code
      const code = generateVerificationCode()
      console.log('🔐 Generated code:', code)
      
      // Send via Brevo SMTP
      setMessage('📧 Sending verification code to your email...')
      const sendResult = await sendVerificationEmail(email, code)
      
      if (!sendResult.success) {
        throw new Error('Failed to send verification email')
      }
      
      // Store code locally with expiration
      storeVerificationCode(email, code)
      
      setMessage('✅ Verification code sent! Check your email inbox.')
      console.log('✅ Password reset flow initiated successfully')
      
      // Move to verification view
      setTimeout(() => {
        setView('verify-code')
        setMessage('')
      }, 2000)
      
    } catch (error) {
      console.error('❌ Send verification code error:', error)
      setMessage('❌ ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Verify Code Entered by User
  const handleVerifyCode = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    try {
      console.log('🔐 Verifying code for:', email)
      
      // Validate code format
      if (!/^\d{6}$/.test(verificationCode.trim())) {
        throw new Error('Please enter a valid 6-digit code')
      }
      
      // Verify code matches and hasn't expired
      const result = verifyCode(email, verificationCode)
      
      if (!result.valid) {
        throw new Error(result.error)
      }
      
      console.log('✅ Code verified successfully!')
      setMessage('✅ Code verified! Now set your new password.')
      
      // Move to password reset view
      setTimeout(() => {
        setView('reset-password')
        setMessage('')
      }, 1500)
      
    } catch (error) {
      console.error('❌ Verify code error:', error)
      setMessage('❌ ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // ✅ STEP 5: Reset Password After Verification (SERVER-SIDE CALL)
  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    try {
      console.log('🔒 Resetting password for:', email)
      
      // Step 1: Validate passwords match
      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match')
      }
      
      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long')
      }
      
      // Step 2: Call server-side password reset function
      setMessage('🔒 Updating your password securely...')
      
      console.log('📡 Calling Netlify function: /.netlify/functions/reset-password')
      
      const response = await fetch('/.netlify/functions/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          newPassword: newPassword
        })
      })
      
      console.log('📊 Response status:', response.status)
      
      // Check if request was successful
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Server error:', errorData)
        throw new Error(errorData.error || 'Password reset failed. Please try again.')
      }
      
      const result = await response.json()
      console.log('✅ Password reset successful:', result)
      
      // Step 3: Clear verification code from storage
      clearVerificationCode(email)
      console.log('✅ Verification code cleared')
      
      setMessage('✅ Password reset successful! Redirecting to login...')
      
      // Step 4: Return to login after 3 seconds
      setTimeout(() => {
        setView('login')
        setEmail('')
        setPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setVerificationCode('')
        setMessage('')
      }, 3000)
      
    } catch (error) {
      console.error('❌ Reset password error:', error)
      
      // Enhanced error messages
      let errorMessage = error.message
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.'
      } else if (error.message.includes('404')) {
        errorMessage = 'Password reset service not available. Please contact support.'
      }
      
      setMessage('❌ ' + errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Resend verification code
  const handleResendCode = async () => {
    setVerificationCode('')
    setMessage('📧 Resending code...')
    await handleSendVerificationCode({ preventDefault: () => {} })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="auth-modal">
          {/* Header */}
          <h1>
            {view === 'login' && 'Welcome Back'}
            {view === 'signup' && 'Get Started'}
            {view === 'forgot' && 'Reset Password'}
            {view === 'verify-code' && 'Enter Verification Code'}
            {view === 'reset-password' && 'Set New Password'}
          </h1>

          {/* Toggle Buttons (Login/Signup only) */}
          {(view === 'login' || view === 'signup') && (
            <div className="auth-toggle">
              <button 
                className={`toggle-btn ${view === 'login' ? 'active' : ''}`} 
                onClick={() => { setView('login'); setMessage(''); }}
              >
                Login
              </button>
              <button 
                className={`toggle-btn ${view === 'signup' ? 'active' : ''}`} 
                onClick={() => { setView('signup'); setMessage(''); }}
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
                  disabled={loading}
                  placeholder="your.email@example.com"
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  disabled={loading} 
                  minLength={6}
                  placeholder="••••••••"
                />
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
                <label>Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  disabled={loading}
                  placeholder="your.email@example.com"
                />
              </div>
              <div className="form-group">
                <label>Password (min 6 characters)</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  disabled={loading} 
                  minLength={6}
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Processing...' : 'Sign Up'}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD - REQUEST CODE */}
          {view === 'forgot' && (
            <form onSubmit={handleSendVerificationCode} className="form">
              <p className="form-description">
                Enter your email address and we'll send you a verification code to reset your password.
              </p>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  disabled={loading}
                  placeholder="your.email@example.com"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </form>
          )}

          {/* VERIFY CODE */}
          {view === 'verify-code' && (
            <form onSubmit={handleVerifyCode} className="form">
              <p className="form-description">
                Enter the 6-digit verification code sent to <strong>{email}</strong>
              </p>
              <div className="form-group">
                <label>Verification Code</label>
                <input 
                  type="text" 
                  value={verificationCode} 
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                  required 
                  disabled={loading}
                  maxLength={6}
                  pattern="[0-9]{6}"
                  placeholder="123456"
                  style={{ 
                    fontSize: '28px', 
                    letterSpacing: '12px', 
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    fontWeight: 'bold'
                  }}
                  autoFocus
                />
                <small style={{ display: 'block', marginTop: '10px', color: '#6B7280' }}>
                  Code expires in 10 minutes
                </small>
              </div>
              <button type="submit" disabled={loading || verificationCode.length !== 6} className="btn-primary">
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              <button 
                type="button" 
                onClick={handleResendCode} 
                disabled={loading}
                className="btn-secondary"
                style={{ marginTop: '10px' }}
              >
                Resend Code
              </button>
            </form>
          )}

          {/* RESET PASSWORD */}
          {view === 'reset-password' && (
            <form onSubmit={handleResetPassword} className="form">
              <p className="form-description">
                Create a new password for your account
              </p>
              <div className="form-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  disabled={loading}
                  minLength={6}
                  placeholder="••••••••"
                />
                <small style={{ display: 'block', marginTop: '5px', color: '#6B7280' }}>
                  Minimum 6 characters
                </small>
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  disabled={loading}
                  minLength={6}
                  placeholder="••••••••"
                />
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p style={{ color: '#DC2626', fontSize: '14px', marginTop: '5px' }}>
                  ⚠️ Passwords do not match
                </p>
              )}
              <button 
                type="submit" 
                disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword} 
                className="btn-primary"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
          
          {/* Message Display */}
          {message && (
            <div className={`message ${message.includes('❌') || message.includes('⚠️') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          {/* Navigation Links */}
          {view === 'login' && (
            <div className="forgot-password">
              <a href="#" onClick={(e) => { e.preventDefault(); setView('forgot'); setMessage(''); }}>
                Forgot password?
              </a>
            </div>
          )}
          
          {(view === 'forgot' || view === 'verify-code' || view === 'reset-password') && (
            <div className="forgot-password">
              <a href="#" onClick={(e) => { 
                e.preventDefault(); 
                setView('login'); 
                setMessage(''); 
                setVerificationCode('');
                setNewPassword('');
                setConfirmPassword('');
              }}>
                ← Back to Login
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthModal