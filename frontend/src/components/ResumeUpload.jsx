import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { validateFile } from '../utils/fileValidator'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants'
import PropTypes from 'prop-types'
import * as mammoth from 'mammoth' 
import * as pdfjsLib from 'pdfjs-dist' 
import './ResumeUpload.css'

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

function ResumeUpload({ user, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState(0)

  const parsePDF = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let fullText = ''
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        
        // Group text items by Y position to preserve lines
        const lines = {}
        textContent.items.forEach((item) => {
          const y = Math.round(item.transform[5]) // Y position
          if (!lines[y]) lines[y] = []
          lines[y].push(item)
        })
        
        // Sort lines by Y position (top to bottom)
        const sortedLines = Object.keys(lines)
          .sort((a, b) => b - a)
          .map(y => {
            // Sort items in each line by X position (left to right)
            return lines[y]
              .sort((a, b) => a.transform[4] - b.transform[4])
              .map(item => item.str)
              .join(' ')
          })
        
        fullText += sortedLines.join('\n') + '\n\n'
      }
      
      return fullText.trim()
    } catch (err) {
      console.error('PDF Parse Error:', err)
      throw new Error('Could not read PDF. Ensure it is text-based.')
    }
  }

  const parseWord = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      
      // Extract text with basic formatting preserved
      const result = await mammoth.extractRawText({ arrayBuffer })
      
      return result.value
    } catch (err) {
      console.error('DOCX Parse Error:', err)
      throw new Error('Could not read DOCX file.')
    }
  }

  const handleFileUpload = async (file) => {
    try {
      const validation = validateFile(file)
      if (!validation.isValid) {
        setError(validation.errors.join(' '))
        return
      }

      setUploading(true)
      setError(null)
      setMessage('📤 Uploading your resume...')
      setProgress(10)

      const timestamp = Date.now()
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `${user.id}/${timestamp}_${sanitizedFileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)
      
      setProgress(40)
      setMessage('📄 Extracting text content...')

      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName)

      let extractedContent = ''
      const fileExtension = file.name.split('.').pop().toLowerCase()

      if (fileExtension === 'txt') {
        extractedContent = await file.text()
      } else if (fileExtension === 'pdf') {
        extractedContent = await parsePDF(file)
      } else if (fileExtension === 'docx' || fileExtension === 'doc') {
        extractedContent = await parseWord(file)
      }

      if (!extractedContent || extractedContent.length < 50) {
        throw new Error('Could not extract content. File might be empty or corrupted.')
      }

      setProgress(80)
      setMessage('💾 Saving to database...')

      const { data: resumeData } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_size: file.size,
          file_type: fileExtension,
          extracted_text: extractedContent,
          status: 'uploaded',
          uploaded_at: new Date().toISOString()
        })
        .select()
        .single()

      setProgress(100)
      setMessage(SUCCESS_MESSAGES.UPLOAD_SUCCESS)

      if (onUploadSuccess) {
        onUploadSuccess({
          text: extractedContent,
          url: urlData.publicUrl,
          name: file.name,
          id: resumeData?.id
        })
      }
      
    } catch (error) {
      console.error('Upload Process Error:', error)
      setError(error.message || ERROR_MESSAGES.UPLOAD_FAILED)
    } finally {
      setUploading(false)
      setTimeout(() => setProgress(0), 3000)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
  }

  return (
    <div className="resume-upload">
      <h3>📄 Upload Your Resume</h3>
      <p className="upload-description">DOCX, PDF, or TXT (max 5MB)</p>
      
      <div className={`upload-zone ${uploading ? 'uploading' : ''}`}>
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
              <p>{message} {progress}%</p>
            </>
          ) : (
             <>
              <div className="upload-icon">📤</div>
              <p className="upload-text"><strong>Click to browse</strong></p>
            </>
          )}
        </label>
      </div>
      {error && <div className="message error">❌ {error}</div>}
    </div>
  )
}

ResumeUpload.propTypes = {
  user: PropTypes.shape({ id: PropTypes.string.isRequired }).isRequired,
  onUploadSuccess: PropTypes.func.isRequired
}

export default ResumeUpload