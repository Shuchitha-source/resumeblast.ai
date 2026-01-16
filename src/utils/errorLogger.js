import { supabase } from '../lib/supabase'

export const logError = async (errorDetails) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    const errorLog = {
      user_id: user?.id || 'anonymous',
      error_type: errorDetails.type || 'general_error',
      error_message: errorDetails.message || 'Unknown error',
      error_stack: errorDetails.stack || null,
      function_name: errorDetails.functionName || 'unknown',
      component: errorDetails.component || 'unknown',
      context: errorDetails.context || {},
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      app_version: '1.0.0-mvp',
      environment: import.meta.env.MODE || 'development'
    }

    console.log('📝 Logging error to Supabase:', errorLog.error_type)

    const { data, error } = await supabase
      .from('error_logs')
      .insert(errorLog)
      .select()

    if (error) {
      console.error('❌ Failed to log error:', error)
      return false
    }
    
    console.log('✅ Error logged successfully')
    return true
  } catch (err) {
    console.error('❌ Error logger failed:', err)
    return false
  }
}

export const logUserAction = async (actionDetails) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    console.log('📝 Logging user action:', actionDetails.type)

    const { data, error } = await supabase
      .from('user_actions')
      .insert({
        user_id: user?.id || 'anonymous',
        action_type: actionDetails.type,
        action_details: actionDetails.details || {},
        timestamp: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('❌ Failed to log action:', error)
      return false
    }
    
    console.log('✅ User action logged')
    return true
  } catch (err) {
    console.error('❌ Action logger failed:', err)
    return false
  }
}

export const testErrorLogging = async () => {
  console.log('🧪 Testing error logging system...')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  const testError = await logError({
    type: 'test_error',
    message: 'This is a test error from ResumeBlast.ai',
    functionName: 'testErrorLogging',
    component: 'ErrorLogger',
    context: { 
      test: true,
      timestamp: new Date().toISOString(),
      testType: 'manual_test_button'
    }
  })

  const testAction = await logUserAction({
    type: 'test_action',
    details: { 
      test: true,
      action: 'Testing error logging system',
      timestamp: new Date().toISOString()
    }
  })

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 Test Results:')
  console.log('  Error logging:', testError ? '✅ SUCCESS' : '❌ FAILED')
  console.log('  Action logging:', testAction ? '✅ SUCCESS' : '❌ FAILED')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  return { testError, testAction }
}
