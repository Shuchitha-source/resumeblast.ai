from flask import Blueprint, request, jsonify
import os
import stripe
from datetime import datetime
import requests
from dotenv import load_dotenv

load_dotenv()

payment_bp = Blueprint('payment', __name__)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')


def _get_headers():
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
    }


# =========================================================
# CREATE CHECKOUT SESSION (UNCHANGED)
# =========================================================
@payment_bp.route('/api/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        data = request.get_json()
        user_email = data.get('email')
        user_id = data.get('user_id')

        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': 'ResumeBlast Premium',
                        'description': 'AI-powered resume distribution',
                    },
                    'unit_amount': 14900,
                },
                'quantity': 1,
            }],
            mode='payment',
            customer_email=user_email,
            client_reference_id=str(user_id),
            success_url=f'{FRONTEND_URL}?payment=success&session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{FRONTEND_URL}?payment=cancelled',
        )

        payment_record = {
            "user_id": user_id,
            "user_email": user_email,
            "user_name": user_email.split('@')[0] if user_email else "unknown",
            "stripe_session_id": checkout_session.id,
            "amount": 14900,
            "currency": "usd",
            "status": "initiated",
            "initiated_at": datetime.utcnow().isoformat()
        }

        requests.post(
            f"{SUPABASE_URL}/rest/v1/payments",
            json=payment_record,
            headers=_get_headers()
        )

        return jsonify({
            "success": True,
            "id": checkout_session.id,
            "url": checkout_session.url
        })

    except Exception as e:
        print("❌ Checkout Error:", str(e))
        return jsonify({"success": False, "error": str(e)}), 500


# =========================================================
# VERIFY PAYMENT (FIXED – NO charges ATTRIBUTE)
# =========================================================
@payment_bp.route('/api/payment/verify', methods=['POST'])
def verify_payment():
    try:
        print("\n================ PAYMENT VERIFY =================")
        print("SUPABASE_KEY LOADED:", bool(SUPABASE_KEY))

        data = request.get_json()
        session_id = data.get('session_id')

        if not session_id:
            return jsonify({"error": "session_id required"}), 400

        # 1️⃣ Fetch Checkout Session
        session = stripe.checkout.Session.retrieve(
            session_id,
            expand=['payment_intent', 'payment_intent.payment_method']
        )

        print("Stripe payment_status:", session.payment_status)

        if session.payment_status != 'paid':
            return jsonify({"success": False})

        payment_intent = session.payment_intent
        print("PaymentIntent:", payment_intent.id)

        # 2️⃣ Card details
        card_brand = None
        card_last4 = None
        receipt_url = None

        if payment_intent.payment_method:
            pm = payment_intent.payment_method
            if isinstance(pm, str):
                pm = stripe.PaymentMethod.retrieve(pm)
            if pm.card:
                card_brand = pm.card.brand
                card_last4 = pm.card.last4

        # 3️⃣ Retrieve charge SAFELY (NEW STRIPE WAY)
        if payment_intent.latest_charge:
            charge = stripe.Charge.retrieve(payment_intent.latest_charge)
            receipt_url = charge.receipt_url

        update_data = {
            "status": "completed",
            "payment_intent_id": payment_intent.id,
            "completed_at": datetime.utcnow().isoformat(),
            "payment_method": "card",
            "card_brand": card_brand,
            "card_last4": card_last4,
            "receipt_url": receipt_url,
            "amount": session.amount_total,
            "currency": session.currency
        }

        update_data = {k: v for k, v in update_data.items() if v is not None}

        print("Updating DB for session:", session_id)
        print("Update payload:", update_data)

        resp = requests.patch(
            f"{SUPABASE_URL}/rest/v1/payments?stripe_session_id=eq.{session_id}",
            json=update_data,
            headers=_get_headers()
        )

        print("SUPABASE PATCH STATUS:", resp.status_code)
        print("SUPABASE PATCH RESPONSE:", resp.text)

        if resp.status_code != 204:
            return jsonify({"error": "Supabase update failed"}), 500

        print("✅ PAYMENT VERIFIED & STORED")
        print("=================================================\n")

        return jsonify({"success": True})

    except Exception as e:
        print("❌ VERIFY PAYMENT CRASH:", str(e))
        return jsonify({"error": str(e)}), 500
