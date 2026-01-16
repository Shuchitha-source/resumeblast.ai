import { useEffect, useState, useRef } from 'react'
import './LandingPage.css'

// --- INTERNAL COMPONENT: Live Counter (Resets on scroll) ---
const CountUp = ({ end, duration = 2000, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
          setCount(0);
        }
      },
      { threshold: 0.1 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [isVisible, end, duration]);

  return <span ref={countRef}>{count}{suffix}</span>;
};

// --- INTERNAL COMPONENT: Infinite Typewriter Effect ---
const TypewriterEffect = ({ text, delay = 0, infinite = false, onTypeEnd, onDeleteStart }) => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isStarted) return;

    let timer;
    const typeSpeed = isDeleting ? 30 : 60;
    const pauseTime = 2000;

    if (!isDeleting && currentIndex < text.length) {
      timer = setTimeout(() => {
        setCurrentText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, typeSpeed);
    } else if (!isDeleting && currentIndex === text.length) {
      if (onTypeEnd) onTypeEnd();
      
      if (infinite) {
        timer = setTimeout(() => {
          setIsDeleting(true);
          if (onDeleteStart) onDeleteStart();
        }, pauseTime);
      }
    } else if (isDeleting && currentIndex > 0) {
      timer = setTimeout(() => {
        setCurrentText(prev => prev.slice(0, -1));
        setCurrentIndex(prev => prev - 1);
      }, typeSpeed);
    } else if (isDeleting && currentIndex === 0) {
      setIsDeleting(false);
    }

    return () => clearTimeout(timer);
  }, [currentIndex, isDeleting, isStarted, text, infinite, onTypeEnd, onDeleteStart]);

  return <span>{currentText}</span>;
};

function LandingPage({ onGetStarted }) {
  const [showHighlight, setShowHighlight] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="landing-page">
      {/* HERO SECTION */}
      <section id="home" className="hero">
        <div className="hero-content">
          
          {/* UPDATED: Animated Tagline (Left to Right wipe) */}
          <div className="tagline-wrapper">
            <p className="tagline animated-wipe">
              AI-Powered Resume Distribution to <span className="counter-badge"><CountUp end={500} suffix="+" /></span> Recruiters
            </p>
          </div>
          
          {/* ANIMATED HEADLINE */}
          <h1>
            <span style={{ display: 'block', minHeight: '1.2em' }}>
              <TypewriterEffect text="Stop Applying." />
            </span>
            
            <span className="highlight-container" style={{ display: 'block', minHeight: '1.2em' }}>
              <TypewriterEffect 
                text="Start Blasting." 
                delay={1000} 
                infinite={true} 
                onTypeEnd={() => setShowHighlight(true)} 
                onDeleteStart={() => setShowHighlight(false)} 
              />
              {/* Highlight Bar */}
              <span className={`highlight-bg ${showHighlight ? 'active' : ''}`}></span>
            </span>
          </h1>
          
          {/* Highlighted Block */}
          <div className="hero-highlight-block">
            <p className="subtitle">
              Don't waste time rewriting your resume. Our engine analyzes your profile and puts it directly in the inboxes of <strong style={{color: '#DC2626', fontWeight: '800'}}><CountUp end={500} suffix="+" /> verified recruiters</strong> looking for your skills.
            </p>
            
            <div className="cta-container">
              <button className="cta-button large" onClick={onGetStarted}>
                Start Your Job Search
              </button>
            </div>
          </div>

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
            <p>We blast your resume to <strong style={{color: '#DC2626'}}>500+</strong> verified recruiters specifically looking for your skills.</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-icon">📊</div>
            <h3>Track Results</h3>
            <p>Real-time analytics dashboard showing email opens and recruiter engagement.</p>
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
              <li>✅ Instant Distribution to <strong><CountUp end={500} suffix="+" duration={1500} /> Recruiters</strong></li>
              <li>✅ Verified Recruiter Database Access</li>
              <li>✅ Real-time Analytics Dashboard</li>
              <li>✅ Email Open & Click Tracking</li>
              <li>✅ Direct Inbox Placement</li>
              <li>✅ 30-Day Email Support</li>
            </ul>
            <button className="cta-button featured" onClick={onGetStarted}>
              Get Started Now
            </button>
            <p className="guarantee">🔒 100% Secure Payment</p>
          </div>
        </div>
      </section>

      {/* Upsells Section */}
      <section className="upsells">
        <h2>Explore Our Other Career Tools</h2>
        <div className="upsell-cards">
          <a href="https://instantresumeai.com" target="_blank" rel="noopener noreferrer" className="upsell-card">
            <h3>⚡ InstantResumeAI</h3>
            <p>Get your resume AI-enhanced in minutes without mass distribution. Perfect for quick updates.</p>
            <span className="learn-more">Learn More →</span>
          </a>
          
          <a href="https://resumedistribute.com" target="_blank" rel="noopener noreferrer" className="upsell-card">
            <h3>📧 ResumeDistribute</h3>
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

      {/* Final CTA Section */}
      <section className="final-cta">
        <h2>Ready to Land Your Dream Job?</h2>
        <p>Join 10,000+ professionals who found their next opportunity with ResumeBlast.ai</p>
        <button className="cta-button large" onClick={onGetStarted}>
          Start Your Job Search Now
        </button>
        <p className="cta-subtext">✅ One-time payment | 🔒 Secure checkout</p>
      </section>
    </div>
  )
}

export default LandingPage