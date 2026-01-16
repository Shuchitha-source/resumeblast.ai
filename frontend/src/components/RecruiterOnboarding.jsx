import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getRecruiterAnalytics, searchCandidates } from '../services/recruiterAnalyticsService'
import RecruiterDisclaimerModal from './RecruiterDisclaimerModal'
import './ResumeBuilder.css' 

function RecruiterOnboarding({ user, onComplete }) {
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [profileExists, setProfileExists] = useState(false)
  const [analytics, setAnalytics] = useState(null)
  
  // Search States
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [pendingSearchResults, setPendingSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [showResultsCount, setShowResultsCount] = useState(false) // NEW: Show count first
  
  // Disclaimer States
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)

  // Initialize form with data
  const [formData, setFormData] = useState({
    email: user?.email || '',
    name: user?.name || '', 
    company: user?.company || '', 
    industry: user?.industry || 'Technology',
    location: user?.location || '',
    specialty: user?.specialty || '',
    seniority_level: user?.seniority_level || 'Mid-Senior'
  })

  // Load Profile & Analytics
  useEffect(() => {
    const initData = async () => {
      try {
        if (!user?.id) return;

        // 1. Fetch Profile
        const { data } = await supabase
          .from('recruiters')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (data) {
          setFormData({
            email: data.email || user.email || '',
            name: data.name || '',
            company: data.company || '',
            industry: data.industry || 'Technology',
            location: data.location || '',
            specialty: data.specialty || '',
            seniority_level: data.seniority_level || 'Mid-Senior'
          })
          
          if (data.company && data.company !== 'Unknown') {
            setProfileExists(true)
            // 2. Fetch Analytics
            const stats = await getRecruiterAnalytics(data.industry)
            setAnalytics(stats)
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }
    
    initData()
  }, [user.id, user.email])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage('')

    try {
      const updates = { ...formData, updated_at: new Date().toISOString() }
      
      const { error } = await supabase
        .from('recruiters')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      setMessage('✅ Profile saved successfully!')
      setProfileExists(true)
      const stats = await getRecruiterAnalytics(formData.industry)
      setAnalytics(stats)

    } catch (error) {
      console.error('❌ Error saving profile:', error)
      setMessage('❌ Failed to save profile: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Search Logic - Show count first
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(false);
    setShowResultsCount(false);
    setSearchResults([]);
    setPendingSearchResults([]);

    try {
      const results = await searchCandidates(searchQuery);
      
      if (results && results.length > 0) {
        // Store results and show count
        setPendingSearchResults(results);
        setShowResultsCount(true);
        setHasSearched(true);
      } else {
        // No results found
        setHasSearched(true);
        setShowResultsCount(false);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setHasSearched(true);
      setShowResultsCount(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle View Further Button Click
  const handleViewFurther = () => {
    setShowDisclaimer(true);
  };

  // Handle Disclaimer Accept
  const handleDisclaimerAccept = () => {
    setDisclaimerAccepted(true);
    setShowDisclaimer(false);
    setSearchResults(pendingSearchResults); // Now show the actual resumes
    setShowResultsCount(false); // Hide the count view
  };

  // Handle Disclaimer Decline
  const handleDisclaimerDecline = () => {
    setShowDisclaimer(false);
    // Keep the count visible, don't clear anything
  };

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) return <div className="spinner"></div>

  // ==========================================
  // VIEW 1: RECRUITER DASHBOARD
  // ==========================================
  if (profileExists) {
      return (
        <div className="container" style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
            
            {/* HEADER */}
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px'}}>
                <div>
                    <h2 style={{fontSize: '28px', marginBottom: '5px'}}>👋 Welcome back, {formData.name}!</h2>
                    <p style={{color: '#666'}}>
                        Recruiting for <strong>{formData.company}</strong> • {formData.industry === 'All' ? 'All Industries' : formData.industry}
                    </p>
                </div>
                
                <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                    <button className="btn-outline" onClick={() => setProfileExists(false)}>⚙️ Edit Profile</button>
                    <button className="btn-outline" onClick={handleLogout} style={{borderColor: '#DC2626', color: '#DC2626'}}>🚪 Sign Out</button>
                </div>
            </div>

            {/* ANALYTICS GRID */}
            {analytics ? (
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px'}}>
                <div className="card">
                    <h3 style={{fontSize: '16px', color: '#6b7280', marginBottom: '10px'}}>Total Available Candidates</h3>
                    <div style={{fontSize: '42px', fontWeight: '800', color: '#DC2626'}}>
                        {analytics.totalCandidates}
                    </div>
                </div>
                <div className="card">
                    <h3 style={{fontSize: '16px', color: '#6b7280', marginBottom: '15px'}}>Trending Skills</h3>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
                        {analytics.topSkills.map((skill, i) => (
                            <span key={i} style={{
                                background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECaca',
                                padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500'
                            }}>
                                {skill.name} ({skill.count})
                            </span>
                        ))}
                        {analytics.topSkills.length === 0 && <span style={{color:'#999'}}>No data yet.</span>}
                    </div>
                </div>
              </div>
            ) : <div className="spinner"></div>}

            {/* SEARCH SECTION */}
            <div style={{
                background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '30px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{textAlign: 'center', marginBottom: '25px'}}>
                    <h3 style={{fontSize: '24px', marginBottom: '10px'}}>Find Your Next Hire</h3>
                    <p style={{color: '#6B7280'}}>Search our database for skills, job titles, or keywords.</p>
                </div>

                {/* SEARCH FORM */}
                <form onSubmit={handleSearch} style={{display: 'flex', gap: '10px', maxWidth: '600px', margin: '0 auto 30px', width: '100%', flexWrap: 'wrap'}}>
                    <input 
                        type="text" 
                        placeholder="e.g. React, Manager, Sales..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            flex: 1, minWidth: '200px', padding: '14px', fontSize: '16px', 
                            borderRadius: '8px', border: '2px solid #E5E7EB', outline: 'none'
                        }}
                    />
                    <button 
                        type="submit" 
                        disabled={isSearching}
                        style={{
                            padding: '0 30px', background: '#DC2626', color: 'white', border: 'none', 
                            borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap'
                        }}
                    >
                        {isSearching ? '...' : 'Search'}
                    </button>
                </form>

                {/* RESULTS COUNT VIEW - Shows candidate count with "View Further" button */}
                {hasSearched && showResultsCount && pendingSearchResults.length > 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
                        borderRadius: '12px',
                        border: '2px solid #FCA5A5'
                    }}>
                        <div style={{
                            fontSize: '48px',
                            fontWeight: 'bold',
                            color: '#DC2626',
                            marginBottom: '15px'
                        }}>
                            {pendingSearchResults.length}
                        </div>
                        <p style={{
                            fontSize: '20px',
                            color: '#374151',
                            marginBottom: '25px',
                            fontWeight: '500'
                        }}>
                            {pendingSearchResults.length === 1 ? 'Candidate Found' : 'Candidates Found'}
                        </p>
                        <p style={{
                            color: '#6B7280',
                            marginBottom: '30px',
                            fontSize: '15px'
                        }}>
                            Click below to review the candidate profiles
                        </p>
                        <button
                            onClick={handleViewFurther}
                            style={{
                                padding: '16px 40px',
                                background: '#DC2626',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                boxShadow: '0 4px 6px rgba(220, 38, 38, 0.3)',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#B91C1C'}
                            onMouseOut={(e) => e.target.style.background = '#DC2626'}
                        >
                            View Further →
                        </button>
                    </div>
                )}

                {/* ACTUAL RESUME RESULTS - Shows after disclaimer acceptance */}
                {searchResults.length > 0 && (
                    <div className="search-results">
                        <div style={{display: 'grid', gap: '15px'}}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '10px',
                                padding: '15px',
                                background: '#F0FDF4',
                                borderRadius: '8px',
                                border: '1px solid #BBF7D0'
                            }}>
                                <h4 style={{margin: 0, color: '#166534', fontSize: '18px'}}>
                                    ✅ {searchResults.length} {searchResults.length === 1 ? 'Resume' : 'Resumes'} Available
                                </h4>
                            </div>
                            {searchResults.map((resume) => (
                                <div key={resume.id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                    padding: '20px', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #F3F4F6', flexWrap: 'wrap', gap: '15px'
                                }}>
                                    <div style={{flex: 1, minWidth: '200px'}}>
                                        <h4 style={{fontSize: '18px', margin: '0 0 5px 0', color: '#111827'}}>
                                            {resume.analysis_data?.candidate_name || 'Verified Candidate'}
                                        </h4>
                                        <div style={{display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap'}}>
                                            <span style={{background: '#DBEAFE', color: '#1E40AF', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold'}}>
                                                {resume.detected_role || 'General'}
                                            </span>
                                            <span style={{color: '#6B7280', fontSize: '14px'}}>
                                                {resume.analysis_data?.total_experience || 'Experience Not Listed'}
                                            </span>
                                        </div>
                                    </div>
                                    <a 
                                        href={resume.file_url} target="_blank" rel="noopener noreferrer"
                                        style={{
                                            textDecoration: 'none', padding: '10px 16px', fontSize: '14px',
                                            border: '1px solid #DC2626', color: '#DC2626', borderRadius: '6px', background: 'white',
                                            fontWeight: '500',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => {
                                            e.target.style.background = '#DC2626';
                                            e.target.style.color = 'white';
                                        }}
                                        onMouseOut={(e) => {
                                            e.target.style.background = 'white';
                                            e.target.style.color = '#DC2626';
                                        }}
                                    >
                                        📥 Download Resume
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* NO RESULTS FOUND */}
                {hasSearched && !showResultsCount && searchResults.length === 0 && pendingSearchResults.length === 0 && (
                    <div style={{textAlign: 'center', padding: '40px', color: '#6B7280', background: '#f9f9f9', borderRadius: '8px'}}>
                        <p style={{fontSize: '18px', marginBottom: '10px'}}>🤷‍♂️ No candidates found</p>
                        <p>Try searching for specific skills (e.g., "Python") or different keywords.</p>
                    </div>
                )}
            </div>

            {/* DISCLAIMER MODAL */}
            {showDisclaimer && (
              <RecruiterDisclaimerModal 
                recruiterId={user?.id} // ✅ ADDED THIS MISSING PROP
                onAccept={handleDisclaimerAccept}
                onDecline={handleDisclaimerDecline}
              />
            )}
        </div>
      )
  }

  // ==========================================
  // VIEW 2: EDIT PROFILE
  // ==========================================
  return (
    <div className="container" style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <div className="resume-builder">
        <h2 style={{textAlign: 'center'}}>🏢 Complete Your Profile</h2>
        <form onSubmit={handleSubmit} className="form-container">
            <div className="form-field"><label>Full Name</label><input name="name" value={formData.name} onChange={handleChange} required /></div>
            <div className="form-field"><label>Company</label><input name="company" value={formData.company} onChange={handleChange} required /></div>
            <div className="form-field"><label>Industry</label>
                <select name="industry" value={formData.industry} onChange={handleChange}>
                  <option value="Technology">Technology</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="All">All Industries</option>
                </select>
            </div>
            <div className="form-field"><label>Location</label><input name="location" value={formData.location} onChange={handleChange} required /></div>
            <button type="submit" className="generate-button" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Profile 💾'}</button>
        </form>
      </div>
    </div>
  )
}

export default RecruiterOnboarding