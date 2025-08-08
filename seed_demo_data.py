#!/usr/bin/env python3
"""
Demo Data Seeder for Phase 2 E2E Testing
Creates: 1 school, 2 classes, 6 users (1 admin, 2 teachers, 3 students)
Seeds habit data with 7-day completion history for streak testing
"""

import os
import uuid
from datetime import date, datetime, timedelta
from supabase import create_client, Client

# Load environment variables
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Missing Supabase credentials")

# Create service role client (bypasses RLS)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def clean_existing_demo_data():
    """Clean up any existing demo data"""
    print("🧹 Cleaning existing demo data...")
    
    # Delete in reverse dependency order
    supabase.table('habit_logs').delete().like('user_id', 'demo-%').execute()
    supabase.table('habits').delete().like('user_id', 'demo-%').execute()  
    supabase.table('memberships').delete().like('user_id', 'demo-%').execute()
    supabase.table('classes').delete().like('name', 'Demo %').execute()
    supabase.table('schools').delete().eq('name', 'Demo Academy').execute()
    
    print("✅ Cleanup complete")

def create_demo_school():
    """Create demo school"""
    print("🏫 Creating demo school...")
    
    school_data = {
        'id': 'demo-school-001',
        'name': 'Demo Academy',
        'created_at': datetime.utcnow().isoformat()
    }
    
    result = supabase.table('schools').insert(school_data).execute()
    print(f"✅ Created school: {result.data[0]['name']}")
    return result.data[0]['id']

def create_demo_classes(school_id):
    """Create 2 demo classes"""
    print("📚 Creating demo classes...")
    
    classes_data = [
        {
            'id': 'demo-class-001',
            'school_id': school_id,
            'name': 'Demo Class A - Mathematics',
            'invite_code': 'DEMO-MATH-A',
            'created_at': datetime.utcnow().isoformat()
        },
        {
            'id': 'demo-class-002', 
            'school_id': school_id,
            'name': 'Demo Class B - Science',
            'invite_code': 'DEMO-SCI-B',
            'created_at': datetime.utcnow().isoformat()
        }
    ]
    
    result = supabase.table('classes').insert(classes_data).execute()
    print(f"✅ Created classes: {[c['name'] for c in result.data]}")
    return {c['name']: c['id'] for c in result.data}

def create_demo_users_and_memberships(school_id, class_ids):
    """Create 6 demo users with appropriate memberships"""
    print("👥 Creating demo users and memberships...")
    
    users = [
        # Admin
        {
            'user_id': 'demo-admin-001',
            'school_id': school_id,
            'class_id': None,
            'role': 'admin',
            'name': 'Alice Admin',
            'email': 'alice.admin@demo.com'
        },
        # Teachers 
        {
            'user_id': 'demo-teacher-001',
            'school_id': school_id, 
            'class_id': class_ids['Demo Class A - Mathematics'],
            'role': 'teacher',
            'name': 'Bob Teacher',
            'email': 'bob.teacher@demo.com'
        },
        {
            'user_id': 'demo-teacher-002',
            'school_id': school_id,
            'class_id': class_ids['Demo Class B - Science'], 
            'role': 'teacher',
            'name': 'Carol Teacher',
            'email': 'carol.teacher@demo.com'
        },
        # Students
        {
            'user_id': 'demo-student-001',
            'school_id': school_id,
            'class_id': class_ids['Demo Class A - Mathematics'],
            'role': 'student', 
            'name': 'David Student',
            'email': 'david.student@demo.com'
        },
        {
            'user_id': 'demo-student-002',
            'school_id': school_id,
            'class_id': class_ids['Demo Class A - Mathematics'],
            'role': 'student',
            'name': 'Emma Student', 
            'email': 'emma.student@demo.com'
        },
        {
            'user_id': 'demo-student-003',
            'school_id': school_id,
            'class_id': class_ids['Demo Class B - Science'],
            'role': 'student',
            'name': 'Frank Student',
            'email': 'frank.student@demo.com'
        }
    ]
    
    # Create memberships
    memberships_data = []
    for user in users:
        membership = {
            'user_id': user['user_id'],
            'school_id': user['school_id'],
            'class_id': user['class_id'],
            'role': user['role']
        }
        memberships_data.append(membership)
    
    result = supabase.table('memberships').insert(memberships_data).execute()
    print(f"✅ Created {len(result.data)} user memberships")
    return users

def create_demo_habits(users, school_id, class_ids):
    """Create demo habits for students"""
    print("🎯 Creating demo habits...")
    
    student_users = [u for u in users if u['role'] == 'student']
    habits_data = []
    
    habit_templates = [
        "Read 10 pages daily",
        "Exercise for 30 minutes", 
        "Practice math problems",
        "Write in journal",
        "Meditate for 10 minutes",
        "Study science notes"
    ]
    
    for i, student in enumerate(student_users):
        # Give each student 2 habits
        for j in range(2):
            habit = {
                'id': f'demo-habit-{i+1}-{j+1}',
                'school_id': school_id,
                'class_id': student['class_id'],
                'user_id': student['user_id'],
                'title': habit_templates[i*2 + j],
                'frequency': 'daily',
                'start_date': (date.today() - timedelta(days=10)).isoformat(),
                'created_at': datetime.utcnow().isoformat()
            }
            habits_data.append(habit)
    
    result = supabase.table('habits').insert(habits_data).execute()
    print(f"✅ Created {len(result.data)} demo habits")
    return result.data

def create_demo_habit_logs(habits, users):
    """Create 7-day completion history for habits (with varying streaks)"""
    print("📊 Creating demo habit logs with streak patterns...")
    
    logs_data = []
    today = date.today()
    
    # Define streak patterns for different students
    streak_patterns = {
        'demo-student-001': [True, True, True, True, True, True, True],    # 7-day streak
        'demo-student-002': [True, True, True, False, True, True, True],   # 3-day current streak  
        'demo-student-003': [True, True, False, False, True, True, False], # 2-day current streak
    }
    
    for habit in habits:
        user_id = habit['user_id']
        pattern = streak_patterns.get(user_id, [True, False, True, True, False, True, True])
        
        # Create logs for last 7 days
        for i, completed in enumerate(pattern):
            log_date = today - timedelta(days=6-i)  # 7 days ago to today
            
            log = {
                'id': f'demo-log-{habit["id"]}-{i}',
                'habit_id': habit['id'],
                'user_id': user_id,
                'occurred_on': log_date.isoformat(),
                'completed': completed,
                'created_at': (datetime.utcnow() - timedelta(days=6-i)).isoformat()
            }
            logs_data.append(log)
    
    result = supabase.table('habit_logs').insert(logs_data).execute()
    print(f"✅ Created {len(result.data)} demo habit logs")
    
    # Print streak summary
    print("\n📈 Streak Summary:")
    for user_id, pattern in streak_patterns.items():
        current_streak = 0
        for completed in reversed(pattern):  # Count from today backward
            if completed:
                current_streak += 1
            else:
                break
        user_name = next(u['name'] for u in users if u['user_id'] == user_id)
        print(f"  {user_name}: {current_streak}-day current streak")
    
    return result.data

def print_demo_data_summary(school_id, class_ids, users):
    """Print summary of created demo data"""
    print("\n" + "="*50)
    print("🎉 DEMO DATA CREATION COMPLETE")
    print("="*50)
    
    print(f"\n🏫 School: Demo Academy (ID: {school_id})")
    
    print(f"\n📚 Classes:")
    for name, class_id in class_ids.items():
        print(f"  • {name} (ID: {class_id})")
    
    print(f"\n👥 Users:")
    for user in users:
        class_name = next((name for name, id in class_ids.items() if id == user['class_id']), 'N/A')
        print(f"  • {user['name']} ({user['role']}) - {user['email']} - {class_name}")
    
    print(f"\n🔗 Invite Codes:")
    print(f"  • Math Class: DEMO-MATH-A")
    print(f"  • Science Class: DEMO-SCI-B")
    
    print(f"\n🧪 Ready for E2E Testing:")
    print(f"  • Auth flow testing with demo emails")
    print(f"  • Invite flow with DEMO-MATH-A code")
    print(f"  • Streak badges (7, 3, 2 day streaks)")  
    print(f"  • Teacher analytics and CSV export")
    print(f"  • RLS isolation between classes")

def main():
    """Main seeding function"""
    print("🌱 Starting Phase 2 Demo Data Seeding...")
    
    try:
        # Step 1: Clean existing data
        clean_existing_demo_data()
        
        # Step 2: Create school
        school_id = create_demo_school()
        
        # Step 3: Create classes  
        class_ids = create_demo_classes(school_id)
        
        # Step 4: Create users and memberships
        users = create_demo_users_and_memberships(school_id, class_ids)
        
        # Step 5: Create habits
        habits = create_demo_habits(users, school_id, class_ids)
        
        # Step 6: Create habit logs with streaks
        create_demo_habit_logs(habits, users)
        
        # Step 7: Print summary
        print_demo_data_summary(school_id, class_ids, users)
        
        print(f"\n✅ Demo data seeding completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        raise

if __name__ == "__main__":
    main()