// /frontend/src/services/paymentService.js - FIXED VERSION
import { loadStripe } from '@stripe/stripe-js';

// Get Stripe publishable key from environment
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Validate configuration on load
if (!STRIPE_PUBLIC_KEY) {
  console.error('❌ CRITICAL: VITE_STRIPE_PUBLIC_KEY is not set in .env file!');
  console.error('Please add: VITE_STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY_HERE');
}

if (!API_URL) {
  console.error('❌ CRITICAL: VITE_API_URL is not set in .env file!');
  console.error('Please add: VITE_API_URL=http://localhost:5000');
}

console.log('💳 paymentService.js loaded');
console.log('🔑 Stripe Public Key:', STRIPE_PUBLIC_KEY ? '✅ Set' : '❌ Missing');
console.log('🌐 API URL:', API_URL);

// Initialize Stripe
const stripePromise = STRIPE_PUBLIC_KEY ? loadStripe(STRIPE_PUBLIC_KEY) : null;

/**
 * Initiate Stripe Checkout for ResumeBlast Premium
 * @param {Object} user - User object with email and id
 * @returns {Promise} - Resolves when checkout is initiated
 */
export const initiateCheckout = async (user) => {
  try {
    console.log('');
    console.log('=== 💳 INITIATING CHECKOUT ===');
    console.log('👤 User:', user?.email);
    console.log('🆔 User ID:', user?.id);

    // STEP 1: Validate Stripe configuration
    if (!STRIPE_PUBLIC_KEY) {
      throw new Error(
        '❌ Stripe not configured!\n\n' +
        'Please follow these steps:\n' +
        '1. Go to https://dashboard.stripe.com/\n' +
        '2. Get your Publishable Key (starts with pk_test_)\n' +
        '3. Add to .env file: VITE_STRIPE_PUBLIC_KEY=your_key\n' +
        '4. Restart your frontend server'
      );
    }

    // STEP 2: Validate API URL
    if (!API_URL) {
      throw new Error('❌ API URL not configured in .env file');
    }

    // STEP 3: Validate user data
    if (!user || !user.email || !user.id) {
      throw new Error('❌ User information is incomplete');
    }

    // STEP 4: Load Stripe
    console.log('📦 Loading Stripe...');
    const stripe = await stripePromise;
    
    if (!stripe) {
      throw new Error('❌ Failed to load Stripe. Check your publishable key.');
    }
    
    console.log('✅ Stripe loaded successfully');

    // STEP 5: Create checkout session on backend
    console.log('🔗 Creating checkout session...');
    console.log('📡 Calling:', `${API_URL}/api/create-checkout-session`);

    const response = await fetch(`${API_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        email: user.email,
        user_id: user.id 
      }),
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response ok:', response.ok);

    // STEP 6: Handle response
    if (!response.ok) {
      let errorMessage = 'Payment initialization failed';
      
      try {
        const errorData = await response.json();
        console.error('❌ Backend error:', errorData);
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        // If JSON parsing fails, try to get text
        const errorText = await response.text();
        console.error('❌ Backend error (text):', errorText);
        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    // STEP 7: Parse successful response
    let session;
    try {
      session = await response.json();
      console.log('✅ Session created:', session.id);
    } catch (parseError) {
      console.error('❌ Failed to parse response:', parseError);
      throw new Error('Invalid response from payment server');
    }

    // STEP 8: Validate session data
    if (!session.success && !session.id) {
      throw new Error(session.error || 'Failed to create checkout session');
    }

    // ============================================================
    // ✅ CRITICAL FIX: Direct Redirect using URL from Backend
    // ============================================================
    if (session.url) {
      console.log('🚀 Redirecting directly to Stripe URL:', session.url);
      window.location.href = session.url; // Force browser to navigate
      return;
    }
    // ============================================================

    if (!session.id) {
      console.error('❌ Session response:', session);
      throw new Error('No session ID returned from server');
    }

    // STEP 9: Redirect to Stripe Checkout (Fallback method)
    console.log('🚀 Redirecting to Stripe Checkout (Fallback)...');
    console.log('🔗 Session ID:', session.id);
    
    const result = await stripe.redirectToCheckout({
      sessionId: session.id,
    });

    // STEP 10: Handle redirect errors (only called if redirect fails)
    if (result.error) {
      console.error('❌ Stripe redirect error:', result.error);
      throw new Error(result.error.message || 'Failed to redirect to checkout');
    }

    console.log('=== ✅ CHECKOUT INITIATED ===');
    console.log('');

  } catch (error) {
    console.log('');
    console.error('=== ❌ CHECKOUT ERROR ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.log('');

    // Enhanced error messages
    if (error.message.includes('Failed to fetch')) {
      throw new Error(
        '❌ Network Error\n\n' +
        'Cannot connect to payment server. Please check:\n' +
        '1. Backend server is running (npm run dev in backend folder)\n' +
        '2. API_URL is correct in .env file\n' +
        '3. Your internet connection\n' +
        '4. Firewall settings'
      );
    }

    throw error;
  }
};

/**
 * Verify payment completion
 * @param {string} sessionId - Stripe session ID
 * @returns {Promise<Object>} - Payment verification result
 */
export const verifyPayment = async (sessionId) => {
  try {
    console.log('🔍 Verifying payment session:', sessionId);

    const response = await fetch(`${API_URL}/api/payment/verify`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ session_id: sessionId }),
    });

    if (!response.ok) {
      throw new Error('Payment verification failed');
    }

    const data = await response.json();
    console.log('✅ Payment verified:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Verification error:', error);
    throw error;
  }
};

/**
 * Test payment API connection
 * @returns {Promise<Object>} - Test result
 */
export const testPaymentAPI = async () => {
  try {
    console.log('🧪 Testing payment API...');
    console.log('🔗 Testing URL:', `${API_URL}/api/payment/test`);

    const response = await fetch(`${API_URL}/api/payment/test`);
    const data = await response.json();
    
    console.log('✅ Payment API test result:', data);
    
    return {
      success: response.ok,
      status: response.status,
      data: data
    };
  } catch (error) {
    console.error('❌ Payment API test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Handle payment success callback
 * @param {string} sessionId - Stripe session ID from URL parameter
 */
export const handlePaymentSuccess = async (sessionId) => {
  try {
    console.log('🎉 Payment successful! Session ID:', sessionId);
    
    // Verify the payment
    const verification = await verifyPayment(sessionId);
    
    if (verification.success && verification.payment_status === 'paid') {
      console.log('✅ Payment verified and completed');
      return {
        success: true,
        message: 'Payment successful! You now have access to premium features.',
        verification
      };
    }
    
    return {
      success: false,
      message: 'Payment verification pending. Please contact support if you were charged.'
    };
  } catch (error) {
    console.error('❌ Error handling payment success:', error);
    return {
      success: false,
      message: 'Error verifying payment. Please contact support.',
      error: error.message
    };
  }
};

/**
 * Handle payment cancellation
 */
export const handlePaymentCancellation = () => {
  console.log('❌ Payment cancelled by user');
  return {
    success: false,
    message: 'Payment was cancelled. You can try again whenever you\'re ready.'
  };
};