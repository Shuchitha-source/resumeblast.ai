// /frontend/src/components/BlastConfig.jsx - FIXED VERSION
import { useState, useEffect } from 'react'
import { triggerEmailBlast } from '../services/blastService'
import { fetchRecruiters } from '../services/supabaseService'
import { initiateCheckout } from '../services/paymentService'
import './BlastConfig.css'

function BlastConfig({ resumeId, resumeUrl, userData, onBlastComplete, onCancel }) {
  const [blastConfig, setBlastConfig] = useState({
    industry: 'Technology',
    recruiterCount: 50,
    location: 'Remote'
  })
  
  const [recruiters, setRecruiters] = useState([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [hasPaid, setHasPaid] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)

  // Check payment status on component mount
  useEffect(() => {
    checkPaymentStatus()
  }, [])

  const checkPaymentStatus = () => {
    // Check URL parameters for payment success
    const urlParams = new URLSearchParams(window.location.search)
    const paymentSuccess = urlParams.get('payment') === 'success'
    
    if (paymentSuccess) {
      console.log('✅ Payment detected in URL - activating premium access')
      setHasPaid(true)
      
      // Store payment status in localStorage
      if (userData?.email) {
        localStorage.setItem(`payment_status_${userData.email}`, 'paid')
        localStorage.setItem(`payment_timestamp_${userData.email}`, new Date().toISOString())
      }
      
      // Clear URL parameter
      window.history.replaceState({}, '', window.location.pathname)
      return
    }
    
    // Check localStorage for persistent payment status
    if (userData?.email) {
      const storedPaymentStatus = localStorage.getItem(`payment_status_${userData.email}`)
      if (storedPaymentStatus === 'paid') {
        console.log('✅ Payment status found in localStorage')
        setHasPaid(true)
      } else {
        console.log('⚠️ No payment status found - payment required')
        setHasPaid(false)
      }
    }
  }

  const handlePayment = async () => {
    try {
      setProcessingPayment(true)
      setError(null)
      
      console.log('💳 Initiating payment...')
      
      // Validate user data
      if (!userData || !userData.email) {
        throw new Error('User information is missing. Please log in again.')
      }
      
      // Create user object for payment
      const user = {
        email: userData.email,
        id: userData.id || userData.email
      }
      
      console.log('👤 User for payment:', user)
      
      // Initiate Stripe checkout - THIS WILL REDIRECT THE USER
      await initiateCheckout(user)
      
      // Note: User will be redirected to Stripe, so code below won't execute
      // When they return, checkPaymentStatus() will handle it
      
    } catch (error) {
      console.error('❌ Payment error:', error)
      setError(error.message || 'Payment failed. Please try again.')
      setProcessingPayment(false)
    }
  }

  const handleLoadRecruiters = async () => {
    // CRITICAL: Block if not paid
    if (!hasPaid) {
      setError('⚠️ Payment required! Please upgrade to premium to load recruiters.')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      console.log('🔍 Loading recruiters...')
      console.log('Industry:', blastConfig.industry)
      console.log('Count:', blastConfig.recruiterCount)
      
      const recruitersData = await fetchRecruiters(
        blastConfig.industry, 
        parseInt(blastConfig.recruiterCount)
      )
      
      console.log('✅ Recruiters loaded:', recruitersData.length)
      setRecruiters(recruitersData)
      
      if (recruitersData.length === 0) {
        setError(`No recruiters found for ${blastConfig.industry}. Try selecting "All" industries.`)
      }
    } catch (err) {
      console.error('❌ Error loading recruiters:', err)
      setError('Failed to load recruiters. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSendBlast = async () => {
    // CRITICAL: Block if not paid
    if (!hasPaid) {
      setError('⚠️ Payment required! Please upgrade to premium to send blast.')
      return
    }

    if (recruiters.length === 0) {
      setError('Please load recruiters first.')
      return
    }

    setSending(true)
    setError(null)

    try {
      console.log('🚀 Sending blast...')
      
      const blastData = {
        candidate_name: userData.name || 'Professional Candidate',
        candidate_email: userData.email || '',
        candidate_phone: userData.phone || '',
        job_role: userData.targetRole || 'Professional',
        years_experience: userData.years_experience || '0',
        key_skills: userData.skills || 'Professional Skills',
        education_level: userData.education || 'Not Specified',
        location: blastConfig.location,
        linkedin_url: userData.linkedin || '',
        resume_url: resumeUrl || '',
        recipients: recruiters.map(r => ({
          email: r.email,
          name: r.name,
          company: r.company
        }))
      }
      
      console.log('📦 Blast data prepared:', blastData)
      
      const result = await triggerEmailBlast(blastData)
      
      console.log('✅ Blast sent successfully:', result)
      setSuccess(true)
      
      // Store blast record
      const blastRecord = {
        timestamp: new Date().toISOString(),
        recruiterCount: recruiters.length,
        industry: blastConfig.industry,
        location: blastConfig.location
      }
      localStorage.setItem(`blast_${Date.now()}`, JSON.stringify(blastRecord))
      
      setTimeout(() => {
        if (onBlastComplete) onBlastComplete(result)
      }, 2000)
      
    } catch (err) {
      console.error('❌ Blast error:', err)
      setError(err.message || 'Failed to send blast. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="blast-config-overlay">
      <div className="blast-config-modal">
        <div className="modal-header">
          <h2>🚀 Configure Resume Blast</h2>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>

        {/* Payment Required Banner - Shows when NOT paid */}
        {!hasPaid && (
          <div className="payment-banner">
            <div className="payment-info">
              <h3>💳 Premium Feature Required</h3>
              <p>Unlock resume distribution to 500+ verified recruiters</p>
              <div className="price-tag">
                <span className="currency">$</span>
                <span className="amount">149</span>
                <span className="period">one-time payment</span>
              </div>
            </div>
            <button 
              className="payment-button"
              onClick={handlePayment}
              disabled={processingPayment}
            >
              {processingPayment ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                '⚡ Upgrade to Premium ($149)'
              )}
            </button>
          </div>
        )}

        {/* Success Banner - Shows when paid */}
        {hasPaid && (
          <div className="success-banner">
            <span className="check-icon">✅</span>
            <span>Premium Access Activated - Ready to Blast!</span>
          </div>
        )}

        <div className="modal-body">
          {/* Campaign Settings */}
          <div className="config-section">
            <h3>📊 Campaign Settings</h3>
            
            <div className="form-group">
              <label>Target Industry</label>
              <select 
                value={blastConfig.industry}
                onChange={(e) => setBlastConfig({...blastConfig, industry: e.target.value})}
                disabled={!hasPaid}
              >
                <option value="All">All Industries</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="Engineering">Engineering</option>
                <option value="Education">Education</option>
                <option value="Retail">Retail</option>
              </select>
            </div>

            <div className="form-group">
              <label>Number of Recruiters</label>
              <select 
                value={blastConfig.recruiterCount}
                onChange={(e) => setBlastConfig({...blastConfig, recruiterCount: e.target.value})}
                disabled={!hasPaid}
              >
                <option value="10">10 Recruiters</option>
                <option value="25">25 Recruiters</option>
                <option value="50">50 Recruiters (Recommended)</option>
                <option value="100">100 Recruiters</option>
                <option value="250">250 Recruiters</option>
                <option value="500">500 Recruiters</option>
              </select>
            </div>

            <div className="form-group">
              <label>Preferred Location</label>
              <select 
                value={blastConfig.location}
                onChange={(e) => setBlastConfig({...blastConfig, location: e.target.value})}
                disabled={!hasPaid}
              >
                <option value="Remote">Remote</option>
                <option value="United States">United States</option>
                <option value="California">California</option>
                <option value="New York">New York</option>
                <option value="Texas">Texas</option>
                <option value="Florida">Florida</option>
                <option value="Flexible">Flexible</option>
              </select>
            </div>

            {!hasPaid && (
              <div className="payment-required-overlay">
                <div className="lock-icon">🔒</div>
                <p>Upgrade to Premium to access this feature</p>
              </div>
            )}

            <button 
              className="load-btn"
              onClick={handleLoadRecruiters}
              disabled={loading || !hasPaid}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Loading Recruiters...
                </>
              ) : (
                '🔍 Load Recruiters'
              )}
            </button>
          </div>

          {/* Recruiters Preview */}
          {recruiters.length > 0 && (
            <div className="recruiters-section">
              <h3>👥 Loaded Recruiters ({recruiters.length})</h3>
              <div className="recruiters-list">
                {recruiters.slice(0, 5).map((recruiter, idx) => (
                  <div key={idx} className="recruiter-card">
                    <div className="recruiter-avatar">
                      {recruiter.name?.charAt(0) || 'R'}
                    </div>
                    <div className="recruiter-info">
                      <p className="recruiter-name">{recruiter.name || 'Recruiter'}</p>
                      <p className="recruiter-company">{recruiter.company || 'Company'}</p>
                      <p className="recruiter-email">{recruiter.email}</p>
                    </div>
                  </div>
                ))}
                {recruiters.length > 5 && (
                  <p className="more-recruiters">
                    + {recruiters.length - 5} more recruiters
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error Messages */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="success-message">
              <span className="success-icon">✅</span>
              <span>Blast sent successfully! Check your email for confirmation.</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button 
            className="send-btn"
            onClick={handleSendBlast}
            disabled={sending || recruiters.length === 0 || !hasPaid}
          >
            {sending ? (
              <>
                <span className="spinner"></span>
                Sending Blast...
              </>
            ) : (
              `🚀 Send to ${recruiters.length} Recruiters`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BlastConfig