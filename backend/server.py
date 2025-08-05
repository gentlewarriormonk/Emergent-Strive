from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, date, timedelta
import hashlib
import jwt
from passlib.context import CryptContext
import asyncio
import math
import csv
import io
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"

# Create the main app without a prefix
app = FastAPI(title="One Thing - Habit Tracker")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "student"  # student or teacher
    class_name: str  # Required now

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    name: str
    email: str
    role: str
    class_id: str
    created_at: datetime

class HabitCreate(BaseModel):
    name: str
    repeats: str = "daily"  # daily, weekly, custom
    startDate: Optional[date] = None

class Habit(BaseModel):
    id: str
    user_id: str
    title: str
    frequency: str
    start_date: date
    created_at: datetime

class HabitLog(BaseModel):
    id: str
    habit_id: str
    date: date
    completed: bool
    created_at: datetime

class HabitLogCreate(BaseModel):
    date: date
    completed: bool

class HabitStats(BaseModel):
    habit_id: str
    current_streak: int
    best_streak: int
    percent_complete: float

class Class(BaseModel):
    id: str
    name: str
    teacher_id: str
    created_at: datetime

class StudentAnalytics(BaseModel):
    student_name: str
    student_email: str
    total_habits: int
    active_habits: int
    best_current_streak: int
    average_completion_rate: float
    last_activity: Optional[datetime]

class ClassMemberData(BaseModel):
    name: str
    role: str
    current_best_streak: int
    total_habits: int
    completion_rate: float
    recent_activity: str

# Gamification Models
class UserStats(BaseModel):
    id: str
    user_id: str
    xp: int = 0
    level: int = 1
    best_streak: int = 0
    total_completions: int = 0
    created_at: datetime

class UserStatsCreate(BaseModel):
    user_id: str
    xp: int = 0
    level: int = 1
    best_streak: int = 0
    total_completions: int = 0

class Crew(BaseModel):
    id: str
    class_id: str
    name: str
    crew_streak: int = 0
    created_at: datetime

class CrewMember(BaseModel):
    id: str
    crew_id: str
    user_id: str
    joined_at: datetime

class Quest(BaseModel):
    id: str
    class_id: str
    title: str
    description: str
    start_date: date
    end_date: date
    xp_reward: int
    created_by: str
    created_at: datetime

class QuestCreate(BaseModel):
    title: str
    description: str
    start_date: date
    end_date: date
    xp_reward: int

class QuestCompletion(BaseModel):
    id: str
    quest_id: str
    user_id: str
    completed: bool = False
    completed_at: Optional[datetime] = None

class RewardItem(BaseModel):
    id: str
    user_id: str
    type: str  # 'crate' or 'badge'
    label: str
    awarded_at: datetime

class CrewJoinRequest(BaseModel):
    crew_id: str

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(user_id: str) -> str:
    payload = {"user_id": user_id, "exp": datetime.utcnow() + timedelta(days=30)}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_doc = await db.users.find_one({"id": user_id})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user_doc)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def calculate_streak(habit_id: str) -> tuple:
    """Calculate current and best streak for a habit"""
    logs = await db.habit_logs.find({"habit_id": habit_id}).sort("date", 1).to_list(1000)
    
    if not logs:
        return 0, 0
    
    # Calculate current streak (from today backwards)
    current_streak = 0
    today = date.today()
    check_date = today
    
    for i in range(30):  # Check last 30 days
        log = next((l for l in logs if l["date"] == check_date.isoformat()), None)
        if log and log["completed"]:
            current_streak += 1
            check_date -= timedelta(days=1)
        else:
            break
    
    # Calculate best streak
    best_streak = 0
    temp_streak = 0
    
    # Convert dates to date objects for comparison
    for log in logs:
        if log["completed"]:
            temp_streak += 1
            best_streak = max(best_streak, temp_streak)
        else:
            temp_streak = 0
    
    return current_streak, best_streak

# Gamification helper functions
def calculate_level_from_xp(xp: int) -> int:
    """Calculate level from XP using formula: threshold = 10 * level^1.5"""
    level = 1
    while xp >= 10 * (level ** 1.5):
        level += 1
    return level - 1 if level > 1 else 1

def get_xp_for_level(level: int) -> int:
    """Get XP threshold for a given level"""
    return int(10 * (level ** 1.5))

