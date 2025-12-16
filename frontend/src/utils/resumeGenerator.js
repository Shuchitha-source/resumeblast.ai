import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'

/**
 * Generate professional PDF from plain text resume
 * Preserves formatting, line breaks, and structure
 */
export async function generateAndUploadOptimizedResume(optimizedText, userId, jobTitle = '') {
  try {
    console.log('📄 Starting PDF generation with format preservation...');
    
    if (!optimizedText || typeof optimizedText !== 'string') {
      throw new Error('No valid content to generate PDF');
    }

    // Clean the text
    let cleanText = optimizedText.trim();

    // Create PDF with proper settings
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 40;
    const maxWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Add header branding (subtle)
    pdf.setFillColor(102, 126, 234);
    pdf.rect(0, 0, pageWidth, 25, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Optimized by ResumeBlast.ai', margin, 15);
    
    if (jobTitle) {
      pdf.setFontSize(8);
      pdf.text(`Target Role: ${jobTitle}`, pageWidth - margin - 150, 15);
    }

    yPosition = 50;

    // Process the resume text line by line
    const lines = cleanText.split('\n');
    
    pdf.setTextColor(0, 0, 0);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip empty lines but preserve spacing
      if (line.trim() === '') {
        yPosition += 6;
        continue;
      }

      // Detect section headers (all caps, short lines, or lines ending with colon)
      const isHeader = (
        line === line.toUpperCase() && 
        line.length < 50 && 
        line.trim().length > 0
      ) || line.trim().endsWith(':');

      if (isHeader) {
        // Check if we need a new page
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(102, 126, 234);
        
        const headerLines = pdf.splitTextToSize(line.trim(), maxWidth);
        pdf.text(headerLines, margin, yPosition);
        yPosition += headerLines.length * 14;
        
        // Add underline for headers
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
        yPosition += 8;
        
        pdf.setTextColor(0, 0, 0);
        continue;
      }

      // Detect bullet points
      const isBullet = line.trim().startsWith('•') || 
                       line.trim().startsWith('-') || 
                       line.trim().startsWith('*') ||
                       /^[\s]*[\u2022\u2023\u25E6\u2043\u2219]\s/.test(line);

      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;
      }

      if (isBullet) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        
        // Clean bullet point
        let bulletText = line.trim();
        bulletText = bulletText.replace(/^[\s]*[\u2022\u2023\u25E6\u2043\u2219\-\*]\s*/, '');
        
        // Add bullet symbol
        pdf.text('•', margin, yPosition);
        
        // Wrap bullet text
        const wrappedLines = pdf.splitTextToSize(bulletText, maxWidth - 15);
        pdf.text(wrappedLines, margin + 15, yPosition);
        yPosition += wrappedLines.length * 12;
        
      } else {
        // Regular text
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        
        const wrappedLines = pdf.splitTextToSize(line.trim(), maxWidth);
        pdf.text(wrappedLines, margin, yPosition);
        yPosition += wrappedLines.length * 12;
      }

      yPosition += 2; // Small spacing between lines
    }

    // Add footer with timestamp
    const pageCount = pdf.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 20,
        { align: 'center' }
      );
    }

    // Generate blob
    const pdfBlob = pdf.output('blob');
    
    if (pdfBlob.size < 1000) {
      throw new Error("Generated PDF is too small - content may be missing");
    }

    console.log(`✅ PDF generated successfully (${Math.round(pdfBlob.size / 1024)}KB)`);

    // Upload to Supabase
    const timestamp = Date.now();
    const safeJobTitle = (jobTitle || 'resume')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 30);
    const fileName = `${userId}/optimized_${safeJobTitle}_${timestamp}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(fileName);

    console.log('✅ PDF uploaded successfully');

    return {
      url: urlData.publicUrl,
      fileName: fileName
    };

  } catch (error) {
    console.error('❌ PDF Generation Error:', error);
    throw error;
  }
}