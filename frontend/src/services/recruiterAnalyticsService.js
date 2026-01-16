// src/services/recruiterAnalyticsService.js - ENHANCED VERSION

import { supabase } from '../lib/supabase'

export const getRecruiterAnalytics = async (industry) => {
  try {
    console.log(`📊 Fetching analytics for industry: ${industry}`)

    // Fetch resumes with all_skills data
    const { data, error } = await supabase
      .from('resumes')
      .select('created_at, analysis_data, all_skills, total_skills_count, ats_score')
      .order('created_at', { ascending: false })
      .limit(100) 

    if (error) throw error

    // Process Data for charts and statistics
    const uploadsByDate = {}
    const skillCounts = {}
    let totalCandidates = 0
    let avgAtsScore = 0
    let totalAtsScores = 0
    let scoresCount = 0

    data.forEach(resume => {
      // Filter by Industry
      const resumeIndustry = resume.analysis_data?.recommended_industry || 'Unspecified'
      if (industry !== 'All' && !resumeIndustry.includes(industry)) return;

      totalCandidates++

      // ATS Score aggregation
      if (resume.ats_score) {
        totalAtsScores += resume.ats_score
        scoresCount++
      }

      // Date Grouping
      const date = new Date(resume.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      uploadsByDate[date] = (uploadsByDate[date] || 0) + 1

      // ✅ ENHANCED: Aggregate ALL skills from all_skills object
      const allSkills = resume.all_skills || {}
      const allSkillsArray = [
        ...(allSkills.technical_skills || []),
        ...(allSkills.soft_skills || []),
        ...(allSkills.tools_technologies || []),
        ...(allSkills.certifications || []),
        ...(allSkills.languages || [])
      ]

      allSkillsArray.forEach(skill => {
        if (skill && skill.trim()) {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1
        }
      })

      // Fallback to top_skills if all_skills is empty
      const topSkills = resume.analysis_data?.top_skills || []
      if (allSkillsArray.length === 0 && topSkills.length > 0) {
        topSkills.forEach(skill => {
          if (skill && skill.trim()) {
            skillCounts[skill] = (skillCounts[skill] || 0) + 1
          }
        })
      }
    })

    // Calculate average ATS score
    avgAtsScore = scoresCount > 0 ? Math.round(totalAtsScores / scoresCount) : 0

    // Format Date Data for Chart (last 7 days)
    const chartData = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      chartData.push({
        date: key,
        count: uploadsByDate[key] || 0
      })
    }

    // Format Skills Data (Top 20 for better visualization)
    const topSkills = Object.entries(skillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([name, count]) => ({ name, count }))

    console.log(`✅ Analytics processed:`)
    console.log(`   Total Candidates: ${totalCandidates}`)
    console.log(`   Avg ATS Score: ${avgAtsScore}`)
    console.log(`   Total Unique Skills: ${Object.keys(skillCounts).length}`)

    return {
      totalCandidates,
      avgAtsScore,
      chartData,
      topSkills,
      totalUniqueSkills: Object.keys(skillCounts).length
    }

  } catch (error) {
    console.error('❌ Analytics error:', error)
    return {
      totalCandidates: 0,
      avgAtsScore: 0,
      chartData: [],
      topSkills: [],
      totalUniqueSkills: 0
    }
  }
}

// ✅ ENHANCED: Search with ALL skills
export const searchCandidates = async (query) => {
  try {
    console.log(`🔍 Searching candidates for: ${query}`)
    
    if (!query) return []

    // Fetch broader dataset
    const { data, error } = await supabase
      .from('resumes')
      .select('*, all_skills, total_skills_count')
      .or(`extracted_text.ilike.%${query}%,detected_role.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error
    if (!data || data.length === 0) return []

    const searchLower = query.toLowerCase();

    // STRICT FILTERING with ALL skills
    const relevantResumes = data.filter(resume => {
      const role = (resume.detected_role || '').toLowerCase();
      const industry = (resume.analysis_data?.recommended_industry || '').toLowerCase();
      
      // Check in ALL skills categories
      const allSkills = resume.all_skills || {}
      const allSkillsArray = [
        ...(allSkills.technical_skills || []),
        ...(allSkills.soft_skills || []),
        ...(allSkills.tools_technologies || []),
        ...(allSkills.certifications || []),
        ...(allSkills.languages || [])
      ].map(s => s.toLowerCase());

      // Fallback to top_skills
      const topSkills = (resume.analysis_data?.top_skills || []).map(s => s.toLowerCase());
      const combinedSkills = [...allSkillsArray, ...topSkills];
      
      const matchesRole = role.includes(searchLower);
      const matchesIndustry = industry.includes(searchLower);
      const matchesSkills = combinedSkills.some(skill => skill.includes(searchLower));
      
      return matchesRole || matchesIndustry || matchesSkills;
    });

    // DEDUPLICATION: Latest resume per user + role
    const uniqueMap = new Map();

    relevantResumes.forEach(resume => {
      const userId = resume.user_id;
      const role = resume.detected_role || 'General';
      const uniqueKey = `${userId}_${role}`;

      if (!uniqueMap.has(uniqueKey)) {
        uniqueMap.set(uniqueKey, resume);
      }
    });

    console.log(`✅ Found ${uniqueMap.size} relevant candidates`)

    return Array.from(uniqueMap.values());

  } catch (error) {
    console.error('❌ Search error:', error)
    return []
  }
}

// ✅ NEW: Get detailed candidate profile with ALL skills
export const getCandidateDetail = async (resumeId) => {
  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .single()

    if (error) throw error

    // Format all skills for display
    const allSkills = data.all_skills || {}
    const skillCategories = []

    if (allSkills.technical_skills && allSkills.technical_skills.length > 0) {
      skillCategories.push({
        name: 'Technical Skills',
        icon: '💻',
        skills: allSkills.technical_skills
      })
    }

    if (allSkills.soft_skills && allSkills.soft_skills.length > 0) {
      skillCategories.push({
        name: 'Soft Skills',
        icon: '🤝',
        skills: allSkills.soft_skills
      })
    }

    if (allSkills.tools_technologies && allSkills.tools_technologies.length > 0) {
      skillCategories.push({
        name: 'Tools & Technologies',
        icon: '🛠️',
        skills: allSkills.tools_technologies
      })
    }

    if (allSkills.certifications && allSkills.certifications.length > 0) {
      skillCategories.push({
        name: 'Certifications',
        icon: '🏆',
        skills: allSkills.certifications
      })
    }

    if (allSkills.languages && allSkills.languages.length > 0) {
      skillCategories.push({
        name: 'Languages',
        icon: '🌍',
        skills: allSkills.languages
      })
    }

    return {
      ...data,
      skillCategories,
      totalSkillsCount: data.total_skills_count || 0
    }
  } catch (error) {
    console.error('❌ Error fetching candidate detail:', error)
    return null
  }
}