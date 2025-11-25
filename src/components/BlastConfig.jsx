import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { triggerEmailBlast } from '../services/blastService';

export default function BlastConfig({ userData, resumeUrl }) {
  const [selectedRecruiters, setSelectedRecruiters] = useState([]);
  const [allRecruiters, setAllRecruiters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch recruiters from Supabase on component mount
  useEffect(() => {
    fetchRecruiters();
  }, []);

  const fetchRecruiters = async () => {
    try {
      console.log('📥 Fetching recruiters from Supabase...');
      
      const { data, error } = await supabase
        .from('recruiters')
        .select('*')
        .eq('status', 'active')
        .limit(100);

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log(`✅ Fetched ${data?.length || 0} recruiters`);
      setAllRecruiters(data || []);
      
      // Auto-select first 3 recruiters for easy testing
      if (data && data.length > 0) {
        setSelectedRecruiters(data.slice(0, 3));
      }
    } catch (err) {
      console.error('❌ Error fetching recruiters:', err);
      setError('Failed to load recruiters: ' + err.message);
    }
  };

  const handleSendBlast = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      console.log('🚀 Starting email blast...');
      console.log('📄 Resume URL:', resumeUrl);
      console.log('👥 Selected recruiters:', selectedRecruiters.length);

      // Validate recruiters
      if (!selectedRecruiters || selectedRecruiters.length === 0) {
        throw new Error('Please select at least one recruiter');
      }

      // Validate resume URL
      if (!resumeUrl) {
        throw new Error('Resume URL is required. Please upload a resume first.');
      }

      // CRITICAL FIX: Correct Supabase bucket name if wrong
      let correctedResumeUrl = resumeUrl;
      if (resumeUrl.includes('/object/public/resume/')) {
        console.warn('⚠️ Fixing incorrect bucket name in URL...');
        correctedResumeUrl = resumeUrl.replace(
          '/object/public/resume/', 
          '/object/public/resumes/'
        );
        console.log('✅ Corrected URL:', correctedResumeUrl);
      }

      // Build recipients array
      const recipients = selectedRecruiters.map(recruiter => ({
        email: recruiter.email,
        name: recruiter.name,
        company: recruiter.company || 'Company'
      }));

      // Build blast data
      const blastData = {
        candidate_name: userData?.name || 'Professional Candidate',
        candidate_email: userData?.email || 'candidate@example.com',
        candidate_phone: userData?.phone || '',
        job_role: userData?.targetRole || userData?.job_role || 'Software Engineer',
        years_experience: String(userData?.experience || userData?.years_experience || '3'),
        key_skills: userData?.skills || userData?.key_skills || 'Professional Skills',
        education_level: userData?.education || userData?.education_level || "Bachelor's Degree",
        location: userData?.location || 'Remote',
        linkedin_url: userData?.linkedin || 'https://linkedin.com',
        resume_url: correctedResumeUrl,
        recipients: recipients
      };

      console.log('📦 Sending blast to', blastData.recipients.length, 'recruiters');

      // Send blast
      const result = await triggerEmailBlast(blastData);

      console.log('✅ Blast successful:', result);
      setSuccess(true);
      
      // Show success message
      alert(
        `✅ Success! Email blast sent to ${blastData.recipients.length} recruiters!\n\n` +
        `Recipients:\n${blastData.recipients.map(r => `- ${r.name} (${r.email})`).join('\n')}\n\n` +
        `📧 Check:\n` +
        `• Recruiter email inboxes (may take 2-5 minutes)\n` +
        `• Spam folders if not in inbox\n` +
        `• Make.com History for execution details\n` +
        `• Brevo Dashboard for delivery status`
      );

    } catch (err) {
      console.error('❌ Blast error:', err);
      setError(err.message || 'Failed to send blast');
      alert('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecruiter = (recruiter) => {
    const isSelected = selectedRecruiters.some(r => r.id === recruiter.id);
    if (isSelected) {
      setSelectedRecruiters(selectedRecruiters.filter(r => r.id !== recruiter.id));
    } else {
      setSelectedRecruiters([...selectedRecruiters, recruiter]);
    }
  };

  const selectAll = () => {
    setSelectedRecruiters(allRecruiters);
  };

  const deselectAll = () => {
    setSelectedRecruiters([]);
  };

  return (
    <div className="blast-config" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>
        🚀 Blast Your Resume
      </h2>

      {/* Error Display */}
      {error && (
        <div style={{
          background: '#fee',
          border: '2px solid #f88',
          padding: '15px',
          borderRadius: '6px',
          marginBottom: '20px',
          color: '#c00',
          fontWeight: '500'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div style={{
          background: '#efe',
          border: '2px solid #8f8',
          padding: '15px',
          borderRadius: '6px',
          marginBottom: '20px',
          color: '#080',
          fontWeight: '500'
        }}>
          ✅ Blast sent successfully! Check recruiter inboxes and Make.com History.
        </div>
      )}

      {/* Recruiter Selection */}
      <div className="recruiter-selection" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>
          Select Recruiters ({selectedRecruiters.length} selected)
        </h3>
        
        {/* Action Buttons */}
        <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={selectAll}
            style={{
              padding: '8px 16px',
              background: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ✓ Select All ({allRecruiters.length})
          </button>
          <button 
            onClick={deselectAll}
            style={{
              padding: '8px 16px',
              background: '#757575',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ✗ Deselect All
          </button>
          <button 
            onClick={fetchRecruiters}
            style={{
              padding: '8px 16px',
              background: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Recruiter List */}
        <div style={{
          maxHeight: '250px',
          overflowY: 'auto',
          border: '1px solid #ddd',
          borderRadius: '6px',
          padding: '10px',
          background: '#fafafa'
        }}>
          {allRecruiters.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
              No recruiters found. Please add recruiters to your database.
            </p>
          ) : (
            allRecruiters.map(recruiter => (
              <label 
                key={recruiter.id} 
                style={{
                  display: 'block',
                  padding: '10px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee',
                  background: selectedRecruiters.some(r => r.id === recruiter.id) ? '#e3f2fd' : 'transparent',
                  borderRadius: '4px',
                  marginBottom: '4px',
                  transition: 'background 0.2s'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedRecruiters.some(r => r.id === recruiter.id)}
                  onChange={() => toggleRecruiter(recruiter)}
                  style={{ marginRight: '10px' }}
                />
                <strong>{recruiter.name}</strong>
                <br />
                <small style={{ color: '#666', marginLeft: '24px' }}>
                  📧 {recruiter.email} • 🏢 {recruiter.company}
                </small>
              </label>
            ))
          )}
        </div>
      </div>

      {/* Send Button */}
      <button
        onClick={handleSendBlast}
        disabled={loading || selectedRecruiters.length === 0}
        style={{
          width: '100%',
          padding: '15px 30px',
          backgroundColor: selectedRecruiters.length === 0 ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: selectedRecruiters.length === 0 ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s',
          boxShadow: loading ? 'none' : '0 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        {loading ? '⏳ Sending Blast...' : `🚀 Send Blast to ${selectedRecruiters.length} Recruiters`}
      </button>

      {/* Helper Text */}
      <p style={{ 
        marginTop: '15px', 
        fontSize: '13px', 
        color: '#666', 
        textAlign: 'center' 
      }}>
        💡 Tip: Emails may take 2-5 minutes to arrive. Check spam folders if not in inbox.
      </p>

      {/* Debug Info */}
      <details style={{ marginTop: '30px', fontSize: '12px', color: '#666' }}>
        <summary style={{ 
          cursor: 'pointer', 
          fontWeight: 'bold',
          padding: '10px',
          background: '#f5f5f5',
          borderRadius: '4px'
        }}>
          🐛 Debug Info (Click to expand)
        </summary>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '15px', 
          borderRadius: '4px', 
          overflow: 'auto',
          fontSize: '11px',
          border: '1px solid #ddd',
          marginTop: '10px'
        }}>
          {JSON.stringify({
            totalRecruiters: allRecruiters.length,
            selectedCount: selectedRecruiters.length,
            selectedRecruiters: selectedRecruiters.map(r => ({ 
              name: r.name, 
              email: r.email,
              company: r.company
            })),
            hasUserData: !!userData,
            hasResumeUrl: !!resumeUrl,
            resumeUrlPreview: resumeUrl ? resumeUrl.substring(0, 80) + '...' : 'Not provided'
          }, null, 2)}
        </pre>
      </details>
    </div>
  );
}