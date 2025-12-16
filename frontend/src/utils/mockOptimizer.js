export const mockOptimizeResume = async (resumeText, jobDescription, targetJob, keywords) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Generate mock optimization results
  const technicalKeywords = keywords?.technical || ['Python', 'React', 'AWS']
  const atsKeywords = keywords?.ats || ['Leadership', 'Strategic Planning']
  const softKeywords = keywords?.soft || ['Communication', 'Problem Solving']
  
  const allKeywords = [...technicalKeywords, ...atsKeywords, ...softKeywords]
  
  // MINIMAL INJECTION - preserve original format
  let optimizedText = resumeText
  
  // Only add keywords if there's a clear skills section
  if (resumeText.toLowerCase().includes('skills')) {
    // Find the skills section and enhance it
    const skillsIndex = resumeText.toLowerCase().indexOf('skills')
    const nextSectionIndex = resumeText.indexOf('\n\n', skillsIndex + 100)
    
    if (nextSectionIndex > skillsIndex) {
      // Insert keywords near skills section
      const beforeSkills = resumeText.substring(0, nextSectionIndex)
      const afterSkills = resumeText.substring(nextSectionIndex)
      
      const keywordsToAdd = allKeywords.slice(0, 8).join(', ')
      optimizedText = `${beforeSkills}\nAdditional Skills: ${keywordsToAdd}${afterSkills}`
    }
  } else {
    // Add a skills section at the end if none exists
    const keywordsToAdd = allKeywords.slice(0, 10).join(' • ')
    optimizedText += `\n\nSKILLS\n${keywordsToAdd}`
  }

  return {
    success: true,
    data: {
      ats_score: 88,
      optimizedText: optimizedText,
      issues: [
        'Resume could benefit from more quantifiable achievements',
        'Consider adding specific metrics to demonstrate impact'
      ],
      keywords: allKeywords.slice(0, 15),
      improvements: [
        {
          original: 'Managed projects',
          improved: `Led cross-functional projects utilizing ${technicalKeywords.slice(0, 3).join(', ')}`,
          reason: 'More specific with relevant technical keywords'
        },
        {
          original: 'Team collaboration',
          improved: `Collaborated with distributed teams demonstrating ${softKeywords[0] || 'strong communication'}`,
          reason: 'Highlights soft skills with context'
        }
      ],
      formatting_tips: [
        'Maintain consistent date formatting throughout',
        'Use action verbs to start each bullet point',
        'Ensure proper capitalization and punctuation',
        'Keep formatting clean and professional'
      ],
      overall_assessment: `Your resume has strong content with ${allKeywords.length} relevant keywords injected for the ${targetJob || 'target'} role. The optimization improves ATS compatibility while preserving your original format and achievements.`
    }
  }
}