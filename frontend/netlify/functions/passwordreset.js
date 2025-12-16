// /netlify/functions/reset-password.js
// Server-side password reset using Supabase Admin API

import { createClient } from '@supabase/supabase-js'

export async function handler(event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { email, newPassword } = JSON.parse(event.body)

    console.log('🔒 Password reset request for:', email)

    // Validate inputs
    if (!email || !newPassword) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email and new password are required' })
      }
    }

    if (newPassword.length < 6) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Password must be at least 6 characters' })
      }
    }

    // Create Supabase Admin client
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY, // Admin key - keep this secret!
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Step 1: Find user by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Error listing users:', listError)
      throw new Error('Failed to find user account')
    }

    const user = users.find(u => u.email === email)

    if (!user) {
      // For security, don't reveal that user doesn't exist
      // Return success anyway to prevent email enumeration
      console.log('⚠️ User not found, but returning success for security')
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true,
          message: 'If an account exists, password has been reset'
        })
      }
    }

    console.log('✅ User found:', user.id)

    // Step 2: Update user password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('❌ Error updating password:', updateError)
      throw new Error('Failed to update password')
    }

    console.log('✅ Password updated successfully for user:', user.id)

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        message: 'Password reset successful'
      })
    }

  } catch (error) {
    console.error('❌ Password reset error:', error)
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message || 'Password reset failed'
      })
    }
  }
}