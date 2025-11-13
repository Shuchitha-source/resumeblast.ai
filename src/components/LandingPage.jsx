import { useState } from 'react'
import './LandingPage.css'

function LandingPage({ onGetStarted }) {
  return (
    <div className="landing-page">
      {/* Hero Section with SEO Keywords */}
      <section className="hero">
        <div className="hero-content">
          <h1>Blast Your Resume with AI 🚀</h1>
          <p className="tagline">AI-Powered Resume Optimization & Mass Distribution to 500+ Recruiters</p>
          <p className="subtitle">
            Get your resume in front of top recruiters and land interviews faster with AI-optimized applications
          </p>
          <button className="cta-button" onClick={onGetStarted}>
            Start Your Job Search - $149
          </button>
          <p className="trust-badge">✅ Trusted by 10,000+ job seekers | ⭐ 4.9/5 rating</p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2>How ResumeBlast.ai Works</h2>
        <p className="section-subtitle">Land your dream job in 4 simple steps</p>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-icon">📄</div>
            <h3>Upload or Build Your Resume</h3>
            <p>Upload your existing resume in PDF, Word, or TXT format - or build a professional one from scratch using our AI-powered builder</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-icon">🤖</div>
            <h3>AI Optimization</h3>
            <p>Our advanced Claude AI analyzes and optimizes your resume for ATS systems, keywords, and recruiter preferences</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-icon">📧</div>
            <h3>Mass Distribution to 500+ Recruiters</h3>
            <p>Your optimized resume is automatically sent to verified recruiters in your industry across top companies</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-icon">📊</div>
            <h3>Track Your Results</h3>
            <p>Real-time analytics dashboard showing email opens, clicks, and responses from recruiters</p>
          </div>
        </div>
      </section>

      {/* Pricing Section - Enhanced */}
      <section className="pricing">
        <h2>Simple, Transparent Pricing</h2>
        <p className="section-subtitle">One-time payment. No subscriptions. No hidden fees.</p>
        
        <div className="pricing-container">
          <div className="pricing-card featured">
            <div className="popular-badge">Most Popular</div>
            <div className="price-header">
              <h3>Complete Package</h3>
              <div className="price-tag">
                <span className="currency">$</span>
                <span className="amount">149</span>
              </div>
              <p className="price-description">One-time payment</p>
            </div>
            
            <ul className="features-list">
              <li>✅ AI Resume Optimization with Claude AI</li>
              <li>✅ ATS Compatibility Check & Enhancement</li>
              <li>✅ Distribution to 500+ Verified Recruiters</li>
              <li>✅ Real-time Analytics Dashboard</li>
              <li>✅ Email Open & Click Tracking</li>
              <li>✅ Response Rate Monitoring</li>
              <li>✅ Resume Builder Tool (Build from Scratch)</li>
              <li>✅ 30-Day Email Support</li>
              <li>✅ Money-Back Guarantee</li>
            </ul>
            
            <button className="cta-button featured" onClick={onGetStarted}>
              Get Started Now
            </button>
            
            <p className="guarantee">🔒 100% Secure Payment | 💰 30-Day Money-Back Guarantee</p>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="comparison-table">
          <h3>Why Choose ResumeBlast.ai?</h3>
          <table>
            <thead>
              <tr>
                <th>Feature</th>
                <th>Traditional Job Hunting</th>
                <th className="highlight">ResumeBlast.ai</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Time to Apply to 500 Jobs</td>
                <td>200+ hours</td>
                <td className="highlight">5 minutes</td>
              </tr>
              <tr>
                <td>Resume Optimization</td>
                <td>Manual guesswork</td>
                <td className="highlight">AI-powered analysis</td>
              </tr>
              <tr>
                <td>Recruiter Reach</td>
                <td>Limited by job boards</td>
                <td className="highlight">500+ verified recruiters</td>
              </tr>
              <tr>
                <td>Response Tracking</td>
                <td>None</td>
                <td className="highlight">Real-time analytics</td>
              </tr>
              <tr>
                <td>Cost</td>
                <td>Free (but 200+ hours)</td>
                <td className="highlight">$149 one-time</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <h2>What Our Users Say</h2>
        <p className="section-subtitle">Join thousands of successful job seekers</p>
        
        <div className="testimonial-cards">
          <div className="testimonial-card">
            <div className="stars">⭐⭐⭐⭐⭐</div>
            <p className="testimonial-text">
              "I got 3 interviews within a week of using ResumeBlast.ai! The AI optimization made my resume stand out and the mass distribution saved me countless hours."
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
              "Best $149 I've ever spent on my career. The analytics showed me exactly which recruiters opened my resume. Landed my dream job in 2 weeks!"
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
              "The resume builder helped me create a professional resume from scratch. Within days, I had recruiters reaching out to me. This actually works!"
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

      {/* Upsell Section */}
      <section className="upsells">
        <h2>Explore Our Other Career Tools</h2>
        <div className="upsell-cards">
          <a href="https://instantresumeai.com" target="_blank" rel="noopener noreferrer" className="upsell-card">
            <h3>⚡ InstantResumeAI</h3>
            <p>Get your resume AI-enhanced in minutes without mass distribution. Perfect for quick updates.</p>
            <span className="learn-more">Learn More →</span>
          </a>
          <a href="https://resumedistribute.com" target="_blank" rel="noopener noreferrer" className="upsell-card">
            <h3>📨 ResumeDistribute</h3>
            <p>Access our premium recruiter database with 10,000+ contacts for targeted outreach campaigns.</p>
            <span className="learn-more">Learn More →</span>
          </a>
          <a href="https://blastmyresume.com" target="_blank" rel="noopener noreferrer" className="upsell-card">
            <h3>💼 BlastMyResume</h3>
            <p>Automated job application system - apply to 100+ jobs per day on major job boards.</p>
            <span className="learn-more">Learn More →</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>ResumeBlast.ai</h4>
            <p>AI-powered resume optimization and mass distribution to help you land your dream job faster.</p>
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