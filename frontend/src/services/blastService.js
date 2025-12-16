// /frontend/src/services/blastService.js - FIXED VERSION

/**
 * CRITICAL FIX INSTRUCTIONS:
 * 
 * 1. GET NEW WEBHOOK URL FROM MAKE.COM:
 *    - Go to your Make.com scenario: "ResumeBlast Distribution"
 *    - Click on the first module (Webhook)
 *    - Copy the WEBHOOK URL (it should start with https://hook.us2.make.com/)
 *    - Replace the URL below in your .env file
 * 
 * 2. UPDATE .env FILE:
 *    Add this line with YOUR webhook URL:
 *    VITE_MAKE_WEBHOOK_URL=https://hook.us2.make.com/YOUR_WEBHOOK_URL_HERE
 * 
 * 3. RESTART YOUR FRONTEND:
 *    - Stop your React dev server (Ctrl+C)
 *    - Run: npm run dev
 */

// Get webhook URL from environment - NO HARDCODED FALLBACK
const MAKE_WEBHOOK_URL = import.meta.env.VITE_MAKE_WEBHOOK_URL;

// Validate webhook URL on module load
if (!MAKE_WEBHOOK_URL) {
  console.error('❌ CRITICAL: VITE_MAKE_WEBHOOK_URL is not set in .env file!');
  console.error('Please add: VITE_MAKE_WEBHOOK_URL=https://hook.us2.make.com/YOUR_WEBHOOK_URL');
}

console.log('🔧 blastService.js loaded');
console.log('🔗 Webhook URL configured:', MAKE_WEBHOOK_URL ? '✅ Set' : '❌ Missing');

/**
 * Trigger email blast via Make.com automation
 */
export const triggerEmailBlast = async (blastData) => {
  try {
    console.log('');
    console.log('=== 🚀 TRIGGER EMAIL BLAST STARTED ===');
    console.log('📤 Webhook URL:', MAKE_WEBHOOK_URL);

    // STEP 1: Validate webhook URL exists
    if (!MAKE_WEBHOOK_URL) {
      throw new Error(
        '❌ Webhook URL not configured!\n\n' +
        'Please follow these steps:\n' +
        '1. Open Make.com and go to your "ResumeBlast Distribution" scenario\n' +
        '2. Click on the Webhook module (first module)\n' +
        '3. Copy the Webhook URL\n' +
        '4. Add to .env file: VITE_MAKE_WEBHOOK_URL=<your-webhook-url>\n' +
        '5. Restart your frontend server'
      );
    }

    // STEP 2: Validate webhook URL format
    if (!MAKE_WEBHOOK_URL.startsWith('https://hook.')) {
      throw new Error(
        `❌ Invalid webhook URL format!\n\n` +
        `Expected: https://hook.us2.make.com/...\n` +
        `Got: ${MAKE_WEBHOOK_URL}\n\n` +
        `Please verify the webhook URL in Make.com`
      );
    }

    // STEP 3: Validate blast data
    const recipientsArray = blastData.recipients || blastData.recruiters;
    
    console.log('🔍 Checking recipients...');
    console.log('📊 Recipients found:', recipientsArray?.length || 0);

    if (!recipientsArray || !Array.isArray(recipientsArray)) {
      throw new Error('❌ Invalid blast data: recipients array is required');
    }

    if (recipientsArray.length === 0) {
      throw new Error('❌ No recipients selected for blast');
    }

    console.log(`✅ Validation passed: ${recipientsArray.length} recipients`);

    // STEP 4: Prepare payload for Make.com
    const payload = {
      // Candidate information
      candidate_name: blastData.candidate_name || blastData.userData?.name || 'Professional Candidate',
      candidate_email: blastData.candidate_email || blastData.userData?.email || 'candidate@example.com',
      candidate_phone: blastData.candidate_phone || blastData.userData?.phone || '',
      job_role: blastData.job_role || blastData.userData?.targetRole || 'Professional',
      years_experience: String(blastData.years_experience || '0'),
      key_skills: blastData.key_skills || 'Professional Skills',
      education_level: blastData.education_level || 'Not Specified',
      location: blastData.location || blastData.campaign?.location || 'Remote',
      linkedin_url: blastData.linkedin_url || blastData.userData?.linkedin || '',
      resume_url: blastData.resume_url || blastData.resumeUrl || '',
      
      // Recipients array - standardized format
      recipients: recipientsArray.map(recipient => ({
        email: recipient.email || recipient.recruiter_email,
        name: recipient.name || recipient.recruiter_name || 'Recruiter',
        company: recipient.company || recipient.company_name || 'Company'
      }))
    };

    console.log('📦 Payload prepared:');
    console.log('  - Candidate:', payload.candidate_name);
    console.log('  - Email:', payload.candidate_email);
    console.log('  - Role:', payload.job_role);
    console.log('  - Recipients:', payload.recipients.length);
    console.log('  - Resume URL:', payload.resume_url ? '✅ Present' : '❌ Missing');

    // STEP 5: Send request to Make.com
    console.log('📡 Sending POST request to Make.com...');

    const response = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
      },
      mode: 'cors',
      body: JSON.stringify(payload),
    });

    console.log('');
    console.log('=== 📥 RESPONSE RECEIVED ===');
    console.log('📊 Status:', response.status);
    console.log('📊 Status Text:', response.statusText);
    console.log('✅ OK:', response.ok);

    // STEP 6: Handle response
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Make.com error response:', errorText);

      // Provide specific error messages based on status code
      let errorMessage = '';
      switch (response.status) {
        case 410:
          errorMessage = 
            '❌ Webhook URL is no longer active (410 Gone)\n\n' +
            'This means the webhook was deleted or recreated in Make.com.\n\n' +
            'STEPS TO FIX:\n' +
            '1. Go to Make.com → Your Scenario\n' +
            '2. Click on the Webhook module\n' +
            '3. Copy the NEW webhook URL\n' +
            '4. Update VITE_MAKE_WEBHOOK_URL in .env file\n' +
            '5. Restart your frontend server (npm run dev)';
          break;
        case 401:
        case 403:
          errorMessage = 
            '❌ Authentication error\n\n' +
            'Make.com rejected the request. Please check:\n' +
            '1. Webhook URL is correct\n' +
            '2. Scenario is turned ON in Make.com\n' +
            '3. Webhook module is properly configured';
          break;
        case 400:
          errorMessage = 
            '❌ Bad Request - Invalid data format\n\n' +
            'Make.com rejected the payload. Details:\n' + errorText;
          break;
        case 500:
        case 502:
        case 503:
          errorMessage = 
            '❌ Make.com server error\n\n' +
            'The Make.com service is having issues. Please:\n' +
            '1. Check Make.com status page\n' +
            '2. Verify your scenario is running\n' +
            '3. Try again in a few minutes';
          break;
        default:
          errorMessage = `Make.com webhook failed (${response.status}): ${errorText}`;
      }

      throw new Error(errorMessage);
    }

    // STEP 7: Parse successful response
    const result = await response.text();
    console.log('📬 Make.com response:', result);
    console.log('=== ✅ EMAIL BLAST COMPLETED ===');
    console.log('');
    
    return {
      success: true,
      message: 'Email blast initiated successfully',
      makecomResponse: result,
      status: response.status,
      recruiterCount: payload.recipients.length
    };

  } catch (error) {
    console.log('');
    console.error('=== ❌ ERROR IN triggerEmailBlast ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.log('');

    // Enhanced error messages for common issues
    if (error.message.includes('Failed to fetch')) {
      throw new Error(
        '❌ Network connection failed\n\n' +
        'Cannot reach Make.com. This could be:\n' +
        '1. Internet connection issue\n' +
        '2. Make.com is down\n' +
        '3. Browser blocking the request (CORS)\n' +
        '4. Firewall blocking Make.com\n\n' +
        'Please check your internet connection and try again.'
      );
    }

    throw error;
  }
};

/**
 * Test Make.com webhook connection
 */
export const testWebhookConnection = async () => {
  try {
    console.log('🧪 Testing webhook connection...');
    console.log('🔗 Testing URL:', MAKE_WEBHOOK_URL);

    if (!MAKE_WEBHOOK_URL) {
      return {
        success: false,
        error: 'Webhook URL not configured in .env file'
      };
    }

    const testData = {
      test: true,
      message: 'Connection test from ResumeBlast',
      timestamp: new Date().toISOString(),
      candidate_name: 'Test User',
      candidate_email: 'test@resumeblast.ai',
      candidate_phone: '1234567890',
      job_role: 'Software Engineer',
      years_experience: '5',
      key_skills: 'Testing, Debugging, Problem Solving',
      education_level: "Bachelor's Degree",
      location: 'Remote',
      linkedin_url: 'https://linkedin.com/in/test',
      resume_url: 'https://example.com/test-resume.pdf',
      recipients: [
        {
          email: 'test-recruiter@example.com',
          name: 'Test Recruiter',
          company: 'Test Company'
        }
      ]
    };

    console.log('📤 Sending test payload...');

    const response = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const responseText = await response.text();
    console.log('✅ Test response status:', response.status);
    console.log('✅ Test response body:', responseText);

    if (response.ok) {
      return { 
        success: true, 
        status: response.status,
        message: 'Webhook connection successful! ✅',
        response: responseText
      };
    } else {
      return { 
        success: false, 
        status: response.status,
        error: `Webhook test failed (${response.status}): ${responseText}`
      };
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Create blast campaign record
 */
export const createBlastCampaign = async (campaignData) => {
  console.log('📝 Creating blast campaign...');
  
  const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const mockCampaign = {
    id: campaignId,
    ...campaignData,
    status: 'pending',
    created_at: new Date().toISOString()
  };
  
  console.log('✅ Campaign created:', mockCampaign.id);
  
  return mockCampaign;
};

/**
 * Get blast campaign analytics
 */
export const getBlastAnalytics = async (campaignId) => {
  console.log('📊 Fetching analytics for campaign:', campaignId);
  
  const mockAnalytics = {
    campaign_id: campaignId,
    total_sent: 0,
    total_opened: 0,
    total_clicked: 0,
    status: 'pending'
  };
  
  console.log('✅ Analytics fetched:', mockAnalytics);
  
  return mockAnalytics;
};