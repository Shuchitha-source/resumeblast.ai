from flask import Blueprint, request, jsonify
import os
import requests
from datetime import datetime, timedelta, timezone
import time

admin_bp = Blueprint('admin', __name__)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

def _get_headers():
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
    }

def get_all_rows(table, query=''):
    """Helper to fetch data from Supabase"""
    try:
        url = f"{SUPABASE_URL}/rest/v1/{table}?{query}"
        resp = requests.get(url, headers=_get_headers())
        return resp.json() if resp.status_code == 200 else []
    except:
        return []

# =========================================================
# 1. REVENUE ANALYTICS (Fixed: Today, 7 Days, Filters)
# =========================================================
@admin_bp.route('/api/admin/revenue', methods=['GET'])
def get_revenue():
    try:
        # Get query parameters for custom date range
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')

        # Fetch ALL payments (ordered by newest first)
        all_payments = get_all_rows('payments', 'select=*&order=created_at.desc')

        # --- Helper: Parse Dates ---
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        seven_days_ago = now - timedelta(days=7)

        # --- Filter Logic ---
        filtered_payments = all_payments
        if start_date_str and end_date_str:
            # If custom range is provided
            try:
                start_dt = datetime.strptime(start_date_str, '%Y-%m-%d').replace(tzinfo=timezone.utc)
                end_dt = datetime.strptime(end_date_str, '%Y-%m-%d').replace(tzinfo=timezone.utc) + timedelta(days=1) # Include end date
                
                filtered_payments = [
                    p for p in all_payments 
                    if start_dt <= datetime.fromisoformat(p['created_at'].replace('Z', '+00:00')) < end_dt
                ]
            except ValueError:
                pass # Ignore invalid date formats

        # --- Categorize Payments (Filtered List) ---
        completed = [p for p in filtered_payments if p.get('status') == 'completed']
        failed = [p for p in filtered_payments if p.get('status') == 'failed']
        refunded = [p for p in filtered_payments if p.get('status') == 'refunded']

        # --- Calculate Metrics (Filtered List) ---
        total_revenue = sum(p.get('amount', 0) for p in completed) / 100
        failed_amount = sum(p.get('amount', 0) for p in failed) / 100
        refunded_amount = sum(p.get('refund_amount', 0) for p in refunded) / 100

        # --- Calculate Time-Based Metrics (From ALL payments) ---
        # Today's Revenue
        today_payments = [
            p for p in all_payments 
            if p.get('status') == 'completed' and 
            datetime.fromisoformat(p['created_at'].replace('Z', '+00:00')) >= today_start
        ]
        today_revenue = sum(p.get('amount', 0) for p in today_payments) / 100
        today_transactions = len(today_payments)

        # Last 7 Days Revenue
        last_7_payments = [
            p for p in all_payments 
            if p.get('status') == 'completed' and 
            datetime.fromisoformat(p['created_at'].replace('Z', '+00:00')) >= seven_days_ago
        ]
        last_7_revenue = sum(p.get('amount', 0) for p in last_7_payments) / 100

        # --- Daily Breakdown (Last 7 Days) ---
        daily_breakdown = []
        for i in range(7):
            day_date = now - timedelta(days=i)
            day_start = day_date.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            day_payments = [
                p for p in all_payments 
                if p.get('status') == 'completed' and 
                day_start <= datetime.fromisoformat(p['created_at'].replace('Z', '+00:00')) < day_end
            ]
            
            daily_breakdown.append({
                'date': day_start.isoformat(),
                'revenue': sum(p.get('amount', 0) for p in day_payments) / 100,
                'transactions': len(day_payments)
            })
        
        # Return consolidated response
        return jsonify({
            'total_revenue': round(total_revenue, 2),
            'transactions': len(completed),
            'today_revenue': round(today_revenue, 2),
            'today_transactions': today_transactions,
            'last_7_days_revenue': round(last_7_revenue, 2),
            'daily_breakdown': daily_breakdown,
            'failed_payments': {
                'count': len(failed),
                'amount': round(failed_amount, 2),
                'payments': failed[:20]
            },
            'refunded_payments': {
                'count': len(refunded),
                'amount': round(refunded_amount, 2),
                'payments': refunded[:20]
            }
        }), 200

    except Exception as e:
        print(f"Admin Revenue Error: {e}")
        return jsonify({'error': str(e)}), 500

# =========================================================
# 2. USERS MANAGEMENT (Fixed: Fetch Users)
# =========================================================
@admin_bp.route('/api/admin/users', methods=['GET'])
def get_users():
    try:
        # Fetch users from the public 'users' table
        # We assume 'users' table is synced or updated via activityTrackingService
        users = get_all_rows('users', 'select=*&order=created_at.desc')
        
        return jsonify({
            'count': len(users),
            'users': users
        }), 200
    except Exception as e:
        print(f"Admin Users Error: {e}")
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/api/admin/users/delete', methods=['POST'])
def delete_user_proxy():
    # This acts as a proxy to the user_management logic if needed
    # Ideally, user_management_bp handles this, but for completeness:
    from services.user_service import UserService
    try:
        data = request.json
        email = data.get('email')
        user_id = data.get('user_id')
        reason = data.get('reason', 'Admin Dashboard Deletion')
        
        result = UserService.delete_user_data(email, user_id, reason)
        return jsonify({'success': True, 'details': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# =========================================================
# 3. SYSTEM HEALTH (Fixed: Detailed Stats)
# =========================================================
@admin_bp.route('/api/admin/health', methods=['GET'])
def get_health():
    try:
        # Check Supabase
        supabase_status = "Healthy"
        try:
            requests.get(f"{SUPABASE_URL}/rest/v1/users?limit=1", headers=_get_headers(), timeout=5)
        except:
            supabase_status = "Unreachable"

        # Check Stripe
        stripe_status = "Configured" if os.getenv('STRIPE_SECRET_KEY') else "Missing Key"
        
        # Check Brevo
        email_status = "Configured" if os.getenv('BREVO_API_KEY') else "Missing Key"

        return jsonify({
            'Database': supabase_status,
            'Payments': stripe_status,
            'Email Service': email_status,
            'AI Service': "Configured" if os.getenv('ANTHROPIC_API_KEY') else "Missing Key",
            'API': 'Online'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/api/admin/server-status', methods=['GET'])
def get_server_status():
    start_time = time.time()
    try:
        # Quick DB ping to measure latency
        requests.get(f"{SUPABASE_URL}/rest/v1/", headers=_get_headers(), timeout=2)
        latency = round((time.time() - start_time) * 1000, 2)
        
        return jsonify({
            'uptime': 'Running', # Simplified
            'services': {
                'Database': {'status': 'Online', 'response_code': 200, 'latency': f"{latency}ms"},
                'Server': {'status': 'Online', 'response_code': 200}
            },
            'configuration': {
                'Stripe': 'Set' if os.getenv('STRIPE_SECRET_KEY') else 'Missing',
                'Supabase': 'Set' if os.getenv('SUPABASE_URL') else 'Missing',
                'Anthropic': 'Set' if os.getenv('ANTHROPIC_API_KEY') else 'Missing'
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =========================================================
# 4. SUPPORT TICKETS (Enhanced with Resolve & Unread Count)
# =========================================================
@admin_bp.route('/api/admin/contact-submissions', methods=['GET'])
def get_contact_submissions():
    try:
        filter_status = request.args.get('filter', 'all')
        
        query = 'select=*&order=created_at.desc'
        if filter_status == 'unread':
            query += '&status=eq.unread'
        elif filter_status == 'open':
            query += '&status=eq.open'
        elif filter_status == 'resolved':
            query += '&status=eq.resolved'
            
        submissions = get_all_rows('support_tickets', query)
        
        # Map fields if necessary to match frontend expectations
        mapped_submissions = []
        for sub in submissions:
            mapped_submissions.append({
                'id': sub.get('id'),
                'name': sub.get('user_name'),
                'email': sub.get('user_email'),
                'subject': sub.get('subject'),
                'message': sub.get('message'),
                'status': sub.get('status', 'open'),  # Can be: unread, open, resolved
                'submitted_at': sub.get('created_at'),
                'ticket_id': sub.get('ticket_id'),
                'admin_notes': sub.get('admin_notes', '')
            })
            
        return jsonify({'submissions': mapped_submissions}), 200
    except Exception as e:
        print(f"Admin Contact Error: {e}")
        return jsonify({'error': str(e)}), 500

# NEW: Get unread ticket count
@admin_bp.route('/api/admin/contact-submissions/unread-count', methods=['GET'])
def get_unread_count():
    try:
        # Count tickets with status 'unread'
        query = 'select=id&status=eq.unread'
        unread_tickets = get_all_rows('support_tickets', query)
        
        return jsonify({
            'unread_count': len(unread_tickets)
        }), 200
    except Exception as e:
        print(f"Admin Unread Count Error: {e}")
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/api/admin/contact-submissions/<ticket_id>/mark-read', methods=['PATCH'])
def mark_contact_read(ticket_id):
    try:
        # Mark as 'open' (not 'closed') to indicate it's been read but not resolved
        url = f"{SUPABASE_URL}/rest/v1/support_tickets?id=eq.{ticket_id}"
        requests.patch(url, json={'status': 'open'}, headers=_get_headers())
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# NEW: Toggle resolve/unresolve status
@admin_bp.route('/api/admin/contact-submissions/<ticket_id>/resolve', methods=['PATCH'])
def toggle_resolve_status(ticket_id):
    try:
        data = request.json
        new_status = data.get('status', 'resolved')  # Can be 'resolved' or 'open'
        
        # Validate status
        if new_status not in ['open', 'resolved']:
            return jsonify({'error': 'Invalid status. Must be "open" or "resolved"'}), 400
        
        url = f"{SUPABASE_URL}/rest/v1/support_tickets?id=eq.{ticket_id}"
        response = requests.patch(url, json={'status': new_status}, headers=_get_headers())
        
        if response.status_code in [200, 204]:
            return jsonify({'success': True, 'status': new_status}), 200
        else:
            return jsonify({'error': 'Failed to update status'}), 500
            
    except Exception as e:
        print(f"Admin Resolve Error: {e}")
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/api/admin/contact-submissions/<ticket_id>/notes', methods=['PATCH'])
def update_contact_notes(ticket_id):
    try:
        notes = request.json.get('admin_notes')
        url = f"{SUPABASE_URL}/rest/v1/support_tickets?id=eq.{ticket_id}"
        requests.patch(url, json={'admin_notes': notes}, headers=_get_headers())
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =========================================================
# 5. GENERAL STATS (Monitoring Tab)
# =========================================================
@admin_bp.route('/api/admin/stats', methods=['GET'])
def get_stats():
    try:
        users = get_all_rows('users', 'select=id')
        active_users = get_all_rows('users', 'select=id&account_status=eq.active')
        blasts = get_all_rows('blast_campaigns', 'select=id')
        resumes = get_all_rows('resumes', 'select=id')
        payments = get_all_rows('payments', 'select=amount&status=eq.completed')
        
        revenue = sum(p.get('amount', 0) for p in payments) / 100
        
        return jsonify({
            'total_users': len(users),
            'active_users': len(active_users),
            'total_blasts': len(blasts),
            'total_resume_uploads': len(resumes),
            'total_revenue': round(revenue, 2)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500