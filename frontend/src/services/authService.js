// frontend/src/services/authService.js
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Check if user email is blacklisted
 * Call this BEFORE allowing signup or login
 */
export const checkBlacklist = async (email) => {
  try {
    console.log('🔍 Checking blacklist for:', email);
    
    const response = await fetch(`${API_URL}/api/auth/check-blacklist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.toLowerCase() }),
    });

    const data = await response.json();

    if (data.is_blacklisted) {
      console.log('🚫 User is blacklisted:', email);
      return {
        allowed: false,
        reason: data.reason,
        message: data.message || 'Your account has been suspended. Please contact support@resumeblast.ai'
      };
    }

    console.log('✅ User not blacklisted, can proceed');
    return {
      allowed: true,
      message: 'Account is in good standing'
    };

  } catch (error) {
    console.error('❌ Error checking blacklist:', error);
    // On error, allow to proceed (fail open) but log the error
    return {
      allowed: true,
      error: error.message,
      message: 'Could not verify account status'
    };
  }
};

/**
 * Enhanced signup with blacklist check
 */
export const signUp = async (email, password, fullName) => {
  try {
    console.log('\n=== 📝 SIGNUP PROCESS STARTED ===');
    console.log('Email:', email);

    // STEP 1: Check blacklist FIRST
    console.log('Step 1: Checking blacklist...');
    const blacklistCheck = await checkBlacklist(email);

    if (!blacklistCheck.allowed) {
      console.log('🚫 Signup blocked - User is blacklisted');
      return {
        success: false,
        error: blacklistCheck.message,
        isBlacklisted: true
      };
    }

    console.log('✅ Blacklist check passed');

    // STEP 2: Proceed with Supabase signup
    console.log('Step 2: Creating Supabase account...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      console.error('❌ Signup error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }

    console.log('✅ Signup successful');
    console.log('=== ✅ SIGNUP PROCESS COMPLETE ===\n');

    return {
      success: true,
      user: data.user,
      session: data.session
    };

  } catch (error) {
    console.error('❌ Signup error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Enhanced login with blacklist check
 */
export const signIn = async (email, password) => {
  try {
    console.log('\n=== 🔐 LOGIN PROCESS STARTED ===');
    console.log('Email:', email);

    // STEP 1: Check blacklist FIRST
    console.log('Step 1: Checking blacklist...');
    const blacklistCheck = await checkBlacklist(email);

    if (!blacklistCheck.allowed) {
      console.log('🚫 Login blocked - User is blacklisted');
      return {
        success: false,
        error: blacklistCheck.message,
        isBlacklisted: true
      };
    }

    console.log('✅ Blacklist check passed');

    // STEP 2: Proceed with Supabase login
    console.log('Step 2: Authenticating with Supabase...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Login error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }

    console.log('✅ Login successful');
    console.log('=== ✅ LOGIN PROCESS COMPLETE ===\n');

    return {
      success: true,
      user: data.user,
      session: data.session
    };

  } catch (error) {
    console.error('❌ Login error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Check auth status including blacklist
 */
export const checkAuthStatus = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        authenticated: false,
        user: null
      };
    }

    // Check if user is blacklisted
    const blacklistCheck = await checkBlacklist(user.email);

    if (!blacklistCheck.allowed) {
      // User is blacklisted, sign them out
      await supabase.auth.signOut();
      
      return {
        authenticated: false,
        user: null,
        isBlacklisted: true,
        message: blacklistCheck.message
      };
    }

    return {
      authenticated: true,
      user: user,
      isBlacklisted: false
    };

  } catch (error) {
    console.error('Error checking auth status:', error);
    return {
      authenticated: false,
      user: null,
      error: error.message
    };
  }
};

/**
 * Sign out
 */
export const signOut = async () => {
  try {
    await supabase.auth.signOut();
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    return {
      success: false,
      error: error.message
    };
  }
};