async def award_xp(user_id: str, xp_amount: int, habit_weight: int = 1):
    """Award XP to user and update level if threshold is crossed"""
    # Get or create user stats
    user_stats = await db.user_stats.find_one({"user_id": user_id})
    if not user_stats:
        user_stats = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "xp": 0,
            "level": 1,
            "best_streak": 0,
            "total_completions": 0,
            "created_at": datetime.utcnow()
        }
        await db.user_stats.insert_one(user_stats)
    
    # Calculate new XP and level
    new_xp = user_stats["xp"] + (xp_amount * habit_weight)
    new_level = calculate_level_from_xp(new_xp)
    
    # Update user stats
    await db.user_stats.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "xp": new_xp,
                "level": new_level,
                "total_completions": user_stats["total_completions"] + 1
            }
        }
    )
    
    return new_level > user_stats["level"]  # Returns True if level increased

async def auto_assign_to_crew(user_id: str, class_id: str):
    """Auto-assign student to crew of 4, create new crew if needed"""
    # Check if user is already in a crew
    existing_membership = await db.crew_members.find_one({"user_id": user_id})
    if existing_membership:
        return
    
    # Find crews in the class with less than 4 members
    crews = await db.crews.find({"class_id": class_id}).to_list(1000)
    
    target_crew = None
    for crew in crews:
        member_count = await db.crew_members.count_documents({"crew_id": crew["id"]})
        if member_count < 4:
            target_crew = crew
            break
    
    # Create new crew if none available
    if not target_crew:
        crew_number = len(crews) + 1
        target_crew = {
            "id": str(uuid.uuid4()),
            "class_id": class_id,
            "name": f"Squad {crew_number}",
            "crew_streak": 0,
            "created_at": datetime.utcnow()
        }
        await db.crews.insert_one(target_crew)
    
    # Add user to crew
    crew_member = {
        "id": str(uuid.uuid4()),
        "crew_id": target_crew["id"],
        "user_id": user_id,
        "joined_at": datetime.utcnow()
    }
    await db.crew_members.insert_one(crew_member)

async def calculate_crew_streak(crew_id: str) -> int:
    """Calculate crew streak as MIN of all members' current streaks"""
    crew_members = await db.crew_members.find({"crew_id": crew_id}).to_list(10)
    if not crew_members:
        return 0
    
    min_streak = float('inf')
    
    for member in crew_members:
        # Get member's best current streak
        user_habits = await db.habits.find({"user_id": member["user_id"]}).to_list(100)
        member_best_streak = 0
        
        for habit in user_habits:
            stats = await db.habit_stats.find_one({"habit_id": habit["id"]})
            if stats:
                member_best_streak = max(member_best_streak, stats["current_streak"])
        
        min_streak = min(min_streak, member_best_streak)
    
    return int(min_streak) if min_streak != float('inf') else 0

async def check_and_award_streak_rewards(user_id: str, new_streak: int):
    """Check if user hit milestone streak and award rewards"""
    milestones = [7, 14, 30]
    
    for milestone in milestones:
        if new_streak == milestone:
            # Check if reward already exists
            existing_reward = await db.reward_items.find_one({
                "user_id": user_id,
                "type": "crate",
                "label": f"{milestone}-Day Streak Crate"
            })
            
            if not existing_reward:
                reward = {
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "type": "crate",
                    "label": f"{milestone}-Day Streak Crate",
                    "awarded_at": datetime.utcnow()
                }
                await db.reward_items.insert_one(reward)

