import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { validateFile } from '../utils/fileValidator'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants'
import { logError, logUserAction } from '../utils/errorLogger'
import PropTypes from 'prop-types'
import './ResumeUpload.css'

function ResumeUpload({ user, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState(0)

  const parsePDF = async (file) => {
    // Simple PDF text extraction (you may have better logic)
    return "PDF text extraction placeholder - implement with pdf-parse or similar"
  }

  const parseWord = async (file) => {
    // Simple Word text extraction (you may have better logic)
    return "Word text extraction placeholder - implement with mammoth or similar"
  }

  const handleFileUpload = async (file) => {
    try {
      // ========== VALIDATION ==========
      const validation = validateFile(file)
      
      if (!validation.isValid) {
        setError(validation.errors.join(' '))
        
        // Log validation error
        await logError({
          type: 'file_validation_failed',
          message: validation.errors.join(', '),
          component: 'ResumeUpload',
          functionName: 'handleFileUpload',
          context: {
            fileName: file?.name,
            fileSize: file?.size,
            fileType: file?.type
          }
        })
        
        return
      }
      // ========== END VALIDATION ==========

      setUploading(true)
      setError(null)
      setMessage('📤 Uploading your resume...')
      setProgress(10)

      // ========== UPLOAD TO SUPABASE STORAGE ==========
      const timestamp = Date.now()
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `${user.id}/${timestamp}_${sanitizedFileName}`

      setProgress(30)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      setProgress(50)

      // ========== GET PUBLIC URL ==========
      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName)

      if (!urlData || !urlData.publicUrl) {
        throw new Error('Failed to generate public URL')
      }

      setProgress(60)
      setMessage('📄 Extracting text from your resume...')

      // ========== PARSE FILE CONTENT ==========
      let extractedText = ''
      const fileExtension = file.name.split('.').pop().toLowerCase()

      try {
        if (fileExtension === 'txt') {
          extractedText = await file.text()
        } else if (fileExtension === 'pdf') {
          extractedText = await parsePDF(file)
        } else if (fileExtension === 'docx' || fileExtension === 'doc') {
          extractedText = await parseWord(file)
        }

        // Validate extracted text
        if (!extractedText || extractedText.trim().length < 50) {
          throw new Error('Could not extract enough text from the file. Please try a different format.')
        }
      } catch (parseError) {
        console.error('Parse error:', parseError)
        
        await logError({
          type: 'file_parse_failed',
          message: parseError.message,
          component: 'ResumeUpload',
          functionName: 'handleFileUpload',
          context: {
            fileName: file.name,
            fileType: fileExtension
          }
        })

        throw new Error(ERROR_MESSAGES.FILE_CORRUPTED)
      }

      setProgress(80)
      setMessage('💾 Saving to database...')

      // ========== SAVE TO DATABASE ==========
      const { data: resumeData, error: dbError } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_size: file.size,
          file_type: fileExtension,
          extracted_text: extractedText,
          status: 'uploaded',
          uploaded_at: new Date().toISOString()
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
        // Don't fail completely if DB save fails, since file is uploaded
      }

      setProgress(100)

      // ========== LOG SUCCESS ==========
      await logUserAction({
        type: 'resume_uploaded',
        details: {
          fileName: file.name,
          fileSize: file.size,
          fileType: fileExtension,
          textLength: extractedText.length,
          resumeId: resumeData?.id
        }
      })

      // ========== CALL SUCCESS CALLBACK ==========
      if (onUploadSuccess) {
        onUploadSuccess({
          text: extractedText,
          url: urlData.publicUrl,
          name: file.name,
          id: resumeData?.id
        })
      }

      setMessage(SUCCESS_MESSAGES.UPLOAD_SUCCESS)
      setError(null)
      
    } catch (error) {
      console.error('Upload error:', error)
      
      // Log error to Supabase
      await logError({
        type: 'file_upload_failed',
        message: error.message,
        stack: error.stack,
        component: 'ResumeUpload',
        functionName: 'handleFileUpload',
        context: {
          fileName: file?.name,
          fileSize: file?.size,
          fileType: file?.type,
          userId: user?.id
        }
      })
      
      setError(error.message || ERROR_MESSAGES.UPLOAD_FAILED)
      setMessage('')
    } finally {
      setUploading(false)
      setTimeout(() => {
        setProgress(0)
      }, 2000)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <div className="resume-upload">
      <h3>📤 Upload Your Resume</h3>
      <p className="upload-description">
        Upload your resume in PDF, Word, or TXT format (max 5MB)
      </p>

      {/* Drag & Drop Area */}
      <div
        className={`upload-zone ${uploading ? 'uploading' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          id="resume-file-input"
          accept=".pdf,.docx,.doc,.txt"
          onChange={handleFileChange}
          disabled={uploading}
          style={{ display: 'none' }}
        />
        
        <label htmlFor="resume-file-input" className="upload-label">
          {uploading ? (
            <>
              <div className="upload-spinner"></div>
              <p>Uploading... {progress}%</p>
            </>
          ) : (
            <>
              <div className="upload-icon">📁</div>
              <p className="upload-text">
                <strong>Click to browse</strong> or drag and drop
              </p>
              <p className="upload-hint">
                PDF, DOCX, DOC, or TXT (max 5MB)
              </p>
            </>
          )}
        </label>

        {/* Progress Bar */}
        {uploading && progress > 0 && (
          <div className="upload-progress">
            <div 
              className="upload-progress-bar" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* Messages */}
      {message && !error && (
        <div className="message success">
          {message}
        </div>
      )}

      {error && (
        <div className="message error">
          ⚠️ {error}
        </div>
      )}

      {/* File Requirements */}
      <div className="upload-requirements">
        <h4>Requirements:</h4>
        <ul>
          <li>✅ File size must be under 5MB</li>
          <li>✅ Accepted formats: PDF, DOCX, DOC, TXT</li>
          <li>✅ File must contain readable text</li>
          <li>✅ Avoid scanned images (use text-based PDFs)</li>
        </ul>
      </div>
    </div>
  )
}

// PropTypes
ResumeUpload.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    email: PropTypes.string
  }).isRequired,
  onUploadSuccess: PropTypes.func.isRequired
}

export default ResumeUpload