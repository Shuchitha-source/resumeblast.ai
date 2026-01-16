from flask import Blueprint, request, jsonify
import stripe
import os
import requests
from datetime import datetime
from dotenv import load_dotenv
import traceback

# Load environment variables
load_dotenv(override=True)

payment_webhook_bp = Blueprint('payment_webhook', __name__)

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')


def _get_headers():
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        # IMPORTANT: Do NOT expect return body on PATCH
        'Prefer': 'resolution=merge-duplicates'
    }


@payment_webhook_bp.route('/api/webhooks/stripe', methods=['POST'])
def stripe_webhook():
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')

    if not STRIPE_WEBHOOK_SECRET:
        print("❌ Webhook secret not configured")
        return jsonify({'error': 'Webhook secret missing'}), 500

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        print(f"❌ Invalid payload: {e}")
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError as e:
        print(f"❌ Invalid signature: {e}")
        return jsonify({'error': 'Invalid signature'}), 400

    print("\n" + "=" * 70)
    print(f"📥 Stripe Webhook Event: {event['type']}")
    print("=" * 70)

    if event['type'] == 'checkout.session.completed':
        try:
            handle_checkout_completed(event['data']['object'])
        except Exception as e:
            print("❌ Error processing webhook:")
            traceback.print_exc()
            # Always return 200 so Stripe does NOT retry endlessly

    return jsonify({'status': 'ok'}), 200


def handle_checkout_completed(session_payload):
    session_id = session_payload.get('id')

    print("\n" + "=" * 70)
    print(f"✅ Processing checkout.session.completed")
    print(f"Session ID: {session_id}")
    print("=" * 70)

    try:
        # ==========================================================
        # 1️⃣ Retrieve full session with expansions
        # ==========================================================
        session = stripe.checkout.Session.retrieve(
            session_id,
            expand=[
                'payment_intent',
                'payment_intent.payment_method',
                'payment_intent.charges'
            ]
        )

        payment_intent = session.payment_intent
        if not payment_intent:
            print("❌ No payment_intent found")
            return

        payment_intent_id = payment_intent.id
        print(f"✅ PaymentIntent: {payment_intent_id}")

        # ==========================================================
        # 2️⃣ Extract payment method (card)
        # ==========================================================
        card_brand = None
        card_last4 = None
        payment_method_type = 'card'

        payment_method = payment_intent.payment_method

        if isinstance(payment_method, str):
            payment_method = stripe.PaymentMethod.retrieve(payment_method)

        if payment_method and hasattr(payment_method, 'card'):
            card_brand = payment_method.card.brand
            card_last4 = payment_method.card.last4

        print(f"💳 Card: {card_brand} **** {card_last4}")

        # ==========================================================
        # 3️⃣ Extract receipt URL
        # ==========================================================
        receipt_url = None

        if payment_intent.charges and payment_intent.charges.data:
            receipt_url = payment_intent.charges.data[0].receipt_url

        print(f"🧾 Receipt URL: {receipt_url}")

        # ==========================================================
        # 4️⃣ Verify payment record exists in Supabase
        # ==========================================================
        check_url = (
            f"{SUPABASE_URL}/rest/v1/payments"
            f"?stripe_session_id=eq.{session_id}&select=id"
        )

        check_resp = requests.get(check_url, headers=_get_headers())

        if check_resp.status_code != 200 or not check_resp.json():
            print("❌ Payment record not found in database")
            print("⚠️ Webhook will not update anything")
            return

        print("✅ Payment record found in database")

        # ==========================================================
        # 5️⃣ Prepare update payload
        # ==========================================================
        update_data = {
            "status": "completed",
            "payment_intent_id": payment_intent_id,
            "completed_at": datetime.utcnow().isoformat(),
            "payment_method": payment_method_type,
            "card_brand": card_brand,
            "card_last4": card_last4,
            "receipt_url": receipt_url,
            "amount": session.amount_total,
            "currency": session.currency
        }

        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}

        # ==========================================================
        # 6️⃣ Update payment record (PATCH)
        # ==========================================================
        update_url = (
            f"{SUPABASE_URL}/rest/v1/payments"
            f"?stripe_session_id=eq.{session_id}"
        )

        resp = requests.patch(
            update_url,
            json=update_data,
            headers=_get_headers()
        )

        if resp.status_code == 204:
            print("✅ Payment record updated successfully")
        else:
            print(f"❌ Failed to update payment record")
            print(f"Status: {resp.status_code}")
            print(resp.text)

        print("\n" + "=" * 70)
        print("✅ WEBHOOK PROCESSING COMPLETE")
        print("=" * 70)

    except Exception as e:
        print("❌ Fatal error in webhook handler")
        traceback.print_exc()
        raise