# Routes
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Handle class creation/assignment
    class_id = None
    if user_data.role == "teacher":
        # Create new class for teacher
        class_doc = {
            "id": str(uuid.uuid4()),
            "name": user_data.class_name,
            "teacher_id": "",  # Will be updated after user creation
            "created_at": datetime.utcnow()
        }
        await db.classes.insert_one(class_doc)
        class_id = class_doc["id"]
    else:
        # Find existing class for student
        class_doc = await db.classes.find_one({"name": user_data.class_name})
        if not class_doc:
            raise HTTPException(status_code=404, detail=f"Class '{user_data.class_name}' not found. Ask your teacher to create the class first.")
        class_id = class_doc["id"]
    
    # Create user
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "role": user_data.role,
        "class_id": class_id,
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_doc)
    
    # Update class with teacher_id if teacher
    if user_data.role == "teacher" and class_id:
        await db.classes.update_one(
            {"id": class_id}, 
            {"$set": {"teacher_id": user_id}}
        )
    
    token = create_access_token(user_id)
    return {"token": token, "user": User(**user_doc)}

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    user_doc = await db.users.find_one({"email": login_data.email})
    if not user_doc or not verify_password(login_data.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(user_doc["id"])
    return {"token": token, "user": User(**user_doc)}

@api_router.get("/habits")
async def get_habits(current_user: User = Depends(get_current_user)):
    habits = await db.habits.find({"user_id": current_user.id}).to_list(1000)
    
    # Get today's logs and stats for each habit
    today = date.today()
    result = []
    
    for habit_doc in habits:
        habit = Habit(**habit_doc)
        
        # Get today's log
        today_log = await db.habit_logs.find_one({
            "habit_id": habit.id,
            "date": today.isoformat()
        })
        
        # Get last 7 days of logs for status bar
        seven_days_ago = today - timedelta(days=6)
        recent_logs = await db.habit_logs.find({
            "habit_id": habit.id,
            "date": {"$gte": seven_days_ago.isoformat(), "$lte": today.isoformat()}
        }).to_list(7)
        
        # Get or calculate stats
        stats_doc = await db.habit_stats.find_one({"habit_id": habit.id})
        if not stats_doc:
            current_streak, best_streak = await calculate_streak(habit.id)
            total_logs = await db.habit_logs.count_documents({"habit_id": habit.id})
            completed_logs = await db.habit_logs.count_documents({"habit_id": habit.id, "completed": True})
            percent_complete = (completed_logs / total_logs * 100) if total_logs > 0 else 0
            
            stats_doc = {
                "habit_id": habit.id,
                "current_streak": current_streak,
                "best_streak": best_streak,
                "percent_complete": percent_complete,
                "updated_at": datetime.utcnow()
            }
            await db.habit_stats.insert_one(stats_doc)
        
        result.append({
            "habit": habit.dict(),
            "today_completed": today_log["completed"] if today_log else False,
            "recent_logs": recent_logs,
            "stats": HabitStats(**stats_doc).dict()
        })
    
    return result

@api_router.post("/habits", status_code=201)
async def create_habit(habit_data: HabitCreate, current_user: User = Depends(get_current_user)):
    # Map frontend fields to backend fields
    start_date = habit_data.startDate or date.today()
    frequency = habit_data.repeats  # Map 'repeats' to 'frequency'
    
    habit_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.id,
        "title": habit_data.name,  # Map 'name' to 'title'
        "frequency": frequency,
        "start_date": start_date.isoformat(),
        "created_at": datetime.utcnow()
    }
    
    await db.habits.insert_one(habit_doc)
    
    # Return the habit with recent_logs array for consistency
    created_habit = Habit(**habit_doc)
    return {
        "habit": created_habit.dict(),
        "today_completed": False,
        "recent_logs": [],
        "stats": {
            "habit_id": created_habit.id,
            "current_streak": 0,
            "best_streak": 0,
            "percent_complete": 0.0
        }
    }

@api_router.post("/habits/{habit_id}/log")
async def log_habit(habit_id: str, log_data: HabitLogCreate, current_user: User = Depends(get_current_user)):
    # Verify habit belongs to user
    habit = await db.habits.find_one({"id": habit_id, "user_id": current_user.id})
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    # Check if log already exists for this date
    existing_log = await db.habit_logs.find_one({
        "habit_id": habit_id,
        "date": log_data.date.isoformat()
    })
    
    if existing_log:
        # Update existing log
        await db.habit_logs.update_one(
            {"id": existing_log["id"]},
            {"$set": {"completed": log_data.completed}}
        )
        log_doc = await db.habit_logs.find_one({"id": existing_log["id"]})
    else:
        # Create new log
        log_doc = {
            "id": str(uuid.uuid4()),
            "habit_id": habit_id,
            "date": log_data.date.isoformat(),
            "completed": log_data.completed,
            "created_at": datetime.utcnow()
        }
        await db.habit_logs.insert_one(log_doc)
    
    # Update stats
    current_streak, best_streak = await calculate_streak(habit_id)
    total_logs = await db.habit_logs.count_documents({"habit_id": habit_id})
    completed_logs = await db.habit_logs.count_documents({"habit_id": habit_id, "completed": True})
    percent_complete = (completed_logs / total_logs * 100) if total_logs > 0 else 0
    
    await db.habit_stats.update_one(
        {"habit_id": habit_id},
        {"$set": {
            "current_streak": current_streak,
            "best_streak": best_streak,
            "percent_complete": percent_complete,
            "updated_at": datetime.utcnow()
        }},
        upsert=True
    )
    
    return HabitLog(**log_doc)

