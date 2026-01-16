import { useState, useEffect } from 'react'

function ContactSubmissions({ onTicketUpdate }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [resolving, setResolving] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  useEffect(() => {
    loadTickets()
  }, [filter])

  const loadTickets = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/admin/contact-submissions?filter=${filter}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setTickets(data.submissions || [])
      console.log('✅ Loaded', data.submissions?.length || 0, 'support tickets')
      
      // Notify parent to update unread count
      if (onTicketUpdate) {
        onTicketUpdate()
      }
    } catch (error) {
      console.error('❌ Error loading tickets:', error)
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsResolved = (ticket) => {
    setSelectedTicket(ticket)
    setShowConfirmDialog(true)
  }

  const confirmResolve = async () => {
    if (!selectedTicket) return

    setResolving(true)
    try {
      console.log('🔄 Marking ticket as resolved:', selectedTicket.id)
      
      const response = await fetch(
        `${API_URL}/api/admin/contact-submissions/${selectedTicket.id}/resolve`,
        {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'resolved' })
        }
      )

      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Response error:', errorText)
        throw new Error(`Failed to update ticket: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ Ticket marked as resolved:', result)
      
      // Close dialog
      setShowConfirmDialog(false)
      setSelectedTicket(null)
      
      // Reload tickets
      await loadTickets()
      
      // Show success message
      alert('✅ Ticket has been marked as resolved successfully!')
      
    } catch (error) {
      console.error('❌ Error marking as resolved:', error)
      alert(`Failed to mark ticket as resolved: ${error.message}`)
    } finally {
      setResolving(false)
    }
  }

  const cancelResolve = () => {
    setShowConfirmDialog(false)
    setSelectedTicket(null)
  }

  // Get status display properties
  const getStatusDisplay = (status) => {
    switch(status) {
      case 'unread':
        return { text: 'Unread', color: '#DC2626', bgColor: '#FEE2E2' }
      case 'open':
        return { text: 'Open', color: '#D97706', bgColor: '#FEF3C7' }
      case 'resolved':
        return { text: 'Resolved', color: '#059669', bgColor: '#D1FAE5' }
      default:
        return { text: 'Unknown', color: '#6B7280', bgColor: '#F3F4F6' }
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header with Title and Filter Buttons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>
          🎫 Support Tickets
        </h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '8px 20px',
              background: filter === 'all' ? '#DC2626' : 'white',
              color: filter === 'all' ? 'white' : '#374151',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            All ({tickets.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            style={{
              padding: '8px 20px',
              background: filter === 'unread' ? '#DC2626' : 'white',
              color: filter === 'unread' ? 'white' : '#374151',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter('open')}
            style={{
              padding: '8px 20px',
              background: filter === 'open' ? '#DC2626' : 'white',
              color: filter === 'open' ? 'white' : '#374151',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            Open
          </button>
          <button
            onClick={() => setFilter('resolved')}
            style={{
              padding: '8px 20px',
              background: filter === 'resolved' ? '#DC2626' : 'white',
              color: filter === 'resolved' ? 'white' : '#374151',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            Resolved
          </button>
        </div>
      </div>

      {/* Table wrapped in stat-card */}
      <div className="stat-card" style={{ padding: '0', overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '100px' }}>STATUS</th>
              <th style={{ width: '180px' }}>TICKET ID</th>
              <th style={{ width: '140px' }}>DATE</th>
              <th style={{ width: '120px' }}>NAME</th>
              <th style={{ width: '200px' }}>EMAIL</th>
              <th style={{ width: '150px' }}>SUBJECT</th>
              <th style={{ width: '150px' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
                  No support tickets found
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => {
                const statusDisplay = getStatusDisplay(ticket.status)
                return (
                  <tr 
                    key={ticket.id}
                    style={{ 
                      background: ticket.status === 'unread' ? '#FEF2F2' : 
                                 ticket.status === 'resolved' ? '#F0FDF4' : 
                                 'white',
                      borderBottom: '1px solid #E5E7EB'
                    }}
                  >
                    {/* Status Column */}
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '700',
                          background: statusDisplay.bgColor,
                          color: statusDisplay.color,
                          border: `1px solid ${statusDisplay.color}40`,
                          textTransform: 'capitalize'
                        }}
                      >
                        <span style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: statusDisplay.color 
                        }}></span>
                        {statusDisplay.text}
                      </span>
                    </td>

                    {/* Ticket ID */}
                    <td style={{ 
                      fontFamily: 'monospace', 
                      fontSize: '12px', 
                      color: '#6B7280',
                      fontWeight: '600'
                    }}>
                      {ticket.ticket_id || `#${ticket.id}`}
                    </td>

                    {/* Date */}
                    <td style={{ fontSize: '13px', color: '#374151' }}>
                      {new Date(ticket.submitted_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </td>

                    {/* Name */}
                    <td style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>
                      {ticket.name}
                    </td>

                    {/* Email */}
                    <td>
                      <a 
                        href={`mailto:${ticket.email}`}
                        style={{ 
                          color: '#2563EB', 
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}
                        onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                        onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                      >
                        {ticket.email}
                      </a>
                    </td>

                    {/* Subject */}
                    <td style={{ 
                      fontSize: '13px', 
                      color: '#374151',
                      maxWidth: '150px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {ticket.subject}
                    </td>

                    {/* Actions */}
                    <td>
                      {ticket.status !== 'resolved' ? (
                        <button
                          onClick={() => handleMarkAsResolved(ticket)}
                          disabled={resolving}
                          style={{
                            padding: '8px 18px',
                            background: resolving ? '#9CA3AF' : '#10B981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: resolving ? 'not-allowed' : 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            boxShadow: '0 1px 3px rgba(16, 185, 129, 0.3)'
                          }}
                          onMouseOver={(e) => {
                            if (!resolving) {
                              e.target.style.background = '#059669'
                              e.target.style.transform = 'translateY(-1px)'
                              e.target.style.boxShadow = '0 4px 6px rgba(16, 185, 129, 0.4)'
                            }
                          }}
                          onMouseOut={(e) => {
                            if (!resolving) {
                              e.target.style.background = '#10B981'
                              e.target.style.transform = 'translateY(0)'
                              e.target.style.boxShadow = '0 1px 3px rgba(16, 185, 129, 0.3)'
                            }
                          }}
                        >
                          {resolving ? 'Processing...' : 'Mark as Resolved'}
                        </button>
                      ) : (
                        <span style={{
                          padding: '8px 18px',
                          background: '#D1FAE5',
                          color: '#059669',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '600',
                          display: 'inline-block'
                        }}>
                          ✓ Resolved
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && selectedTicket && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
            backdropFilter: 'blur(4px)'
          }}
          onClick={cancelResolve}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
              animation: 'slideIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog Header */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '28px',
                color: 'white',
                fontWeight: 'bold'
              }}>
                ✓
              </div>
              <h3 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '20px', 
                fontWeight: '700', 
                color: '#111827' 
              }}>
                www.resumeblast.ai says
              </h3>
            </div>

            {/* Dialog Content */}
            <p style={{ 
              fontSize: '15px', 
              color: '#374151', 
              marginBottom: '24px',
              lineHeight: '1.6',
              textAlign: 'center'
            }}>
              Are you sure you have resolved this ticket via email?
            </p>

            {/* Ticket Info */}
            <div style={{
              background: '#F9FAFB',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '24px',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                Ticket: <span style={{ fontWeight: '600', color: '#111827' }}>
                  {selectedTicket.ticket_id || `#${selectedTicket.id}`}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>
                User: <span style={{ fontWeight: '600', color: '#111827' }}>
                  {selectedTicket.name} ({selectedTicket.email})
                </span>
              </div>
            </div>

            {/* Dialog Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'center'
            }}>
              <button
                onClick={confirmResolve}
                disabled={resolving}
                style={{
                  padding: '12px 32px',
                  background: resolving ? '#9CA3AF' : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: resolving ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: '700',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px rgba(37, 99, 235, 0.3)',
                  minWidth: '100px'
                }}
                onMouseOver={(e) => {
                  if (!resolving) {
                    e.target.style.background = 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)'
                    e.target.style.transform = 'translateY(-2px)'
                    e.target.style.boxShadow = '0 6px 12px rgba(37, 99, 235, 0.4)'
                  }
                }}
                onMouseOut={(e) => {
                  if (!resolving) {
                    e.target.style.background = 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)'
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = '0 4px 6px rgba(37, 99, 235, 0.3)'
                  }
                }}
              >
                {resolving ? 'Processing...' : 'OK'}
              </button>
              <button
                onClick={cancelResolve}
                disabled={resolving}
                style={{
                  padding: '12px 32px',
                  background: 'white',
                  color: '#374151',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  cursor: resolving ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  minWidth: '100px',
                  opacity: resolving ? 0.5 : 1
                }}
                onMouseOver={(e) => {
                  if (!resolving) {
                    e.target.style.background = '#F9FAFB'
                    e.target.style.borderColor = '#D1D5DB'
                  }
                }}
                onMouseOut={(e) => {
                  if (!resolving) {
                    e.target.style.background = 'white'
                    e.target.style.borderColor = '#E5E7EB'
                  }
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  )
}

export default ContactSubmissions