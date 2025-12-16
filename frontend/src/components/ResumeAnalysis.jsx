import { useState, useEffect } from 'react'
import Lottie from 'lottie-react'
import botAnimation from '../assets/bot-working.json'
import BlastConfig from './BlastConfig'
import { analyzeResumeForBlast } from '../utils/aiAnalyzer'
import './ResumeAnalysis.css'

function ResumeAnalysis({ user, resumeText, resumeUrl }) {
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [showBlastConfig, setShowBlastConfig] = useState(false)

  // 1. Automatically start analysis when component mounts
  useEffect(() => {
    if (resumeText && !analysis) {
      runAnalysis();
    }
  }, [resumeText]);

  // ✅ 2. NEW: Automatically open Blast Config if payment was just completed
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
        console.log("💰 Payment success detected - opening blast config");
        setShowBlastConfig(true);
    }
  }, []);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const result = await analyzeResumeForBlast(resumeText);
      setAnalysis(result);
    } catch (error) {
      console.error("Analysis failed", error);
      alert("Analysis failed. Please try again.");
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
        <h3>🤖 AI is reading your resume...</h3>
        <p>Extracting your details and identifying the best recruiters.</p>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="resume-analysis-container">
      <div className="analysis-header">
        <h2>🎯 Resume Distribution Readiness</h2>
        <p>We've analyzed your resume to target the right recruiters.</p>
      </div>

      <div className="analysis-grid">
        {/* Score Card */}
        <div className="analysis-card score-card">
          <div className="score-ring" style={{ borderColor: getScoreColor(analysis.ats_score) }}>
            <span className="score-number">{analysis.ats_score}</span>
            <span className="score-label">Blast Score</span>
          </div>
          <p className="recommendation">{analysis.blast_recommendation}</p>
        </div>

        {/* Targeting Data */}
        <div className="analysis-card targeting-card">
          <h3>🎯 Targeting Profile</h3>
          <div className="data-row">
            <span className="label">Detected Name:</span>
            <span className="value">{analysis.candidate_name || "Not Detected"}</span>
          </div>
          <div className="data-row">
            <span className="label">Detected Role:</span>
            <span className="value">{analysis.detected_role}</span>
          </div>
          <div className="data-row">
            <span className="label">Seniority:</span>
            <span className="value">{analysis.seniority_level}</span>
          </div>
          <div className="data-row">
            <span className="label">Best Industry:</span>
            <span className="value highlight">{analysis.recommended_industry}</span>
          </div>
        </div>

        {/* Skills */}
        <div className="analysis-card skills-card">
          <h3>🔑 Extracted Keywords</h3>
          <div className="skills-cloud">
            {analysis.top_skills.map((skill, idx) => (
              <span key={idx} className="skill-tag">{skill}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="action-section">
        <button className="blast-button-large" onClick={handleBlastClick}>
          🚀 Blast to 500+ {analysis.recommended_industry} Recruiters
        </button>
        <p className="subtext">Your original resume will be sent. No changes made.</p>
      </div>

      {showBlastConfig && (
        <BlastConfig
          resumeId={`blast_${Date.now()}`}
          resumeUrl={resumeUrl}
          userData={{
            // PRIORITIZE EXTRACTED DATA, FALLBACK TO LOGIN DATA
            name: analysis.candidate_name || user?.email?.split('@')[0],
            email: analysis.candidate_email || user?.email,
            phone: analysis.candidate_phone || "",
            targetRole: analysis.detected_role,
            skills: analysis.top_skills.join(', '),
            education: "See Resume",
            years_experience: analysis.seniority_level
          }}
          onBlastComplete={() => {
            setShowBlastConfig(false);
            alert("Blast Successful!");
          }}
          onCancel={() => setShowBlastConfig(false)}
        />
      )}
    </div>
  );
}

// Helper for color coding
const getScoreColor = (score) => {
  if (score >= 80) return '#059669'; // Green
  if (score >= 60) return '#D97706'; // Yellow
  return '#DC2626'; // Red
};

export default ResumeAnalysis;