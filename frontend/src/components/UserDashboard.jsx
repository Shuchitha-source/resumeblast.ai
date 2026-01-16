import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'
import './UserDashboard.css'

function UserDashboard({ user, onStartBlast }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    blasts: [],
    payments: [],
    resumes: []
  })

  useEffect(() => {
    async function loadDashboardData() {
      try {
        if (!user) return

        // 1. Fetch Recent Blasts
        const { data: blasts } = await supabase
          .from('blast_campaigns')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)

        // 2. Fetch Payment History
        const { data: payments } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)

        // 3. Fetch Recent Resumes
        const { data: resumes } = await supabase
          .from('resumes')
          .select('*')
          .eq('user_id', user.id)
          .order('uploaded_at', { ascending: false })
          .limit(5)

        setData({
          blasts: blasts || [],
          payments: payments || [],
          resumes: resumes || []
        })

      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  // --- Receipt Generator ---
  const downloadReceipt = (payment) => {
    const doc = new jsPDF()
    doc.setFillColor(220, 38, 38)
    doc.rect(0, 0, 210, 20, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.text("ResumeBlast.ai - Payment Receipt", 10, 13)
    
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.text(`Date: ${new Date(payment.created_at).toLocaleDateString()}`, 10, 40)
    doc.text(`Receipt ID: ${payment.id.substr(0, 8).toUpperCase()}`, 10, 50)
    doc.text(`Amount: $${(payment.amount / 100).toFixed(2)}`, 10, 60)
    doc.text(`Status: Paid`, 10, 70)
    
    doc.save(`receipt_${payment.created_at.slice(0,10)}.pdf`)
  }

  if (loading) return <div style={{textAlign:'center', padding:'40px'}}>Loading dashboard data...</div>

  return (
    <div className="user-dashboard">
      <div className="dashboard-header-row">
        <div>
           <h1>📊 {user.user_metadata?.full_name || user.email?.split('@')[0]}'s Dashboard</h1>
           <p>Track your blasts, payments, and uploaded resumes.</p>
        </div>
        <button className="btn-primary" onClick={onStartBlast}>
          🚀 Start New Blast
        </button>
      </div>

      {/* --- SECTION 1: BLAST CAMPAIGNS --- */}
      <div className="dashboard-section">
        <h2>🚀 Blast Campaigns</h2>
        <div className="table-container">
          <table className="dashboard-table">
            <thead>
              <tr><th>Date</th><th>Industry</th><th>Recruiters Reached</th><th>Status</th></tr>
            </thead>
            <tbody>
              {data.blasts.length > 0 ? data.blasts.map(b => (
                  <tr key={b.id}>
                    <td>{new Date(b.created_at || b.initiated_at).toLocaleDateString()}</td>
                    <td>{b.industry}</td>
                    <td>{b.recipients_count}</td>
                    <td>
                      <span className={`status-badge ${b.status === 'completed' ? 'success' : 'pending'}`}>
                        {b.status || 'Processing'}
                      </span>
                    </td>
                  </tr>
              )) : <tr><td colSpan="4" className="empty-cell">No blasts sent yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>


      {/* --- SECTION 3: RECENT RESUMES --- */}
      <div className="dashboard-section">
        <h2>📄 Recent Uploads</h2>
        <div className="table-container">
          <table className="dashboard-table">
            <thead>
              <tr><th>Uploaded Date</th><th>File Name</th><th>Detected Role</th></tr>
            </thead>
            <tbody>
              {data.resumes.length > 0 ? data.resumes.map(r => (
                  <tr key={r.id}>
                    <td>{new Date(r.uploaded_at || r.created_at).toLocaleDateString()}</td>
                    <td>
  {/* Display as plain text instead of a link */}
  <span style={{ color: '#374151' }}>
    {r.file_name || 'Resume.pdf'}
  </span>
</td>
                    <td>{r.detected_role || 'General'}</td>
                  </tr>
              )) : <tr><td colSpan="3" className="empty-cell">No resumes uploaded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default UserDashboard