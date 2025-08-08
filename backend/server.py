from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, date, timedelta
import asyncio
from supabase import create_client, Client
from supabase_client import supabase_service

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Supabase configuration
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY are required")

# Create anon client for user operations
supabase_anon: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI(title="Strive - Multi-School Habit Tracker")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class SchoolCreate(BaseModel):
    name: str

class ClassCreate(BaseModel):
    name: str
    school_id: str

class InviteRequest(BaseModel):
    role: str = "student"  # student, teacher

class JoinClassRequest(BaseModel):
    invite_code: str

class HabitCreate(BaseModel):
    name: str
    repeats: str = "daily"  # daily, weekly, custom
    startDate: Optional[date] = None

class HabitLogCreate(BaseModel):
    date: date
    completed: bool

class School(BaseModel):
    id: str
    name: str
    created_at: datetime

class Class(BaseModel):
    id: str
    school_id: str
    name: str
    invite_code: Optional[str]
    created_at: datetime

class Membership(BaseModel):
    user_id: str
    school_id: str
    class_id: Optional[str]
    role: str

class Habit(BaseModel):
    id: str
    school_id: str
    class_id: Optional[str]
    user_id: str
    title: str
    frequency: str
    start_date: date
    created_at: datetime

class HabitLog(BaseModel):
    id: str
    habit_id: str
    user_id: str
    occurred_on: date
    completed: bool
    created_at: datetime

# Helper functions
def get_supabase_user(authorization: str) -> Dict[str, Any]:
    """Get user from Supabase JWT token."""
    try:
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header")
        
        token = authorization[7:]  # Remove "Bearer " prefix
        
        # Create client with user token
        client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        
        # Get user from token
        user_response = client.auth.get_user(token)
        
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        return user_response.user
        
    except Exception as e:
        logging.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

def get_user_client(authorization: str) -> Client:
    """Get Supabase client with user JWT token."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization[7:]
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    # Set the auth token for this client
    try:
        client.auth.set_session(token, None)
        return client
    except Exception as e:
        logging.error(f"Error setting auth session: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

async def get_current_user(authorization: str = Header(...)) -> Dict[str, Any]:
    """Dependency to get current authenticated user."""
    return get_supabase_user(authorization)

async def get_user_memberships(user_id: str, client: Client) -> List[Dict[str, Any]]:
    """Get user's memberships with school and class info."""
    try:
        result = client.table('memberships').select(
            '*, schools(*), classes(*)'
        ).eq('user_id', user_id).execute()
        
        return result.data or []
    except Exception as e:
        logging.error(f"Error fetching memberships: {e}")
        return []

async def get_primary_context(user_id: str, client: Client) -> Dict[str, Any]:
    """Get user's primary school/class context."""
    memberships = await get_user_memberships(user_id, client)
    
    if not memberships:
        raise HTTPException(status_code=404, detail="User not part of any school")
    
    # For now, return first membership (TODO: add context switching)
    return memberships[0]

async def calculate_habit_stats(habit_id: str, client: Client) -> Dict[str, Any]:
    """Calculate habit statistics."""
    try:
        # Get all logs for this habit
        logs_result = client.table('habit_logs').select(
            'occurred_on, completed'
        ).eq('habit_id', habit_id).order('occurred_on').execute()
        
        logs = logs_result.data or []
        
        if not logs:
            return {
                'current_streak': 0,
                'best_streak': 0,
                'percent_complete': 0.0
            }
        
        # Calculate current streak (from today backwards)
        current_streak = 0
        today = date.today()
        
        for i in range(30):  # Check last 30 days
            check_date = today - timedelta(days=i)
            log = next((l for l in logs if l['occurred_on'] == str(check_date)), None)
            if log and log['completed']:
                current_streak += 1
            else:
                break
        
        # Calculate best streak
        best_streak = 0
        temp_streak = 0
        
        for log in logs:
            if log['completed']:
                temp_streak += 1
                best_streak = max(best_streak, temp_streak)
            else:
                temp_streak = 0
        
        # Calculate completion rate
        total_logs = len(logs)
        completed_logs = sum(1 for log in logs if log['completed'])
        percent_complete = (completed_logs / total_logs * 100) if total_logs > 0 else 0
        
        return {
            'current_streak': current_streak,
            'best_streak': best_streak,
            'percent_complete': round(percent_complete, 1)
        }
    except Exception as e:
        logging.error(f"Error calculating habit stats: {e}")
        return {'current_streak': 0, 'best_streak': 0, 'percent_complete': 0.0}

