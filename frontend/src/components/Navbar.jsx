import { useState } from 'react'
import './Navbar.css'

function Navbar({ user, isAdmin, onViewChange, onLoginClick, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleNavClick = (view) => {
    setMobileMenuOpen(false)
    onViewChange(view)
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-logo" onClick={() => handleNavClick('home')}>
            <span className="logo-icon">🚀</span>
            <span className="logo-text">ResumeBlast.ai</span>
          </div>
          
          <ul className={`navbar-menu ${mobileMenuOpen ? 'mobile-active' : ''}`}>
            
            <li><button className="nav-link" onClick={() => handleNavClick('home')}>Home</button></li>
            
            {!user ? (
              <>
                <li><button className="nav-link" onClick={() => handleNavClick('how-it-works')}>How It Works</button></li>
                <li><button className="nav-link" onClick={() => handleNavClick('pricing')}>Pricing</button></li>
                <li><button className="nav-link" onClick={() => handleNavClick('recruiter')}>Employers</button></li>
                
                {/* ✅ UPDATED: Navigate to contact page instead of modal */}
                <li>
                  <button 
                    className="nav-link" 
                    onClick={() => handleNavClick('contact')}
                  >
                    Contact
                  </button>
                </li>
                
                <li>
                  <button className="nav-link nav-login" onClick={onLoginClick}>
                    Login
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <button className="nav-link" style={{fontWeight: 'bold', color: '#DC2626'}} onClick={() => handleNavClick('dashboard')}>
                    Dashboard
                  </button>
                </li>

                {/* ✅ UPDATED: Navigate to contact page for logged in users */}
                <li>
                  <button 
                    className="nav-link" 
                    onClick={() => handleNavClick('contact')}
                  >
                    Contact
                  </button>
                </li>

                {isAdmin && (
                  <li>
                    <button 
                      className="nav-link" 
                      style={{
                        background: '#111827', 
                        color: 'white', 
                        border: '1px solid #374151',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }} 
                      onClick={() => handleNavClick('admin')}
                    >
                      🛡️ Admin Panel
                    </button>
                  </li>
                )}

                <li className="user-badge">
                   👤 {user.email?.split('@')[0]}
                </li>
                <li>
                  <button className="nav-link nav-logout" onClick={onLogout}>
                    Sign Out
                  </button>
                </li>
              </>
            )}
          </ul>
          
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span>{mobileMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </nav>
    </>
  )
}

export default Navbar