# backend/routes/auth.py - ENHANCED WITH BLACKLIST CHECK
from flask import Blueprint, request, jsonify
from services.user_service import UserService
import os

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/auth/check-blacklist', methods=['POST'])
def check_blacklist():
    """
    Check if a user email is blacklisted before allowing signup/login
    
    Request body:
    {
        "email": "user@example.com"
    }
    
    Response:
    {
        "is_blacklisted": true/false,
        "reason": "reason for ban" (if blacklisted),
        "message": "error message to display"
    }
    """
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        
        if not email:
            return jsonify({
                'success': False,
                'error': 'Email is required'
            }), 400
        
        # Check if user is blacklisted
        is_blacklisted, reason = UserService.is_user_blacklisted(email)
        
        if is_blacklisted:
            print(f"🚫 Blacklisted user attempted access: {email}")
            
            return jsonify({
                'success': False,
                'is_blacklisted': True,
                'reason': reason,
                'message': (
                    'Your account has been suspended. '
                    'Please contact support@resumeblast.ai for assistance.'
                )
            }), 403
        
        # User is not blacklisted, allow to proceed
        return jsonify({
            'success': True,
            'is_blacklisted': False,
            'message': 'Account is in good standing'
        }), 200
        
    except Exception as e:
        print(f"❌ Error checking blacklist: {e}")
        return jsonify({
            'success': False,
            'error': 'Error checking account status'
        }), 500


@auth_bp.route('/api/auth/status', methods=['POST'])
def check_auth_status():
    """
    Check user authentication and blacklist status
    
    Request body:
    {
        "email": "user@example.com",
        "user_id": "uuid" (optional)
    }
    """
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        user_id = data.get('user_id')
        
        if not email:
            return jsonify({
                'success': False,
                'error': 'Email is required'
            }), 400
        
        # Check blacklist
        is_blacklisted, reason = UserService.is_user_blacklisted(email)
        
        if is_blacklisted:
            # Get detailed blacklist info
            blacklist_info = UserService.get_blacklist_info(email)
            
            return jsonify({
                'success': False,
                'is_blacklisted': True,
                'is_banned': True,
                'reason': reason,
                'blacklist_details': {
                    'deleted_at': blacklist_info.get('deleted_at'),
                    'deleted_by': blacklist_info.get('deleted_by'),
                    'original_user_id': blacklist_info.get('original_user_id')
                },
                'message': (
                    'This account has been permanently suspended. '
                    'If you believe this is an error, please contact support@resumeblast.ai '
                    'with your account details.'
                )
            }), 403
        
        return jsonify({
            'success': True,
            'is_blacklisted': False,
            'is_banned': False,
            'message': 'Account status: Active'
        }), 200
        
    except Exception as e:
        print(f"❌ Error checking auth status: {e}")
        return jsonify({
            'success': False,
            'error': 'Error checking account status'
        }), 500


@auth_bp.route('/api/auth/test', methods=['GET'])
def test_auth():
    """Test endpoint to verify auth route is working"""
    return jsonify({
        'success': True,
        'message': 'Auth API is online',
        'endpoints': [
            '/api/auth/check-blacklist',
            '/api/auth/status'
        ]
    }), 200