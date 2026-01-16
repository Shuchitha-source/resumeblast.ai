import { useState, useEffect } from 'react'
import { triggerEmailBlast } from '../services/blastService'
import { fetchRecruiters } from '../services/supabaseService'
import { initiateCheckout } from '../services/paymentService'
import { 
  trackPaymentInitiated, 
  trackPaymentFailure,
  trackBlastInitiated, 
  trackBlastCompleted, 
  trackBlastFailure 
} from '../services/activityTrackingService'
import './BlastConfig.css'

function BlastConfig({ resumeId, resumeUrl, userData, paymentVerified, onBlastComplete, onCancel }) {
  const [blastConfig, setBlastConfig] = useState({
    industry: 'Technology',
    recruiterCount: 50,
    location: 'Remote'
  })
  
  const [status, setStatus] = useState('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState(null)

  // ✅ Trigger blast if paymentVerified is TRUE
  useEffect(() => {
    if (paymentVerified) {
      console.log('💳 Payment Verified via Prop - Auto Blasting...');
      const savedConfig = localStorage.getItem('pending_blast_config');
      if (savedConfig) setBlastConfig(JSON.parse(savedConfig));
      handleAutoBlast();
    }
  }, [paymentVerified]);

  const handlePaymentAndBlast = async () => {
    try {
      setStatus('payment_processing');
      setError(null);
      
      // Save config for after redirect
      localStorage.setItem('pending_blast_config', JSON.stringify(blastConfig));
      if (resumeId) {
        localStorage.setItem('pending_blast_resume_data', JSON.stringify({
          id: resumeId, url: resumeUrl, timestamp: Date.now()
        }));
      }
      
      // Track & Checkout
      await trackPaymentInitiated(userData.id, userData.email, 14900);
      await initiateCheckout({ email: userData.email, id: userData.id });
      
    } catch (error) {
      console.error('❌ Payment Error:', error);
      setError(error.message);
      setStatus('idle');
      if (userData?.id) await trackPaymentFailure(userData.id, error.message);
    }
  }

  const handleAutoBlast = async () => {
    setStatus('blasting');
    setStatusMessage('Payment verified! Finding matching recruiters...');
    let campaignId = null;

    try {
      // 1. Fetch Recruiters
      const savedConfigStr = localStorage.getItem('pending_blast_config');
      const currentConfig = savedConfigStr ? JSON.parse(savedConfigStr) : blastConfig;
      
      console.log(`🔍 Fetching recruiters for: ${currentConfig.industry}`);
      const recruiters = await fetchRecruiters(currentConfig.industry, 50);
      
      if (!recruiters || recruiters.length === 0) {
          console.warn(`⚠️ No recruiters found for ${currentConfig.industry}. Using fallback.`);
      }

      const effectiveRecruiters = (recruiters && recruiters.length > 0) ? recruiters : [
        { email: 'demo@example.com', name: 'Demo Recruiter', company: 'Demo Company' }
      ];

      setStatusMessage(`Found ${effectiveRecruiters.length} recruiters. Sending resumes...`);

      // ✅ OPTION 2 FIX: Extract correct filename from URL
      // This handles .pdf, .docx, .txt automatically based on what was uploaded
      let correctFileName = 'Resume.pdf'; // Default
      if (resumeUrl) {
          try {
             const urlObj = new URL(resumeUrl);
             // Extracts "timestamp_filename.docx" from URL
             const pathName = urlObj.pathname.split('/').pop(); 
             if (pathName) correctFileName = decodeURIComponent(pathName);
          } catch (e) {
             console.warn('Could not extract filename from URL, using default.');
          }
      }
      console.log('📄 Using resume filename:', correctFileName);

      // 2. Prepare Data
      const blastData = {
        candidate_name: userData.name,
        candidate_email: userData.email,
        candidate_phone: userData.phone || '',
        job_role: userData.targetRole,
        resume_url: resumeUrl,
        resume_name: correctFileName, // <--- Pass extracted name
        recipients: effectiveRecruiters.map(r => ({
          email: r.email, name: r.name, company: r.company
        }))
      };

      // 3. Track Initiation
      try {
        const tracking = await trackBlastInitiated(userData.id, {
          resume_id: resumeId,
          industry: currentConfig.industry,
          recipients_count: effectiveRecruiters.length
        });
        if (tracking.success) campaignId = tracking.campaign_id;
      } catch (e) { console.warn('Tracking error', e); }

      // 4. Send via Make.com
      const result = await triggerEmailBlast(blastData);
      
      // 5. Track Completion
      if (campaignId) {
        await trackBlastCompleted(userData.id, campaignId, result);
      }

      setStatus('success');
      
      // Cleanup
      localStorage.removeItem('pending_blast_config');
      localStorage.removeItem('pending_blast_resume_data');
      window.history.replaceState({}, '', window.location.pathname);
      
      setTimeout(() => {
        if (onBlastComplete) onBlastComplete(result);
      }, 3000);

    } catch (err) {
      console.error('❌ Blast Failed:', err);
      setError(err.message);
      setStatus('error');
      if (campaignId) await trackBlastFailure(userData.id, campaignId, err.message);
    }
  }

  return (
    <div className="blast-config-overlay">
      <div className="blast-config-modal">
        {/* Header */}
        <div className="modal-header">
          <h2>{status === 'success' ? '🚀 Blast Complete!' : '🚀 Resume Blast'}</h2>
          {status !== 'blasting' && status !== 'payment_processing' && (
            <button className="close-btn" onClick={onCancel}>✕</button>
          )}
        </div>

        <div className="modal-body">
          {/* Success View */}
          {status === 'success' && (
            <div className="success-message" style={{textAlign: 'center', padding: '40px'}}>
              <span style={{fontSize: '48px'}}>✅</span>
              <h3>Blast Complete!</h3>
              <p>Sent to {blastConfig.recruiterCount} recruiters.</p>
            </div>
          )}

          {/* Loading View */}
          {(status === 'blasting' || status === 'payment_processing') && (
            <div style={{textAlign: 'center', padding: '40px'}}>
              <div className="spinner" style={{width: '50px', height: '50px', margin: '0 auto 20px'}}></div>
              <h3>{status === 'payment_processing' ? 'Redirecting...' : 'Blast in Progress'}</h3>
              <p>{statusMessage}</p>
            </div>
          )}

          {/* Config View */}
          {(status === 'idle' || status === 'error') && (
            <>
              {error && <div className="error-message" style={{color: 'red', background:'#fee2e2', padding:'10px', borderRadius:'5px', marginBottom:'10px'}}>⚠️ {error}</div>}
              
              <div className="payment-banner" style={{background: '#FEF2F2', border: '1px solid #DC2626', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div><h3 style={{margin:0, color:'#991B1B'}}>One Payment, One Blast</h3></div>
                <div style={{fontSize: '24px', fontWeight: 'bold', color:'#DC2626'}}>$149</div>
              </div>

              <div className="config-section">
                <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>Target Industry</label>
                <select value={blastConfig.industry} onChange={(e) => setBlastConfig({...blastConfig, industry: e.target.value})} style={{width: '100%', padding: '10px', marginBottom: '20px'}}>
                  <option value="Technology">Technology</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Marketing">Marketing</option>
                  <option value="All">All Industries</option>
                </select>
                
                <div style={{background: '#F3F4F6', padding: '15px', borderRadius: '8px'}}>
                   <strong>Recruiter Reach:</strong> ~50 Verified Recruiters
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {(status === 'idle' || status === 'error') && (
          <div className="modal-footer" style={{padding: '20px', borderTop: '1px solid #eee', display: 'flex', gap: '10px'}}>
            <button onClick={onCancel} style={{flex: 1, padding: '12px', background: 'white', border: '1px solid #ccc', borderRadius: '8px'}}>Cancel</button>
            <button onClick={handlePaymentAndBlast} style={{flex: 2, padding: '12px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold'}}>⚡ Pay $149 & Blast</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default BlastConfig