import jsPDF from 'jspdf'

export const generateOptimizedResumePDF = (resumeText, jobTitle, keywords, atsScore) => {
  const doc = new jsPDF()
  
  // Set up fonts and spacing
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const maxWidth = pageWidth - (margin * 2)
  let yPosition = margin

  // Helper function to add text with word wrap
  const addText = (text, fontSize = 11, isBold = false, color = [0, 0, 0]) => {
    doc.setFontSize(fontSize)
    doc.setTextColor(...color)
    doc.setFont('helvetica', isBold ? 'bold' : 'normal')
    
    const lines = doc.splitTextToSize(text, maxWidth)
    
    // Check if we need a new page
    if (yPosition + (lines.length * fontSize * 0.5) > pageHeight - margin) {
      doc.addPage()
      yPosition = margin
    }
    
    doc.text(lines, margin, yPosition)
    yPosition += lines.length * fontSize * 0.5
  }

  const addSpace = (space = 5) => {
    yPosition += space
  }

  // Add header with branding
  doc.setFillColor(102, 126, 234) // Purple color
  doc.rect(0, 0, pageWidth, 15, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.text('Optimized by ResumeBlast.ai', margin, 10)
  yPosition = 25

  // Add optimization info badge
  if (jobTitle) {
    doc.setFillColor(240, 245, 255)
    doc.roundedRect(margin, yPosition, maxWidth, 20, 3, 3, 'F')
    doc.setTextColor(102, 126, 234)
    doc.setFontSize(9)
    doc.text(`Optimized for: ${jobTitle}`, margin + 5, yPosition + 7)
    if (atsScore) {
      doc.text(`ATS Score: ${atsScore}/100`, margin + 5, yPosition + 14)
    }
    yPosition += 25
  }

  // Add the resume content
  addText(resumeText, 11, false, [0, 0, 0])
  
  addSpace(10)

  // Add footer with keywords if provided
  if (keywords && keywords.technical && keywords.technical.length > 0) {
    // Start footer on new page if needed
    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = margin
    }

    // Add separator line
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    addSpace(8)

    // Keywords section
    addText('Key Skills & Keywords', 10, true, [102, 126, 234])
    addSpace(3)

    const allKeywords = [
      ...(keywords.technical || []),
      ...(keywords.ats || []),
      ...(keywords.soft || [])
    ]

    const keywordText = allKeywords.slice(0, 20).join(' • ')
    addText(keywordText, 9, false, [80, 80, 80])
  }

  // Add footer with timestamp
  const timestamp = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text(`Generated on ${timestamp}`, margin, pageHeight - 10)

  return doc
}

export const downloadResumePDF = (resumeText, jobTitle, keywords, atsScore) => {
  const doc = generateOptimizedResumePDF(resumeText, jobTitle, keywords, atsScore)
  const fileName = `optimized-resume-${jobTitle?.replace(/\s+/g, '-').toLowerCase() || 'general'}-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}