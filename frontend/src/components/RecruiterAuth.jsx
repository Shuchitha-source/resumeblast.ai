import { useState } from 'react'
import { checkRecruiterExists, registerRecruiter, loginRecruiter } from '../services/recruiterAuthService'
import { logRecruiterActivity, ACTIVITY_TYPES } from '../services/recruiterActivityService'
import './AuthModal.css'

function RecruiterAuth({ onClose, onSuccess }) {
  // Steps: 'email' -> 'login' (if found) OR 'register' (if new)
  const [step, setStep] = useState('email') 
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // STEP 1: Check if Email exists in 'recruiters' table
  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (!email.includes('@')) throw new Error('Invalid email')
        
      const result = await checkRecruiterExists(email)

      if (result.exists) {
        console.log('✅ Recruiter found, prompting login')
        setStep('login') 
      } else {
        console.log('🔍 New recruiter, prompting registration')
        setStep('register') 
      }
    } catch (error) {
      setMessage('❌ ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // STEP 2a: Login (if recruiter exists)
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const result = await loginRecruiter(email, password)
    
    if (result.success) {
      setMessage('✅ Login successful!')
      
      // ✅ LOG LOGIN ACTIVITY
      await logRecruiterActivity(result.recruiter.id, ACTIVITY_TYPES.LOGIN, {
        email: result.recruiter.email,
        login_method: 'password',
        success: true
      })
      
      setTimeout(() => onSuccess(result.recruiter), 500)
    } else {
      setMessage('❌ ' + (result.error || 'Login failed'))
      
      // ✅ LOG FAILED LOGIN ATTEMPT
      if (result.recruiter?.id) {
        await logRecruiterActivity(result.recruiter.id, ACTIVITY_TYPES.LOGIN, {
          email: email,
          login_method: 'password',
          success: false,
          error: result.error
        })
      }
      
      setLoading(false)
    }
  }

  // STEP 2b: Register (if recruiter is new) - SAVES TO 'recruiters' TABLE
  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    if (password.length < 6) {
      setMessage('❌ Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const result = await registerRecruiter(email, password)

    if (result.success) {
      setMessage('✅ Account created!')
      
      // ✅ LOG REGISTRATION ACTIVITY
      await logRecruiterActivity(result.recruiter.id, 'registration', {
        email: result.recruiter.email,
        registration_method: 'email_password'
      })
      
      setTimeout(() => onSuccess(result.recruiter), 1000)
    } else {
      setMessage('❌ ' + (result.error || 'Registration failed'))
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="auth-modal">
          <h1>
            {step === 'email' && 'Recruiter Access'}
            {step === 'login' && 'Welcome Back'}
            {step === 'register' && 'Create Account'}
          </h1>
          
          <p className="subtitle" style={{marginBottom: '20px'}}>
            {step === 'email' && 'Enter your work email to start'}
            {step === 'login' && `Log in as ${email}`}
            {step === 'register' && `Create a password for ${email}`}
          </p>

          {/* VIEW 1: EMAIL ENTRY */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="form">
              <div className="form-group">
                <label>Work Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="name@company.com"
                  required 
                  autoFocus
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Checking...' : 'Continue →'}
              </button>
            </form>
          )}

          {/* VIEW 2: LOGIN */}
          {step === 'login' && (
            <form onSubmit={handleLogin} className="form">
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  autoFocus
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Logging in...' : 'Login'}
              </button>
              <button type="button" onClick={() => {setStep('email'); setPassword('')}} className="btn-text">
                ← Back to email
              </button>
            </form>
          )}

          {/* VIEW 3: REGISTER */}
          {step === 'register' && (
            <form onSubmit={handleRegister} className="form">
              <div className="form-group">
                <label>Create Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Min 6 characters"
                  required 
                  minLength={6}
                  autoFocus
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
              <button type="button" onClick={() => {setStep('email'); setPassword('')}} className="btn-text">
                ← Back to email
              </button>
            </form>
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

export default RecruiterAuth