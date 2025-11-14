import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Lottie from 'lottie-react'
import './ResumeOptimizer.css'

// Simple bot animation data (you can replace with actual Lottie JSON)
const botAnimationData = {
  v: "5.5.7",
  fr: 60,
  ip: 0,
  op: 180,
  w: 500,
  h: 500,
  nm: "Bot Animation",
  ddd: 0,
  assets: [],
  layers: []
}

function ResumeOptimizer({ user, resumeText, resumeUrl }) {
  const [optimizing, setOptimizing] = useState(false)
  const [optimizationResult, setOptimizationResult] = useState(null)
  const [message, setMessage] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)

  const handleOptimize = async () => {
    if (!resumeText) {
      setMessage('❌ Please upload a resume first')
      return
    }

    setOptimizing(true)
    setMessage('🤖 Bot scanning your resume...')
    setElapsedTime(0)
    setOptimizationResult(null)

    // Timer for bot status
    const startTime = Date.now()
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setElapsedTime(elapsed)
      setMessage(`🤖 Bot analyzing... ${elapsed}s elapsed`)
    }, 1000)

    try {
      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('optimize-resume', {
        body: {
          resumeText,
          jobDescription: jobDescription || null
        }
      })

      clearInterval(timer)

      if (error) throw error

      if (!data.success) {
        throw new Error(data.error || 'Optimization failed')
      }

      const finalTime = Math.floor((Date.now() - startTime) / 1000)
      setMessage(`✅ Done in ${finalTime}s! Your resume has been optimized.`)
      setOptimizationResult(data.data)
      setShowSuggestions(true)

      // Save optimization to database
      await supabase.from('resume_history').insert({
        user_id: user.id,
        file_url: resumeUrl,
        optimized_data: data.data,
        status: 'optimized'
      })

    } catch (error) {
      clearInterval(timer)
      console.error('Optimization error:', error)
      setMessage('❌ Error: ' + error.message)
    } finally {
      setOptimizing(false)
    }
  }

  return (
    <div className="resume-optimizer">
      <h2>🤖 AI Resume Optimizer</h2>
      <p className="optimizer-description">
        Get AI-powered suggestions to make your resume ATS-friendly and recruiter-ready
      </p>

      {/* Job Description Input (Optional) */}
      <div className="job-description-section">
        <label>Target Job Description (Optional)</label>
        <textarea
          placeholder="Paste the job description to optimize your resume for a specific role..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          disabled={optimizing}
          rows={4}
        />
      </div>

      {/* Optimize Button */}
      <button 
        className="optimize-button"
        onClick={handleOptimize}
        disabled={optimizing || !resumeText}
      >
        {optimizing ? (
          <>
            <div className="button-spinner"></div>
            🤖 Bot Optimizing... {elapsedTime}s
          </>
        ) : (
          '🚀 Optimize My Resume'
        )}
      </button>

      {/* Bot Animation */}
      {optimizing && (
        <div className="bot-animation-container">
          <div className="bot-animation">
            <div className="scanning-animation">
              <div className="scan-line"></div>
              <div className="bot-icon">🤖</div>
            </div>
            <p className="bot-status">{message}</p>
          </div>
        </div>
      )}

      {/* Message */}
      {message && !optimizing && (
        <div className={`message ${message.includes('Error') || message.includes('❌') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* Optimization Results Sidebar */}
      {optimizationResult && showSuggestions && (
        <div className="optimization-results">
          <div className="results-header">
            <h3>🎯 Optimization Results</h3>
            <button 
              className="close-suggestions"
              onClick={() => setShowSuggestions(false)}
            >
              ×
            </button>
          </div>

          {/* ATS Score */}
          <div className="ats-score-card">
            <h4>ATS Compatibility Score</h4>
            <div className="score-display">
              <div className="score-circle" style={{
                background: `conic-gradient(#667eea ${optimizationResult.ats_score}%, #e2e8f0 0)`
              }}>
                <div className="score-inner">
                  <span className="score-number">{optimizationResult.ats_score}</span>
                  <span className="score-label">/100</span>
                </div>
              </div>
            </div>
            <p className="score-description">
              {optimizationResult.ats_score >= 80 ? '✅ Excellent! Your resume is highly ATS-compatible.' :
               optimizationResult.ats_score >= 60 ? '⚠️ Good, but there\'s room for improvement.' :
               '❌ Needs work. Follow the suggestions below.'}
            </p>
          </div>

          {/* Key Issues */}
          {optimizationResult.issues && optimizationResult.issues.length > 0 && (
            <div className="result-section">
              <h4>⚠️ Key Issues Found</h4>
              <ul className="issues-list">
                {optimizationResult.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Keyword Suggestions */}
          {optimizationResult.keywords && optimizationResult.keywords.length > 0 && (
            <div className="result-section">
              <h4>🔑 Recommended Keywords</h4>
              <div className="keywords-grid">
                {optimizationResult.keywords.map((keyword, index) => (
                  <span key={index} className="keyword-tag">{keyword}</span>
                ))}
              </div>
            </div>
          )}

          {/* Content Improvements */}
          {optimizationResult.improvements && optimizationResult.improvements.length > 0 && (
            <div className="result-section">
              <h4>✨ Content Improvements</h4>
              {optimizationResult.improvements.map((improvement, index) => (
                <div key={index} className="improvement-card">
                  <div className="improvement-original">
                    <strong>Before:</strong>
                    <p>{improvement.original}</p>
                  </div>
                  <div className="improvement-arrow">→</div>
                  <div className="improvement-improved">
                    <strong>After:</strong>
                    <p>{improvement.improved}</p>
                  </div>
                  <div className="improvement-reason">
                    <em>Why: {improvement.reason}</em>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Formatting Tips */}
          {optimizationResult.formatting_tips && optimizationResult.formatting_tips.length > 0 && (
            <div className="result-section">
              <h4>📋 Formatting Tips</h4>
              <ul className="tips-list">
                {optimizationResult.formatting_tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Overall Assessment */}
          {optimizationResult.overall_assessment && (
            <div className="result-section">
              <h4>📊 Overall Assessment</h4>
              <p className="assessment-text">{optimizationResult.overall_assessment}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="result-actions">
            <button 
              className="apply-suggestions-button"
              onClick={() => {
                alert('Apply suggestions feature coming soon!')
              }}
            >
              Apply All Suggestions
            </button>
            <button 
              className="download-report-button"
              onClick={() => {
                alert('Download report feature coming soon!')
              }}
            >
              Download Report
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResumeOptimizer