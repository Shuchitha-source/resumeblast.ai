import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { verifyPayment } from '../services/paymentService';

function PaymentSuccessHandler() {
  const processedSessions = useRef(new Set());

  useEffect(() => {
    handlePaymentCallback();
  }, []);

  const handlePaymentCallback = async () => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const paymentStatus = params.get('payment');

    if (paymentStatus !== 'success' || !sessionId) return;
    if (processedSessions.current.has(sessionId)) return;

    processedSessions.current.add(sessionId);

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase.from('user_activity').insert({
        user_id: user.id,
        email: user.email,
        event_type: 'payment_success_viewed',
        event_timestamp: new Date().toISOString(),
        metadata: { session_id: sessionId }
      });
    }

    try {
      const result = await verifyPayment(sessionId);

      if (result.success) {
        console.log('✅ Payment verified & stored');
      } else {
        console.warn('⚠️ Payment not completed yet');
      }
    } catch (err) {
      console.error('❌ Payment verification failed', err);
    }
  };

  return null;
}

export default PaymentSuccessHandler;