# Routes
@api_router.post("/schools")
async def create_school(
    school_data: SchoolCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new school (admin operation)."""
    try:
        school = await supabase_service.create_school_and_admin(
            school_data.name, 
            current_user['id']
        )
        return {"school": school, "message": "School created successfully"}
    except Exception as e:
        logging.error(f"Error creating school: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/classes")
async def create_class(
    class_data: ClassCreate,
    authorization: str = Header(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new class (admin/teacher only)."""
    try:
        client = get_user_client(authorization)
        
        # Verify user has permission to create class in this school
        membership = await get_primary_context(current_user['id'], client)
        
        if membership['role'] not in ['admin', 'teacher']:
            raise HTTPException(status_code=403, detail="Only admins and teachers can create classes")
        
        result = client.table('classes').insert({
            'school_id': class_data.school_id,
            'name': class_data.name
        }).execute()
        
        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to create class")
        
        return {"class": result.data[0]}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating class: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/classes/{class_id}/invite")
async def generate_invite_code(
    class_id: str,
    invite_data: InviteRequest,
    authorization: str = Header(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Generate invite code for a class."""
    try:
        client = get_user_client(authorization)
        
        # Verify user has permission
        membership = await get_primary_context(current_user['id'], client)
        if membership['role'] not in ['admin', 'teacher']:
            raise HTTPException(status_code=403, detail="Only admins and teachers can generate invite codes")
        
        # Generate unique invite code
        invite_code = f"JOIN-{uuid.uuid4().hex[:8].upper()}"
        
        # Update class with invite code
        result = client.table('classes').update({
            'invite_code': invite_code
        }).eq('id', class_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Class not found")
        
        # Construct join URL
        join_url = f"/join?code={invite_code}"
        
        return {
            "invite_code": invite_code,
            "join_url": join_url,
            "expires_at": None  # For future implementation
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error generating invite code: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/join")
async def join_class_via_invite(
    join_data: JoinClassRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Join a class using invite code."""
    try:
        # Validate invite code
        class_info = await supabase_service.validate_invite_code(join_data.invite_code)
        
        if not class_info:
            raise HTTPException(status_code=404, detail="Invalid invite code")
        
        # Add user to class as student
        success = await supabase_service.add_user_to_class(
            current_user['id'],
            class_info['id'],
            class_info['school_id'],
            'student'
        )
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to join class")
        
        return {
            "message": f"Successfully joined class: {class_info['name']}",
            "class": class_info,
            "school": class_info['schools']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error joining class: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/user/context")
async def get_user_context(
    authorization: str = Header(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get user's current school/class context."""
    try:
        client = get_user_client(authorization)
        memberships = await get_user_memberships(current_user['id'], client)
        
        if not memberships:
            return {"memberships": [], "current_context": None}
        
        # Return first membership as current context (TODO: add switching)
        return {
            "memberships": memberships,
            "current_context": memberships[0]
        }
        
    except Exception as e:
        logging.error(f"Error fetching user context: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/habits")
async def get_habits(
    authorization: str = Header(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get user's habits with stats and recent logs."""
    try:
        client = get_user_client(authorization)
        
        # Get user's habits
        result = client.table('habits').select('*').eq('user_id', current_user['id']).execute()
        habits = result.data or []
        
        # Get today's date
        today = date.today()
        
        # Process each habit
        habit_data = []
        for habit in habits:
            # Get today's log
            today_log_result = client.table('habit_logs').select('*').eq(
                'habit_id', habit['id']
            ).eq('occurred_on', str(today)).execute()
            
            today_completed = bool(today_log_result.data and today_log_result.data[0]['completed'])
            
            # Get last 7 days of logs
            seven_days_ago = today - timedelta(days=6)
            recent_logs_result = client.table('habit_logs').select('*').eq(
                'habit_id', habit['id']
            ).gte('occurred_on', str(seven_days_ago)).lte(
                'occurred_on', str(today)
            ).order('occurred_on').execute()
            
            recent_logs = recent_logs_result.data or []
            
            # Calculate stats
            stats = await calculate_habit_stats(habit['id'], client)
            
            habit_data.append({
                'habit': habit,
                'today_completed': today_completed,
                'recent_logs': recent_logs,
                'stats': stats
            })
        
        return habit_data
        
    except Exception as e:
        logging.error(f"Error fetching habits: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/habits", status_code=201)
async def create_habit(
    habit_data: HabitCreate,
    authorization: str = Header(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new habit."""
    try:
        client = get_user_client(authorization)
        
        # Get user's context
        context = await get_primary_context(current_user['id'], client)
        
        # Create habit
        habit_doc = {
            'user_id': current_user['id'],
            'school_id': context['school_id'],
            'class_id': context['class_id'],
            'title': habit_data.name,
            'frequency': habit_data.repeats,
            'start_date': str(habit_data.startDate or date.today())
        }
        
        result = client.table('habits').insert(habit_doc).execute()
        
        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to create habit")
        
        created_habit = result.data[0]
        
        return {
            'habit': created_habit,
            'today_completed': False,
            'recent_logs': [],
            'stats': {
                'current_streak': 0,
                'best_streak': 0,
                'percent_complete': 0.0
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating habit: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/habits/{habit_id}/log")
async def log_habit(
    habit_id: str,
    log_data: HabitLogCreate,
    authorization: str = Header(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Log habit completion."""
    try:
        client = get_user_client(authorization)
        
        # Verify habit belongs to user
        habit_result = client.table('habits').select('*').eq(
            'id', habit_id
        ).eq('user_id', current_user['id']).execute()
        
        if not habit_result.data:
            raise HTTPException(status_code=404, detail="Habit not found")
        
        # Check if log already exists
        existing_log_result = client.table('habit_logs').select('*').eq(
            'habit_id', habit_id
        ).eq('occurred_on', str(log_data.date)).execute()
        
        if existing_log_result.data:
            # Update existing log
            result = client.table('habit_logs').update({
                'completed': log_data.completed
            }).eq('id', existing_log_result.data[0]['id']).execute()
            
            return result.data[0] if result.data else existing_log_result.data[0]
        else:
            # Create new log
            log_doc = {
                'habit_id': habit_id,
                'user_id': current_user['id'],
                'occurred_on': str(log_data.date),
                'completed': log_data.completed
            }
            
            result = client.table('habit_logs').insert(log_doc).execute()
            
            if not result.data:
                raise HTTPException(status_code=400, detail="Failed to log habit")
            
            return result.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error logging habit: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/my-class/feed")
async def get_class_feed(
    authorization: str = Header(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get class member feed with habit progress."""
    try:
        client = get_user_client(authorization)
        
        # Get user's context
        context = await get_primary_context(current_user['id'], client)
        class_id = context.get('class_id')
        
        if not class_id:
            return []
        
        # Get all members in the same class
        members_result = client.table('memberships').select(
            'user_id, role'
        ).eq('class_id', class_id).execute()
        
        members = members_result.data or []
        
        feed_data = []
        for member in members:
            # Get member's habits
            habits_result = client.table('habits').select('id').eq(
                'user_id', member['user_id']
            ).execute()
            
            habits = habits_result.data or []
            
            # Calculate aggregate stats
            total_habits = len(habits)
            best_current_streak = 0
            total_completion_rate = 0
            active_habits = 0
            
            for habit in habits:
                stats = await calculate_habit_stats(habit['id'], client)
                best_current_streak = max(best_current_streak, stats['current_streak'])
                total_completion_rate += stats['percent_complete']
                if stats['current_streak'] > 0:
                    active_habits += 1
            
            average_completion_rate = total_completion_rate / total_habits if total_habits > 0 else 0
            
            # Get recent activity
            recent_activity = "No recent activity"
            if habits:
                recent_log_result = client.table('habit_logs').select('created_at').in_(
                    'habit_id', [h['id'] for h in habits]
                ).order('created_at', desc=True).limit(1).execute()
                
                if recent_log_result.data:
                    created_at = datetime.fromisoformat(recent_log_result.data[0]['created_at'].replace('Z', '+00:00'))
                    days_ago = (datetime.utcnow() - created_at).days
                    if days_ago == 0:
                        recent_activity = "Active today"
                    elif days_ago == 1:
                        recent_activity = "Active yesterday"
                    else:
                        recent_activity = f"Active {days_ago} days ago"
            
            # Get user info from auth
            # Note: In real implementation, you'd store user profiles
            user_name = f"User {member['user_id'][:8]}"  # Placeholder
            
            feed_data.append({
                'name': user_name,
                'role': member['role'],
                'current_best_streak': best_current_streak,
                'total_habits': total_habits,
                'completion_rate': round(average_completion_rate, 1),
                'recent_activity': recent_activity
            })
        
        # Sort by streak
        feed_data.sort(key=lambda x: x['current_best_streak'], reverse=True)
        
        return feed_data
        
    except Exception as e:
        logging.error(f"Error fetching class feed: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/my-class/info")
async def get_class_info(
    authorization: str = Header(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get current class information."""
    try:
        client = get_user_client(authorization)
        context = await get_primary_context(current_user['id'], client)
        
        # Get student count
        student_count_result = client.table('memberships').select('user_id').eq(
            'class_id', context['class_id']
        ).eq('role', 'student').execute()
        
        student_count = len(student_count_result.data or [])
        
        # Get teacher info
        teacher_result = client.table('memberships').select('user_id').eq(
            'class_id', context['class_id']
        ).eq('role', 'teacher').execute()
        
        teacher_name = "Unknown"
        if teacher_result.data:
            # In real implementation, get actual teacher name
            teacher_name = f"Teacher {teacher_result.data[0]['user_id'][:8]}"
        
        return {
            'class_name': context['classes']['name'] if context.get('classes') else 'Unknown Class',
            'teacher_name': teacher_name,
            'student_count': student_count,
            'your_role': context['role']
        }
        
    except Exception as e:
        logging.error(f"Error fetching class info: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/classes/{class_id}/analytics")
async def get_class_analytics(
    class_id: str,
    authorization: str = Header(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get class analytics (teacher/admin only)."""
    try:
        client = get_user_client(authorization)
        
        # Verify user has permission to access this class
        context = await get_primary_context(current_user['id'], client)
        
        if context['role'] not in ['admin', 'teacher']:
            raise HTTPException(status_code=403, detail="Only teachers and admins can access analytics")
        
        # Get class info
        class_result = client.table('classes').select('*').eq('id', class_id).execute()
        if not class_result.data:
            raise HTTPException(status_code=404, detail="Class not found")
        
        class_info = class_result.data[0]
        
        # Get all students in this class
        students_result = client.table('memberships').select('user_id').eq(
            'class_id', class_id
        ).eq('role', 'student').execute()
        
        students = students_result.data or []
        
        analytics = []
        total_completion_rate = 0
        all_streaks = []
        last_7_days_total = 0
        last_7_days_completed = 0
        
        for student in students:
            user_id = student['user_id']
            
            # Get student's habits
            habits_result = client.table('habits').select('id, title').eq(
                'user_id', user_id
            ).execute()
            
            habits = habits_result.data or []
            
            # Calculate analytics
            total_habits = len(habits)
            active_habits = 0
            best_current_streak = 0
            student_completion_rate = 0
            
            for habit in habits:
                stats = await calculate_habit_stats(habit['id'], client)
                if stats['current_streak'] > 0:
                    active_habits += 1
                best_current_streak = max(best_current_streak, stats['current_streak'])
                student_completion_rate += stats['percent_complete']
                
                # Add to overall streaks for top 3
                if stats['current_streak'] > 0:
                    all_streaks.append({
                        'user_id': user_id,
                        'streak': stats['current_streak'],
                        'habit_title': habit['title']
                    })
                
                # Calculate last 7 days completion for this habit
                seven_days_ago = date.today() - timedelta(days=6)
                recent_logs_result = client.table('habit_logs').select('completed').eq(
                    'habit_id', habit['id']
                ).gte('occurred_on', str(seven_days_ago)).execute()
                
                recent_logs = recent_logs_result.data or []
                last_7_days_total += 7  # 7 days per habit
                last_7_days_completed += sum(1 for log in recent_logs if log['completed'])
            
            # Get last activity
            last_activity = None
            if habits:
                recent_log_result = client.table('habit_logs').select('created_at').in_(
                    'habit_id', [h['id'] for h in habits]
                ).order('created_at', desc=True).limit(1).execute()
                
                if recent_log_result.data:
                    last_activity = recent_log_result.data[0]['created_at']
            
            average_completion_rate = student_completion_rate / total_habits if total_habits > 0 else 0
            total_completion_rate += average_completion_rate
            
            # Note: In real implementation, you'd get actual student names from Supabase Auth
            analytics.append({
                'student_name': f"Student {user_id[:8]}",
                'student_email': f"student.{user_id[:8]}@example.com",
                'user_id': user_id,
                'total_habits': total_habits,
                'active_habits': active_habits,
                'best_current_streak': best_current_streak,
                'average_completion_rate': round(average_completion_rate, 1),
                'last_activity': last_activity
            })
        
        # Calculate overall metrics
        average_daily_completion = (last_7_days_completed / last_7_days_total * 100) if last_7_days_total > 0 else 0
        
        # Get top 3 streaks
        all_streaks.sort(key=lambda x: x['streak'], reverse=True)
        top_3_streaks = all_streaks[:3]
        
        return {
            'class_name': class_info['name'],
            'total_students': len(students),
            'average_daily_completion': round(average_daily_completion, 1),
            'top_3_streaks': top_3_streaks,
            'analytics': analytics
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching class analytics: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/classes/{class_id}/export")
async def export_class_csv(
    class_id: str,
    authorization: str = Header(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Export class data as CSV (teacher/admin only)."""
    try:
        from fastapi.responses import StreamingResponse
        import io
        import csv
        
        client = get_user_client(authorization)
        
        # Verify permissions
        context = await get_primary_context(current_user['id'], client)
        if context['role'] not in ['admin', 'teacher']:
            raise HTTPException(status_code=403, detail="Only teachers and admins can export data")
        
        # Get class analytics data
        analytics_response = await get_class_analytics(class_id, authorization, current_user)
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Student Name',
            'Email', 
            'Total Habits',
            'Active Habits',
            'Best Streak',
            'Completion Rate (%)',
            'Last Activity'
        ])
        
        # Write student data
        for student in analytics_response['analytics']:
            last_activity = student['last_activity']
            if last_activity:
                try:
                    # Convert ISO datetime to readable format
                    from datetime import datetime
                    dt = datetime.fromisoformat(last_activity.replace('Z', '+00:00'))
                    last_activity = dt.strftime('%Y-%m-%d %H:%M')
                except:
                    last_activity = 'Unknown'
            else:
                last_activity = 'Never'
                
            writer.writerow([
                student['student_name'],
                student['student_email'],
                student['total_habits'],
                student['active_habits'],
                student['best_current_streak'],
                student['average_completion_rate'],
                last_activity
            ])
        
        # Add summary row
        writer.writerow([])
        writer.writerow([
            'CLASS SUMMARY',
            f"Total Students: {analytics_response['total_students']}",
            f"Avg Daily Completion: {analytics_response['average_daily_completion']}%",
            '',
            '',
            '',
            f"Exported: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}"
        ])
        
        output.seek(0)
        
        # Create streaming response
        def iter_csv():
            yield output.getvalue()
        
        filename = f"class_{analytics_response['class_name'].replace(' ', '_')}_export_{date.today().isoformat()}.csv"
        
        return StreamingResponse(
            iter_csv(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error exporting CSV: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/classes/{class_id}/analytics/daily")
async def get_daily_completion_analytics(
    class_id: str,
    days: int = 14,
    authorization: str = Header(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get daily completion rate analytics for charts (teacher/admin only)."""
    try:
        client = get_user_client(authorization)
        
        # Verify user has permission
        context = await get_primary_context(current_user['id'], client)
        if context['role'] not in ['admin', 'teacher']:
            raise HTTPException(status_code=403, detail="Only teachers and admins can access analytics")
        
        # Limit days to reasonable range
        days = min(max(days, 1), 90)
        
        # Get all students in class
        students_result = client.table('memberships').select('user_id').eq(
            'class_id', class_id
        ).eq('role', 'student').execute()
        
        students = students_result.data or []
        
        if not students:
            return []
        
        # Generate daily data for the requested period
        daily_data = []
        today = date.today()
        
        for i in range(days):
            check_date = today - timedelta(days=days-1-i)
            
            total_possible_logs = 0
            total_completed_logs = 0
            
            for student in students:
                user_id = student['user_id']
                
                # Get all habits for this student
                habits_result = client.table('habits').select('id').eq(
                    'user_id', user_id
                ).execute()
                
                habits = habits_result.data or []
                total_possible_logs += len(habits)
                
                # Check completion for this date
                for habit in habits:
                    log_result = client.table('habit_logs').select('completed').eq(
                        'habit_id', habit['id']
                    ).eq('occurred_on', str(check_date)).execute()
                    
                    if log_result.data and log_result.data[0]['completed']:
                        total_completed_logs += 1
            
            completion_rate = (total_completed_logs / total_possible_logs * 100) if total_possible_logs > 0 else 0
            
            daily_data.append({
                'date': str(check_date),
                'completion_rate': round(completion_rate, 1),
                'total_possible': total_possible_logs,
                'total_completed': total_completed_logs
            })
        
        return daily_data
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching daily analytics: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/classes/{class_id}/analytics/weekly")
async def get_weekly_completion_analytics(
    class_id: str,
    weeks: int = 12,
    authorization: str = Header(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get weekly completion rate analytics for charts (teacher/admin only)."""
    try:
        client = get_user_client(authorization)
        
        # Verify user has permission
        context = await get_primary_context(current_user['id'], client)
        if context['role'] not in ['admin', 'teacher']:
            raise HTTPException(status_code=403, detail="Only teachers and admins can access analytics")
        
        # Limit weeks to reasonable range
        weeks = min(max(weeks, 1), 52)
        
        # Get all students in class
        students_result = client.table('memberships').select('user_id').eq(
            'class_id', class_id
        ).eq('role', 'student').execute()
        
        students = students_result.data or []
        
        if not students:
            return []
        
        # Generate weekly data
        weekly_data = []
        today = date.today()
        
        for i in range(weeks):
            # Calculate week start (Monday)
            week_start = today - timedelta(days=today.weekday()) - timedelta(weeks=weeks-1-i)
            week_end = week_start + timedelta(days=6)
            
            total_possible_logs = 0
            total_completed_logs = 0
            
            for student in students:
                user_id = student['user_id']
                
                # Get all habits for this student
                habits_result = client.table('habits').select('id').eq(
                    'user_id', user_id
                ).execute()
                
                habits = habits_result.data or []
                
                # Check completion for the week
                for habit in habits:
                    logs_result = client.table('habit_logs').select('completed').eq(
                        'habit_id', habit['id']
                    ).gte('occurred_on', str(week_start)).lte(
                        'occurred_on', str(week_end)
                    ).execute()
                    
                    logs = logs_result.data or []
                    total_possible_logs += 7  # 7 days per week
                    total_completed_logs += sum(1 for log in logs if log['completed'])
            
            completion_rate = (total_completed_logs / total_possible_logs * 100) if total_possible_logs > 0 else 0
            
            # Format week as ISO week
            year, week_num, _ = week_start.isocalendar()
            
            weekly_data.append({
                'week': f"{year}-W{week_num:02d}",
                'week_start': str(week_start),
                'completion_rate': round(completion_rate, 1),
                'total_possible': total_possible_logs,
                'total_completed': total_completed_logs
            })
        
        return weekly_data
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching weekly analytics: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/admin/recompute-streaks")
async def manually_recompute_streaks(
    authorization: str = Header(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Manually trigger streak recomputation (admin only)."""
    try:
        client = get_user_client(authorization)
        
        # Verify user is admin
        context = await get_primary_context(current_user['id'], client)
        if context['role'] != 'admin':
            raise HTTPException(status_code=403, detail="Only admins can trigger streak recomputation")
        
        # Use service role to execute the recomputation
        result = supabase_service.admin_client.rpc('recompute_all_streaks').execute()
        
        if result.data is None and not result.error:
            # Get count of processed habits
            habits_count = supabase_service.admin_client.table('habits').select('*', count='exact', head=True).execute()
            
            return {
                'success': True,
                'message': 'Streak recomputation completed successfully',
                'habits_processed': habits_count.count or 0,
                'timestamp': datetime.utcnow().isoformat()
            }
        else:
            raise HTTPException(status_code=500, detail=result.error.message if result.error else "Unknown error")
            
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error during manual streak recomputation: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)