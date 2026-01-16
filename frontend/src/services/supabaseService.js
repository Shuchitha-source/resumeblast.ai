import { supabase } from '../lib/supabase'

export const saveOptimizedResume = async (resumeId, optimizationData) => {
  try {
    const { data, error } = await supabase
      .from('resumes')
      .update({
        job_title: optimizationData.jobTitle,
        keywords_matched: optimizationData.keywordsMatched,
        optimized_text: optimizationData.optimizedText,
        optimization_timestamp: new Date().toISOString(),
        keyword_count: (
          optimizationData.keywordsMatched.technical.length +
          optimizationData.keywordsMatched.ats.length
        )
      })
      .eq('id', resumeId)
      .select()
      .single();

    if (error) throw error;

    // Also save to optimization history
    await saveToOptimizationHistory(resumeId, optimizationData);

    return data;
  } catch (error) {
    console.error('Error saving optimized resume:', error);
    
    // Log to Supabase for debugging
    await logError('saveOptimizedResume', error.message, { resumeId, optimizationData });
    
    throw error;
  }
};

export const saveToOptimizationHistory = async (resumeId, optimizationData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('optimization_history')
      .insert({
        resume_id: resumeId,
        user_id: user.id,
        job_title: optimizationData.jobTitle,
        keywords_injected: optimizationData.keywordsMatched,
        optimized_text: optimizationData.optimizedText
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving to optimization history:', error);
    throw error;
  }
};

export const getOptimizationHistory = async (resumeId) => {
  try {
    const { data, error } = await supabase
      .from('optimization_history')
      .select('*')
      .eq('resume_id', resumeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching optimization history:', error);
    return [];
  }
};

// Error logging function
export const logError = async (functionName, errorMessage, context = {}) => {
  try {
    await supabase
      .from('error_logs')
      .insert({
        function_name: functionName,
        error_message: errorMessage,
        context: context,
        timestamp: new Date().toISOString()
      });
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
};
// ... existing imports ...

/**
 * Fetch recruiters from Supabase based on industry and count
 */
export const fetchRecruiters = async (industry, limit = 5) => {
  try {
    console.log(`🔍 Fetching ${limit} recruiters for industry: ${industry}`);
    
    // Start building the query
    let query = supabase
      .from('recruiters') // Ensure your table name is 'recruiters'
      .select('email, name, company, industry, location, seniority_level')
      .limit(limit);

    // Apply industry filter if it's not "All"
    // Using ilike for case-insensitive matching (e.g., "Technology" matches "technology")
    if (industry && industry !== 'All') {
      query = query.ilike('industry', `%${industry}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    console.log(`✅ Successfully fetched ${data?.length || 0} recruiters`);
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching recruiters:', error.message);
    throw error;
  }
};