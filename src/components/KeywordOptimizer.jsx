import { useState } from 'react'
import { getKeywordsForJob } from '../data/jobKeywords'
import Lottie from 'lottie-react'
import botAnimation from '../assets/bot-working.json'
import './KeywordOptimizer.css'

function KeywordOptimizer({ resumeText, onOptimizationStart }) {
  const [jobTitle, setJobTitle] = useState('')
  const [previewKeywords, setPreviewKeywords] = useState(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')

  const handleJobTitleChange = (e) => {
    const title = e.target.value
    setJobTitle(title)
    
    if (title.trim()) {
      const keywords = getKeywordsForJob(title)
      setPreviewKeywords(keywords)
    } else {
      setPreviewKeywords(null)
    }
  }

  const handleOptimizeClick = async () => {
    if (!jobTitle.trim()) {
      alert('Please enter a job title')
      return
    }

    if (!resumeText) {
      alert('Please upload or generate a resume first')
      return
    }

    // Start optimization animation
    setIsOptimizing(true)
    setProgress(0)

    try {
      // Step 1: Analyzing job market
      setStatusMessage('🤖 Bot analyzing job market...')
      setProgress(20)
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Step 2: Get keywords
      const keywords = getKeywordsForJob(jobTitle)
      const totalKeywords = keywords.technical.length + keywords.ats.length + keywords.soft.length
      
      setStatusMessage(`🤖 Bot matching ${totalKeywords} keywords...`)
      setProgress(40)
      await new Promise(resolve => setTimeout(resolve, 1200))

      // Step 3: Optimizing with AI
      setStatusMessage('🤖 Bot optimizing resume with AI...')
      setProgress(60)
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Step 4: Finalizing
      setStatusMessage('🤖 Bot finalizing ATS optimization...')
      setProgress(90)
      await new Promise(resolve => setTimeout(resolve, 800))

      setProgress(100)
      setStatusMessage('✅ Optimization complete!')

      // Pass job info to parent component
      if (onOptimizationStart) {
        onOptimizationStart({
          jobTitle,
          keywords
        })
      }

    } catch (error) {
      console.error('Optimization failed:', error)
      setStatusMessage('❌ Optimization failed: ' + error.message)
      alert('Error: ' + error.message)
    } finally {
      setTimeout(() => {
        setIsOptimizing(false)
        setProgress(0)
        setStatusMessage('')
      }, 2000)
    }
  }

  return (
    <div className="keyword-optimizer-container">
      <div className="optimizer-header">
        <h2>🎯 Smart Keyword Targeting</h2>
        <p>Inject job-specific keywords to beat ATS systems</p>
      </div>

      <div className="job-input-section">
        <label htmlFor="jobTitle">Target Job Title *</label>
        <input
          id="jobTitle"
          type="text"
          placeholder="e.g., Software Engineer, Data Scientist, Product Manager, Frontend Developer"
          value={jobTitle}
          onChange={handleJobTitleChange}
          disabled={isOptimizing}
          className="job-title-input"
        />
      </div>

      {/* Bot Status Display with Lottie Animation */}
      {isOptimizing && (
        <div className="bot-status-container">
          <div className="bot-animation">
            <Lottie 
              animationData={botAnimation} 
              loop={true} 
              style={{ width: 150, height: 150 }} 
            />
          </div>
          <div className="status-info">
            <p className="status-message">{statusMessage}</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="progress-text">{progress}%</p>
          </div>
        </div>
      )}

      {/* Keyword Preview */}
      {previewKeywords && !isOptimizing && (
        <div className="keywords-preview">
          <h3>📋 Keywords to be Injected:</h3>
          
          <div className="keyword-section">
            <h4>💻 Technical Skills ({previewKeywords.technical.length}):</h4>
            <div className="keyword-tags">
              {previewKeywords.technical.map((keyword, index) => (
                <span key={index} className="keyword-tag technical">{keyword}</span>
              ))}
            </div>
          </div>

          <div className="keyword-section">
            <h4>🎯 ATS Keywords ({previewKeywords.ats.length}):</h4>
            <div className="keyword-tags">
              {previewKeywords.ats.map((keyword, index) => (
                <span key={index} className="keyword-tag ats">{keyword}</span>
              ))}
            </div>
          </div>

          <div className="keyword-section">
            <h4>🤝 Soft Skills ({previewKeywords.soft.length}):</h4>
            <div className="keyword-tags">
              {previewKeywords.soft.map((keyword, index) => (
                <span key={index} className="keyword-tag soft">{keyword}</span>
              ))}
            </div>
          </div>

          <div className="keyword-count">
            <strong>✅ Total Keywords: {
              previewKeywords.technical.length + 
              previewKeywords.ats.length + 
              previewKeywords.soft.length
            }</strong>
          </div>

          <button 
            className="optimize-with-keywords-btn"
            onClick={handleOptimizeClick}
            disabled={!resumeText}
          >
            ⚡ Optimize with These Keywords
          </button>
        </div>
      )}
    </div>
  )
}

export default KeywordOptimizer