import { useState } from 'react'
import PropTypes from 'prop-types'
import { supabase } from '../lib/supabase'
// import { useNavigate } from 'react-router-dom' // FIXED: Commented out - causing error
import Lottie from 'lottie-react'
import KeywordOptimizer from '../components/KeywordOptimizer'
import BlastConfig from '../components/BlastConfig'
import { mockOptimizeResume } from '../utils/mockOptimizer'
import { downloadResumePDF } from '../utils/pdfGenerator'
import { logError, logUserAction } from '../utils/errorLogger'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants'
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
  // const navigate = useNavigate() // FIXED: Commented out - causing error
  const [optimizing, setOptimizing] = useState(false)
  const [optimizationResult, setOptimizationResult] = useState(null)
  const [message, setMessage] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [targetJobInfo, setTargetJobInfo] = useState(null)
  const [optimizedResume, setOptimizedResume] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  // ========== NEW: Day 6 - Blast Feature State ==========
  const [showBlastConfig, setShowBlastConfig] = useState(false)
  // ========== END NEW STATE ==========

  // Day 4: Handle keyword optimization
  const handleKeywordOptimization = (jobInfo) => {
    setTargetJobInfo(jobInfo)
    
    // Create enhanced job description with keywords
    const keywordsList = [
      ...jobInfo.keywords.technical,
      ...jobInfo.keywords.ats,
      ...jobInfo.keywords.soft
    ].join(', ')
    
    setJobDescription(
      `Target Job: ${jobInfo.jobTitle}\n\nKey Skills Required: ${keywordsList}\n\nOptimize the resume to include these keywords naturally where relevant.`
    )
    
    // Automatically trigger optimization after a short delay
    setTimeout(() => {
      handleOptimize()
    }, 500)
  }

  const handleOptimize = async () => {
    if (!resumeText) {
      setMessage(ERROR_MESSAGES.NO_RESUME)
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
      // Log user action
      await logUserAction({
        type: 'resume_optimization_started',
        details: {
          hasJobTitle: !!targetJobInfo?.jobTitle,
          jobTitle: targetJobInfo?.jobTitle,
          keywordCount: targetJobInfo ? 
            Object.values(targetJobInfo.keywords).flat().length : 0,
          resumeLength: resumeText?.length
        }
      })

      // Use mock optimizer (replace with real Supabase Edge Function when ready)
      const data = await mockOptimizeResume(
        resumeText,
        jobDescription,
        targetJobInfo?.jobTitle,
        targetJobInfo?.keywords
      )

      clearInterval(timer)

      if (!data.success) {
        throw new Error(data.error || ERROR_MESSAGES.OPTIMIZATION_FAILED)
      }

      const finalTime = Math.floor((Date.now() - startTime) / 1000)
      setMessage(SUCCESS_MESSAGES.OPTIMIZATION_COMPLETE)
      setOptimizationResult(data.data)
      setShowSuggestions(true)

      // Log successful optimization
      await logUserAction({
        type: 'resume_optimization_completed',
        details: {
          jobTitle: targetJobInfo?.jobTitle,
          atsScore: data.data.ats_score,
          timeTaken: finalTime,
          keywordCount: targetJobInfo ? 
            Object.values(targetJobInfo.keywords).flat().length : 0
        }
      })

      // ========== IMPROVED: Save optimization to database with better error handling ==========
      if (user && user.id) {
        try {
          const historyRecord = {
            user_id: user.id,
            file_url: resumeUrl || null,
            optimized_data: data.data,
            job_title: targetJobInfo?.jobTitle || null,
            keywords_matched: targetJobInfo?.keywords || null,
            status: 'optimized'
          }

          console.log('📝 Saving to resume_history:', historyRecord)

          const { data: savedData, error: dbError } = await supabase
            .from('resume_history')
            .insert(historyRecord)
            .select()

          if (dbError) {
            console.error('❌ Database save error:', dbError)
            
            await logError({
              type: 'resume_history_save_failed',
              message: dbError.message,
              component: 'ResumeOptimizer',
              functionName: 'handleOptimize',
              context: {
                userId: user.id,
                jobTitle: targetJobInfo?.jobTitle,
                errorCode: dbError.code,
                errorDetails: dbError.details
              }
            })
          } else {
            console.log('✅ Successfully saved to database:', savedData)
          }
        } catch (dbError) {
          console.error('❌ Unexpected database error:', dbError)
          // Continue anyway - optimization succeeded even if DB save failed
        }
      }
      // ========== END IMPROVED DATABASE SAVE ==========

      // Day 4: Also save using the new service
      if (targetJobInfo) {
        setOptimizedResume({
          jobTitle: targetJobInfo.jobTitle,
          keywordsMatched: targetJobInfo.keywords,
          optimizedText: data.data.optimizedText || resumeText
        })
      }

    } catch (error) {
      clearInterval(timer)
      
      // Log error to Supabase
      await logError({
        type: 'optimization_failed',
        message: error.message,
        stack: error.stack,
        functionName: 'handleOptimize',
        component: 'ResumeOptimizer',
        context: {
          hasResumeText: !!resumeText,
          jobTitle: targetJobInfo?.jobTitle,
          resumeLength: resumeText?.length,
          hasJobDescription: !!jobDescription
        }
      })
      
      setMessage(`${ERROR_MESSAGES.OPTIMIZATION_FAILED}: ${error.message}`)
    } finally {
      setOptimizing(false)
    }
  }

  const handleOptimizationComplete = async (result) => {
    setOptimizedResume(result)
    
    // Auto-save to Supabase
    setIsSaving(true)
    try {
      // Future: Implement actual save logic here
      await logUserAction({
        type: 'optimized_resume_saved',
        details: {
          jobTitle: result.jobTitle
        }
      })
    } catch (error) {
      await logError({
        type: 'save_optimized_resume_failed',
        message: error.message,
        component: 'ResumeOptimizer',
        functionName: 'handleOptimizationComplete'
      })
      alert('Failed to save optimization. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // ========== IMPROVED: Better debugging and error handling ==========
  const handleApplySuggestions = () => {
    try {
      console.log('🔧 === Apply Suggestions Clicked ===')
      console.log('📊 optimizationResult:', optimizationResult)
      console.log('📋 improvements:', optimizationResult?.improvements)
      console.log('📝 resumeText length:', resumeText?.length)

      // Check if we have improvements
      if (!optimizationResult?.improvements || optimizationResult.improvements.length === 0) {
        console.warn('⚠️ No improvements available')
        alert('No suggestions available to apply. Please run optimization first.')
        return
      }

      let appliedText = resumeText
      let appliedCount = 0
      
      // Apply each improvement
      optimizationResult.improvements.forEach((improvement, index) => {
        console.log(`\n🔄 Processing improvement ${index + 1}/${optimizationResult.improvements.length}`)
        console.log('   Original:', improvement.original?.substring(0, 50) + '...')
        console.log('   Improved:', improvement.improved?.substring(0, 50) + '...')
        
        if (improvement.original && improvement.improved) {
          // Escape special regex characters
          const escapedOriginal = improvement.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const regex = new RegExp(escapedOriginal, 'g')
          
          const beforeReplace = appliedText
          appliedText = appliedText.replace(regex, improvement.improved)
          
          if (beforeReplace !== appliedText) {
            appliedCount++
            console.log(`   ✅ Applied improvement ${index + 1}`)
          } else {
            console.log(`   ⚠️ Improvement ${index + 1} not found in text`)
          }
        }
      })

      console.log(`\n📊 Summary: Applied ${appliedCount} out of ${optimizationResult.improvements.length} suggestions`)

      // Check if any changes were made
      if (appliedCount === 0) {
        console.warn('⚠️ No changes could be applied')
        alert('No changes could be applied. The suggestions may already be in your resume, or the text doesn\'t match exactly.')
        return
      }

      // Update the optimized resume state
      const updatedResume = {
        jobTitle: targetJobInfo?.jobTitle || optimizedResume?.jobTitle || 'Resume',
        keywordsMatched: targetJobInfo?.keywords || optimizedResume?.keywordsMatched || {
          technical: [],
          ats: [],
          soft: []
        },
        optimizedText: appliedText
      }

      console.log('💾 Setting optimized resume:', {
        jobTitle: updatedResume.jobTitle,
        textLength: updatedResume.optimizedText.length,
        keywordCount: Object.values(updatedResume.keywordsMatched).flat().length
      })

      setOptimizedResume(updatedResume)
      setMessage(`${SUCCESS_MESSAGES.SUGGESTIONS_APPLIED} (${appliedCount} changes applied)`)
      
      // Log action
      logUserAction({
        type: 'suggestions_applied',
        details: {
          improvementsCount: appliedCount,
          totalSuggestions: optimizationResult.improvements.length,
          jobTitle: targetJobInfo?.jobTitle
        }
      })
      
      // Scroll to results after a short delay
      setTimeout(() => {
        const resultsElement = document.querySelector('.day4-optimized-results')
        if (resultsElement) {
          console.log('📜 Scrolling to results...')
          resultsElement.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          })
        } else {
          console.warn('⚠️ Results element not found in DOM')
        }
      }, 300)

    } catch (error) {
      console.error('❌ Error applying suggestions:', error)
      console.error('Stack:', error.stack)
      
      logError({
        type: 'apply_suggestions_failed',
        message: error.message,
        stack: error.stack,
        component: 'ResumeOptimizer',
        functionName: 'handleApplySuggestions',
        context: {
          hasOptimizationResult: !!optimizationResult,
          hasImprovements: !!optimizationResult?.improvements,
          improvementsCount: optimizationResult?.improvements?.length
        }
      })
      
      alert('Failed to apply suggestions: ' + error.message)
    }
  }
  // ========== END IMPROVED APPLY SUGGESTIONS ==========

  const handleDownloadReport = () => {
    const keywordsInjected = targetJobInfo 
      ? [...targetJobInfo.keywords.technical, ...targetJobInfo.keywords.ats, ...targetJobInfo.keywords.soft]
      : []
    
    const reportContent = `
╔════════════════════════════════════════════════════════════╗
║         RESUME OPTIMIZATION REPORT - ResumeBlast.ai        ║
╚════════════════════════════════════════════════════════════╝

📊 OPTIMIZATION SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ATS Compatibility Score: ${optimizationResult.ats_score}/100
Target Job Role: ${targetJobInfo?.jobTitle || 'General Optimization'}
Keywords Injected: ${keywordsInjected.length}
Optimization Date: ${new Date().toLocaleString()}

${optimizationResult.ats_score >= 80 ? '✅ EXCELLENT - Your resume is highly ATS-compatible!' :
  optimizationResult.ats_score >= 60 ? '⚠️ GOOD - Room for improvement exists.' :
  '❌ NEEDS WORK - Follow the recommendations below.'}


🎯 KEYWORDS INJECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${keywordsInjected.length > 0 ? keywordsInjected.map((kw, i) => `${i + 1}. ${kw}`).join('\n') : 'No specific keywords targeted'}


⚠️ KEY ISSUES IDENTIFIED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${optimizationResult.issues && optimizationResult.issues.length > 0 
  ? optimizationResult.issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')
  : 'No major issues found'}


✨ CONTENT IMPROVEMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${optimizationResult.improvements && optimizationResult.improvements.length > 0
  ? optimizationResult.improvements.map((imp, i) => `
${i + 1}. BEFORE: ${imp.original}
   AFTER:  ${imp.improved}
   WHY:    ${imp.reason}
`).join('\n')
  : 'No specific improvements suggested'}


📋 FORMATTING RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${optimizationResult.formatting_tips && optimizationResult.formatting_tips.length > 0
  ? optimizationResult.formatting_tips.map((tip, i) => `${i + 1}. ${tip}`).join('\n')
  : 'No formatting issues detected'}


📊 OVERALL ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${optimizationResult.overall_assessment || 'Your resume has been optimized for ATS systems.'}


═══════════════════════════════════════════════════════════

Generated by ResumeBlast.ai - AI-Powered Resume Optimization

═══════════════════════════════════════════════════════════
`
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `resume-optimization-report-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    setMessage(SUCCESS_MESSAGES.REPORT_DOWNLOADED)
    
    // Log action
    logUserAction({
      type: 'report_downloaded',
      details: {
        jobTitle: targetJobInfo?.jobTitle,
        atsScore: optimizationResult.ats_score
      }
    })
  }

  const handleDownloadPDF = () => {
    const resumeToDownload = optimizedResume?.optimizedText || resumeText
    
    downloadResumePDF(
      resumeToDownload,
      targetJobInfo?.jobTitle || 'Resume',
      targetJobInfo?.keywords || null,
      optimizationResult?.ats_score || null
    )
    
    setMessage(SUCCESS_MESSAGES.PDF_DOWNLOADED)
    
    // Log action
    logUserAction({
      type: 'resume_downloaded_pdf',
      details: {
        jobTitle: targetJobInfo?.jobTitle,
        atsScore: optimizationResult?.ats_score
      }
    })
  }

  const handleDownloadTXT = () => {
    const resumeToDownload = optimizedResume?.optimizedText || resumeText
    
    const blob = new Blob([resumeToDownload], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `optimized-resume-${targetJobInfo?.jobTitle?.replace(/\s+/g, '-') || 'general'}-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    setMessage(SUCCESS_MESSAGES.TXT_DOWNLOADED)
    
    // Log action
    logUserAction({
      type: 'resume_downloaded_txt',
      details: {
        jobTitle: targetJobInfo?.jobTitle
      }
    })
  }

  // ========== NEW: Day 6 - Blast Feature Handlers ==========
  const handleBlastClick = () => {
    // Check if resume is ready for blasting
    if (!resumeText) {
      alert('Please upload a resume first before blasting.')
      return
    }
    
    setShowBlastConfig(true)
    
    // Log action
    logUserAction({
      type: 'blast_button_clicked',
      details: {
        hasOptimizedResume: !!optimizedResume,
        hasTargetJob: !!targetJobInfo
      }
    })
  }

  const handleBlastComplete = (campaignId) => {
    setShowBlastConfig(false)
    
    // Log successful blast
    logUserAction({
      type: 'blast_completed',
      details: {
        campaignId,
        jobTitle: targetJobInfo?.jobTitle
      }
    })
    
    // Show success message
    alert(`🎉 Blast initiated successfully! Campaign ID: ${campaignId}`)
    
    console.log('Blast campaign created:', campaignId)
    // Future: Add navigation when analytics page is ready
  }

  const handleBlastCancel = () => {
    setShowBlastConfig(false)
    
    // Log action
    logUserAction({
      type: 'blast_cancelled',
      details: {}
    })
  }
  // ========== END NEW HANDLERS ==========

  return (
    <div className="resume-optimizer">
      <h2>🤖 AI Resume Optimizer</h2>
      <p className="optimizer-description">
        Get AI-powered suggestions to make your resume ATS-friendly and recruiter-ready
      </p>

      {/* ============ DAY 4: SMART KEYWORD TARGETING ============ */}
      {resumeText && (
        <>
          <KeywordOptimizer
            resumeText={resumeText}
            onOptimizationStart={handleKeywordOptimization}
          />
          
          {/* Divider */}
          <div style={{ 
            margin: '30px 0', 
            borderTop: '2px dashed #cbd5e1',
            position: 'relative'
          }}>
            <div style={{ 
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'white',
              padding: '0 16px',
              color: '#64748b',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              OR
            </div>
          </div>

          <p style={{ 
            textAlign: 'center', 
            color: '#64748b', 
            fontSize: '14px',
            marginBottom: '20px',
            fontStyle: 'italic'
          }}>
            Use the traditional method below ↓
          </p>
        </>
      )}
      {/* ============ END DAY 4 SECTION ============ */}

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

      {/* Day 4: Display Optimized Results with Keywords */}
      {optimizedResume && (
        <div className="day4-optimized-results">
          <h2>✅ Optimization Complete</h2>
          <div className="results-stats">
            <div className="stat">
              <span className="stat-label">Keywords Injected:</span>
              <span className="stat-value">
                {optimizedResume.keywordsMatched.technical.length + 
                 optimizedResume.keywordsMatched.ats.length}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Target Job:</span>
              <span className="stat-value">{optimizedResume.jobTitle}</span>
            </div>
          </div>
          
          <div className="optimized-text">
            <h3>Optimized Resume:</h3>
            <pre>{optimizedResume.optimizedText}</pre>
          </div>

          {/* ========== NEW: Day 6 - Blast Button ========== */}
          <div style={{ 
            marginTop: '24px', 
            padding: '20px', 
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            borderRadius: '12px',
            border: '2px solid #fbbf24'
          }}>
            <h3 style={{ 
              margin: '0 0 12px 0', 
              color: '#92400e',
              fontSize: '18px',
              fontWeight: '700'
            }}>
              🚀 Ready to Send Your Resume?
            </h3>
            <p style={{ 
              margin: '0 0 16px 0', 
              color: '#78350f',
              fontSize: '14px'
            }}>
              Your optimized resume is ready! Blast it to 500+ recruiters instantly.
            </p>
            <button
              onClick={handleBlastClick}
              style={{
                background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                color: 'white',
                padding: '14px 28px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '700',
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                transition: 'all 0.2s',
                width: '100%'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 6px 20px rgba(220, 38, 38, 0.4)'
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)'
              }}
            >
              🚀 Blast to 500+ Recruiters - $149
            </button>
          </div>
          {/* ========== END NEW BLAST BUTTON ========== */}

          {isSaving && <p>💾 Saving to database...</p>}
        </div>
      )}

      {/* Optimization Results Sidebar (Original) */}
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

          {/* Action Buttons - REFACTORED */}
          <div className="result-actions">
            <button 
              className="apply-suggestions-button"
              onClick={handleApplySuggestions}
              disabled={!optimizationResult || !optimizationResult.improvements}
            >
              ✨ Apply All Suggestions
            </button>
            
            <button 
              className="download-report-button"
              onClick={handleDownloadReport}
              disabled={!optimizationResult}
            >
              📥 Download Report
            </button>

            {/* PDF and TXT Download Options */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px', width: '100%' }}>
              <button 
                className="download-resume-button"
                onClick={handleDownloadPDF}
                disabled={!optimizedResume && !resumeText}
                style={{ 
                  background: '#10b981',
                  flex: 1
                }}
              >
                📄 Download as PDF
              </button>

              <button 
                className="download-resume-button"
                onClick={handleDownloadTXT}
                disabled={!optimizedResume && !resumeText}
                style={{ 
                  background: '#6366f1',
                  flex: 1
                }}
              >
                📝 Download as TXT
              </button>
            </div>

            {/* ========== NEW: Blast Button in Results Sidebar ========== */}
            <button 
              className="blast-button"
              onClick={handleBlastClick}
              disabled={!resumeText}
              style={{ 
                background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                color: 'white',
                width: '100%',
                marginTop: '16px',
                padding: '14px',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              🚀 Blast to 500+ Recruiters
            </button>
            {/* ========== END NEW BLAST BUTTON ========== */}
          </div>
        </div>
      )}

      {/* ========== NEW: Day 6 - Blast Configuration Modal ========== */}
      {showBlastConfig && (
        <BlastConfig
          resumeId={`resume_${user?.id}_${Date.now()}`}
          resumeUrl={resumeUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'}
          candidateName={user?.email?.split('@')[0] || 'Candidate'}
          candidateEmail={user?.email || 'candidate@example.com'}
          onBlastComplete={handleBlastComplete}
          onCancel={handleBlastCancel}
        />
      )}
      {/* ========== END NEW BLAST MODAL ========== */}
    </div>
  )
}

// PropTypes for type checking
ResumeOptimizer.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    email: PropTypes.string
  }),
  resumeText: PropTypes.string.isRequired,
  resumeUrl: PropTypes.string
}

export default ResumeOptimizer