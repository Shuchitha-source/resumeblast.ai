# backend/routes/support_ticket.py
from flask import Blueprint, request, jsonify
import os
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

support_ticket_bp = Blueprint('support_ticket', __name__)

# Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
BREVO_API_KEY = os.getenv('BREVO_API_KEY')

# ✅ TARGET EMAIL (Based on your requirements)
SUPPORT_EMAIL = 'support@shirotechnologies.com'

# ✅ SENDER IDENTITY
# This MUST be a verified sender in your Brevo account (e.g., the email you used to sign up)
# If 'noreply@resumeblast.ai' is not verified, change this to your personal verified email for testing.
BREVO_SENDER_EMAIL = 'noreply@resumeblast.ai' 
BREVO_SENDER_NAME = 'ResumeBlast Support'

@support_ticket_bp.route('/api/support-ticket/submit', methods=['POST'])
def submit_support_ticket():
    try:
        data = request.get_json()
        
        print("\n" + "=" * 60)
        print("🎫 SUPPORT TICKET RECEIVED")
        
        # 1. Validate inputs
        required_fields = ['name', 'email', 'subject', 'message']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        user_name = data['name']
        user_email = data['email']
        subject = data['subject']
        message = data['message']
        
        # 2. Generate ID
        ticket_id = f"TKT-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}"
        print(f"   User: {user_name} ({user_email})")
        print(f"   Ticket ID: {ticket_id}")

        # 3. Store in DB with 'unread' status
        db_payload = {
            'ticket_id': ticket_id,
            'user_name': user_name,
            'user_email': user_email,
            'subject': subject,
            'message': message,
            'status': 'unread',  # ✅ Changed from 'open' to 'unread'
            'created_at': datetime.utcnow().isoformat()
        }
        
        supabase_url = f"{SUPABASE_URL}/rest/v1/support_tickets"
        supabase_headers = {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
        
        db_response = requests.post(
            supabase_url, 
            json=db_payload, 
            headers=supabase_headers, 
            verify=False,
            timeout=10
        )
        
        if db_response.status_code in [200, 201]:
            print(f"✅ DB Save Success (Status: unread)")
        else:
            print(f"⚠️ DB Save Failed: {db_response.text}")

        # 4. Send Email
        if not BREVO_API_KEY:
            print("❌ BREVO_API_KEY is missing in .env")
            return jsonify({'success': True, 'message': 'Ticket saved, but email config missing'}), 200

        print(f"📤 Sending email to: {SUPPORT_EMAIL}")
        
        email_payload = {
            "sender": {
                "name": BREVO_SENDER_NAME,
                "email": BREVO_SENDER_EMAIL 
            },
            # This makes "Reply" go to the user
            "replyTo": {
                "email": user_email,
                "name": user_name
            },
            "to": [
                {
                    "email": SUPPORT_EMAIL,
                    "name": "Support Team"
                }
            ],
            "subject": f"🎫 Support: {subject} [{ticket_id}]",
            "htmlContent": f"""
            <html>
            <body style="font-family:Arial, sans-serif; padding:20px;">
                <div style="border-left: 4px solid #DC2626; padding-left: 15px;">
                    <h2>🆕 New Support Ticket</h2>
                    <p><strong>From:</strong> {user_name} ({user_email})</p>
                    <p><strong>Ticket ID:</strong> {ticket_id}</p>
                    <p><strong>Status:</strong> <span style="color: #DC2626; font-weight: bold;">UNREAD</span></p>
                </div>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <h3 style="color: #333;">{subject}</h3>
                <p style="white-space: pre-wrap; color: #555;">{message}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #999;">
                    This is an automated notification from ResumeBlast.ai Admin System.<br>
                    Please log in to the admin dashboard to view and respond to this ticket.
                </p>
            </body>
            </html>
            """
        }
        
        brevo_resp = requests.post(
            'https://api.brevo.com/v3/smtp/email',
            headers={
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json'
            },
            json=email_payload,
            timeout=10
        )
        
        # 📝 DETAILED LOGGING FOR DEBUGGING
        print(f"   Brevo Status: {brevo_resp.status_code}")
        print(f"   Brevo Response: {brevo_resp.text}")

        if brevo_resp.status_code in [200, 201]:
            print("✅ Email Sent Successfully")
        else:
            print("❌ Email Failed to Send")

        print("=" * 60 + "\n")

        return jsonify({
            'success': True,
            'message': 'Ticket received',
            'ticket_id': ticket_id
        }), 200

    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return jsonify({'error': str(e)}), 500