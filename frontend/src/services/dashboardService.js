// frontend/src/services/dashboardService.js - COMPLETE VERSION
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Fetch comprehensive revenue analytics
 * Includes successful, failed, and refunded payments
 */
export const getRevenueAnalytics = async (days = 30) => {
  try {
    console.log(`📊 Fetching revenue analytics (last ${days} days)...`);
    
    const response = await fetch(
      `${API_URL}/api/admin/analytics/revenue?days=${days}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch analytics: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Revenue analytics fetched successfully');
    
    return {
      success: true,
      analytics: data.analytics
    };

  } catch (error) {
    console.error('❌ Error fetching revenue analytics:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Fetch complete dashboard analytics in one call
 * Includes revenue, users, and recent activity
 */
export const getDashboardAnalytics = async () => {
  try {
    console.log('📊 Fetching dashboard analytics...');
    
    const response = await fetch(
      `${API_URL}/api/admin/analytics/dashboard`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Dashboard analytics fetched successfully');
    
    return {
      success: true,
      dashboard: data.dashboard
    };

  } catch (error) {
    console.error('❌ Error fetching dashboard analytics:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Fetch recent payments with optional status filter
 */
export const getRecentPayments = async (limit = 50, status = null) => {
  try {
    console.log(`📋 Fetching recent payments (limit: ${limit}, status: ${status || 'all'})...`);
    
    let url = `${API_URL}/api/admin/payments/recent?limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch payments: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Fetched ${data.count} payments`);
    
    return {
      success: true,
      payments: data.payments,
      count: data.count
    };

  } catch (error) {
    console.error('❌ Error fetching payments:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Fetch failed payment attempts
 */
export const getFailedPayments = async () => {
  try {
    console.log('❌ Fetching failed payments...');
    
    const response = await fetch(
      `${API_URL}/api/admin/payments/failed`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch failed payments: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Fetched ${data.summary.total_failures} failed payments`);
    
    return {
      success: true,
      failures: data.failures,
      failedPayments: data.failed_payments,
      summary: data.summary
    };

  } catch (error) {
    console.error('❌ Error fetching failed payments:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Fetch refunded payments
 */
export const getRefundedPayments = async () => {
  try {
    console.log('💸 Fetching refunded payments...');
    
    const response = await fetch(
      `${API_URL}/api/admin/payments/refunded`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch refunded payments: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Fetched ${data.summary.total_refunds} refunded payments`);
    
    return {
      success: true,
      refunds: data.refunds,
      summary: data.summary
    };

  } catch (error) {
    console.error('❌ Error fetching refunded payments:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Format currency for display
 */
export const formatCurrency = (amountInCents, currency = 'USD') => {
  if (!amountInCents && amountInCents !== 0) return 'N/A';
  
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Format date for display
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Calculate success rate percentage
 */
export const calculateSuccessRate = (successful, total) => {
  if (!total || total === 0) return 0;
  return ((successful / total) * 100).toFixed(2);
};

/**
 * Get payment status badge color
 */
export const getStatusColor = (status) => {
  const colors = {
    completed: 'green',
    pending: 'yellow',
    failed: 'red',
    refunded: 'orange',
    disputed: 'purple'
  };
  
  return colors[status] || 'gray';
};

/**
 * Export analytics data as CSV
 */
export const exportAnalyticsCSV = (analytics, filename = 'revenue_analytics.csv') => {
  try {
    // Prepare CSV data
    const rows = [];
    
    // Summary section
    rows.push(['Revenue Analytics Summary']);
    rows.push(['Metric', 'Value']);
    rows.push(['Total Revenue', analytics.summary.total_revenue_usd]);
    rows.push(['Net Revenue', analytics.summary.net_revenue_usd]);
    rows.push(['Total Refunded', analytics.summary.total_refunded_usd]);
    rows.push(['Failed Amount', analytics.summary.failed_amount_usd]);
    rows.push(['Successful Transactions', analytics.summary.successful_count]);
    rows.push(['Failed Transactions', analytics.summary.failed_count]);
    rows.push(['Refunded Transactions', analytics.summary.refunded_count]);
    rows.push(['Success Rate', `${analytics.summary.success_rate}%`]);
    rows.push([]);
    
    // Daily trends section
    if (analytics.daily_trends && analytics.daily_trends.length > 0) {
      rows.push(['Daily Trends']);
      rows.push(['Date', 'Successful', 'Failed', 'Refunded', 'Revenue', 'Refunded Amount']);
      
      analytics.daily_trends.forEach(day => {
        rows.push([
          day.date,
          day.successful,
          day.failed,
          day.refunded,
          formatCurrency(day.revenue),
          formatCurrency(day.refunded_amount)
        ]);
      });
      rows.push([]);
    }
    
    // Create CSV content
    const csvContent = rows.map(row => row.join(',')).join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    console.log('✅ Analytics exported as CSV');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error exporting CSV:', error);
    return {
      success: false,
      error: error.message
    };
  }
};