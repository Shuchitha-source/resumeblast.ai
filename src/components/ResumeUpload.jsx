import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { FilePond, registerPlugin } from 'react-filepond'
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type'
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size'
import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'

// Import FilePond styles
import 'filepond/dist/filepond.min.css'
import './ResumeUpload.css'

// Register FilePond plugins
registerPlugin(FilePondPluginFileValidateType, FilePondPluginFileValidateSize)

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

function ResumeUpload({ user, onUploadSuccess }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [extractedText, setExtractedText] = useState('')
  const [message, setMessage] = useState('')
  const pondRef = useRef(null)

  // Parse PDF file
  const parsePDF = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let fullText = ''

      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map(item => item.str).join(' ')
        fullText += pageText + '\n'
      }

      return fullText
    } catch (error) {
      console.error('PDF parsing error:', error)
      throw new Error('Failed to parse PDF')
    }
  }

  // Parse Word document
  const parseWord = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      return result.value
    } catch (error) {
      console.error('Word parsing error:', error)
      throw new Error('Failed to parse Word document')
    }
  }

  // Parse text file
  const parseText = async (file) => {
    try {
      return await file.text()
    } catch (error) {
      console.error('Text parsing error:', error)
      throw new Error('Failed to read text file')
    }
  }

  // Extract text based on file type
  const extractTextFromFile = async (file) => {
    setParsing(true)
    setMessage('📄 Parsing your resume...')
    
    try {
      let text = ''
      
      if (file.type === 'application/pdf') {
        text = await parsePDF(file)
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword'
      ) {
        text = await parseWord(file)
      } else if (file.type === 'text/plain') {
        text = await parseText(file)
      }

      setExtractedText(text)
      setMessage('✅ Resume parsed successfully!')
      return text
    } catch (error) {
      setMessage('⚠️ Could not parse file content, but file was uploaded')
      return ''
    } finally {
      setParsing(false)
    }
  }

  // Handle file upload
  const handleProcess = async (fieldName, file, metadata, load, error, progress, abort) => {
    setUploading(true)
    setMessage('Uploading your resume...')

    try {
      // Extract text from file
      const text = await extractTextFromFile(file)

      // Create unique file path
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName)

      // Save to database
      const { error: dbError } = await supabase
        .from('users')
        .update({
          resume_file_url: urlData.publicUrl,
          resume_file_name: file.name,
          resume_uploaded_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (dbError) throw dbError

      // Save to resume_history with extracted text
      await supabase.from('resume_history').insert({
        user_id: user.id,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        status: 'uploaded',
        extracted_text: text
      })

      setMessage('✅ Resume uploaded and parsed successfully!')
      load(fileName)
      
      if (onUploadSuccess) {
        onUploadSuccess({ text, url: urlData.publicUrl, name: file.name })
      }

    } catch (err) {
      console.error('Upload error:', err)
      setMessage('❌ Error: ' + err.message)
      error(err.message)
    } finally {
      setUploading(false)
    }

    return {
      abort: () => {
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
          <p>Parsing your resume content...</p>
        </div>
      )}

      {message && (
        <div className={`message ${message.includes('Error') || message.includes('❌') ? 'error' : 'success'}`}>
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
              onClick={() => alert(extractedText)}
            >
              View Full Text
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResumeUpload