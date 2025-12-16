import { useState } from 'react'
import './LandingPage.css'

function LandingPage({ onGetStarted }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    closeMobileMenu();
  };

  return (
    <div className="landing-page">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-logo" onClick={() => scrollToSection('home')}>
            <span className="logo-icon">🚀</span>
            <span className="logo-text">ResumeBlast.ai</span>
          </div>
          
          <ul className={`navbar-menu ${mobileMenuOpen ? 'mobile-active' : ''}`}>
            <li>
              <button className="nav-link" onClick={() => scrollToSection('home')}>
                Home
              </button>
            </li>
            <li>
              <button className="nav-link" onClick={() => scrollToSection('how-it-works')}>
                How It Works
              </button>
            </li>
            <li>
              <button className="nav-link" onClick={() => scrollToSection('pricing')}>
                Pricing
              </button>
            </li>
            <li>
              <button className="nav-link nav-login" onClick={onGetStarted}>
                Login
              </button>
            </li>
            <li>
              <button className="nav-link nav-profile" onClick={onGetStarted}>
                Profile
              </button>
            </li>
          </ul>
          
          <button className="mobile-menu-btn" onClick={toggleMobileMenu} aria-label="Toggle menu">
            <span>{mobileMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero">
        <div className="hero-content">
          <h1>Stop Applying. Start Blasting. 🚀</h1>
          <p className="tagline">AI-Powered Resume Distribution to 500+ Tech Recruiters</p>
          <p className="subtitle">
            Don't waste time rewriting your resume. Our engine analyzes your profile and puts it directly in the inboxes of recruiters hiring for your role.
          </p>
          <div className="cta-container">
            <button className="cta-button large" onClick={onGetStarted}>
              Start Your Job Search - $149
            </button>
          </div>
          <p className="trust-badge">✅ Trusted by 10,000+ job seekers | ⭐ 4.9/5 rating</p>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works">
        <h2>How It Works</h2>
        <p className="section-subtitle">Get noticed in 3 simple steps</p>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-icon">📄</div>
            <h3>Upload Resume</h3>
            <p>Upload your existing PDF. No rewriting, reformatting, or "AI optimizing" required.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-icon">🤖</div>
            <h3>AI Analysis</h3>
            <p>Our AI scans your resume to detect your role, seniority, and best-fit industry automatically.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-icon">📧</div>
            <h3>Mass Distribution</h3>
            <p>We blast your resume to 500+ verified recruiters specifically looking for your skills.</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-icon">📊</div>
            <h3>Track Results</h3>
            <p>Real-time analytics dashboard showing exactly which companies received your profile.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing">
        <h2>Simple, Transparent Pricing</h2>
        <p className="section-subtitle">One-time payment. No subscriptions. No hidden fees.</p>
        
        <div className="pricing-container">
          <div className="pricing-card featured">
            <div className="popular-badge">Most Popular</div>
            <div className="price-header">
              <h3>Distribution Package</h3>
              <div className="price-tag">
                <span className="currency">$</span>
                <span className="amount">149</span>
              </div>
              <p className="price-description">One-time payment</p>
            </div>
            
            <ul className="features-list">
              <li>✅ AI Targeting Analysis</li>
              <li>✅ Instant Distribution to 500+ Recruiters</li>
              <li>✅ Verified Recruiter Database Access</li>
              <li>✅ Real-time Analytics Dashboard</li>
              <li>✅ Email Open & Click Tracking</li>
              <li>✅ Direct Inbox Placement</li>
              <li>✅ 30-Day Email Support</li>
              <li>✅ Money-Back Guarantee</li>
            </ul>
            
            <button className="cta-button featured" onClick={onGetStarted}>
              Get Started Now
            </button>
            
            <p className="guarantee">🔒 100% Secure Payment | 💰 30-Day Money-Back Guarantee</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials">
        <h2>What Our Users Say</h2>
        <p className="section-subtitle">Join thousands of successful job seekers</p>
        
        <div className="testimonial-cards">
          <div className="testimonial-card">
            <div className="stars">⭐⭐⭐⭐⭐</div>
            <p className="testimonial-text">
              "I didn't have to rewrite a single word. I uploaded my resume, hit blast, and woke up to 3 interview requests."
            </p>
            <div className="testimonial-author">
              <div className="author-avatar">SM</div>
              <div className="author-info">
                <p className="author-name">Sarah Martinez</p>
                <p className="author-title">Software Engineer at Google</p>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="stars">⭐⭐⭐⭐⭐</div>
            <p className="testimonial-text">
              "Finally, a tool that actually gets my resume seen instead of just 'optimizing' keywords. Worth every penny."
            </p>
            <div className="testimonial-author">
              <div className="author-avatar">JC</div>
              <div className="author-info">
                <p className="author-name">James Chen</p>
                <p className="author-title">Product Manager at Microsoft</p>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="stars">⭐⭐⭐⭐⭐</div>
            <p className="testimonial-text">
              "The analytics are a game changer. Knowing exactly which recruiters opened my resume gave me so much confidence."
            </p>
            <div className="testimonial-author">
              <div className="author-avatar">EP</div>
              <div className="author-info">
                <p className="author-name">Emily Parker</p>
                <p className="author-title">Marketing Director at Amazon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="final-cta">
        <h2>Ready to Land Your Dream Job?</h2>
        <p>Join 10,000+ professionals who found their next opportunity with ResumeBlast.ai</p>
        <button className="cta-button large" onClick={onGetStarted}>
          Start Your Job Search Now - $149
        </button>
        <p className="cta-subtext">✅ One-time payment | 💰 Money-back guarantee | 🔒 Secure checkout</p>
      </section>

      {/* Upsell Section - UPDATED BUTTONS */}
      <section className="upsells">
        <h2>Explore Our Other Career Tools</h2>
        <div className="upsell-cards">
          <a href="https://instantresumeai.com" target="_blank" rel="noopener noreferrer" className="upsell-card">
            <h3>⚡ InstantResumeAI</h3>
            <p>Get your resume AI-enhanced in minutes without mass distribution. Perfect for quick updates.</p>
            <span className="learn-more">Get Started →</span>
          </a>
          <a href="https://resumedistribute.com" target="_blank" rel="noopener noreferrer" className="upsell-card">
            <h3>📨 ResumeDistribute</h3>
            <p>Access our premium recruiter database with 10,000+ contacts for targeted outreach campaigns.</p>
            <span className="learn-more">Get Started →</span>
          </a>
          <div className="upsell-card" style={{ cursor: 'default', opacity: 0.9 }}>
            <h3>💼 BlastMyResume</h3>
            <p>Automated job application system - apply to 100+ jobs per day on major job boards.</p>
            <span className="learn-more" style={{ borderBottom: 'none', textDecoration: 'none', color: '#666', cursor: 'default' }}>
              Coming Soon
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>ResumeBlast.ai</h4>
            <p>AI-powered resume distribution to help you land your dream job faster.</p>
          </div>
          <div className="footer-section">
            <h4>Product</h4>
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
            <a href="#testimonials">Testimonials</a>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#refund">Refund Policy</a>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <a href="mailto:support@resumeblast.ai">support@resumeblast.ai</a>
            <p>© 2025 ResumeBlast.ai - All rights reserved</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage