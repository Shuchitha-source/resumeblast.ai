// src/services/activityTrackingService.js
import { supabase } from '../lib/supabase'

console.log('📊 Activity Tracking Service Loaded (Fixed for One-Time Payment)')

// ========================================================================
// USER AUTHENTICATION TRACKING
// ========================================================================

export const trackUserLogin = async (userId, email, metadata = {}) => {
  try {
    console.log('📊 Tracking user login:', email)
    
    // 1. Log to user_activity table
    const { error: activityError } = await supabase
      .from('user_activity')
      .insert({
        user_id: userId,
        email: email,
        event_type: 'login',
        event_timestamp: new Date().toISOString(),
        metadata: metadata
      })

    if (activityError) {
      console.warn('⚠️ Activity insert warning:', activityError.message)
    }

    // 2. Update users table (Ensure row exists)
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('login_count')
      .eq('id', userId)
      .maybeSingle()

    if (existingUser) {
      await supabase
        .from('users')
        .update({ 
          last_login_at: new Date().toISOString(),
          login_count: (existingUser.login_count || 0) + 1
        })
        .eq('id', userId)
    } else {
      // If user doesn't exist in public.users, create now
      // REMOVED: subscription_tier
      console.log('👤 User missing in public table, creating now...')
      await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          last_login_at: new Date().toISOString(),
          login_count: 1,
          account_status: 'active'
        })
    }

    console.log('✅ Login tracked successfully')
    return { success: true }
  } catch (error) {
    console.error('❌ Error tracking login:', error)
    return { success: false, error: error.message }
  }
}

export const trackUserSignup = async (userId, email, metadata = {}) => {
  try {
    console.log('📊 Tracking user signup:', email)
    
    // Extract Name from metadata (passed from AuthModal)
    // If metadata.full_name is missing, fallback to part of email
    const fullName = metadata.full_name || email.split('@')[0];

    // 1. Insert into public.users table
    // REMOVED: subscription_tier
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: email,
        full_name: fullName, // ✅ Storing the name properly
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
        login_count: 1,
        account_status: 'active'
      }, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })

    if (userError) {
        console.error('❌ Failed to create user record:', userError)
        throw userError
    }

    // 2. Log activity
    await supabase
      .from('user_activity')
      .insert({
        user_id: userId,
        email: email,
        event_type: 'signup',
        event_timestamp: new Date().toISOString(),
        metadata: metadata
      })

    console.log('✅ Signup tracked successfully')
    return { success: true }
  } catch (error) {
    console.error('❌ Error tracking signup:', error)
    return { success: false, error: error.message }
  }
}

// ========================================================================
// RESUME UPLOAD TRACKING
// ========================================================================

export const trackResumeUpload = async (userId, resumeData) => {
  try {
    console.log('📊 Tracking resume upload for user:', userId)
    
    const uploadData = {
      user_id: userId,
      file_name: resumeData.file_name || resumeData.name || 'unknown.pdf',
      file_url: resumeData.file_url || resumeData.url || '',
      file_size: resumeData.file_size || resumeData.size || 0,
      file_type: resumeData.file_type || resumeData.type || 'pdf',
      extracted_text: resumeData.extracted_text || resumeData.text || '',
      status: 'uploaded',
      uploaded_at: new Date().toISOString(),
      metadata: {
        extraction_method: resumeData.extraction_method || 'auto',
        text_length: (resumeData.extracted_text || resumeData.text || '').length
      }
    }

    const { data: resumeRecord, error: resumeError } = await supabase
      .from('resumes')
      .insert(uploadData)
      .select()
      .single()

    if (resumeError) {
      console.error('❌ Resume insert failed:', resumeError)
      throw resumeError
    }

    console.log('✅ Resume inserted, ID:', resumeRecord.id)

    const { data: userData } = await supabase
      .from('users')
      .select('resume_count')
      .eq('id', userId)
      .maybeSingle()

    const currentCount = userData?.resume_count || 0

    await supabase
      .from('users')
      .update({ 
        resume_uploaded_at: new Date().toISOString(),
        resume_count: currentCount + 1
      })
      .eq('id', userId)

    await supabase
      .from('user_activity')
      .insert({
        user_id: userId,
        event_type: 'resume_upload',
        event_timestamp: new Date().toISOString(),
        metadata: {
          file_name: uploadData.file_name,
          resume_id: resumeRecord.id,
          file_size: uploadData.file_size
        }
      })

    console.log('✅ Resume upload tracked successfully')
    return { 
      success: true, 
      data: resumeRecord, 
      resume_id: resumeRecord.id 
    }
  } catch (error) {
    console.error('❌ Error tracking resume upload:', error)
    return { success: false, error: error.message }
  }
}

// ========================================================================
// RESUME ANALYSIS TRACKING
// ========================================================================

export const trackResumeAnalysis = async (userId, resumeId, analysisData) => {
  try {
    console.log('📊 Tracking comprehensive resume analysis:', resumeId)
    
    // Format all skills for storage
    const allSkillsFlat = [
      ...(analysisData.all_skills?.technical_skills || []),
      ...(analysisData.all_skills?.soft_skills || []),
      ...(analysisData.all_skills?.tools_technologies || []),
      ...(analysisData.all_skills?.certifications || []),
      ...(analysisData.all_skills?.languages || [])
    ];
    
    // Update resumes table with comprehensive data
    await supabase
      .from('resumes')
      .update({
        analysis_data: analysisData,
        analyzed_at: new Date().toISOString(),
        ats_score: analysisData.ats_score || null,
        detected_role: analysisData.detected_role || null,
        seniority_level: analysisData.seniority_level || null,
        years_experience: analysisData.years_of_experience || null,
        all_skills: analysisData.all_skills || {},
        total_skills_count: analysisData.total_skills_count || allSkillsFlat.length,
        status: 'analyzed'
      })
      .eq('id', resumeId)

    // Track activity with enhanced metadata
    await supabase
      .from('user_activity')
      .insert({
        user_id: userId,
        event_type: 'resume_analysis',
        event_timestamp: new Date().toISOString(),
        metadata: {
          resume_id: resumeId,
          ats_score: analysisData.ats_score,
          detected_role: analysisData.detected_role,
          total_skills_found: analysisData.total_skills_count || allSkillsFlat.length,
          score_breakdown: analysisData.score_breakdown
        }
      })

    console.log('✅ Comprehensive analysis tracked successfully')
    return { success: true }
  } catch (error) {
    console.error('❌ Error tracking analysis:', error)
    return { success: false, error: error.message }
  }
}

// ========================================================================
// PAYMENT TRACKING
// ========================================================================

export const trackPaymentInitiated = async (userId, email, amount) => {
  try {
    console.log('📊 Tracking payment initiation:', email, amount)
    
    await supabase
      .from('user_activity')
      .insert({
        user_id: userId,
        email: email,
        event_type: 'payment_initiated',
        event_timestamp: new Date().toISOString(),
        metadata: {
          amount: amount,
          currency: 'usd'
        }
      })

    console.log('✅ Payment initiation tracked')
    return { success: true }
  } catch (error) {
    console.error('❌ Error tracking payment:', error)
    return { success: false, error: error.message }
  }
}

export const trackPaymentSuccess = async (userId, sessionId, paymentData) => {
  try {
    console.log('📊 Tracking payment success:', sessionId)
    
    await supabase
      .from('user_activity')
      .insert({
        user_id: userId,
        event_type: 'payment_completed',
        event_timestamp: new Date().toISOString(),
        metadata: {
          session_id: sessionId,
          amount: paymentData.amount,
          currency: paymentData.currency || 'usd',
          payment_status: paymentData.payment_status
        }
      })

    // REMOVED: subscription_tier update
    await supabase
      .from('users')
      .update({
        updated_at: new Date().toISOString()
        // Removed subscription_tier: 'premium'
      })
      .eq('id', userId)

    console.log('✅ Payment success tracked')
    return { success: true }
  } catch (error) {
    console.error('❌ Error tracking payment success:', error)
    return { success: false, error: error.message }
  }
}

export const trackPaymentFailure = async (userId, errorMsg) => {
  try {
    await supabase
      .from('user_activity')
      .insert({
        user_id: userId,
        event_type: 'payment_failed',
        event_timestamp: new Date().toISOString(),
        metadata: { error: errorMsg }
      })

    return { success: true }
  } catch (error) {
    console.error('❌ Error tracking payment failure:', error)
    return { success: false, error: error.message }
  }
}

// ========================================================================
// BLAST CAMPAIGN TRACKING
// ========================================================================

export const trackBlastInitiated = async (userId, blastData) => {
  try {
    console.log('📊 Tracking blast initiation:', blastData)
    
    const { data: campaign, error: campaignError } = await supabase
      .from('blast_campaigns')
      .insert({
        user_id: userId,
        resume_id: blastData.resume_id,
        industry: blastData.industry,
        recipients_count: blastData.recipients_count,
        status: 'initiated',
        initiated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (campaignError) {
      console.error('❌ Campaign insert failed:', campaignError)
      throw campaignError
    }

    await supabase
      .from('user_activity')
      .insert({
        user_id: userId,
        event_type: 'blast_initiated',
        event_timestamp: new Date().toISOString(),
        metadata: {
          campaign_id: campaign.id,
          industry: blastData.industry,
          recipients_count: blastData.recipients_count
        }
      })

    console.log('✅ Blast initiation tracked, campaign ID:', campaign.id)
    return { success: true, campaign_id: campaign.id }
  } catch (error) {
    console.error('❌ Error tracking blast initiation:', error)
    return { success: false, error: error.message }
  }
}

export const trackBlastCompleted = async (userId, campaignId, result) => {
  try {
    console.log('📊 Tracking blast completion:', campaignId)
    
    await supabase
      .from('blast_campaigns')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        result_data: result
      })
      .eq('id', campaignId)

    await supabase
      .from('user_activity')
      .insert({
        user_id: userId,
        event_type: 'blast_completed',
        event_timestamp: new Date().toISOString(),
        metadata: { campaign_id: campaignId }
      })

    console.log('✅ Blast completion tracked')
    return { success: true }
  } catch (error) {
    console.error('❌ Error tracking blast completion:', error)
    return { success: false, error: error.message }
  }
}

export const trackBlastFailure = async (userId, campaignId, errorMessage) => {
  try {
    console.log('📊 Tracking blast failure:', campaignId)
    
    await supabase
      .from('blast_campaigns')
      .update({
        status: 'failed',
        failed_at: new Date().toISOString(),
        error_message: errorMessage
      })
      .eq('id', campaignId)

    await supabase
      .from('user_activity')
      .insert({
        user_id: userId,
        event_type: 'blast_failed',
        event_timestamp: new Date().toISOString(),
        metadata: { 
          campaign_id: campaignId,
          error: errorMessage 
        }
      })

    console.log('✅ Blast failure tracked')
    return { success: true }
  } catch (error) {
    console.error('❌ Error tracking blast failure:', error)
    return { success: false, error: error.message }
  }
}

// ========================================================================
// ANALYTICS & REPORTING
// ========================================================================

export const getUserActivitySummary = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_activity')
      .select('event_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    const summary = {}
    data.forEach(activity => {
      summary[activity.event_type] = (summary[activity.event_type] || 0) + 1
    })

    return { success: true, data: summary }
  } catch (error) {
    console.error('❌ Error fetching activity summary:', error)
    return { success: false, error: error.message }
  }
}

export const getRecentActivities = async (userId, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('user_activity')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('❌ Error fetching recent activities:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export default {
  trackUserLogin,
  trackUserSignup,
  trackResumeUpload,
  trackResumeAnalysis,
  trackPaymentInitiated,
  trackPaymentSuccess,
  trackPaymentFailure,
  trackBlastInitiated,
  trackBlastCompleted,
  trackBlastFailure,
  getUserActivitySummary,
  getRecentActivities
}