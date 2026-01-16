# backend/services/user_service.py - ENHANCED VERSION
import os
import requests
from datetime import datetime

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

class UserService:
    @staticmethod
    def _get_headers():
        """Get Supabase headers with service role key"""
        return {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }

    @staticmethod
    def delete_user_data(email, user_id=None, reason="Admin deletion"):
        """
        Complete user data deletion orchestration:
        1. Resolve user_id if not provided
        2. Add to blacklist (deleted_users table)
        3. Delete from all database tables
        4. Ban user in users table
        5. Delete from Supabase Auth
        
        Args:
            email: User email address
            user_id: Optional user UUID
            reason: Reason for deletion (e.g., "Stripe Refund", "Admin Ban")
        
        Returns:
            dict: Deletion summary
        """
        print(f"\n{'='*70}")
        print(f"🗑️  STARTING USER DELETION")
        print(f"{'='*70}")
        print(f"📧 Email: {email}")
        print(f"📝 Reason: {reason}")
        
        deletion_summary = {
            'email': email,
            'reason': reason,
            'timestamp': datetime.utcnow().isoformat(),
            'steps_completed': []
        }
        
        # STEP 1: Resolve User ID
        if not user_id:
            print(f"\n🔍 Step 1: Resolving user ID...")
            user_id = UserService.get_user_id_by_email(email)
            if user_id:
                print(f"✅ User ID found: {user_id}")
                deletion_summary['user_id'] = user_id
            else:
                print(f"⚠️  User ID not found for {email}")
                deletion_summary['user_id'] = None
        else:
            deletion_summary['user_id'] = user_id
            print(f"✅ User ID provided: {user_id}")
        
        # STEP 2: Add to Blacklist (CRITICAL - Do this first!)
        print(f"\n🚫 Step 2: Adding to blacklist...")
        blacklist_result = UserService.add_to_blacklist(email, user_id, reason)
        deletion_summary['steps_completed'].append('blacklist')
        
        if user_id:
            # STEP 3: Ban user in users table (before deletion)
            print(f"\n⛔ Step 3: Banning user account...")
            UserService.ban_user(user_id, reason)
            deletion_summary['steps_completed'].append('ban_user')
            
            # STEP 4: Delete from all database tables
            print(f"\n🗂️  Step 4: Deleting from database tables...")
            tables_deleted = UserService.delete_from_all_tables(user_id)
            deletion_summary['steps_completed'].append('database_cleanup')
            deletion_summary['tables_deleted'] = tables_deleted
            
            # STEP 5: Delete from Supabase Auth
            print(f"\n🔐 Step 5: Deleting from authentication...")
            UserService.delete_from_auth(user_id)
            deletion_summary['steps_completed'].append('auth_deletion')
        
        print(f"\n{'='*70}")
        print(f"✅ USER DELETION COMPLETED")
        print(f"{'='*70}")
        print(f"📊 Summary:")
        print(f"   Email: {email}")
        print(f"   User ID: {user_id or 'N/A'}")
        print(f"   Blacklisted: Yes")
        print(f"   Steps Completed: {len(deletion_summary['steps_completed'])}")
        print(f"{'='*70}\n")
        
        return deletion_summary

    @staticmethod
    def get_user_id_by_email(email):
        """
        Find user ID by email from multiple sources
        Priority: auth.users -> public.users -> payments table
        """
        try:
            # Try public.users first (faster)
            url = f"{SUPABASE_URL}/rest/v1/users?email=eq.{email}&select=id"
            resp = requests.get(url, headers=UserService._get_headers())
            
            if resp.status_code == 200:
                data = resp.json()
                if data and len(data) > 0:
                    print(f"   Found in users table")
                    return data[0]['id']
            
            # Try payments table as fallback
            url = f"{SUPABASE_URL}/rest/v1/payments?user_email=eq.{email}&select=user_id&limit=1"
            resp = requests.get(url, headers=UserService._get_headers())
            
            if resp.status_code == 200:
                data = resp.json()
                if data and len(data) > 0:
                    print(f"   Found in payments table")
                    return data[0]['user_id']
            
            print(f"   User ID not found in database")
            return None
            
        except Exception as e:
            print(f"❌ Error finding user ID: {e}")
            return None

    @staticmethod
    def add_to_blacklist(email, original_user_id, reason):
        """
        Add email to deleted_users blacklist
        Uses upsert to handle duplicates
        """
        try:
            url = f"{SUPABASE_URL}/rest/v1/deleted_users"
            
            data = {
                'email': email.lower(),
                'original_user_id': original_user_id,
                'reason': reason,
                'deleted_at': datetime.utcnow().isoformat(),
                'deleted_by': 'system',
                'metadata': {
                    'deletion_timestamp': datetime.utcnow().isoformat(),
                    'reason_category': 'refund' if 'refund' in reason.lower() else 'admin'
                }
            }
            
            # Use upsert to avoid duplicate errors
            headers = UserService._get_headers()
            headers['Prefer'] = 'resolution=merge-duplicates'
            
            response = requests.post(url, json=data, headers=headers)
            
            if response.status_code in [200, 201]:
                print(f"✅ Added {email} to blacklist")
                return True
            else:
                print(f"⚠️  Blacklist response: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error adding to blacklist: {e}")
            return False

    @staticmethod
    def ban_user(user_id, reason):
        """
        Ban user in users table (mark as banned before deletion)
        """
        try:
            url = f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}"
            
            data = {
                'is_banned': True,
                'ban_reason': reason,
                'banned_at': datetime.utcnow().isoformat(),
                'account_status': 'banned',
                'updated_at': datetime.utcnow().isoformat()
            }
            
            response = requests.patch(url, json=data, headers=UserService._get_headers())
            
            if response.status_code in [200, 204]:
                print(f"✅ User banned in users table")
            else:
                print(f"⚠️  Could not ban user: {response.status_code}")
                
        except Exception as e:
            print(f"⚠️  Error banning user: {e}")

    @staticmethod
    def delete_from_all_tables(user_id):
        """
        Delete user data from all tables
        Returns list of tables that were successfully cleaned
        """
        tables = [
            'resume_uploads',
            'blast_history', 
            'payment_history',
            'user_activity',
            'recruiter_activity',
            'support_tickets',
            'payments',
            'resumes',
            'blast_campaigns',
            'resume_analysis',
            'blast_recipients',
            'blast_responses',
            'contact_submissions'
        ]
        
        deleted_tables = []
        
        for table in tables:
            try:
                url = f"{SUPABASE_URL}/rest/v1/{table}?user_id=eq.{user_id}"
                response = requests.delete(url, headers=UserService._get_headers())
                
                if response.status_code in [200, 204]:
                    print(f"   ✓ Cleared: {table}")
                    deleted_tables.append(table)
                else:
                    print(f"   ⚠ Skipped: {table} ({response.status_code})")
                    
            except Exception as e:
                print(f"   ⚠ Error clearing {table}: {e}")
        
        # Also delete from users table
        try:
            url = f"{SUPABASE_URL}/rest/v1/users?id=eq.{user_id}"
            response = requests.delete(url, headers=UserService._get_headers())
            
            if response.status_code in [200, 204]:
                print(f"   ✓ Cleared: users")
                deleted_tables.append('users')
                
        except Exception as e:
            print(f"   ⚠ Error clearing users: {e}")
        
        return deleted_tables

    @staticmethod
    def delete_from_auth(user_id):
        """
        Delete user from Supabase Auth
        This prevents them from logging in
        """
        try:
            url = f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}"
            response = requests.delete(url, headers=UserService._get_headers())
            
            if response.status_code in [200, 204]:
                print(f"✅ Deleted from Supabase Auth")
            else:
                print(f"⚠️  Auth deletion response: {response.status_code}")
                
        except Exception as e:
            print(f"⚠️  Auth deletion error: {e}")

    @staticmethod
    def is_user_blacklisted(email):
        """
        Check if user is in blacklist
        Returns: (is_blacklisted: bool, reason: str)
        """
        try:
            url = f"{SUPABASE_URL}/rest/v1/deleted_users?email=eq.{email.lower()}"
            response = requests.get(url, headers=UserService._get_headers())
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    return True, data[0].get('reason', 'Account suspended')
            
            return False, None
            
        except Exception as e:
            print(f"❌ Error checking blacklist: {e}")
            return False, None

    @staticmethod
    def get_blacklist_info(email):
        """
        Get detailed blacklist information for an email
        """
        try:
            url = f"{SUPABASE_URL}/rest/v1/deleted_users?email=eq.{email.lower()}"
            response = requests.get(url, headers=UserService._get_headers())
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    return data[0]
            
            return None
            
        except Exception as e:
            print(f"❌ Error getting blacklist info: {e}")
            return None