import { useState } from 'react'
import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'
import './ResumeBuilder.css'

function ResumeBuilder({ user, onGenerateSuccess }) {
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: user?.email || '',
    phone: '',
    location: '',
    summary: '',
    experience: [
      { company: '', position: '', duration: '', description: '' }
    ],
    education: [
      { school: '', degree: '', year: '' }
    ],
    skills: '',
    certifications: ''
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, { company: '', position: '', duration: '', description: '' }]
    }))
  }

  const updateExperience = (index, field, value) => {
    const newExperience = [...formData.experience]
    newExperience[index][field] = value
    setFormData(prev => ({ ...prev, experience: newExperience }))
  }

  const removeExperience = (index) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }))
  }

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { school: '', degree: '', year: '' }]
    }))
  }

  const updateEducation = (index, field, value) => {
    const newEducation = [...formData.education]
    newEducation[index][field] = value
    setFormData(prev => ({ ...prev, education: newEducation }))
  }

  const removeEducation = (index) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }))
  }

  const generatePDF = async () => {
    // Validation
    if (!formData.fullName || !formData.email) {
      setMessage('❌ Please fill in at least your name and email')
      return
    }

    setGenerating(true)
    setMessage('🤖 Bot generating your resume...')

    try {
      // Create PDF
      const doc = new jsPDF()
      let yPosition = 20

      // Helper function to add text with word wrap
      const addText = (text, fontSize = 10, isBold = false) => {
        doc.setFontSize(fontSize)
        doc.setFont('helvetica', isBold ? 'bold' : 'normal')
        
        if (yPosition > 270) {
          doc.addPage()
          yPosition = 20
        }
        
        const lines = doc.splitTextToSize(text, 170)
        doc.text(lines, 20, yPosition)
        yPosition += lines.length * (fontSize / 2) + 5
      }

      // Header - Name
      doc.setFillColor(102, 126, 234)
      doc.rect(0, 0, 210, 35, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text(formData.fullName.toUpperCase(), 20, 20)
      
      // Contact Info
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`${formData.email} | ${formData.phone} | ${formData.location}`, 20, 28)
      
      // Reset colors
      doc.setTextColor(0, 0, 0)
      yPosition = 45

      // Professional Summary
      if (formData.summary) {
        addText('PROFESSIONAL SUMMARY', 14, true)
        yPosition += 2
        addText(formData.summary, 10)
        yPosition += 5
      }

      // Experience
      if (formData.experience.some(exp => exp.company)) {
        addText('PROFESSIONAL EXPERIENCE', 14, true)
        yPosition += 2
        
        formData.experience.forEach(exp => {
          if (exp.company && exp.position) {
            addText(`${exp.position} at ${exp.company}`, 11, true)
            if (exp.duration) {
              doc.setFontSize(9)
              doc.setFont('helvetica', 'italic')
              doc.text(exp.duration, 20, yPosition)
              yPosition += 5
            }
            if (exp.description) {
              addText(exp.description, 10)
            }
            yPosition += 3
          }
        })
        yPosition += 2
      }

      // Education
      if (formData.education.some(edu => edu.school)) {
        addText('EDUCATION', 14, true)
        yPosition += 2
        
        formData.education.forEach(edu => {
          if (edu.school && edu.degree) {
            addText(`${edu.degree}`, 11, true)
            addText(`${edu.school} - ${edu.year}`, 10)
            yPosition += 2
          }
        })
        yPosition += 2
      }

      // Skills
      if (formData.skills) {
        addText('SKILLS', 14, true)
        yPosition += 2
        addText(formData.skills, 10)
        yPosition += 5
      }

      // Certifications
      if (formData.certifications) {
        addText('CERTIFICATIONS', 14, true)
        yPosition += 2
        addText(formData.certifications, 10)
      }

      // Save PDF as blob
      const pdfBlob = doc.output('blob')
      const fileName = `${formData.fullName.replace(/\s+/g, '_')}_Resume_${Date.now()}.pdf`

      // Upload to Supabase Storage
      const filePath = `${user.id}/${fileName}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          cacheControl: '3600'
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath)

      // Save to database
      await supabase
        .from('users')
        .update({
          resume_file_url: urlData.publicUrl,
          resume_file_name: fileName,
          resume_uploaded_at: new Date().toISOString()
        })
        .eq('id', user.id)

      // Save to resume_history
      await supabase.from('resume_history').insert({
        user_id: user.id,
        file_url: urlData.publicUrl,
        file_name: fileName,
        file_size: pdfBlob.size,
        status: 'generated'
      })

      setMessage('✅ Resume generated successfully!')
      
      // Download PDF
      doc.save(fileName)
      
      // ✅ UPDATED: Generate text representation and pass it to parent
      if (onGenerateSuccess) {
        // Generate text representation of the form data
        const generatedText = `${formData.fullName}
${formData.email}
${formData.phone}
${formData.location}

PROFESSIONAL SUMMARY:
${formData.summary}

PROFESSIONAL EXPERIENCE:
${formData.experience.map(exp => `${exp.position} at ${exp.company}
${exp.duration}
${exp.description}`).join('\n\n')}

EDUCATION:
${formData.education.map(edu => `${edu.degree} - ${edu.school} (${edu.year})`).join('\n')}

SKILLS:
${formData.skills}

CERTIFICATIONS:
${formData.certifications}`
        
        onGenerateSuccess({ 
          url: urlData.publicUrl, 
          name: fileName,
          text: generatedText 
        })
      }

    } catch (error) {
      console.error('Generation error:', error)
      setMessage('❌ Error: ' + error.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="resume-builder">
      <h2>🤖 Build Resume from Scratch</h2>
      <p className="builder-description">
        Fill in your information and let our bot generate a professional resume for you.
      </p>

      <div className="form-container">
        {/* Personal Information */}
        <div className="form-section">
          <h3>Personal Information</h3>
          
          <div className="form-row">
            <div className="form-field">
              <label>Full Name *</label>
              <input
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                disabled={generating}
              />
            </div>
            
            <div className="form-field">
              <label>Email *</label>
              <input
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={generating}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Phone</label>
              <input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={generating}
              />
            </div>
            
            <div className="form-field">
              <label>Location</label>
              <input
                type="text"
                placeholder="New York, NY"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                disabled={generating}
              />
            </div>
          </div>

          <div className="form-field">
            <label>Professional Summary</label>
            <textarea
              placeholder="Brief summary of your professional background and career goals..."
              value={formData.summary}
              onChange={(e) => handleInputChange('summary', e.target.value)}
              disabled={generating}
              rows={4}
            />
          </div>
        </div>

        {/* Experience */}
        <div className="form-section">
          <div className="section-header">
            <h3>Work Experience</h3>
            <button 
              className="add-button" 
              onClick={addExperience}
              disabled={generating}
            >
              + Add Experience
            </button>
          </div>

          {formData.experience.map((exp, index) => (
            <div key={index} className="repeatable-section">
              <div className="section-controls">
                <span className="section-number">Experience #{index + 1}</span>
                {formData.experience.length > 1 && (
                  <button 
                    className="remove-button"
                    onClick={() => removeExperience(index)}
                    disabled={generating}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Company</label>
                  <input
                    type="text"
                    placeholder="Company Name"
                    value={exp.company}
                    onChange={(e) => updateExperience(index, 'company', e.target.value)}
                    disabled={generating}
                  />
                </div>
                
                <div className="form-field">
                  <label>Position</label>
                  <input
                    type="text"
                    placeholder="Job Title"
                    value={exp.position}
                    onChange={(e) => updateExperience(index, 'position', e.target.value)}
                    disabled={generating}
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Duration</label>
                <input
                  type="text"
                  placeholder="Jan 2020 - Present"
                  value={exp.duration}
                  onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                  disabled={generating}
                />
              </div>

              <div className="form-field">
                <label>Description</label>
                <textarea
                  placeholder="Describe your responsibilities and achievements..."
                  value={exp.description}
                  onChange={(e) => updateExperience(index, 'description', e.target.value)}
                  disabled={generating}
                  rows={3}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Education */}
        <div className="form-section">
          <div className="section-header">
            <h3>Education</h3>
            <button 
              className="add-button" 
              onClick={addEducation}
              disabled={generating}
            >
              + Add Education
            </button>
          </div>

          {formData.education.map((edu, index) => (
            <div key={index} className="repeatable-section">
              <div className="section-controls">
                <span className="section-number">Education #{index + 1}</span>
                {formData.education.length > 1 && (
                  <button 
                    className="remove-button"
                    onClick={() => removeEducation(index)}
                    disabled={generating}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>School/University</label>
                  <input
                    type="text"
                    placeholder="University Name"
                    value={edu.school}
                    onChange={(e) => updateEducation(index, 'school', e.target.value)}
                    disabled={generating}
                  />
                </div>
                
                <div className="form-field">
                  <label>Degree</label>
                  <input
                    type="text"
                    placeholder="Bachelor of Science in Computer Science"
                    value={edu.degree}
                    onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                    disabled={generating}
                  />
                </div>

                <div className="form-field">
                  <label>Year</label>
                  <input
                    type="text"
                    placeholder="2020"
                    value={edu.year}
                    onChange={(e) => updateEducation(index, 'year', e.target.value)}
                    disabled={generating}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Skills */}
        <div className="form-section">
          <h3>Skills</h3>
          <div className="form-field">
            <label>List your skills (comma separated)</label>
            <textarea
              placeholder="JavaScript, React, Node.js, Python, SQL, Project Management..."
              value={formData.skills}
              onChange={(e) => handleInputChange('skills', e.target.value)}
              disabled={generating}
              rows={3}
            />
          </div>
        </div>

        {/* Certifications */}
        <div className="form-section">
          <h3>Certifications (Optional)</h3>
          <div className="form-field">
            <label>List your certifications</label>
            <textarea
              placeholder="AWS Certified Solutions Architect, PMP Certification..."
              value={formData.certifications}
              onChange={(e) => handleInputChange('certifications', e.target.value)}
              disabled={generating}
              rows={2}
            />
          </div>
        </div>

        {/* Generate Button */}
        <button 
          className="generate-button"
          onClick={generatePDF}
          disabled={generating || !formData.fullName || !formData.email}
        >
          {generating ? (
            <>
              <div className="button-spinner"></div>
              🤖 Bot Generating Resume...
            </>
          ) : (
            '🚀 Generate Resume PDF'
          )}
        </button>

        {message && (
          <div className={`message ${message.includes('Error') || message.includes('❌') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}

export default ResumeBuilder