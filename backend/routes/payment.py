import os
import stripe
from flask import Blueprint, request, jsonify
from datetime import datetime

payment_bp = Blueprint('payment', __name__)

# Initialize Stripe with your Secret Key
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5174')

print('💳 Payment module loaded')
print('🔐 Stripe API Key configured:', 'YES' if stripe.api_key else 'NO')
print('🌐 Frontend URL:', FRONTEND_URL)


@payment_bp.route('/api/create-checkout-session', methods=['POST', 'OPTIONS'])
def create_checkout_session():
    """Create Stripe Checkout Session for ResumeBlast Premium"""
    
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    
    try:
        print('\n=== 💳 CREATING CHECKOUT SESSION ===')
        
        # Get request data
        data = request.json
        if not data:
            print('❌ No data received in request')
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        user_email = data.get('email')
        user_id = data.get('user_id')
        
        print(f'📧 User email: {user_email}')
        print(f'🆔 User ID: {user_id}')
        
        # Validate required fields
        if not user_email:
            return jsonify({
                'success': False,
                'error': 'Email is required'
            }), 400
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'User ID is required'
            }), 400
        
        # Validate Stripe API key
        if not stripe.api_key:
            print('❌ Stripe API key not configured')
            return jsonify({
                'success': False,
                'error': 'Payment system not configured. Please contact support.'
            }), 500
        
        print('📝 Creating Stripe checkout session...')
        
        # Create Stripe Checkout Session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': 'ResumeBlast Premium',
                        'description': 'AI-Powered Resume Distribution to 500+ Recruiters',
                        'images': ['https://resumeblast.ai/logo.png'],  # Optional: Add your logo URL
                    },
                    'unit_amount': 14900,  # $149.00 in cents
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f'{FRONTEND_URL}?payment=success&session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{FRONTEND_URL}?payment=cancelled',
            customer_email=user_email,
            client_reference_id=user_id,
            metadata={
                'user_id': user_id,
                'user_email': user_email,
                'plan_type': 'premium',
                'product': 'resume_blast',
                'recruiter_count': 500
            },
            billing_address_collection='required',
            phone_number_collection={
                'enabled': True
            }
        )
        
        print(f'✅ Checkout session created: {checkout_session.id}')
        print(f'🔗 Checkout URL: {checkout_session.url}')
        
        return jsonify({
            'success': True,
            'id': checkout_session.id,
            'url': checkout_session.url
        }), 200
        
    except stripe.error.CardError as e:
        # Card was declined
        print(f'❌ Card Error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'Your card was declined. Please try a different payment method.'
        }), 400
        
    except stripe.error.RateLimitError as e:
        print(f'❌ Rate Limit Error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'Too many requests. Please try again in a moment.'
        }), 429
        
    except stripe.error.InvalidRequestError as e:
        print(f'❌ Invalid Request: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'Invalid payment request. Please contact support.'
        }), 400
        
    except stripe.error.AuthenticationError as e:
        print(f'❌ Authentication Error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'Payment authentication failed. Please contact support.'
        }), 500
        
    except stripe.error.APIConnectionError as e:
        print(f'❌ Network Error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'Network error. Please check your connection and try again.'
        }), 500
        
    except stripe.error.StripeError as e:
        print(f'❌ Stripe Error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'Payment processing error. Please try again.'
        }), 500
        
    except Exception as e:
        print(f'❌ Unexpected Error: {str(e)}')
        return jsonify({
            'success': False,
            'error': 'An unexpected error occurred. Please try again.'
        }), 500


@payment_bp.route('/api/payment/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhook events"""
    
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
    
    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        else:
            event = stripe.Event.construct_from(
                request.json, stripe.api_key
            )
        
        print(f'\n=== 🎣 WEBHOOK RECEIVED ===')
        print(f'Event type: {event["type"]}')
        
        # Handle successful payment
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            
            print(f'✅ Payment successful!')
            print(f'Customer email: {session.get("customer_email")}')
            print(f'Amount paid: ${session.get("amount_total", 0) / 100}')
            
            # TODO: Update your database here
            # - Mark user as premium
            # - Grant access to blast features
            # - Send confirmation email
            
        return jsonify({'received': True}), 200
        
    except Exception as e:
        print(f'❌ Webhook error: {str(e)}')
        return jsonify({'error': str(e)}), 400


@payment_bp.route('/api/payment/verify', methods=['POST'])
def verify_payment():
    """Verify a payment session"""
    
    try:
        data = request.json
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({
                'success': False,
                'error': 'Session ID required'
            }), 400
        
        # Retrieve the session from Stripe
        session = stripe.checkout.Session.retrieve(session_id)
        
        return jsonify({
            'success': True,
            'payment_status': session.payment_status,
            'customer_email': session.customer_email,
            'amount_total': session.amount_total / 100,
            'metadata': session.metadata
        }), 200
        
    except Exception as e:
        print(f'❌ Verification error: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@payment_bp.route('/api/payment/test', methods=['GET'])
def test_payment():
    """Test endpoint to verify payment API is working"""
    return jsonify({
        'success': True,
        'message': 'Payment API is working',
        'stripe_configured': bool(stripe.api_key),
        'frontend_url': FRONTEND_URL,
        'timestamp': datetime.utcnow().isoformat()
    }), 200