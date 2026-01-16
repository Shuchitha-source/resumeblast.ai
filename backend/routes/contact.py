# backend/routes/contact.py
from flask import Blueprint, request, jsonify
import os
from datetime import datetime
import requests
from dotenv import load_dotenv

load_dotenv()

contact_bp = Blueprint('contact', __name__)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

# Brevo Configuration
BREVO_API_KEY = os.getenv('BREVO_API_KEY')
SUPPORT_EMAIL = 'support@shirotechnologies.com'
BREVO_SENDER_EMAIL = os.getenv('BREVO_SENDER_EMAIL', 'noreply@resumeblast.ai')
BREVO_SENDER_NAME = os.getenv('BREVO_SENDER_NAME', 'ResumeBlast Support')

@contact_bp.route('/api/contact/submit', methods=['POST'])
def submit_contact():
    try:
        data = request.get_json()
        
        print("📧 Received contact form submission:")
        print(f"   Name: {data.get('name')}")
        print(f"   Email: {data.get('email')}")
        
        # 1. Validate required fields
        required_fields = ['name', 'email', 'subject', 'message']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # 2. Generate Ticket ID
        ticket_id = f"TKT-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}"

        # 3. Prepare data for Supabase
        # ✅ FIX: We are now targeting the 'support_tickets' table you showed in screenshots
        submission_data = {
            'user_name': data['name'],      
            'user_email': data['email'],    
            'subject': data['subject'],
            'message': data['message'],
            'status': 'open',               # Changed to 'open' to match standard ticket status
            'ticket_id': ticket_id,         # Added via SQL in Step 1
            'created_at': datetime.utcnow().isoformat()
        }
        
        # 4. Insert into 'support_tickets' table (instead of contact_submissions)
        url = f"{SUPABASE_URL}/rest/v1/support_tickets"
        headers = {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
        
        response = requests.post(url, json=submission_data, headers=headers, verify=False)
        
        if response.status_code in [200, 201]:
            print(f"✅ Ticket saved to DB. ID: {ticket_id}")
            
            # 5. Send Email via Brevo
            if BREVO_API_KEY:
                print(f"📨 Sending email to {SUPPORT_EMAIL}...")
                
                email_payload = {
                    "sender": {"name": BREVO_SENDER_NAME, "email": BREVO_SENDER_EMAIL},
                    "replyTo": {"name": data['name'], "email": data['email']},
                    "to": [{"email": SUPPORT_EMAIL, "name": "Support Team"}],
                    "subject": f"🎫 Support Ticket: {data['subject']} [{ticket_id}]",
                    "htmlContent": f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>New Support Ticket</title></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f9fafb;">
<div style="background:#fff;max-width:600px;margin:20px auto;padding:30px;border-radius:10px;border:1px solid #e5e7eb;box-shadow:0 2px 5px rgba(0,0,0,0.05);">
    <div style="border-bottom:1px solid #eee;padding-bottom:15px;margin-bottom:20px;">
        <h2 style="color:#DC2626;margin:0;">🎫 New Support Ticket</h2>
        <p style="color:#666;margin:5px 0 0 0;font-size:14px;">Ticket ID: <strong>{ticket_id}</strong></p>
    </div>
    <div style="background:#f3f4f6;padding:15px;border-radius:5px;margin-bottom:20px;">
        <p style="margin:5px 0;"><strong>👤 User:</strong> {data['name']}</p>
        <p style="margin:5px 0;"><strong>📧 Email:</strong> <a href="mailto:{data['email']}" style="color:#DC2626;text-decoration:none;">{data['email']}</a></p>
        <p style="margin:5px 0;"><strong>📋 Subject:</strong> {data['subject']}</p>
    </div>
    <h3 style="color:#333;font-size:16px;">Message:</h3>
    <div style="background:#fff;border:1px solid #e5e7eb;padding:15px;border-radius:5px;color:#374151;line-height:1.6;white-space:pre-wrap;">{data['message']}</div>
</div>
</body>
</html>
"""
                }
                
                try:
                    brevo_response = requests.post(
                        'https://api.brevo.com/v3/smtp/email',
                        headers={'accept': 'application/json', 'api-key': BREVO_API_KEY, 'content-type': 'application/json'},
                        json=email_payload,
                        timeout=10
                    )
                    if brevo_response.status_code in [200, 201]:
                        print(f"✅ Support email sent successfully!")
                    else:
                        print(f"⚠️ Failed to send support email: {brevo_response.text}")
                except Exception as e:
                    print(f"❌ Error sending email: {str(e)}")
            else:
                print("⚠️ BREVO_API_KEY not configured, skipping email notification.")

            return jsonify({
                'success': True,
                'message': 'Support ticket created successfully',
                'ticket_id': ticket_id
            }), 200
        else:
            print(f"❌ Supabase error: {response.status_code}")
            print(f"   Response: {response.text}")
            return jsonify({'error': f'Database error: {response.text}'}), 500
        
    except Exception as e:
        print(f"❌ Contact submission error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500