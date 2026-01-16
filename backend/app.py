from flask import Flask, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv, find_dotenv
from routes.contact import contact_bp

# ✅ METHOD 1: Try to find .env automatically
dotenv_path = find_dotenv()
if dotenv_path:
    print(f"✅ Found .env at: {dotenv_path}")
    load_dotenv(dotenv_path=dotenv_path, override=True)
else:
    print("⚠️ .env file not found by find_dotenv(), trying manual path...")
    # ✅ METHOD 2: Manual path as fallback
    from pathlib import Path
    backend_dir = Path(__file__).parent
    manual_env_path = backend_dir / '.env'
    print(f"🔍 Trying manual path: {manual_env_path}")
    if manual_env_path.exists():
        load_dotenv(dotenv_path=manual_env_path, override=True)
        print(f"✅ Loaded .env from: {manual_env_path}")
    else:
        print(f"❌ .env not found at: {manual_env_path}")

# ✅ VERIFY ALL ENVIRONMENT VARIABLES
print("\n" + "="*70)
print("🔒 ENVIRONMENT VARIABLES CHECK")
print("="*70)

supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
stripe_key = os.getenv('STRIPE_SECRET_KEY')
anthropic_key = os.getenv('ANTHROPIC_API_KEY')
stripe_webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')

print(f"SUPABASE_URL: {supabase_url if supabase_url else '❌ NOT SET'}")
print(f"SUPABASE_KEY: {'✅ SET (' + supabase_key[:20] + '...)' if supabase_key else '❌ NOT SET'}")
print(f"STRIPE_KEY: {'✅ SET (' + stripe_key[:15] + '...)' if stripe_key else '❌ NOT SET'}")
print(f"ANTHROPIC_KEY: {'✅ SET (' + anthropic_key[:15] + '...)' if anthropic_key else '❌ NOT SET'}")
print(f"STRIPE_WEBHOOK_SECRET: {'✅ SET (' + stripe_webhook_secret[:15] + '...)' if stripe_webhook_secret else '⚠️ NOT SET (optional for webhooks)'}")
print("="*70 + "\n")

# ❌ STOP SERVER IF CRITICAL VARS MISSING
if not supabase_url:
    print("🚨 CRITICAL ERROR: SUPABASE_URL is not set!")
    print("   Please check your .env file in the backend folder")
    print("   Expected location: backend/.env")
    exit(1)

# Import routes AFTER environment is loaded
from routes.payment import payment_bp
from routes.blast import blast_bp
from routes.auth import auth_bp 
from routes.analyze import analyze_bp 
from routes.admin import admin_bp
from routes.recruiter_activity import recruiter_activity_bp
from routes.support_ticket import support_ticket_bp
from routes.user_management import user_management_bp
from routes.payment_webhook import payment_webhook_bp  # ✅ NEW WEBHOOK BLUEPRINT

app = Flask(__name__)

# ✅ FIXED: Added PATCH to allowed methods for support ticket resolution
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3000",
            "https://resumeblast.ai",
        ],
        "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],  # ✅ ADDED PATCH
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Register Blueprints
app.register_blueprint(payment_bp)
app.register_blueprint(blast_bp)
app.register_blueprint(auth_bp) 
app.register_blueprint(analyze_bp) 
app.register_blueprint(admin_bp)
app.register_blueprint(recruiter_activity_bp)
app.register_blueprint(contact_bp)
app.register_blueprint(support_ticket_bp)
app.register_blueprint(user_management_bp)
app.register_blueprint(payment_webhook_bp)  # ✅ REGISTER WEBHOOK BLUEPRINT

@app.route('/')
def home():
    return jsonify({
        'status': 'success',
        'message': 'ResumeBlast API is running',
        'version': '1.0.0'
    })

@app.route('/api/health')
def health():
    return jsonify({
        'status': 'healthy',
        'stripe_configured': bool(os.getenv('STRIPE_SECRET_KEY')),
        'webhook_configured': bool(os.getenv('MAKE_WEBHOOK_URL')),
        'supabase_configured': bool(os.getenv('SUPABASE_SERVICE_ROLE_KEY')),
        'anthropic_configured': bool(os.getenv('ANTHROPIC_API_KEY')),
        'stripe_webhook_configured': bool(os.getenv('STRIPE_WEBHOOK_SECRET'))
    })

# ✅ NEW: Debug route to verify CORS is working
@app.route('/api/test-cors', methods=['GET', 'POST', 'PATCH'])
def test_cors():
    return jsonify({
        'success': True,
        'message': 'CORS is working correctly',
        'method': 'PATCH allowed',
        'cors_enabled': True
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    print('\n' + '='*70)
    print('🚀 RESUMEBLAST API SERVER STARTING')
    print('='*70)
    print(f'🌐 Port: {port}')
    print(f'🔧 Debug Mode: {debug}')
    print(f'💳 Stripe Webhook: /api/webhooks/stripe')
    print(f'🎫 Support Tickets: CORS enabled with PATCH method')  # ✅ NEW
    print('='*70 + '\n')
    
    app.run(host='0.0.0.0', port=port, debug=debug)