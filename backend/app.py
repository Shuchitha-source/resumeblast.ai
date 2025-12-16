from flask import Flask, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

# ADD "routes." HERE ↓
from routes.payment import payment_bp
from routes.blast import blast_bp

app = Flask(__name__)

CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3000",
            "https://resumeblast.ai",
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

app.register_blueprint(payment_bp)
app.register_blueprint(blast_bp)

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
        'webhook_configured': bool(os.getenv('MAKE_WEBHOOK_URL'))
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    print('\n' + '='*50)
    print('🚀 ResumeBlast API Server Starting')
    print('='*50)
    print(f'📍 Port: {port}')
    print(f'🔧 Debug: {debug}')
    print(f'💳 Stripe: {"✅ Configured" if os.getenv("STRIPE_SECRET_KEY") else "❌ Not Configured"}')
    print(f'🌐 Webhook: {"✅ Configured" if os.getenv("MAKE_WEBHOOK_URL") else "❌ Not Configured"}')
    print('='*50 + '\n')
    
    app.run(host='0.0.0.0', port=port, debug=debug)