@api_router.get("/classes/{class_id}/analytics")
async def get_class_analytics(class_id: str, current_user: User = Depends(get_current_user)):
    # Verify user is teacher and owns this class
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can access class analytics")
    
    class_doc = await db.classes.find_one({"id": class_id, "teacher_id": current_user.id})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found or access denied")
    
    # Get all students in this class
    students = await db.users.find({"class_id": class_id, "role": "student"}).to_list(1000)
    
    analytics = []
    for student in students:
        # Get student's habits
        habits = await db.habits.find({"user_id": student["id"]}).to_list(1000)
        
        # Calculate analytics
        total_habits = len(habits)
        active_habits = 0
        best_current_streak = 0
        total_completion_rate = 0
        last_activity = None
        
        for habit in habits:
            # Get stats
            stats = await db.habit_stats.find_one({"habit_id": habit["id"]})
            if stats:
                if stats["current_streak"] > 0:
                    active_habits += 1
                best_current_streak = max(best_current_streak, stats["current_streak"])
                total_completion_rate += stats["percent_complete"]
        
        # Get last activity
        last_log = await db.habit_logs.find_one(
            {"habit_id": {"$in": [h["id"] for h in habits]}},
            sort=[("created_at", -1)]
        )
        if last_log:
            last_activity = last_log["created_at"]
        
        average_completion_rate = total_completion_rate / total_habits if total_habits > 0 else 0
        
        analytics.append(StudentAnalytics(
            student_name=student["name"],
            student_email=student["email"],
            total_habits=total_habits,
            active_habits=active_habits,
            best_current_streak=best_current_streak,
            average_completion_rate=round(average_completion_rate, 1),
            last_activity=last_activity
        ))
    
    return {
        "class_name": class_doc["name"],
        "total_students": len(students),
        "analytics": analytics
    }

@api_router.get("/my-class/feed")
async def get_class_feed(current_user: User = Depends(get_current_user)):
    # Get all users in the same class
    class_members = await db.users.find({"class_id": current_user.class_id}).to_list(1000)
    
    feed_data = []
    for member in class_members:
        # Get member's habits
        habits = await db.habits.find({"user_id": member["id"]}).to_list(1000)
        
        # Calculate member's best current streak and completion rate
        best_current_streak = 0
        total_completion_rate = 0
        active_habits = 0
        
        for habit in habits:
            stats = await db.habit_stats.find_one({"habit_id": habit["id"]})
            if stats:
                best_current_streak = max(best_current_streak, stats["current_streak"])
                total_completion_rate += stats["percent_complete"]
                if stats["current_streak"] > 0:
                    active_habits += 1
        
        average_completion_rate = total_completion_rate / len(habits) if habits else 0
        
        # Get recent activity
        recent_activity = "No recent activity"
        if habits:
            recent_log = await db.habit_logs.find_one(
                {"habit_id": {"$in": [h["id"] for h in habits]}},
                sort=[("created_at", -1)]
            )
            if recent_log:
                days_ago = (datetime.utcnow() - recent_log["created_at"]).days
                if days_ago == 0:
                    recent_activity = "Active today"
                elif days_ago == 1:
                    recent_activity = "Active yesterday"
                else:
                    recent_activity = f"Active {days_ago} days ago"
        
        feed_data.append(ClassMemberData(
            name=member["name"],
            role=member["role"],
            current_best_streak=best_current_streak,
            total_habits=len(habits),
            completion_rate=round(average_completion_rate, 1),
            recent_activity=recent_activity
        ))
    
    # Sort by current best streak descending
    feed_data.sort(key=lambda x: x.current_best_streak, reverse=True)
    
    return feed_data

@api_router.get("/my-class/info")
async def get_class_info(current_user: User = Depends(get_current_user)):
    class_doc = await db.classes.find_one({"id": current_user.class_id})
    if not class_doc:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Get teacher info
    teacher = await db.users.find_one({"id": class_doc["teacher_id"]})
    teacher_name = teacher["name"] if teacher else "Unknown"
    
    # Get student count
    student_count = await db.users.count_documents({"class_id": current_user.class_id, "role": "student"})
    
    return {
        "class_name": class_doc["name"],
        "teacher_name": teacher_name,
        "student_count": student_count,
        "your_role": current_user.role
    }

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()