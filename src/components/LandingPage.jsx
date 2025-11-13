import { useState } from 'react'
import './LandingPage.css'

function LandingPage({ onGetStarted }) {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>🚀 ResumeBlast.ai</h1>
          <p className="tagline">AI-Powered Resume Optimization & Mass Distribution</p>
          <p className="subtitle">
            Land your dream job faster with AI-optimized resumes sent to 500+ recruiters
          </p>
          <button className="cta-button" onClick={onGetStarted}>
            Get Started - $149
          </button>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2>How ResumeBlast.ai Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>📄 Upload Your Resume</h3>
            <p>Upload PDF, Word, or TXT file - or build one from scratch using our AI builder</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>🤖 AI Optimization</h3>
            <p>Our Claude AI analyzes and optimizes your resume for ATS systems and recruiter preferences</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>📧 Mass Distribution</h3>
            <p>Your optimized resume is sent to 500+ verified recruiters in your industry</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>📊 Track Results</h3>
            <p>Real-time analytics showing opens, clicks, and responses from recruiters</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing">
        <h2>Simple, Transparent Pricing</h2>
        <div className="pricing-card">
          <div className="price-tag">
            <span className="currency">$</span>
            <span className="amount">149</span>
          </div>
          <h3>Complete Package</h3>
          <ul className="features-list">
            <li>✅ AI Resume Optimization</li>
            <li>✅ ATS Compatibility Check</li>
            <li>✅ Distribution to 500+ Recruiters</li>
            <li>✅ Real-time Analytics Dashboard</li>
            <li>✅ Email Open & Click Tracking</li>
            <li>✅ Response Rate Monitoring</li>
            <li>✅ 30-Day Support</li>
          </ul>
          <button className="cta-button" onClick={onGetStarted}>
            Start Your Job Search
          </button>
        </div>
      </section>

      {/* Upsell Section */}
      <section className="upsells">
        <h2>Need More Help? Check Out Our Other Services</h2>
        <div className="upsell-cards">
          <a href="https://instantresumeai.com" target="_blank" rel="noopener noreferrer" className="upsell-card">
            <h3>⚡ InstantResumeAI</h3>
            <p>Get your resume AI-enhanced in minutes without mass distribution</p>
            <span className="learn-more">Learn More →</span>
          </a>
          <a href="https://resumedistribute.com" target="_blank" rel="noopener noreferrer" className="upsell-card">
            <h3>📨 ResumeDistribute</h3>
            <p>Premium recruiter database with 10,000+ contacts for targeted outreach</p>
            <span className="learn-more">Learn More →</span>
          </a>
          <a href="https://blastmyresume.com" target="_blank" rel="noopener noreferrer" className="upsell-card">
            <h3>💼 BlastMyResume</h3>
            <p>Automated job application system - apply to 100+ jobs per day</p>
            <span className="learn-more">Learn More →</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2025 ResumeBlast.ai - All rights reserved</p>
        <div className="footer-links">
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Service</a>
          <a href="#contact">Contact</a>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage