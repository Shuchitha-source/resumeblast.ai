import { useState, useEffect } from 'react'
import Lottie from 'lottie-react'
import botAnimation from '../assets/bot-working.json'
import BlastConfig from './BlastConfig'
import { analyzeResumeForBlast, getSkillsByCategory, formatAllSkillsForDisplay } from '../utils/aiAnalyzer'
import { trackResumeAnalysis } from '../services/activityTrackingService'
import './ResumeAnalysis.css'

function ResumeAnalysis({ user, resumeText, resumeUrl, resumeId, isPaymentSuccess }) {
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [showBlastConfig, setShowBlastConfig] = useState(false)
  const [paymentVerified, setPaymentVerified] = useState(false)
  const [showAllSkills, setShowAllSkills] = useState(false) // Toggle for skills view
  
  // NEW: State for the dummy progress bar
  const [progress, setProgress] = useState(0)

  // 1. Start Analysis automatically when resumeText changes
  useEffect(() => {
    if (resumeText && !analysis) {
      runAnalysis();
    }
  }, [resumeText]);

  // 2. Check for payment success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSuccess = params.get('payment') === 'success';

    if (isPaymentSuccess || urlSuccess) {
        console.log("💰 Payment success detected");
        setPaymentVerified(true);
        setShowBlastConfig(true);
    }
  }, [isPaymentSuccess]); 

  // 3. NEW: Effect to simulate progress bar when analyzing
  useEffect(() => {
    let interval;
    if (analyzing) {
      setProgress(0); // Reset to 0 start
      interval = setInterval(() => {
        setProgress((prev) => {
          // Rapidly go to 30%, then slow down, cap at 95%
          if (prev >= 95) return 95; 
          
          // Speed logic: Fast at start, slower as it gets higher
          const increment = prev < 30 ? 5 : (prev < 70 ? 2 : 1);
          return prev + increment;
        });
      }, 150); // Updates every 150ms
    }
    return () => clearInterval(interval);
  }, [analyzing]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      // Calls our enhanced backend
      const result = await analyzeResumeForBlast(resumeText);
      setAnalysis(result);
      
      if (user && resumeId) {
        try {
          await trackResumeAnalysis(user.id, resumeId, result);
        } catch (e) { console.error(e) }
      }
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleBlastClick = () => {
    setShowBlastConfig(true);
  };

  if (analyzing) {
    return (
      <div className="analysis-loading">
        <div style={{ width: 150, height: 150, margin: '0 auto' }}>
          <Lottie animationData={botAnimation} loop={true} />
        </div>
        <h3>🤖 AI is performing comprehensive resume analysis...</h3>
        <p style={{color: '#6b7280', fontSize: '14px', marginTop: '10px', marginBottom: '20px'}}>
          Extracting all skills, calculating Our Score, and analyzing your profile
        </p>
        
        {/* NEW: Dummy Progress Bar Section */}
        <div style={{ width: '100%', maxWidth: '350px', margin: '0 auto' }}>
          <div style={{ 
            width: '100%', 
            height: '8px', 
            backgroundColor: '#e5e7eb', 
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '8px'
          }}>
            <div style={{ 
              width: `${progress}%`, 
              height: '100%', 
              backgroundColor: '#3b82f6', // Blue color (tailwind blue-500)
              borderRadius: '10px',
              transition: 'width 0.2s ease-in-out'
            }} />
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '12px', 
            color: '#6b7280',
            fontWeight: '500'
          }}>
            <span>Processing...</span>
            <span>{progress}%</span>
          </div>
        </div>

      </div>
    );
  }

  if (!analysis) return null;

  const skillCategories = getSkillsByCategory(analysis.all_skills || {});
  const allSkillsFlat = formatAllSkillsForDisplay(analysis.all_skills || {});

  return (
    <div className="resume-analysis-container">
      <div className="analysis-header">
        <h2>🎯 Comprehensive Resume Analysis</h2>
        <p>Complete AI-powered analysis of your resume with detailed skill extraction</p>
      </div>

      <div className="analysis-grid">
       {/* Card 1: Score with Breakdown */}
        <div className="analysis-card score-card">
          <div className="score-ring" style={{ borderColor: getScoreColor(analysis.ats_score) }}>
            <span className="score-number">{analysis.ats_score}</span>
            <span className="score-label">Our Score</span>
          </div>
          <p className="recommendation">{analysis.blast_recommendation}</p>
          
          {/* Score Breakdown */}
          {analysis.score_breakdown && (
            <div style={{marginTop: '15px', fontSize: '12px', color: '#6b7280'}}>
              <div style={{fontWeight: '600', marginBottom: '8px', color: '#374151'}}>Score Breakdown:</div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <div>Contact Info: {analysis.score_breakdown.contact_info || 0}/10</div>
                <div>Skills: {analysis.score_breakdown.skills || 0}/30</div>
                <div>Experience: {analysis.score_breakdown.experience || 0}/25</div>
                <div>Education: {analysis.score_breakdown.education || 0}/20</div>
                <div>Keywords: {analysis.score_breakdown.keywords || 0}/15</div>
              </div>
            </div>
          )}

          {/* Disclaimer Note */}
          <p style={{
            fontSize: '11px', 
            color: '#4b5563', 
            marginTop: '20px', 
            textAlign: 'center',
            fontStyle: 'italic',
            lineHeight: '1.4',
            borderTop: '1px solid #e5e7eb',
            paddingTop: '10px'
          }}>
            This score is generated by our internal logic based on resume best practices.
          </p>
        </div>

        {/* Card 2: Targeting Profile */}
        <div className="analysis-card targeting-card">
          <h3>🎯 Targeting Profile</h3>
          
          <div className="data-row">
            <span className="label">Candidate:</span>
            <span className="value" style={{fontWeight: '700', textTransform: 'capitalize'}}>
                {analysis.candidate_name || 'Not Detected'}
            </span>
          </div>

          <div className="data-row">
            <span className="label">Role:</span>
            <span className="value">{analysis.detected_role || 'General'}</span>
          </div>

          <div className="data-row">
            <span className="label">Seniority:</span>
            <span className="value">{analysis.seniority_level || 'Mid-Level'}</span>
          </div>

          <div className="data-row">
            <span className="label">Experience:</span>
            <span className="value" style={{fontWeight: '700'}}>
              {analysis.total_experience || 'N/A'}
            </span>
          </div>

          <div className="data-row">
            <span className="label">Education:</span>
            <span className="value" style={{fontSize: '13px', textAlign: 'right', maxWidth: '160px', lineHeight: '1.2'}}>
              {analysis.education_summary || 'Not Specified'}
            </span>
          </div>

          <div className="data-row">
            <span className="label">Industry:</span>
            <span className="value highlight">{analysis.recommended_industry || 'Technology'}</span>
          </div>
        </div>

        {/* Card 3: Skills Overview - ENHANCED */}
        <div className="analysis-card skills-card">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
            <h3>🔑 Skills Analysis</h3>
            <span style={{
              background: '#dbeafe',
              color: '#1e40af',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '600'
            }}>
              {analysis.total_skills_count || allSkillsFlat.length} Skills Found
            </span>
          </div>
          
          {/* Top Skills Preview */}
          <div className="skills-cloud">
            {analysis.top_skills && analysis.top_skills.length > 0 ? (
                analysis.top_skills.slice(0, 8).map((skill, idx) => (
                  <span key={idx} className="skill-tag">{skill}</span>
                ))
            ) : (
                <span style={{fontSize:'12px', color:'#999'}}>No skills detected</span>
            )}
          </div>

          {/* Toggle Button */}
          {allSkillsFlat.length > 8 && (
            <button 
              onClick={() => setShowAllSkills(!showAllSkills)}
              style={{
                marginTop: '15px',
                padding: '8px 16px',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                width: '100%',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
              onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
            >
              {showAllSkills ? '▲ Show Less' : `▼ View All ${allSkillsFlat.length} Skills`}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Skills Section */}
      {showAllSkills && skillCategories.length > 0 && (
        <div className="analysis-card" style={{marginTop: '20px', padding: '30px'}}>
          <h3 style={{marginBottom: '25px', fontSize: '20px'}}>📚 Complete Skills Breakdown</h3>
          
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px'}}>
            {skillCategories.map((category, idx) => (
              <div key={idx} style={{
                background: '#f9fafb',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '15px',
                  paddingBottom: '10px',
                  borderBottom: '2px solid #e5e7eb'
                }}>
                  <span style={{fontSize: '24px'}}>{category.icon}</span>
                  <span style={{fontWeight: '600', fontSize: '16px', color: '#111827'}}>
                    {category.name}
                  </span>
                  <span style={{
                    marginLeft: 'auto',
                    background: '#dbeafe',
                    color: '#1e40af',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {category.skills.length}
                  </span>
                </div>
                
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                  {category.skills.map((skill, skillIdx) => (
                    <span key={skillIdx} style={{
                      background: '#ffffff',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#374151',
                      border: '1px solid #e5e7eb',
                      fontWeight: '500'
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Achievements Section */}
      {analysis.key_achievements && analysis.key_achievements.length > 0 && (
        <div className="analysis-card" style={{marginTop: '20px', padding: '30px'}}>
          <h3 style={{marginBottom: '20px', fontSize: '20px'}}>🏆 Key Achievements</h3>
          <ul style={{paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '12px'}}>
            {analysis.key_achievements.map((achievement, idx) => (
              <li key={idx} style={{
                fontSize: '15px',
                lineHeight: '1.6',
                color: '#374151'
              }}>
                {achievement}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Section */}
      <div className="action-section">
        <button className="blast-button-large" onClick={handleBlastClick}>
          🚀 Blast to 500+ {analysis.recommended_industry || 'Tech'} Recruiters
        </button>
        <p className="subtext">Verified recruiters active in the last 30 days</p>
      </div>

      {showBlastConfig && (
        <BlastConfig
          resumeId={resumeId}
          resumeUrl={resumeUrl}
          paymentVerified={paymentVerified}
          userData={{
            id: user?.id,
            name: analysis.candidate_name || user?.email?.split('@')[0],
            email: (analysis.candidate_email && analysis.candidate_email.includes('@') && analysis.candidate_email !== 'Not Found') 
                   ? analysis.candidate_email 
                   : user?.email,
            phone: analysis.candidate_phone !== 'Not Found' ? analysis.candidate_phone : "",
            targetRole: analysis.detected_role,
            skills: allSkillsFlat.join(', '),  // Send ALL skills
            years_experience: analysis.total_experience || analysis.seniority_level
          }}
          onBlastComplete={() => {
            setShowBlastConfig(false);
            setPaymentVerified(false);
          }}
          onCancel={() => setShowBlastConfig(false)}
        />
      )}
    </div>
  );
}

const getScoreColor = (score) => {
  if (score >= 80) return '#059669'; 
  if (score >= 60) return '#D97706'; 
  return '#DC2626'; 
};

export default ResumeAnalysis;