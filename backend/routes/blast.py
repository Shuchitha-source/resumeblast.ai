from flask import Blueprint, request, jsonify
import requests
import os
from datetime import datetime

blast_bp = Blueprint('blast', __name__)

# Get webhook URL from environment
MAKE_WEBHOOK_URL = os.getenv('MAKE_WEBHOOK_URL')

@blast_bp.route('/api/blast/send', methods=['POST'])
def send_blast():
    """
    Send resume blast via Make.com webhook
    This endpoint acts as a proxy to avoid CORS issues
    """
    try:
        print("\n=== 🚀 BLAST REQUEST RECEIVED ===")
        
        # Get data from frontend
        blast_data = request.json
        print(f"📦 Blast data: {blast_data}")
        
        # Validate required fields
        if not blast_data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        if not blast_data.get('recipients'):
            return jsonify({
                'success': False,
                'error': 'Recipients array is required'
            }), 400
        
        if len(blast_data.get('recipients', [])) == 0:
            return jsonify({
                'success': False,
                'error': 'At least one recipient is required'
            }), 400
        
        # Validate webhook URL
        if not MAKE_WEBHOOK_URL:
            return jsonify({
                'success': False,
                'error': 'Make.com webhook URL not configured in backend .env'
            }), 500
        
        print(f"📡 Sending to Make.com: {MAKE_WEBHOOK_URL}")
        
        # Forward request to Make.com
        response = requests.post(
            MAKE_WEBHOOK_URL,
            json=blast_data,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"📥 Make.com response: {response.status_code}")
        print(f"📄 Response text: {response.text}")
        
        # Check if request was successful
        if response.status_code >= 400:
            return jsonify({
                'success': False,
                'error': f'Make.com returned error: {response.status_code}',
                'details': response.text
            }), 502
        
        # Return success response
        return jsonify({
            'success': True,
            'message': 'Blast sent successfully',
            'status': response.status_code,
            'response': response.text,
            'recipients_count': len(blast_data.get('recipients', []))
        }), 200
        
    except requests.exceptions.Timeout:
        print("❌ Timeout error")
        return jsonify({
            'success': False,
            'error': 'Request to Make.com timed out'
        }), 504
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to connect to Make.com: {str(e)}'
        }), 502
        
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@blast_bp.route('/api/blast/test', methods=['GET'])
def test_blast():
    """Test endpoint to verify blast API is working"""
    return jsonify({
        'success': True,
        'message': 'Blast API is working',
        'webhook_configured': bool(MAKE_WEBHOOK_URL),
        'timestamp': datetime.utcnow().isoformat()
    }), 200