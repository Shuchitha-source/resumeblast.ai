import { loadStripe } from '@stripe/stripe-js';

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

export const initiateCheckout = async (user) => {
  const stripe = await stripePromise;

  const response = await fetch(`${API_URL}/api/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: user.email,
      user_id: user.id
    })
  });

  const session = await response.json();
  window.location.href = session.url;
};

export const verifyPayment = async (sessionId) => {
  const response = await fetch(`${API_URL}/api/payment/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId })
  });

  return response.json();
};
