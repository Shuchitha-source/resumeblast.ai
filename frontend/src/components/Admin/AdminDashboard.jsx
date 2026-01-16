import { useState, useEffect } from 'react'
import ContactSubmissions from './ContactSubmissions'
import './AdminStyles.css'

function AdminDashboard({ user, onExit }) {
  const [activeTab, setActiveTab] = useState('monitoring')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    monitoring: null,
    users: null,
    stripe: null,
    health: null,
    support: null,
    serverStatus: null
  })
  const [error, setError] = useState(null)
  
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // NEW: Unread ticket count
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) {
      if (onExit) onExit()
      return
    }
    if (activeTab !== 'support') {
      fetchData(activeTab)
    } else {
      setLoading(false)
    }
  }, [activeTab, user])

  // NEW: Poll for unread count
  useEffect(() => {
    if (user) {
      fetchUnreadCount()
      // Poll every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  // NEW: Fetch unread count
  const fetchUnreadCount = async () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    try {
      const response = await fetch(`${API_URL}/api/admin/contact-submissions/unread-count`)
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unread_count || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const fetchData = async (tab, customStartDate = null, customEndDate = null) => {
    setLoading(true)
    setError(null)
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    
    try {
      let endpoint = ''
      let dataKey = tab
      
      if (tab === 'monitoring') {
        endpoint = '/api/admin/stats'
        const serverStatusRes = await fetch(`${API_URL}/api/admin/server-status`)
        if (serverStatusRes.ok) {
          const serverData = await serverStatusRes.json()
          setData(prev => ({ ...prev, serverStatus: serverData }))
        }
      }
      if (tab === 'users') endpoint = '/api/admin/users'
      if (tab === 'stripe') {
        endpoint = '/api/admin/revenue'
        if (customStartDate && customEndDate) {
          endpoint += `?start_date=${customStartDate}&end_date=${customEndDate}`
        }
      }
      if (tab === 'health') endpoint = '/api/admin/health'

      if (endpoint) {
        console.log(`📡 Fetching: ${API_URL}${endpoint}`)
        
        const res = await fetch(`${API_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }

        const json = await res.json()
        console.log(`✅ ${tab} data:`, json)
        
        setData(prev => ({
          ...prev,
          [dataKey]: json
        }))
      }
    } catch (e) {
      console.error(`❌ Error fetching ${tab}:`, e)
      setError(`Failed to load ${tab} data`)
    } finally {
      setLoading(false)
    }
  }

  const handleDateRangeSubmit = (e) => {
    e.preventDefault()
    if (startDate && endDate) {
      fetchData('stripe', startDate, endDate)
    } else {
      alert('Please select both start and end dates')
    }
  }

  const handleDeleteUser = async (userEmail, userId) => {
    const confirmed = window.confirm(
      `⚠️ WARNING: Are you absolutely sure you want to delete user "${userEmail}"?\n\n` +
      `This action will:\n` +
      `• Delete all user data (resumes, blasts, payments, activity)\n` +
      `• Remove from authentication system\n` +
      `• Prevent future signup/login\n\n` +
      `This action CANNOT be undone!`
    )
    
    if (!confirmed) return
    
    const finalConfirm = window.confirm(
      `FINAL CONFIRMATION: Delete ${userEmail}?\n\nType YES in your mind and click OK to proceed.`
    )
    
    if (!finalConfirm) return
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    
    try {
      console.log(` Deleting user: ${userEmail}`)
      
      const response = await fetch(`${API_URL}/api/admin/users/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          user_id: userId,
          admin_email: user?.email || 'admin',
          reason: 'Admin deletion via dashboard'
        })
      })
      
      const result = await response.json()
      
      if (result.success || response.status === 207) {
        alert(`✅ User "${userEmail}" has been successfully deleted!\n\nDetails:\n` +
              `• Auth: ${result.details.auth_deleted ? 'Deleted' : 'Failed'}\n` +
              `• Blacklisted: ${result.details.blacklisted ? 'Yes' : 'No'}\n` +
              `• Data cleaned: ${Object.values(result.details.data_cleanup).filter(Boolean).length} tables`)
        
        fetchData('users')
      } else {
        alert(`❌ Error deleting user:\n${result.error || 'Unknown error'}`)
      }
      
    } catch (error) {
      console.error('Delete error:', error)
      alert(`❌ Failed to delete user:\n${error.message}`)
    }
  }

  return (
    <div className="admin-container">
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <h3> Admin Panel</h3>
          <p style={{fontSize: '12px', color: '#9ca3af', marginTop: '8px'}}>
            {user?.email || 'Admin'}
          </p>
        </div>
        
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'monitoring' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitoring')}
          >
             Monitoring
          </button>
          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
             Users
          </button>
          <button
            className={`nav-item ${activeTab === 'stripe' ? 'active' : ''}`}
            onClick={() => setActiveTab('stripe')}
          >
             Revenue Analytics
          </button>
          <button
            className={`nav-item ${activeTab === 'health' ? 'active' : ''}`}
            onClick={() => setActiveTab('health')}
          >
             System Health
          </button>
          
          {/* Support Tickets with Unread Badge */}
          <button
            className={`nav-item ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => setActiveTab('support')}
            style={{ position: 'relative' }}
          >
             Support
            {/* WhatsApp-style Unread Badge */}
            {unreadCount > 0 && (
              <span className="support-unread-badge">
                {unreadCount}
              </span>
            )}
          </button>
        </nav>
        
        <div className="sidebar-footer">
          <button className="nav-item" onClick={onExit}>
             Exit Dashboard
          </button>
        </div>
      </div>

      <div className="admin-content">
        {error && (
          <div className="error-banner">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {activeTab === 'monitoring' && data.monitoring && (
              <div>
                <h2> System Overview</h2>
                <div className="stats-grid">
                  <div className="stat-card">
                    <h3>Total Users</h3>
                    <div className="stat-value">{data.monitoring.total_users || 0}</div>
                    <p>{data.monitoring.active_users || 0} active</p>
                  </div>
                  
                  <div className="stat-card">
                    <h3>Total Blasts</h3>
                    <div className="stat-value">{data.monitoring.total_blasts || 0}</div>
                    <p>Resume distributions</p>
                  </div>
                  
                  <div className="stat-card">
                    <h3>Resume Uploads</h3>
                    <div className="stat-value">{data.monitoring.total_resume_uploads || 0}</div>
                    <p>Total files</p>
                  </div>
                  
                  <div className="stat-card">
                    <h3>Total Revenue</h3>
                    <div className="stat-value" style={{ color: '#059669' }}>
                      ${data.monitoring.total_revenue || 0}
                    </div>
                    <p>All-time earnings</p>
                  </div>
                </div>

                {data.serverStatus && (
                  <div style={{ marginTop: '40px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#111827' }}>
                       Server Status
                    </h3>
                    <div className="stats-grid">
                      <div className="stat-card">
                        <h3>Uptime</h3>
                        <div style={{ fontSize: '18px', fontWeight: '600', color: '#059669' }}>
                          {data.serverStatus.uptime || 'Running'}
                        </div>
                      </div>
                      
                      {data.serverStatus.services && (
                        <>
                          <div className="stat-card">
                            <h3>Database</h3>
                            <div style={{ fontSize: '18px', fontWeight: '600', color: '#059669' }}>
                              {data.serverStatus.services.Database?.status || 'Unknown'}
                            </div>
                            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                              {data.serverStatus.services.Database?.latency || 'N/A'}
                            </p>
                          </div>
                          
                          <div className="stat-card">
                            <h3>API Server</h3>
                            <div style={{ fontSize: '18px', fontWeight: '600', color: '#059669' }}>
                              {data.serverStatus.services.Server?.status || 'Unknown'}
                            </div>
                          </div>
                        </>
                      )}
                      
                      {data.serverStatus.configuration && (
                        <div className="stat-card">
                          <h3>Configuration</h3>
                          <div style={{ fontSize: '13px', marginTop: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ color: '#6b7280' }}>Stripe:</span>
                              <span style={{ fontWeight: '600', color: data.serverStatus.configuration.Stripe === 'Set' ? '#059669' : '#DC2626' }}>
                                {data.serverStatus.configuration.Stripe || 'Missing'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ color: '#6b7280' }}>Supabase:</span>
                              <span style={{ fontWeight: '600', color: data.serverStatus.configuration.Supabase === 'Set' ? '#059669' : '#DC2626' }}>
                                {data.serverStatus.configuration.Supabase || 'Missing'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#6b7280' }}>Anthropic:</span>
                              <span style={{ fontWeight: '600', color: data.serverStatus.configuration.Anthropic === 'Set' ? '#059669' : '#DC2626' }}>
                                {data.serverStatus.configuration.Anthropic || 'Missing'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && data.users && (
              <div>
                <h2> User Management</h2>
                <div className="stat-card" style={{ marginBottom: '20px' }}>
                  <h3>Total Users</h3>
                  <div className="stat-value">{data.users.count || 0}</div>
                </div>
                
                <div className="stat-card" style={{ padding: '0', overflow: 'hidden' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.users.users && data.users.users.length > 0 ? (
                        data.users.users.map((user) => (
                          <tr key={user.id}>
                            <td style={{ fontWeight: '600' }}>{user.email}</td>
                            <td>{user.full_name || 'N/A'}</td>
                            <td>
                              <span className={user.account_status === 'active' ? 'badge-success' : 'badge-warning'}>
                                {user.account_status || 'Unknown'}
                              </span>
                            </td>
                            <td>{new Date(user.created_at).toLocaleDateString()}</td>
                            <td>
                              <button
                                onClick={() => handleDeleteUser(user.email, user.id)}
                                style={{
                                  padding: '6px 12px',
                                  background: '#DC2626',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  transition: 'background 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.background = '#B91C1C'}
                                onMouseOut={(e) => e.target.style.background = '#DC2626'}
                              >
                                 Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
                            No users found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'stripe' && (
              <div>
                <h2> Revenue Analytics</h2>
                
                <div className="date-range-section">
                  <h3> Custom Date Range</h3>
                  <form onSubmit={handleDateRangeSubmit} className="date-range-form">
                    <div className="form-group">
                      <label htmlFor="start-date">Start Date</label>
                      <input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        max={endDate || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="end-date">End Date</label>
                      <input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label style={{ opacity: 0 }}>Submit</label>
                      <button type="submit" className="btn-primary">
                        Apply Filter
                      </button>
                    </div>
                    
                    {(startDate || endDate) && (
                      <div className="form-group">
                        <label style={{ opacity: 0 }}>Clear</label>
                        <button
                          type="button"
                          onClick={() => {
                            setStartDate('')
                            setEndDate('')
                            fetchData('stripe')
                          }}
                          className="btn-secondary"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </form>
                </div>

                {data.stripe && (
                  <div>
                    <div className="stats-grid">
                      <div className="stat-card">
                        <h3>Today's Revenue</h3>
                        <div className="stat-value" style={{ color: '#059669' }}>
                          ${data.stripe.today_revenue || 0}
                        </div>
                        <p style={{ marginTop: '10px', color: '#6b7280', fontSize: '14px' }}>
                          {data.stripe.today_transactions || 0} transactions
                        </p>
                      </div>
                      
                      <div className="stat-card">
                        <h3>Last 7 Days</h3>
                        <div className="stat-value" style={{ color: '#059669' }}>
                          ${data.stripe.last_7_days_revenue || 0}
                        </div>
                        <p style={{ marginTop: '10px', color: '#6b7280', fontSize: '14px' }}>
                          Rolling 7-day total
                        </p>
                      </div>
                      
                      <div className="stat-card">
                        <h3>{startDate && endDate ? 'Selected Period Revenue' : 'All-Time Revenue'}</h3>
                        <div className="stat-value" style={{ color: '#059669' }}>
                          ${data.stripe.total_revenue || 0}
                        </div>
                        <p style={{ marginTop: '10px', color: '#6b7280', fontSize: '14px' }}>
                          {data.stripe.transactions || 0} total transactions
                        </p>
                      </div>
                    </div>

                    {data.stripe.daily_breakdown && data.stripe.daily_breakdown.length > 0 && (
                      <div className="stat-card" style={{ padding: '0', overflow: 'hidden', marginTop: '20px' }}>
                        <div style={{padding: '20px', borderBottom: '1px solid #e5e7eb'}}>
                          <h3 style={{margin: 0}}>📈 Daily Revenue Breakdown (Last 7 Days)</h3>
                        </div>
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Revenue</th>
                              <th>Transactions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.stripe.daily_breakdown.map((day, index) => (
                              <tr key={index}>
                                <td>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                <td style={{fontWeight: 'bold', color: day.revenue > 0 ? '#059669' : '#6b7280'}}>
                                  ${day.revenue.toFixed(2)}
                                </td>
                                <td>{day.transactions}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {data.stripe.failed_payments && (
                      <div className="stat-card" style={{ padding: '0', overflow: 'hidden', marginTop: '20px' }}>
                        <div style={{padding: '20px', borderBottom: '1px solid #e5e7eb', background: '#fee2e2'}}>
                          <h3 style={{margin: 0, color: '#991b1b'}}>❌ Failed Payments</h3>
                          <p style={{margin: '5px 0 0 0', fontSize: '14px', color: '#7f1d1d'}}>
                            Total: {data.stripe.failed_payments.count} failures | Amount: ${data.stripe.failed_payments.amount}
                          </p>
                        </div>
                        {data.stripe.failed_payments.count > 0 ? (
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Email</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Payment ID</th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.stripe.failed_payments.payments.map((payment, index) => (
                                <tr key={index}>
                                  <td>{payment.user_email || 'N/A'}</td>
                                  <td style={{fontWeight: 'bold', color: '#DC2626'}}>
                                    ${(payment.amount / 100).toFixed(2)}
                                  </td>
                                  <td>
                                    <span style={{
                                      padding: '4px 8px',
                                      background: '#fee2e2',
                                      color: '#991b1b',
                                      borderRadius: '4px',
                                      fontSize: '12px',
                                      fontWeight: '600'
                                    }}>
                                      {payment.status}
                                    </span>
                                  </td>
                                  <td>{new Date(payment.created_at).toLocaleDateString()}</td>
                                  <td style={{fontSize: '12px', color: '#6b7280'}}>
                                    {payment.stripe_payment_intent_id?.slice(0, 20) || payment.id?.slice(0, 8) || 'N/A'}...
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div style={{padding: '30px', textAlign: 'center', color: '#6b7280'}}>
                            ✅ No failed payments found
                          </div>
                        )}
                      </div>
                    )}

                    {data.stripe.refunded_payments && (
                      <div className="stat-card" style={{ padding: '0', overflow: 'hidden', marginTop: '20px' }}>
                        <div style={{padding: '20px', borderBottom: '1px solid #e5e7eb', background: '#fef3c7'}}>
                          <h3 style={{margin: 0, color: '#92400e'}}>💸 Refunded Payments</h3>
                          <p style={{margin: '5px 0 0 0', fontSize: '14px', color: '#78350f'}}>
                            Total: {data.stripe.refunded_payments.count} refunds | Amount: ${data.stripe.refunded_payments.amount}
                          </p>
                        </div>
                        {data.stripe.refunded_payments.count > 0 ? (
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Email</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Payment ID</th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.stripe.refunded_payments.payments.map((payment, index) => (
                                <tr key={index}>
                                  <td>{payment.user_email || 'N/A'}</td>
                                  <td style={{fontWeight: 'bold', color: '#D97706'}}>
                                    ${(payment.amount / 100).toFixed(2)}
                                  </td>
                                  <td>
                                    <span style={{
                                      padding: '4px 8px',
                                      background: '#fef3c7',
                                      color: '#92400e',
                                      borderRadius: '4px',
                                      fontSize: '12px',
                                      fontWeight: '600'
                                    }}>
                                      {payment.status}
                                    </span>
                                  </td>
                                  <td>{new Date(payment.created_at).toLocaleDateString()}</td>
                                  <td style={{fontSize: '12px', color: '#6b7280'}}>
                                    {payment.stripe_payment_intent_id?.slice(0, 20) || payment.id?.slice(0, 8) || 'N/A'}...
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div style={{padding: '30px', textAlign: 'center', color: '#6b7280'}}>
                            ✅ No refunded payments found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'health' && data.health && (
              <div>
                <h2> System Health</h2>
                <div className="stats-grid">
                  {Object.entries(data.health).map(([key, status]) => (
                    <div key={key} className="stat-card">
                      <h3>{key}</h3>
                      <div style={{
                        color: status === 'Healthy' || status === 'Configured' || status === 'Online' ? '#059669' : '#DC2626',
                        fontWeight: 'bold',
                        fontSize: '20px'
                      }}>
                        {status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <ContactSubmissions 
                onTicketUpdate={fetchUnreadCount}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard