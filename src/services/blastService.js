// /frontend/src/services/blastService.js

// Import webhook URL from environment variables or use hardcoded for now
const MAKE_WEBHOOK_URL = import.meta.env.VITE_MAKE_WEBHOOK_URL || 'https://hook.us2.make.com/sn9gbcmhwedb22e5gthr56w3lt36cvw9';

// Log on file load to verify it's set
console.log('🔧 blastService.js loaded');
console.log('🔗 Webhook URL:', MAKE_WEBHOOK_URL);

/**
 * Trigger email blast via Make.com automation
 * @param {Object} blastData - Campaign configuration data
 * @returns {Promise} - Response from Make.com webhook
 */
export const triggerEmailBlast = async (blastData) => {
  try {
    console.log('');
    console.log('=== 🚀 TRIGGER EMAIL BLAST STARTED ===');
    console.log('📤 Webhook URL:', MAKE_WEBHOOK_URL);
    console.log('📦 Blast data received:', JSON.stringify(blastData, null, 2));

    // Validate webhook URL exists
    if (!MAKE_WEBHOOK_URL) {
      throw new Error('❌ VITE_MAKE_WEBHOOK_URL is not defined. Using fallback URL or add it to .env file.');
    }

    // Validate webhook URL format
    if (!MAKE_WEBHOOK_URL.startsWith('https://hook.')) {
      throw new Error(`❌ Invalid webhook URL format. Expected https://hook.*, got: ${MAKE_WEBHOOK_URL}`);
    }

    // CRITICAL FIX: Support both 'recipients' (new format) and 'recruiters' (old format)
    const recipientsArray = blastData.recipients || blastData.recruiters;
    
    console.log('🔍 Checking recipients...');
    console.log('📊 blastData.recipients:', blastData.recipients);
    console.log('📊 blastData.recruiters:', blastData.recruiters);
    console.log('📊 Selected array:', recipientsArray);

    // Validate blast data structure
    if (!recipientsArray) {
      throw new Error('❌ Invalid blast data: recipients or recruiters array is required');
    }

    if (!Array.isArray(recipientsArray)) {
      throw new Error('❌ Invalid blast data: recipients must be an array');
    }

    if (recipientsArray.length === 0) {
      throw new Error('❌ No recipients selected for blast');
    }

    console.log(`✅ Validation passed: ${recipientsArray.length} recipients found`);

    // Prepare standardized payload for Make.com
    // Make.com expects 'recipients' array based on the scenario configuration
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
      resume_url: blastData.resume_url || '',
      
      // Recipients array - standardized format
      recipients: recipientsArray.map(recipient => ({
        email: recipient.email || recipient.recruiter_email,
        name: recipient.name || recipient.recruiter_name,
        company: recipient.company || recipient.company_name || 'Company'
      }))
    };

    console.log('📦 Final payload prepared:', JSON.stringify(payload, null, 2));
    console.log(`📊 Sending blast to ${payload.recipients.length} recipients`);
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Make.com error response:', errorText);
      throw new Error(`Make.com webhook failed: ${response.status} - ${errorText}`);
    }

    // Make.com typically returns "Accepted" as plain text
    const result = await response.text();
    console.log('📬 Make.com response text:', result);
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

    // Provide user-friendly error messages
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Unable to connect to email service. Please check:\n1. Your internet connection\n2. Make.com scenario is ON\n3. Webhook URL is correct');
    }

    if (error.name === 'TypeError' && !error.message.includes('VITE_MAKE_WEBHOOK_URL')) {
      throw new Error('Network error: Cannot reach Make.com. The webhook might be blocked by your browser or firewall.');
    }

    throw error;
  }
};

/**
 * Create blast campaign record in database
 * @param {Object} campaignData - Campaign details
 * @returns {Promise} - Created campaign record
 */
export const createBlastCampaign = async (campaignData) => {
  console.log('📝 Creating blast campaign...');
  
  // TEMPORARY: Generate campaign ID without backend
  const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const mockCampaign = {
    id: campaignId,
    ...campaignData,
    status: 'pending',
    created_at: new Date().toISOString()
  };
  
  console.log('✅ Campaign created (mock):', mockCampaign);
  
  return mockCampaign;
};

/**
 * Get blast campaign analytics
 * @param {string} campaignId - Campaign ID
 * @returns {Promise} - Campaign analytics data
 */
export const getBlastAnalytics = async (campaignId) => {
  console.log('📊 Fetching analytics for campaign:', campaignId);
  
  // TEMPORARY: Return mock analytics
  const mockAnalytics = {
    campaign_id: campaignId,
    total_sent: 0,
    total_opened: 0,
    total_clicked: 0,
    status: 'pending'
  };
  
  console.log('✅ Analytics fetched (mock):', mockAnalytics);
  
  return mockAnalytics;
};

/**
 * Test Make.com webhook connection
 * @returns {Promise} - Test result
 */
export const testWebhookConnection = async () => {
  try {
    console.log('🧪 Testing webhook connection...');
    console.log('🔗 Testing URL:', MAKE_WEBHOOK_URL);

    const testData = {
      test: true,
      message: 'Test from ResumeBlast',
      timestamp: new Date().toISOString(),
      candidate_name: 'Test User',
      candidate_email: 'user@test.com',
      candidate_phone: '1234567890',
      job_role: 'Software Engineer',
      years_experience: '5',
      key_skills: 'Testing, Debugging',
      education_level: "Bachelor's Degree",
      location: 'Remote',
      linkedin_url: 'https://linkedin.com/test',
      resume_url: 'https://example.com/test-resume.pdf',
      recipients: [
        {
          email: 'test@example.com',
          name: 'Test Recruiter',
          company: 'Test Company'
        }
      ]
    };

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
        message: 'Webhook connection successful',
        response: responseText
      };
    } else {
      return { 
        success: false, 
        status: response.status,
        error: responseText
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