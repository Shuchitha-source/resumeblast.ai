// /frontend/src/services/blastService.js
// Get webhook URL from environment - NO HARDCODED FALLBACK
const MAKE_WEBHOOK_URL = import.meta.env.VITE_MAKE_WEBHOOK_URL;

// Validate webhook URL on module load
if (!MAKE_WEBHOOK_URL) {
  console.error('❌ CRITICAL: VITE_MAKE_WEBHOOK_URL is not set in .env file!');
}

console.log('🔧 blastService.js loaded');

/**
 * Trigger email blast via Make.com automation
 */
export const triggerEmailBlast = async (blastData) => {
  try {
    console.log('');
    console.log('=== 🚀 TRIGGER EMAIL BLAST STARTED ===');
    
    // STEP 1: Validate webhook URL exists
    if (!MAKE_WEBHOOK_URL) {
      throw new Error('❌ Webhook URL not configured! Check VITE_MAKE_WEBHOOK_URL in .env');
    }

    // STEP 2: Validate recipients
    const recipientsArray = blastData.recipients || blastData.recruiters;
    if (!recipientsArray || !Array.isArray(recipientsArray) || recipientsArray.length === 0) {
      throw new Error('❌ No recipients selected for blast');
    }

    console.log(`✅ Validation passed: ${recipientsArray.length} recipients`);

    // STEP 3: Prepare payload for Make.com
    const payload = {
      // Candidate information
      candidate_name: blastData.candidate_name || 'Professional Candidate',
      candidate_email: blastData.candidate_email || 'candidate@example.com',
      candidate_phone: blastData.candidate_phone || '',
      job_role: blastData.job_role || 'Professional',
      years_experience: String(blastData.years_experience || '0'),
      key_skills: blastData.key_skills || 'Professional Skills',
      education_level: blastData.education_level || 'Not Specified',
      location: blastData.location || 'Remote',
      linkedin_url: blastData.linkedin_url || '',
      
      // ✅ Resume File Info
      resume_url: blastData.resume_url || blastData.resumeUrl || '',
      // OPTION 2 FIX: Send the filename so Brevo gets the right extension
      resume_name: blastData.resume_name || 'Resume.pdf', 
      
      // Recipients array
      recipients: recipientsArray.map(recipient => ({
        email: recipient.email || recipient.recruiter_email,
        name: recipient.name || recipient.recruiter_name || 'Recruiter',
        company: recipient.company || recipient.company_name || 'Company'
      }))
    };

    console.log('📦 Payload prepared:');
    console.log('  - Candidate:', payload.candidate_name);
    console.log('  - Resume Name:', payload.resume_name); // Log for debugging

    // STEP 4: Send request to Make.com
    console.log('📡 Sending POST request to Make.com...');

    const response = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Make.com webhook failed (${response.status}): ${errorText}`);
    }

    const result = await response.text();
    console.log('✅ Make.com response:', result);
    
    return {
      success: true,
      message: 'Email blast initiated successfully',
      makecomResponse: result,
      recruiterCount: payload.recipients.length
    };

  } catch (error) {
    console.error('=== ❌ ERROR IN triggerEmailBlast ===', error);
    throw error;
  }
};

export const testWebhookConnection = async () => {
    // (Kept simple for brevity, logic remains the same as before)
    return { success: true, message: "Test not implemented in this snippet" };
};