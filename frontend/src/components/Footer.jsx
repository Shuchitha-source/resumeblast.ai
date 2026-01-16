import './Footer.css'

function Footer() {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>ResumeBlast.ai</h4>
          <p>AI-powered resume distribution to help you land your dream job faster.</p>
        </div>
        <div className="footer-section">
          <h4>Product</h4>
          <button onClick={() => scrollToSection('how-it-works')} className="footer-link">
            How It Works
          </button>
          <button onClick={() => scrollToSection('pricing')} className="footer-link">
            Pricing
          </button>
        </div>
        <div className="footer-section">
          <h4>Legal</h4>
          <a href="#privacy" className="footer-link">Privacy Policy</a>
          <a href="#terms" className="footer-link">Terms of Service</a>
        </div>
        <div className="footer-section">
          <h4>Contact</h4>
          <a href="mailto:support@resumeblast.ai" className="footer-link">
            support@resumeblast.ai
          </a>
          <p style={{ marginTop: '15px', color: '#9CA3AF', fontSize: '14px' }}>
            © 2025 ResumeBlast.ai - All rights reserved
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer