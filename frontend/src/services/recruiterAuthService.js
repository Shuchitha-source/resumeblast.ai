import { supabase } from '../lib/supabase'

// Helper to hash password (client-side for this demo)
const hashPassword = async (password) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * 1. Check if email exists in 'recruiters' table
 */
export const checkRecruiterExists = async (email) => {
  try {
    const { data, error } = await supabase
      .from('recruiters')
      .select('id, email')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle()

    if (error) throw error
    return { exists: !!data, recruiter: data }
  } catch (error) {
    console.error('Check failed:', error)
    return { exists: false, error: error.message }
  }
}

/**
 * 2. Register NEW recruiter directly into 'recruiters' table
 */
export const registerRecruiter = async (email, password) => {
  try {
    const trimmedEmail = email.trim().toLowerCase()
    const passwordHash = await hashPassword(password)
    
    // Default values for new recruiter
    const newRecruiter = {
      email: trimmedEmail,
      password_hash: passwordHash,
      name: trimmedEmail.split('@')[0], // Placeholder name
      company: 'Pending Company',       // Placeholder company
      industry: 'Technology',
      is_active: true,
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('recruiters')
      .insert(newRecruiter)
      .select()
      .single()

    if (error) {
        if (error.code === '23505') throw new Error('Email already exists')
        throw error
    }

    return { success: true, recruiter: data }
  } catch (error) {
    console.error('Registration failed:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 3. Login existing recruiter
 */
export const loginRecruiter = async (email, password) => {
  try {
    const passwordHash = await hashPassword(password)
    
    const { data, error } = await supabase
      .from('recruiters')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .eq('password_hash', passwordHash)
      .maybeSingle()

    if (error) throw error
    if (!data) throw new Error('Invalid password')

    return { success: true, recruiter: data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}