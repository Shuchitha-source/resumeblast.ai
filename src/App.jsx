import { useState } from 'react'
import { supabase } from './lib/supabase'
import './App.css'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) throw error
      
      setMessage('✅ Success! Check your email for verification link.')
      setEmail('')
      setPassword('')
    } catch (error) {
      setMessage('❌ Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1>🚀 ResumeBlast.ai</h1>
        <p className="subtitle">AI-Powered Resume Optimization & Distribution</p>
        
        <form onSubmit={handleSignUp} className="form">
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
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />
          </div>
          
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        
        {message && (
          <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}

export default App