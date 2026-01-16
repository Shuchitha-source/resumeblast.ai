import { supabase } from '../lib/supabase'

/**
 * Get user profile - Simple version with no retries
 */
export const getUserProfile = async (userId) => {
  try {
    console.log('📊 Fetching profile for:', userId)
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error fetching profile:', error)
      throw error
    }

    if (data) {
      console.log('✅ Profile found')
      return data
    }

    console.log('⚠️ No profile found')
    return null
  } catch (error) {
    console.error('❌ Exception:', error)
    return null
  }
}

/**
 * Create user profile - Force creation
 */
export const createUserProfile = async (userId, email, role = 'job_seeker') => {
  try {
    console.log('📝 Creating profile...')
    console.log('  User ID:', userId)
    console.log('  Email:', email)
    console.log('  Role:', role)

    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        email: email,
        role: role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Insert error:', error)
      
      // If already exists, just fetch it
      if (error.code === '23505') {
        console.log('⚠️ Profile exists, fetching...')
        return await getUserProfile(userId)
      }
      
      throw error
    }

    console.log('✅ Profile created successfully')
    return data
  } catch (error) {
    console.error('❌ Create profile failed:', error)
    throw error
  }
}

/**
 * Ensure profile exists - Simple version
 */
export const ensureUserProfile = async (userId, email, role = 'job_seeker') => {
  try {
    console.log('\n🔍 Ensuring profile exists...')
    
    // First check if exists
    let profile = await getUserProfile(userId)
    
    if (profile) {
      console.log('✅ Profile already exists')
      return profile
    }

    // Doesn't exist, create it
    console.log('📝 Profile missing, creating now...')
    profile = await createUserProfile(userId, email, role)
    
    if (!profile) {
      throw new Error('Failed to create profile')
    }

    console.log('✅ Profile ready\n')
    return profile
  } catch (error) {
    console.error('❌ Ensure profile failed:', error)
    throw error
  }
}

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    console.log('📝 Updating profile:', userId)

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    console.log('✅ Profile updated')
    return data
  } catch (error) {
    console.error('❌ Update failed:', error)
    throw error
  }
}