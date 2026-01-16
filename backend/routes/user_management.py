# backend/routes/user_management.py
from flask import Blueprint, request, jsonify
from services.user_service import UserService

user_management_bp = Blueprint('user_management', __name__)

@user_management_bp.route('/api/admin/users/delete', methods=['POST'])
def delete_user():
    try:
        data = request.json
        email = data.get('email')
        user_id = data.get('user_id')
        reason = data.get('reason', 'Admin deletion')
        
        if not email:
            return jsonify({'success': False, 'error': 'Email required'}), 400
            
        # Use the centralized Service
        success = UserService.delete_user_data(email, user_id, reason)
        
        return jsonify({
            'success': success, 
            'message': 'User deleted and blacklisted'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Keep get_deleted_users and check_deleted_user routes as they were...