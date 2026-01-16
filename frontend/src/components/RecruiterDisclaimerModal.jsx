import { useState } from 'react'
import { logRecruiterActivity, ACTIVITY_TYPES } from '../services/recruiterActivityService'
import './AuthModal.css' // Reuse existing modal styles

function RecruiterDisclaimerModal({ onAccept, onDecline, recruiterId }) {
  const [isChecked, setIsChecked] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAccept = async () => {
    if (isChecked && !isSubmitting) {
      setIsSubmitting(true)
      
      console.log('📝 Logging disclaimer acceptance for recruiter:', recruiterId)
      
      // ✅ LOG DISCLAIMER ACCEPTANCE
      const result = await logRecruiterActivity(recruiterId, ACTIVITY_TYPES.DISCLAIMER_ACCEPTED, {
        accepted_at: new Date().toISOString(),
        checkbox_confirmed: true
      })
      
      if (result.success) {
        console.log('✅ Disclaimer acceptance logged successfully')
      } else {
        console.error('❌ Failed to log disclaimer acceptance:', result.error)
      }
      
      // Call parent handler to update database
      onAccept()
    }
  }

  const handleDecline = async () => {
    console.log('❌ User declined disclaimer')
    
    // ✅ LOG DISCLAIMER DECLINED
    await logRecruiterActivity(recruiterId, 'disclaimer_declined', {
      declined_at: new Date().toISOString()
    })
    
    onDecline()
  }

  return (
    <div className="modal-overlay" onClick={handleDecline}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <button className="close-button" onClick={handleDecline}>×</button>
        
        <div className="auth-modal">
          <h2 style={{ color: '#DC2626', marginBottom: '20px', fontSize: '24px' }}>
            ⚠️ Resume Usage Disclaimer
          </h2>
          
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FEE2E2',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '25px',
            textAlign: 'left',
            lineHeight: '1.6'
          }}>
            <p style={{ marginBottom: '15px', color: '#374151' }}>
              The resumes displayed on this platform are provided by job seekers solely for recruitment purposes. 
              Recruiters must not misuse, copy, modify, redistribute, or alter any resume content without the 
              job seeker's explicit consent.
            </p>
            
            <p style={{ marginBottom: '15px', color: '#374151' }}>
              Any unauthorized use or modification is the <strong>sole responsibility of the recruiter</strong>. 
              ResumeBlast.ai is not liable for any misuse, alteration, or resulting consequences.
            </p>
            
            <p style={{ color: '#374151', marginBottom: 0 }}>
              By proceeding, you agree to use the resume information ethically and only for legitimate hiring purposes.
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '15px',
            background: '#F9FAFB',
            borderRadius: '8px',
            marginBottom: '20px',
            cursor: 'pointer'
          }}
          onClick={() => setIsChecked(!isChecked)}
          >
            <input 
              type="checkbox"
              id="disclaimer-checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              style={{
                width: '20px',
                height: '20px',
                cursor: 'pointer',
                marginTop: '2px',
                accentColor: '#DC2626'
              }}
            />
            <label 
              htmlFor="disclaimer-checkbox" 
              style={{
                cursor: 'pointer',
                fontSize: '15px',
                color: '#111827',
                fontWeight: '500',
                userSelect: 'none'
              }}
            >
              I agree to use resume information ethically and only for legitimate recruitment purposes
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button 
              onClick={handleDecline}
              className="btn-outline"
              style={{
                padding: '12px 24px',
                fontSize: '15px'
              }}
            >
              Cancel
            </button>
            <button 
              onClick={handleAccept}
              disabled={!isChecked || isSubmitting}
              className="btn-primary"
              style={{
                padding: '12px 24px',
                fontSize: '15px',
                opacity: (isChecked && !isSubmitting) ? 1 : 0.5,
                cursor: (isChecked && !isSubmitting) ? 'pointer' : 'not-allowed',
                background: (isChecked && !isSubmitting) ? '#DC2626' : '#9CA3AF'
              }}
            >
              {isSubmitting ? 'Processing...' : 'I Agree & Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecruiterDisclaimerModal