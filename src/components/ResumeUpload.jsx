import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { FilePond, registerPlugin } from 'react-filepond'
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type'
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'
import mammoth from 'mammoth'

// Import FilePond styles
import 'filepond/dist/filepond.min.css'
import './ResumeUpload.css'

// Register FilePond plugins
registerPlugin(FilePondPluginFileValidateType, FilePondPluginFileValidateSize)

// Configure PDF.js worker - CORRECTED VERSION
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`

function ResumeUpload({ user, onUploadSuccess }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [extractedText, setExtractedText] = useState('')
  const [message, setMessage] = useState('')
  const pondRef = useRef(null)

  // Parse PDF file - WORKING VERSION
  const parsePDF = async (file) => {
    try {
      console.log('=== STARTING PDF PARSE ===')
      console.log('File size:', file.size, 'bytes')
      console.log('File name:', file.name)
      
      const arrayBuffer = await file.arrayBuffer()
      console.log('ArrayBuffer created, size:', arrayBuffer.byteLength)
      
      // Load PDF document
      console.log('Loading PDF document...')
      const loadingTask = pdfjsLib.getDocument(arrayBuffer)
      const pdf = await loadingTask.promise
      
      console.log('✅ PDF loaded successfully!')
      console.log('Total pages:', pdf.numPages)
      
      let fullText = ''
      let totalItems = 0

      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        console.log(`--- Processing page ${pageNum}/${pdf.numPages} ---`)
        
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        
        console.log(`Page ${pageNum} has ${textContent.items.length} text items`)
        totalItems += textContent.items.length
        
        // Extract text with spacing
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ')
        
        fullText += pageText + '\n\n'
        
        console.log(`Page ${pageNum} extracted ${pageText.length} characters`)
        if (pageText.length > 0) {
          console.log(`Page ${pageNum} preview:`, pageText.substring(0, 100))
        }
      }

      // Clean up text
      fullText = fullText.trim()

      console.log('=== PDF EXTRACTION COMPLETE ===')
      console.log('Total text items processed:', totalItems)
      console.log('Total characters extracted:', fullText.length)
      console.log('First 300 characters:', fullText.substring(0, 300))
      
      if (fullText.length === 0) {
        console.error('⚠️ PDF has no extractable text')
        throw new Error('This PDF appears to be scanned or image-based. Please use a text-based PDF, or convert it to Word/TXT format.')
      }

      console.log('✅ PDF parsing successful!')
      return fullText
      
    } catch (error) {
      console.error('=== PDF PARSING ERROR ===')
      console.error('Error type:', error.name)
      console.error('Error message:', error.message)
      
      if (error.message.includes('scanned') || error.message.includes('image-based')) {
        throw error
      }
      
      // More user-friendly error messages
      if (error.message.includes('worker')) {
        throw new Error('PDF parsing library failed to load. Please refresh the page and try again.')
      }
      
      throw new Error(`Failed to parse PDF: ${error.message}`)
    }
  }

  // Parse Word document
  const parseWord = async (file) => {
    try {
      console.log('=== STARTING WORD PARSE ===')
      console.log('File size:', file.size, 'bytes')
      console.log('File name:', file.name)
      
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      
      console.log('✅ Word parsed successfully')
      console.log('Extracted text length:', result.value.length)
      console.log('First 300 characters:', result.value.substring(0, 300))
      
      if (!result.value || result.value.trim().length === 0) {
        throw new Error('Word document appears to be empty')
      }
      
      return result.value.trim()
    } catch (error) {
      console.error('=== WORD PARSING ERROR ===', error)
      throw new Error('Failed to parse Word document: ' + error.message)
    }
  }

  // Parse text file
  const parseText = async (file) => {
    try {
      console.log('=== STARTING TEXT PARSE ===')
      console.log('File size:', file.size, 'bytes')
      console.log('File name:', file.name)
      
      const text = await file.text()
      
      console.log('✅ Text file read successfully')
      console.log('Extracted text length:', text.length)
      console.log('First 300 characters:', text.substring(0, 300))
      
      if (!text || text.trim().length === 0) {
        throw new Error('Text file appears to be empty')
      }
      
      return text.trim()
    } catch (error) {
      console.error('=== TEXT PARSING ERROR ===', error)
      throw new Error('Failed to read text file: ' + error.message)
    }
  }

  // Extract text based on file type
  const extractTextFromFile = async (file) => {
    setParsing(true)
    setMessage('🤖 Bot parsing your resume...')
    
    try {
      let text = ''
      
      console.log('=== PARSING FILE ===')
      console.log('File type:', file.type)
      console.log('File name:', file.name)
      console.log('File size:', file.size, 'bytes')
      
      if (file.type === 'application/pdf') {
        console.log('📄 Attempting PDF parsing...')
        text = await parsePDF(file)
        console.log('✅ PDF parsed successfully. Text length:', text.length)
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword'
      ) {
        console.log('📝 Attempting Word parsing...')
        text = await parseWord(file)
        console.log('✅ Word parsed successfully. Text length:', text.length)
      } else if (file.type === 'text/plain') {
        console.log('📃 Attempting text parsing...')
        text = await parseText(file)
        console.log('✅ Text parsed successfully. Text length:', text.length)
      } else {
        throw new Error('Unsupported file type: ' + file.type)
      }

      console.log('=== EXTRACTED TEXT SUMMARY ===')
      console.log('Length:', text.length)
      console.log('Word count:', text.split(/\s+/).length)
      console.log('First 500 chars:', text.substring(0, 500))

      if (!text || text.trim().length === 0) {
        throw new Error('No text could be extracted from the file.')
      }

      setExtractedText(text)
      setMessage('✅ Resume parsed successfully!')
      return text
    } catch (error) {
      console.error('=== PARSING ERROR ===', error)
      setMessage('⚠️ ' + error.message)
      throw error
    } finally {
      setParsing(false)
    }
  }

  // Handle file upload
  const handleProcess = async (fieldName, file, metadata, load, error, progress, abort) => {
    setUploading(true)
    setMessage('⏳ Uploading your resume...')

    try {
      console.log('=== STARTING UPLOAD PROCESS ===')
      
      // Extract text from file FIRST
      const text = await extractTextFromFile(file)

      console.log('=== AFTER extractTextFromFile ===')
      console.log('✓ Text extracted successfully')
      console.log('✓ Text length:', text.length, 'characters')
      console.log('✓ Text preview:', text.substring(0, 200))

      if (!text || text.trim().length === 0) {
        throw new Error('Failed to extract text from resume.')
      }

      // Create unique file path
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      console.log('📤 Uploading to Supabase Storage...')
      console.log('File path:', fileName)

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw uploadError
      }

      console.log('✅ File uploaded to storage')

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName)

      console.log('✅ Public URL generated:', urlData.publicUrl)

      // Save to database - Update users table
      console.log('💾 Updating users table...')
      const { error: dbError } = await supabase
        .from('users')
        .update({
          resume_file_url: urlData.publicUrl,
          resume_file_name: file.name,
          resume_uploaded_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (dbError) {
        console.error('Database update error:', dbError)
        throw dbError
      }

      console.log('✅ Users table updated')

      // Save to resume_history with extracted text
      console.log('💾 Saving to resume_history...')
      console.log('Text length being saved:', text.length)
      
      const { error: historyError } = await supabase.from('resume_history').upsert({
        user_id: user.id,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        status: 'uploaded',
        extracted_text: text,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'file_url',
        ignoreDuplicates: false
      })

      if (historyError) {
        console.error('⚠️ History insert warning:', historyError)
        // Continue even if history insert fails
      } else {
        console.log('✅ Resume history saved')
      }

      setMessage('✅ Resume uploaded and parsed successfully!')
      load(fileName)
      
      console.log('=== CALLING onUploadSuccess ===')
      console.log('Passing to parent:')
      console.log('  - Text length:', text.length, 'characters')
      console.log('  - URL:', urlData.publicUrl)
      console.log('  - Name:', file.name)

      // Pass text, url, and name to parent
      if (onUploadSuccess) {
        onUploadSuccess({ 
          text: text, 
          url: urlData.publicUrl, 
          name: file.name 
        })
      }

      console.log('=== ✅ UPLOAD PROCESS COMPLETE ===')

    } catch (err) {
      console.error('=== ❌ UPLOAD ERROR ===')
      console.error('Error name:', err.name)
      console.error('Error message:', err.message)
      console.error('Full error:', err)
      
      setMessage('❌ Error: ' + err.message)
      error(err.message)
    } finally {
      setUploading(false)
    }

    return {
      abort: () => {
        console.log('Upload aborted by user')
        abort()
      }
    }
  }

  return (
    <div className="resume-upload">
      <h2>📄 Upload Your Resume</h2>
      <p className="upload-description">
        Upload your resume in PDF, Word, or Text format. We'll parse it automatically.
      </p>

      <FilePond
        ref={pondRef}
        files={files}
        onupdatefiles={setFiles}
        allowMultiple={false}
        maxFiles={1}
        server={{ process: handleProcess }}
        name="resume"
        labelIdle='Drag & Drop your resume or <span class="filepond--label-action">Browse</span>'
        acceptedFileTypes={[
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          'text/plain'
        ]}
        maxFileSize="10MB"
        labelMaxFileSizeExceeded="File is too large"
        labelMaxFileSize="Maximum file size is 10MB"
        fileValidateTypeLabelExpectedTypes="Expects PDF, Word, or Text files"
        credits={false}
      />

      {parsing && (
        <div className="parsing-loader">
          <div className="loader-spinner"></div>
          <p>🤖 Bot parsing your resume content...</p>
        </div>
      )}

      {uploading && !parsing && (
        <div className="parsing-loader">
          <div className="loader-spinner"></div>
          <p>⏳ Bot uploading your resume...</p>
        </div>
      )}

      {message && (
        <div className={`message ${message.includes('Error') || message.includes('❌') || message.includes('⚠️') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {extractedText && (
        <div className="extracted-preview">
          <h3>📋 Extracted Content Preview</h3>
          <div className="text-preview">
            {extractedText.substring(0, 500)}...
            <button 
              className="view-full-button"
              onClick={() => {
                const textWindow = window.open('', '_blank')
                textWindow.document.write(`
                  <html>
                    <head>
                      <title>Full Resume Text</title>
                      <style>
                        body { 
                          font-family: Arial, sans-serif; 
                          padding: 20px; 
                          max-width: 800px; 
                          margin: 0 auto; 
                          line-height: 1.6;
                        }
                        h1 { color: #333; }
                        pre { 
                          white-space: pre-wrap; 
                          background: #f5f5f5; 
                          padding: 15px; 
                          border-radius: 5px;
                        }
                      </style>
                    </head>
                    <body>
                      <h1>Full Resume Text</h1>
                      <pre>${extractedText}</pre>
                    </body>
                  </html>
                `)
                textWindow.document.close()
              }}
            >
              View Full Text
            </button>
          </div>
          <div className="text-stats">
            <small>
              ✅ Extracted {extractedText.length} characters | 
              ~{Math.round(extractedText.split(/\s+/).length)} words
            </small>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResumeUpload