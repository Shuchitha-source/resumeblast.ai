export const optimizeResumeWithKeywords = async (resumeText, jobTitle, userPreferences = {}) => {
  const keywords = getKeywordsForJob(jobTitle);
  
  const prompt = `You are an expert ATS (Applicant Tracking System) resume optimizer. Your task is to optimize the following resume for the job title: "${jobTitle}".

RESUME TEXT:
${resumeText}

TARGET JOB KEYWORDS TO INJECT:
Technical Skills: ${keywords.technical.join(', ')}
Soft Skills: ${keywords.soft.join(', ')}
ATS Keywords: ${keywords.ats.join(', ')}

INSTRUCTIONS:
1. Analyze the resume and identify where these keywords can be naturally integrated
2. Preserve the original meaning and achievements
3. DO NOT fabricate experience or skills the candidate doesn't have
4. Inject keywords in context where they make sense (e.g., in bullet points, skills section, summary)
5. Prioritize ATS keywords for better job matching
6. Maintain professional tone and formatting
7. Return the optimized resume text with clear markers showing where keywords were added

IMPORTANT: Mark each injected keyword with [INJECTED: keyword] so the user can review changes.

Provide the optimized resume below:`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.REACT_APP_CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Claude API request failed');
    }

    return {
      optimizedText: data.content[0].text,
      keywordsMatched: keywords,
      jobTitle: jobTitle,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Claude API Error:', error);
    throw error;
  }
};