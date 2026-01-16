import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'

// Components
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LandingPage from './components/LandingPage'
import RecruiterLanding from './components/RecruiterLanding'
import RecruiterAuth from './components/RecruiterAuth' 
import RecruiterOnboarding from './components/RecruiterOnboarding' 
import ResumeUpload from './components/ResumeUpload'
import AuthModal from './components/AuthModal'
import ResumeAnalysis from './components/ResumeAnalysis'
import GoogleAnalytics from './components/GoogleAnalytics'
import PaymentSuccessHandler from './components/PaymentSuccessHandler'
import UserDashboard from './components/UserDashboard'
import AdminDashboard from './components/Admin/AdminDashboard'
import PaymentBlastTrigger from './components/PaymentBlastTrigger'
import ContactPage from './components/ContactPage' // ✅ ADD THIS IMPORT

import './App.css'
import usePageTracking from './hooks/usePageTracking'

function App() {
  usePageTracking()

  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  
  // viewMode states: 'jobseeker-home', 'dashboard', 'upload-workbench', 'recruiter', 'admin', 'contact'
  const [viewMode, setViewMode] = useState('jobseeker-home') 
  
  const [isRestoring, setIsRestoring] = useState(true) 
  const [paymentSuccess, setPaymentSuccess] = useState(false) 
  const [hasUploadedInSession, setHasUploadedInSession] = useState(false)

  // Track previous user to prevent loop
  const prevUserIdRef = useRef(null)

  const [resumeText, setResumeText] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')
  const [resumeId, setResumeId] = useState('')

  // ✅ IMPROVED: Simplified Admin Check
  // Uses hardcoded list instead of database query
  const checkAdminStatus = (email) => {
    if (!email) return false
    
    // List of admin emails
    const adminEmails = [
      'admin@resumeblast.ai',
      'shuchitharamesh71@gmail.com',
      // Add more admin emails here as needed
    ]
    
    const isAdminUser = adminEmails.includes(email.toLowerCase())
    console.log(`🔍 Admin Check: ${email} → ${isAdminUser ? '✅ ADMIN' : '❌ NOT ADMIN'}`)
    return isAdminUser
  }

  // 1. INITIALIZATION
  useEffect(() => {
    const initSession = async () => {
      console.log('📄 Initializing session...')
      try {
        const params = new URLSearchParams(window.location.search)
        const isPaymentReturn = params.get('payment') === 'success'
        
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          console.log('👤 User found in session:', session.user.email)
          setUser(session.user)
          prevUserIdRef.current = session.user.id
          
          // ✅ FIXED: Synchronous admin check
          const adminStatus = checkAdminStatus(session.user.email)
          setIsAdmin(adminStatus)
          
          // ✅ Routing Logic
          if (isPaymentReturn) {
            setPaymentSuccess(true)
            setHasUploadedInSession(true)
            setViewMode('upload-workbench') 
            
            const savedResumeData = localStorage.getItem('pending_blast_resume_data')
            if (savedResumeData) {
               try {
                 const parsed = JSON.parse(savedResumeData)
                 if (parsed.id) setResumeId(parsed.id)
                 if (parsed.url) setResumeUrl(parsed.url)
               } catch (e) { console.error(e) }
            }
          } else if (adminStatus) {
            // ✅ AUTO-REDIRECT ADMINS TO ADMIN PANEL
            console.log('🛡️ Admin detected - redirecting to admin panel')
            setViewMode('admin')
          } else if (session.user.user_metadata?.role === 'recruiter') {
            setViewMode('recruiter')
          } else {
            // Default to dashboard for regular users
            setViewMode('dashboard')
          }
        } else {
          setViewMode('jobseeker-home')
        }
      } catch (error) {
        console.error('❌ Session init error:', error)
      } finally {
        // ✅ CRITICAL: This ensures spinner always disappears
        console.log('🏁 Session initialization complete')
        setIsRestoring(false) 
      }
    }

    initSession()

    // 2. LISTEN FOR LOGIN/LOGOUT EVENTS
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔔 Auth event: ${event}`)
      
      if (event === 'SIGNED_IN' && session?.user) {
         // Prevent re-running logic if it's just a token refresh
         if (prevUserIdRef.current === session.user.id) {
             return 
         }
         
         prevUserIdRef.current = session.user.id
         setUser(session.user)
         
         // ✅ FIXED: Synchronous admin check
         const adminStatus = checkAdminStatus(session.user.email)
         setIsAdmin(adminStatus)

         // ✅ IMPROVED: Better routing logic
         if (adminStatus) {
             console.log('🛡️ Admin logged in - showing admin panel')
             setViewMode('admin')
         } else {
             const role = session?.user?.user_metadata?.role
             if (role === 'recruiter') {
                 setViewMode('recruiter')
             } else {
                 setViewMode('upload-workbench')
             }
         }

      } else if (event === 'SIGNED_OUT') {
         prevUserIdRef.current = null
         setUser(null)
         setIsAdmin(false)
         setViewMode('jobseeker-home')
         setHasUploadedInSession(false)
      }
    })

    return () => subscription.unsubscribe()
  }, []) 

  const handleStartBlast = () => {
    setHasUploadedInSession(false)
    setResumeText('')
    setResumeUrl('')
    setResumeId('')
    setViewMode('upload-workbench')
  }

  const handleViewChange = (view) => {
    console.log(`🔄 View change requested: ${view}`)
    window.scrollTo(0, 0)
    
    switch(view) {
      case 'home':
        setViewMode(user ? 'upload-workbench' : 'jobseeker-home')
        break
      case 'recruiter':
        setViewMode('recruiter')
        break
      case 'dashboard':
        setViewMode('dashboard') 
        break
      case 'contact': // ✅ ADD CONTACT CASE
        setViewMode('contact')
        break
      case 'admin':
        if (isAdmin) {
          console.log('✅ Admin access granted')
          setViewMode('admin')
        } else {
          console.warn('❌ Unauthorized admin access attempt')
          alert('You do not have admin privileges')
        }
        break
      case 'how-it-works':
      case 'pricing':
        setViewMode('jobseeker-home')
        setTimeout(() => {
          document.getElementById(view)?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
        break
      default:
        break
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
    setHasUploadedInSession(false)
    setViewMode('jobseeker-home')
    window.location.href = '/'
  }

  const renderContent = () => {
    // Show spinner only while restoring session
    if (isRestoring) {
      console.log('⏳ Showing loading spinner...')
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <div className="spinner" style={{ width: '50px', height: '50px' }}></div>
        </div>
      )
    }

    // ✅ CONTACT PAGE - ADD THIS BEFORE ADMIN CHECK
    if (viewMode === 'contact') {
      console.log('📧 Rendering contact page')
      return (
        <ContactPage 
          onBack={() => {
            console.log('🔙 Going back from contact page')
            setViewMode(user ? 'dashboard' : 'jobseeker-home')
          }} 
        />
      )
    }

    // ✅ ADMIN DASHBOARD - HIGHEST PRIORITY
    if (viewMode === 'admin') {
      console.log(`🛡️ Rendering admin dashboard for: ${user?.email}`)
      
      if (!user) {
        console.warn('⚠️ Admin view requested but no user logged in')
        setViewMode('jobseeker-home')
        return null
      }
      
      if (!isAdmin) {
        console.warn('⚠️ Admin view requested but user is not admin')
        setViewMode('dashboard')
        return null
      }
      
      return (
        <AdminDashboard 
          user={user} 
          onExit={() => {
            console.log('👋 Exiting admin panel')
            setViewMode('dashboard')
          }} 
        />
      )
    }

    if (viewMode === 'recruiter') {
      if (user) return <div className="container"><RecruiterOnboarding user={user} /></div>
      return <RecruiterLanding onBackToJobSeeker={() => setViewMode('jobseeker-home')} onLogin={() => setShowSignup(true)} />
    }

    if (user) {
        if (viewMode === 'dashboard') {
            return (
                <div className="container">
                    <UserDashboard user={user} onStartBlast={handleStartBlast} />
                </div>
            )
        }

        if (viewMode === 'jobseeker-home') {
             return <LandingPage onGetStarted={() => handleStartBlast()} />
        }

        // Upload Workbench (Default fallback for user)
        return (
            <div className="container dashboard-container">
              <div style={{marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                 <button className="btn-text" onClick={() => setViewMode('dashboard')}>← Back to Dashboard</button>
                 <h1 style={{fontSize: '24px', margin: 0}}>Resume Blast Workbench</h1>
              </div>
    
              {hasUploadedInSession ? (
                <>
                   <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px', padding: '15px', background: '#f3f4f6', borderRadius: '8px', alignItems:'center'}}>
                    <div><h3 style={{margin: 0, fontSize: '18px'}}>Current Resume Analysis</h3></div>
                    <button onClick={handleStartBlast} className="btn-outline">📄 Upload Different Resume</button>
                  </div>
                  <ResumeAnalysis 
                    user={user} 
                    resumeText={resumeText} 
                    resumeId={resumeId}
                    resumeUrl={resumeUrl}
                    isPaymentSuccess={paymentSuccess}
                  />
                </>
              ) : (
                <ResumeUpload 
                  user={user}
                  onUploadSuccess={({ text, url, id }) => {
                    setResumeText(text)
                    setResumeUrl(url)
                    setResumeId(id)
                    setHasUploadedInSession(true)
                  }} 
                />
              )}
            </div>
          )
    }

    return <LandingPage onGetStarted={() => setShowSignup(true)} />
  }

  const isRecruiterDashboard = viewMode === 'recruiter' && user
  const isAdminPage = viewMode === 'admin' && user
  const isContactPage = viewMode === 'contact' // ✅ ADD THIS

  // ✅ UPDATED: Determine if Footer should be shown
  // Footer is hidden on admin panel and contact page but shown everywhere else
  const shouldShowFooter = !isAdminPage && !isContactPage

  return (
    <div className="app-wrapper">
      <GoogleAnalytics />
      <PaymentSuccessHandler />
      <PaymentBlastTrigger />
      
      {!isRecruiterDashboard && !isAdminPage && !isContactPage && (
        <Navbar 
          user={user}
          isAdmin={isAdmin}
          onViewChange={handleViewChange}
          onLoginClick={() => setShowSignup(true)}
          onLogout={handleLogout}
        />
      )}
      
      <main className="main-content" style={(isRecruiterDashboard || isAdminPage || isContactPage) ? { paddingTop: 0 } : {}}>
        {renderContent()}
      </main>

      {/* ✅ UPDATED FOOTER - Shows on all pages except admin panel and contact page */}
      {shouldShowFooter && <Footer />}

      {showSignup && (
        viewMode === 'recruiter' 
          ? <RecruiterAuth onClose={() => setShowSignup(false)} onSuccess={(u) => { setUser({...u, role: 'recruiter'}); setShowSignup(false); }} />
          : <AuthModal onClose={() => setShowSignup(false)} onSuccess={(u) => { setUser(u); setShowSignup(false); setViewMode('upload-workbench'); }} />
      )}
    </div>
  )
}

export default App