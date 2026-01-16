from flask import Blueprint, request, jsonify
from services.recruiter_activity_service import RecruiterActivityService

recruiter_activity_bp = Blueprint('recruiter_activity', __name__, url_prefix='/api/recruiter-activity')

@recruiter_activity_bp.route('/log', methods=['POST'])
def log_activity():
    """Log recruiter activity"""
    try:
        data = request.json
        recruiter_id = data.get('recruiter_id')
        activity_type = data.get('activity_type')
        activity_details = data.get('activity_details', {})
        
        if not recruiter_id or not activity_type:
            return jsonify({
                'success': False,
                'error': 'recruiter_id and activity_type are required'
            }), 400
        
        result = RecruiterActivityService.log_activity(
            recruiter_id=recruiter_id,
            activity_type=activity_type,
            activity_details=activity_details
        )
        
        return jsonify(result), 200 if result['success'] else 500
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@recruiter_activity_bp.route('/<recruiter_id>', methods=['GET'])
def get_activities(recruiter_id):
    """Get activities for a specific recruiter"""
    try:
        limit = request.args.get('limit', 50, type=int)
        activity_type = request.args.get('activity_type')
        
        result = RecruiterActivityService.get_recruiter_activities(
            recruiter_id=recruiter_id,
            limit=limit,
            activity_type=activity_type
        )
        
        return jsonify(result), 200 if result['success'] else 500
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@recruiter_activity_bp.route('/admin/all', methods=['GET'])
def get_all_activities():
    """Get all recruiter activities (admin only)"""
    try:
        limit = request.args.get('limit', 100, type=int)
        
        result = RecruiterActivityService.get_all_recruiter_activities(limit=limit)
        
        return jsonify(result), 200 if result['success'] else 500
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500