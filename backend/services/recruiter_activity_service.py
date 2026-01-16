import os
import requests
from datetime import datetime
import json

class RecruiterActivityService:
    """
    Service for tracking recruiter activities using direct HTTP requests to Supabase REST API
    This approach avoids websocket dependency issues with the Supabase Python client
    """
    
    @staticmethod
    def _get_headers():
        """Get headers for Supabase REST API requests"""
        api_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        return {
            'apikey': api_key,
            'Authorization': f"Bearer {api_key}",
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    
    @staticmethod
    def _get_base_url():
        """Get base URL for Supabase REST API"""
        return f"{os.getenv('SUPABASE_URL')}/rest/v1"
    
    @staticmethod
    def log_activity(recruiter_id, activity_type, activity_details=None):
        """
        Log recruiter activity to recruiter_activity table
        
        Args:
            recruiter_id: UUID of the recruiter
            activity_type: Type of activity (login, logout, disclaimer_accepted, etc.)
            activity_details: Additional details as dictionary
        
        Returns:
            dict: {'success': bool, 'data': dict/None, 'error': str/None}
        """
        try:
            url = f"{RecruiterActivityService._get_base_url()}/recruiter_activity"
            
            activity_data = {
                'recruiter_id': recruiter_id,
                'activity_type': activity_type,
                'activity_details': activity_details or {},
                'created_at': datetime.utcnow().isoformat()
            }
            
            print(f"📝 Logging recruiter activity: {activity_type} for recruiter {recruiter_id}")
            
            response = requests.post(
                url,
                headers=RecruiterActivityService._get_headers(),
                json=activity_data,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                print(f"✅ Recruiter activity logged successfully: {activity_type}")
                return {'success': True, 'data': response.json()}
            else:
                error_msg = f"Status {response.status_code}: {response.text}"
                print(f"❌ Failed to log activity: {error_msg}")
                return {'success': False, 'error': error_msg}
            
        except Exception as e:
            print(f"❌ Error logging recruiter activity: {str(e)}")
            import traceback
            traceback.print_exc()
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def get_recruiter_activities(recruiter_id, limit=50, activity_type=None):
        """
        Get activity log for a specific recruiter
        
        Args:
            recruiter_id: UUID of the recruiter
            limit: Number of records to return
            activity_type: Filter by specific activity type (optional)
        
        Returns:
            dict: {'success': bool, 'data': list/None, 'error': str/None}
        """
        try:
            url = f"{RecruiterActivityService._get_base_url()}/recruiter_activity"
            
            # Build query parameters
            params = {
                'recruiter_id': f'eq.{recruiter_id}',
                'order': 'created_at.desc',
                'limit': limit
            }
            
            if activity_type:
                params['activity_type'] = f'eq.{activity_type}'
            
            print(f"🔍 Fetching activities for recruiter: {recruiter_id}")
            
            response = requests.get(
                url,
                headers=RecruiterActivityService._get_headers(),
                params=params,
                timeout=10
            )
            
            if response.status_code == 200:
                print(f"✅ Successfully fetched {len(response.json())} activities")
                return {'success': True, 'data': response.json()}
            else:
                error_msg = f"Status {response.status_code}: {response.text}"
                print(f"❌ Failed to fetch activities: {error_msg}")
                return {'success': False, 'error': error_msg}
            
        except Exception as e:
            print(f"❌ Error fetching recruiter activities: {str(e)}")
            import traceback
            traceback.print_exc()
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def get_all_recruiter_activities(limit=100):
        """
        Get all recruiter activities (admin only)
        
        Args:
            limit: Number of records to return
        
        Returns:
            dict: {'success': bool, 'data': list/None, 'error': str/None}
        """
        try:
            url = f"{RecruiterActivityService._get_base_url()}/recruiter_activity"
            
            # Build query parameters with embedded recruiter data
            params = {
                'select': '*,recruiters(email,name,company)',
                'order': 'created_at.desc',
                'limit': limit
            }
            
            print(f"🔍 Fetching all recruiter activities (limit: {limit})")
            
            response = requests.get(
                url,
                headers=RecruiterActivityService._get_headers(),
                params=params,
                timeout=10
            )
            
            if response.status_code == 200:
                activities = response.json()
                print(f"✅ Successfully fetched {len(activities)} activities")
                return {'success': True, 'data': activities}
            else:
                error_msg = f"Status {response.status_code}: {response.text}"
                print(f"❌ Failed to fetch all activities: {error_msg}")
                return {'success': False, 'error': error_msg}
            
        except Exception as e:
            print(f"❌ Error fetching all recruiter activities: {str(e)}")
            import traceback
            traceback.print_exc()
            return {'success': False, 'error': str(e)}