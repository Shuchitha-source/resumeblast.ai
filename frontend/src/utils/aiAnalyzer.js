// src/utils/aiAnalyzer.js - ENHANCED VERSION

/**
 * Helper: Extract basic info locally using Regex if Backend fails
 */
const extractLocalData = (text) => {
  if (!text) return {};
  const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  
  return {
    candidate_email: (text.match(emailRegex) || [])[0] || "Not Found",
    candidate_phone: (text.match(phoneRegex) || [])[0] || "Not Found",
    candidate_name: "Candidate", 
    education_summary: "Not Specified"
  };
};

/**
 * Main function to analyze resume for blast
 * Sends resume to backend for comprehensive AI analysis
 */
export const analyzeResumeForBlast = async (resumeText) => {
  const localData = extractLocalData(resumeText);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  try {
    console.log('🤖 Sending resume to AI backend for comprehensive analysis...');
    console.log(`📄 Resume length: ${resumeText.length} characters`);
    
    // Call Python backend for AI analysis
    const response = await fetch(`${API_URL}/api/analyze-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ resume_text: resumeText })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Backend API Error: ${response.status}`, errorText);
      throw new Error(`Backend analysis failed: ${response.status}`);
    }

    const aiResult = await response.json();
    console.log('✅ Comprehensive AI Analysis received');
    console.log(`📊 ATS Score: ${aiResult.ats_score}/100`);
    console.log(`🔧 Total Skills Found: ${aiResult.total_skills_count || 'N/A'}`);
    
    // Validate and merge with fallbacks
    const finalResult = {
      // Basic Info
      candidate_name: aiResult.candidate_name || localData.candidate_name,
      candidate_email: (aiResult.candidate_email && aiResult.candidate_email !== 'Not Found') 
        ? aiResult.candidate_email 
        : localData.candidate_email,
      candidate_phone: (aiResult.candidate_phone && aiResult.candidate_phone !== 'Not Found')
        ? aiResult.candidate_phone
        : localData.candidate_phone,
      location: aiResult.location || "Not Specified",
      linkedin_url: aiResult.linkedin_url || "",
      
      // Career Info
      detected_role: aiResult.detected_role || "General Professional",
      seniority_level: aiResult.seniority_level || "Mid-Level",
      years_of_experience: aiResult.years_of_experience || 0,
      total_experience: aiResult.years_of_experience 
        ? `${aiResult.years_of_experience} Years` 
        : "Experience Varies",
      recommended_industry: aiResult.recommended_industry || "Technology",
      education_summary: aiResult.education_summary || "Not Specified",
      
      // Skills - COMPREHENSIVE
      all_skills: aiResult.all_skills || {
        technical_skills: [],
        soft_skills: [],
        tools_technologies: [],
        certifications: [],
        languages: []
      },
      top_skills: aiResult.top_skills || ["Analysis Pending"],
      total_skills_count: aiResult.total_skills_count || 0,
      
      // Experience & Achievements
      work_experience_summary: aiResult.work_experience_summary || "",
      key_achievements: aiResult.key_achievements || [],
      
      // ATS Score
      ats_score: aiResult.ats_score || 75,
      score_breakdown: aiResult.score_breakdown || {},
      
      // Recommendation
      blast_recommendation: aiResult.blast_recommendation || "Resume analyzed and ready for distribution"
    };

    console.log('✅ Analysis complete and formatted for UI');
    return finalResult;

  } catch (error) {
    console.warn('⚠️ API Call Failed, using local extraction fallback', error);
    
    // Comprehensive Fallback Data
    return {
      // Basic Info
      candidate_name: localData.candidate_name,
      candidate_email: localData.candidate_email,
      candidate_phone: localData.candidate_phone,
      location: "Not Specified",
      linkedin_url: "",
      
      // Career Info
      detected_role: "Professional",
      seniority_level: "Mid-Level",
      years_of_experience: 3,
      total_experience: "3+ Years",
      recommended_industry: "Technology",
      education_summary: localData.education_summary,
      
      // Skills - Empty but structured
      all_skills: {
        technical_skills: ["Analysis Failed - Please Review Resume"],
        soft_skills: [],
        tools_technologies: [],
        certifications: [],
        languages: []
      },
      top_skills: ["Analysis Pending", "Upload Again"],
      total_skills_count: 1,
      
      // Experience
      work_experience_summary: "Analysis failed - manual review recommended",
      key_achievements: [],
      
      // ATS Score
      ats_score: 70,
      score_breakdown: {
        contact_info: 14,
        skills: 5,
        experience: 15,
        education: 7,
        keywords: 10
      },
      
      // Recommendation
      blast_recommendation: "Basic analysis complete. Contact info detected. Manual review recommended for best results."
    };
  }
};

/**
 * Format skills for display
 * Converts all_skills object into flat array for display
 */
export const formatAllSkillsForDisplay = (allSkills) => {
  if (!allSkills) return [];
  
  const allSkillsFlat = [
    ...(allSkills.technical_skills || []),
    ...(allSkills.soft_skills || []),
    ...(allSkills.tools_technologies || []),
    ...(allSkills.certifications || []),
    ...(allSkills.languages || [])
  ];
  
  return allSkillsFlat;
};

/**
 * Get skills by category
 */
export const getSkillsByCategory = (allSkills) => {
  if (!allSkills) return [];
  
  const categories = [];
  
  if (allSkills.technical_skills && allSkills.technical_skills.length > 0) {
    categories.push({
      name: 'Technical Skills',
      skills: allSkills.technical_skills,
      icon: '💻'
    });
  }
  
  if (allSkills.soft_skills && allSkills.soft_skills.length > 0) {
    categories.push({
      name: 'Soft Skills',
      skills: allSkills.soft_skills,
      icon: '🤝'
    });
  }
  
  if (allSkills.tools_technologies && allSkills.tools_technologies.length > 0) {
    categories.push({
      name: 'Tools & Technologies',
      skills: allSkills.tools_technologies,
      icon: '🛠️'
    });
  }
  
  if (allSkills.certifications && allSkills.certifications.length > 0) {
    categories.push({
      name: 'Certifications',
      skills: allSkills.certifications,
      icon: '🏆'
    });
  }
  
  if (allSkills.languages && allSkills.languages.length > 0) {
    categories.push({
      name: 'Languages',
      skills: allSkills.languages,
      icon: '🌍'
    });
  }
  
  return categories;
};

/**
 * Get ATS score color based on score value
 */
export const getATSScoreColor = (score) => {
  if (score >= 80) return '#059669'; // Green
  if (score >= 60) return '#D97706'; // Orange
  return '#DC2626'; // Red
};

/**
 * Get ATS score rating text
 */
export const getATSScoreRating = (score) => {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Needs Improvement';
};