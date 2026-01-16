// /src/services/brevoEmailService.js
// Brevo SMTP Service for Verification Codes (Separate from Resume Blast)

const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY
const BREVO_SENDER_EMAIL = import.meta.env.VITE_BREVO_SENDER_EMAIL || 'noreply@resumeblast.ai'
const BREVO_SENDER_NAME = import.meta.env.VITE_BREVO_SENDER_NAME || 'ResumeBlast.ai'

console.log('🔧 brevoEmailService.js loaded')
console.log('📧 Brevo Email Service configured:', BREVO_API_KEY ? '✅ API Key Set' : '❌ Missing API Key')

/**
 * Generate a 6-digit verification code
 */
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Send verification code email via Brevo SMTP API
 * This is separate from the resume blast functionality
 */
export const sendVerificationEmail = async (recipientEmail, verificationCode) => {
  try {
    console.log('')
    console.log('=== 📧 SENDING VERIFICATION EMAIL ===')
    console.log('📤 To:', recipientEmail)
    console.log('🔐 Code:', verificationCode)

    // Validate API key
    if (!BREVO_API_KEY) {
      throw new Error(
        '❌ Brevo API Key not configured!\n\n' +
        'Please add to .env file:\n' +
        'VITE_BREVO_API_KEY=your_brevo_api_key_here'
      )
    }

    // Prepare email payload
    const emailPayload = {
      sender: {
        name: BREVO_SENDER_NAME,
        email: BREVO_SENDER_EMAIL
      },
      to: [
        {
          email: recipientEmail,
          name: recipientEmail.split('@')[0]
        }
      ],
      subject: 'Password Reset Verification Code - ResumeBlast.ai',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #f9fafb;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 40px 20px; text-align: center;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">
                        🔐 Password Reset
                      </h1>
                      <p style="color: #FEE2E2; margin: 10px 0 0 0; font-size: 16px;">
                        Verify your identity to continue
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 50px 40px;">
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hello,
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        You requested to reset your password for your <strong>ResumeBlast.ai</strong> account. 
                        Use the verification code below to complete the process:
                      </p>
                      
                      <!-- Verification Code Box -->
                      <div style="background-color: #FEE2E2; border: 3px solid #DC2626; border-radius: 12px; padding: 40px; text-align: center; margin: 30px 0;">
                        <p style="color: #991B1B; font-size: 14px; font-weight: 600; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 2px;">
                          Your Verification Code
                        </p>
                        <p style="color: #DC2626; font-size: 48px; font-weight: 900; margin: 0; letter-spacing: 12px; font-family: 'Courier New', monospace;">
                          ${verificationCode}
                        </p>
                      </div>
                      
                      <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 30px 0; border-radius: 6px;">
                        <p style="color: #92400E; font-size: 14px; margin: 0; line-height: 1.6;">
                          ⏱️ <strong>Important:</strong> This code expires in <strong>10 minutes</strong>
                        </p>
                      </div>
                      
                      <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                        If you didn't request this password reset, please ignore this email or contact our support team if you have concerns.
                      </p>
                      
                      <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #E5E7EB;">
                        <p style="color: #9CA3AF; font-size: 13px; margin: 0; line-height: 1.6;">
                          For security reasons, never share this code with anyone. Our team will never ask for your verification code.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #F3F4F6; padding: 30px 40px; text-align: center; border-radius: 0 0 12px 12px;">
                      <div style="margin-bottom: 15px;">
                        <span style="font-size: 24px;">🚀</span>
                      </div>
                      <p style="color: #6B7280; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">
                        ResumeBlast.ai
                      </p>
                      <p style="color: #9CA3AF; font-size: 13px; margin: 0 0 15px 0;">
                        AI-Powered Resume Distribution
                      </p>
                      <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
                        © 2025 ResumeBlast.ai. All rights reserved.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    }

    console.log('📡 Sending request to Brevo API...')

    // Send via Brevo API (v3/smtp/email)
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    })

    console.log('📊 Response status:', response.status)
    console.log('📊 Response ok:', response.ok)

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Brevo API error:', errorData)
      
      let errorMessage = 'Failed to send verification email'
      
      switch (response.status) {
        case 400:
          errorMessage = 'Invalid email format or missing required fields'
          break
        case 401:
          errorMessage = 'Invalid Brevo API key - please check your .env file'
          break
        case 402:
          errorMessage = 'Brevo account limit reached - please check your Brevo dashboard'
          break
        default:
          errorMessage = errorData.message || `Brevo API error (${response.status})`
      }
      
      throw new Error(errorMessage)
    }

    const result = await response.json()
    console.log('✅ Verification email sent successfully!')
    console.log('📬 Message ID:', result.messageId)
    console.log('=== ✅ EMAIL SEND COMPLETE ===')
    console.log('')
    
    return {
      success: true,
      messageId: result.messageId,
      recipient: recipientEmail
    }

  } catch (error) {
    console.log('')
    console.error('=== ❌ ERROR SENDING VERIFICATION EMAIL ===')
    console.error('Error type:', error.name)
    console.error('Error message:', error.message)
    console.log('')
    
    // Enhanced error messages
    if (error.message.includes('Failed to fetch')) {
      throw new Error(
        '❌ Network Error\n\n' +
        'Cannot reach Brevo API. Please check:\n' +
        '1. Your internet connection\n' +
        '2. Brevo service status\n' +
        '3. Firewall settings'
      )
    }
    
    throw error
  }
}

/**
 * Test Brevo SMTP connection
 */
export const testBrevoConnection = async () => {
  try {
    console.log('🧪 Testing Brevo SMTP connection...')
    
    if (!BREVO_API_KEY) {
      return {
        success: false,
        error: 'Brevo API Key not configured in .env file'
      }
    }

    const testPayload = {
      sender: {
        name: BREVO_SENDER_NAME,
        email: BREVO_SENDER_EMAIL
      },
      to: [
        {
          email: 'test@example.com',
          name: 'Test User'
        }
      ],
      subject: 'Test Connection from ResumeBlast.ai',
      htmlContent: '<html><body><h1>Test Email</h1></body></html>'
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    })

    const responseText = await response.text()
    console.log('✅ Test response status:', response.status)
    console.log('✅ Test response:', responseText)

    return {
      success: response.ok,
      status: response.status,
      message: response.ok ? 'Brevo SMTP connection successful! ✅' : 'Connection failed',
      response: responseText
    }
  } catch (error) {
    console.error('❌ Test failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}