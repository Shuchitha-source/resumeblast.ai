export const mockOptimizeResume = async (resumeText, jobDescription, targetJob, keywords) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Generate mock optimization results
  const technicalKeywords = keywords?.technical || []
  const atsKeywords = keywords?.ats || []
  const softKeywords = keywords?.soft || []
  
  const allKeywords = [...technicalKeywords, ...atsKeywords, ...softKeywords]
  
  // Create optimized resume by injecting keywords
  let optimizedText = resumeText
  
  // Add keywords to a skills section if not present
  if (!resumeText.toLowerCase().includes('skills')) {
    optimizedText += `\n\nSKILLS:\n${allKeywords.slice(0, 10).join(' • ')}`
  }

  return {
    success: true,
    data: {
      ats_score: 85,
      optimizedText: optimizedText,
      issues: [
        'Inconsistent formatting in experience section',
        'Missing quantifiable achievements in some bullet points',
        'Could benefit from stronger action verbs'
      ],
      keywords: allKeywords.slice(0, 15),
      improvements: [
        {
          original: 'Worked on projects',
          improved: `Developed and maintained 15+ responsive web applications using ${technicalKeywords.slice(0, 3).join(', ')}`,
          reason: 'More specific and includes relevant keywords'
        },
        {
          original: 'Team collaboration',
          improved: `Collaborated with cross-functional teams of 8+ developers using ${softKeywords[0] || 'agile methodology'}`,
          reason: 'Quantified and demonstrates collaboration'
        }
      ],
      formatting_tips: [
        'Use consistent date formatting (Month Year - Month Year)',
        'Add LinkedIn profile URL in header',
        'Implement proper capitalization throughout',
        'Use bullet points for all achievements'
      ],
      overall_assessment: `This resume has a solid foundation with relevant experience. With the injected ${allKeywords.length} keywords for the ${targetJob || 'target'} role, ATS compatibility has improved significantly. The experience section demonstrates impact, but quantifying achievements more would strengthen it further.`
    }
  }
}