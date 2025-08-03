from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, date, timedelta
import hashlib
import jwt
from passlib.context import CryptContext
import asyncio

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
    class_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    name: str
    email: str
    role: str
    class_id: Optional[str] = None
    created_at: datetime

class HabitCreate(BaseModel):
    title: str
    frequency: str = "daily"  # daily, weekly
    start_date: date

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

class FriendRequest(BaseModel):
    friend_email: str

class Class(BaseModel):
    id: str
    name: str
    teacher_id: str
    created_at: datetime

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

# Routes
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Handle class creation/assignment
    class_id = None
    if user_data.role == "teacher" and user_data.class_name:
        # Create new class
        class_doc = {
            "id": str(uuid.uuid4()),
            "name": user_data.class_name,
            "teacher_id": "",  # Will be updated after user creation
            "created_at": datetime.utcnow()
        }
        await db.classes.insert_one(class_doc)
        class_id = class_doc["id"]
    elif user_data.role == "student" and user_data.class_name:
        # Find existing class
        class_doc = await db.classes.find_one({"name": user_data.class_name})
        if class_doc:
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
            "stats": HabitStats(**stats_doc).dict()
        })
    
    return result

@api_router.post("/habits")
async def create_habit(habit_data: HabitCreate, current_user: User = Depends(get_current_user)):
    habit_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.id,
        "title": habit_data.title,
        "frequency": habit_data.frequency,
        "start_date": habit_data.start_date.isoformat(),
        "created_at": datetime.utcnow()
    }
    
    await db.habits.insert_one(habit_doc)
    return Habit(**habit_doc)

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

@api_router.post("/friends/request")
async def send_friend_request(request_data: FriendRequest, current_user: User = Depends(get_current_user)):
    # Find friend by email
    friend = await db.users.find_one({"email": request_data.friend_email})
    if not friend:
        raise HTTPException(status_code=404, detail="User not found")
    
    if friend["id"] == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as friend")
    
    # Check if friendship already exists
    existing = await db.friendships.find_one({
        "$or": [
            {"requester_id": current_user.id, "accepter_id": friend["id"]},
            {"requester_id": friend["id"], "accepter_id": current_user.id}
        ]
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Friendship already exists")
    
    # Create friend request
    friendship_doc = {
        "id": str(uuid.uuid4()),
        "requester_id": current_user.id,
        "accepter_id": friend["id"],
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    
    await db.friendships.insert_one(friendship_doc)
    return {"message": "Friend request sent"}

@api_router.get("/friends/requests")
async def get_friend_requests(current_user: User = Depends(get_current_user)):
    requests = await db.friendships.find({
        "accepter_id": current_user.id,
        "status": "pending"
    }).to_list(1000)
    
    result = []
    for req in requests:
        requester = await db.users.find_one({"id": req["requester_id"]})
        result.append({
            "request_id": req["id"],
            "requester": {"name": requester["name"], "email": requester["email"]}
        })
    
    return result

@api_router.post("/friends/accept/{request_id}")
async def accept_friend_request(request_id: str, current_user: User = Depends(get_current_user)):
    # Find and update request
    result = await db.friendships.update_one(
        {"id": request_id, "accepter_id": current_user.id, "status": "pending"},
        {"$set": {"status": "accepted"}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    return {"message": "Friend request accepted"}

@api_router.get("/feed/friends-streaks")
async def get_friends_feed(current_user: User = Depends(get_current_user)):
    # Get accepted friendships
    friendships = await db.friendships.find({
        "$or": [
            {"requester_id": current_user.id, "status": "accepted"},
            {"accepter_id": current_user.id, "status": "accepted"}
        ]
    }).to_list(1000)
    
    friends_data = []
    for friendship in friendships:
        friend_id = friendship["accepter_id"] if friendship["requester_id"] == current_user.id else friendship["requester_id"]
        friend = await db.users.find_one({"id": friend_id})
        
        if friend:
            # Get friend's best current streak
            habits = await db.habits.find({"user_id": friend_id}).to_list(1000)
            best_streak = 0
            
            for habit in habits:
                stats = await db.habit_stats.find_one({"habit_id": habit["id"]})
                if stats and stats["current_streak"] > best_streak:
                    best_streak = stats["current_streak"]
            
            friends_data.append({
                "name": friend["name"],
                "current_streak": best_streak
            })
    
    # Sort by current streak descending
    friends_data.sort(key=lambda x: x["current_streak"], reverse=True)
    return friends_data

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