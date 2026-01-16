import { useState } from 'react'
import './LandingPage.css' // Reuse existing styles

function RecruiterLanding({ onBackToJobSeeker, onLogin }) {
  // Mobile menu state is no longer needed here since the global Navbar handles it
  
  return (
    <div className="landing-page">
      {/* 🚀 REMOVED: Internal <nav> block. 
         Now relies on the Global Navbar in App.jsx (same as the main Landing Page). 
      */}

      {/* Recruiter Hero Section */}
      <section className="hero" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="hero-content">
          <h1>Hire Smarter. Connect Directly.</h1>
          <p className="tagline">Skip crowded job boards and long application cycles.</p>
          <p className="subtitle">
            Instead of posting on job boards and waiting, ResumeBlast.ai lets you directly engage with job seekers who are ready to work.
          </p>
          
          <div className="cta-container">
            <button className="cta-button large" onClick={onLogin}>
              Register or Log In
            </button>
          </div>
          
          <p className="trust-badge" style={{ marginTop: '20px' }}>
             Connect with motivated candidates and streamline your hiring process.
          </p>
        </div>
      </section>

      {/* ⛔️ FOOTER REMOVED: 
         The internal <footer> section has been deleted to prevent double footer issue.
         The page now uses the global Footer component from App.jsx.
      */}
    </div>
  )
}

export default RecruiterLanding