import React from 'react'
import { logError } from '../utils/errorLogger'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    
    logError({
      type: 'react_error_boundary',
      message: error.message,
      stack: error.stack,
      component: this.props.componentName || 'Unknown',
      context: {
        errorInfo: errorInfo.componentStack
      }
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: '#fee2e2',
          border: '2px solid #ef4444',
          borderRadius: '12px',
          margin: '20px'
        }}>
          <h2 style={{ color: '#991b1b' }}>⚠️ Oops! Something went wrong</h2>
          <p style={{ color: '#7f1d1d', marginTop: '16px' }}>
            We've logged this error and will fix it soon.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🔄 Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary