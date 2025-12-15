from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import blueprints
from routes.blast import blast_bp

# Create Flask app
app = Flask(__name__)

# ENHANCED CORS CONFIGURATION - This fixes the connection issue
CORS(app, 
     resources={
         r"/*": {  # Allow all routes
             "origins": ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True,
             "expose_headers": ["Content-Type"],
             "max_age": 3600
         }
     },
     supports_credentials=True)

# Add after_request handler for additional CORS headers
@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    if origin in ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]:
        response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# Register blueprints
app.register_blueprint(blast_bp)

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'ResumeBlast Backend',
        'cors_enabled': True
    }), 200

# Root endpoint
@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'ResumeBlast API',
        'version': '1.0.0',
        'endpoints': {
            'blast': '/api/blast/send',
            'test': '/api/blast/test',
            'health': '/health'
        }
    }), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV', 'development') == 'development'
    
    print(f"\n🚀 Starting ResumeBlast Backend on port {port}")
    print(f"🌐 Environment: {os.getenv('FLASK_ENV', 'development')}")
    print(f"🔧 Debug mode: {debug}")
    print(f"✅ CORS enabled for: http://localhost:5173, http://localhost:3000")
    print(f"📡 Backend URL: http://localhost:{port}\n")
    
    app.run(host='0.0.0.0', port=port, debug=debug)