import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { resumeText, jobDescription } = await req.json()

    if (!resumeText) {
      throw new Error('Resume text is required')
    }

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `You are an expert ATS resume optimizer and career consultant. Analyze the following resume and provide specific, actionable suggestions to improve it for Applicant Tracking Systems (ATS) and recruiter appeal.

Resume Text:
${resumeText}

${jobDescription ? `Target Job Description:\n${jobDescription}\n\n` : ''}

Please provide:
1. ATS Optimization Score (0-100)
2. Key Issues Found (list 3-5 major problems)
3. Keyword Suggestions (5-10 industry-relevant keywords to add)
4. Content Improvements (specific bullet point rewrites)
5. Formatting Recommendations
6. Overall Assessment

Format your response as JSON with this structure:
{
  "ats_score": number,
  "issues": ["issue1", "issue2", ...],
  "keywords": ["keyword1", "keyword2", ...],
  "improvements": [
    {"original": "original text", "improved": "improved text", "reason": "why this is better"}
  ],
  "formatting_tips": ["tip1", "tip2", ...],
  "overall_assessment": "summary of the resume's strengths and weaknesses"
}

IMPORTANT: Return ONLY valid JSON, no additional text or markdown formatting.`
        }]
      })
    })

    if (!claudeResponse.ok) {
      const error = await claudeResponse.text()
      throw new Error(`Claude API error: ${error}`)
    }

    const claudeData = await claudeResponse.json()
    const responseText = claudeData.content[0].text

    // Parse Claude's JSON response
    let optimizationData
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      optimizationData = JSON.parse(cleanedResponse)
    } catch (parseError) {
      // If JSON parsing fails, return raw text
      optimizationData = {
        ats_score: 0,
        issues: ['Could not parse optimization results'],
        keywords: [],
        improvements: [],
        formatting_tips: [],
        overall_assessment: responseText
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: optimizationData,
        usage: claudeData.usage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})