#!/usr/bin/env python3
"""
Comprehensive Backend Testing for One Thing Habit Tracker
Tests authentication, habit management, social features, and data validation
"""

import requests
import json
import uuid
from datetime import date, datetime, timedelta
import time

# Get backend URL from frontend env
BACKEND_URL = "https://e1775d52-63b1-4e94-ab13-bc0364a8e8b7.preview.emergentagent.com/api"

class HabitTrackerTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_users = []
        self.test_tokens = {}
        self.test_habits = {}
        self.test_results = {
            "authentication": {"passed": 0, "failed": 0, "details": []},
            "habit_management": {"passed": 0, "failed": 0, "details": []},
            "social_features": {"passed": 0, "failed": 0, "details": []},
            "data_validation": {"passed": 0, "failed": 0, "details": []},
            "authorization": {"passed": 0, "failed": 0, "details": []}
        }
    
    def log_result(self, category, test_name, passed, details=""):
        """Log test result"""
        if passed:
            self.test_results[category]["passed"] += 1
            status = "✅ PASS"
        else:
            self.test_results[category]["failed"] += 1
            status = "❌ FAIL"
        
        self.test_results[category]["details"].append(f"{status}: {test_name} - {details}")
        print(f"{status}: {test_name} - {details}")
    
    def test_user_registration(self):
        """Test user registration for students and teachers"""
        print("\n=== Testing User Registration ===")
        
        # Test student registration
        student_data = {
            "name": "Emma Johnson",
            "email": f"emma.johnson.{uuid.uuid4().hex[:8]}@school.edu",
            "password": "SecurePass123!",
            "role": "student",
            "class_name": "Math 101"
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/register", json=student_data)
            if response.status_code == 200:
                data = response.json()
                if "token" in data and "user" in data:
                    self.test_users.append(student_data)
                    self.test_tokens[student_data["email"]] = data["token"]
                    self.log_result("authentication", "Student Registration", True, f"User {student_data['name']} registered successfully")
                else:
                    self.log_result("authentication", "Student Registration", False, "Missing token or user in response")
            else:
                self.log_result("authentication", "Student Registration", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("authentication", "Student Registration", False, f"Exception: {str(e)}")
        
        # Test teacher registration
        teacher_data = {
            "name": "Dr. Sarah Wilson",
            "email": f"sarah.wilson.{uuid.uuid4().hex[:8]}@school.edu",
            "password": "TeacherPass456!",
            "role": "teacher",
            "class_name": "Physics Advanced"
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/register", json=teacher_data)
            if response.status_code == 200:
                data = response.json()
                if "token" in data and "user" in data:
                    self.test_users.append(teacher_data)
                    self.test_tokens[teacher_data["email"]] = data["token"]
                    self.log_result("authentication", "Teacher Registration", True, f"Teacher {teacher_data['name']} registered successfully")
                else:
                    self.log_result("authentication", "Teacher Registration", False, "Missing token or user in response")
            else:
                self.log_result("authentication", "Teacher Registration", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("authentication", "Teacher Registration", False, f"Exception: {str(e)}")
        
        # Test duplicate email registration
        try:
            response = requests.post(f"{self.base_url}/auth/register", json=student_data)
            if response.status_code == 400:
                self.log_result("data_validation", "Duplicate Email Prevention", True, "Correctly rejected duplicate email")
            else:
                self.log_result("data_validation", "Duplicate Email Prevention", False, f"Should have rejected duplicate email, got {response.status_code}")
        except Exception as e:
            self.log_result("data_validation", "Duplicate Email Prevention", False, f"Exception: {str(e)}")
    
    def test_user_login(self):
        """Test user login with valid and invalid credentials"""
        print("\n=== Testing User Login ===")
        
        if not self.test_users:
            self.log_result("authentication", "Login Test", False, "No test users available")
            return
        
        # Test valid login
        user = self.test_users[0]
        login_data = {
            "email": user["email"],
            "password": user["password"]
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/login", json=login_data)
            if response.status_code == 200:
                data = response.json()
                if "token" in data and "user" in data:
                    self.log_result("authentication", "Valid Login", True, f"Successfully logged in {user['email']}")
                else:
                    self.log_result("authentication", "Valid Login", False, "Missing token or user in response")
            else:
                self.log_result("authentication", "Valid Login", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("authentication", "Valid Login", False, f"Exception: {str(e)}")
        
        # Test invalid credentials
        invalid_login = {
            "email": user["email"],
            "password": "WrongPassword123"
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/login", json=invalid_login)
            if response.status_code == 401:
                self.log_result("authentication", "Invalid Login Rejection", True, "Correctly rejected invalid credentials")
            else:
                self.log_result("authentication", "Invalid Login Rejection", False, f"Should have rejected invalid credentials, got {response.status_code}")
        except Exception as e:
            self.log_result("authentication", "Invalid Login Rejection", False, f"Exception: {str(e)}")
    
    def test_jwt_validation(self):
        """Test JWT token validation"""
        print("\n=== Testing JWT Token Validation ===")
        
        if not self.test_tokens:
            self.log_result("authentication", "JWT Validation", False, "No tokens available")
            return
        
        # Test valid token
        email = list(self.test_tokens.keys())[0]
        token = self.test_tokens[email]
        headers = {"Authorization": f"Bearer {token}"}
        
        try:
            response = requests.get(f"{self.base_url}/habits", headers=headers)
            if response.status_code == 200:
                self.log_result("authentication", "Valid JWT Token", True, "Token accepted for protected route")
            else:
                self.log_result("authentication", "Valid JWT Token", False, f"Valid token rejected: {response.status_code}")
        except Exception as e:
            self.log_result("authentication", "Valid JWT Token", False, f"Exception: {str(e)}")
        
        # Test invalid token
        invalid_headers = {"Authorization": "Bearer invalid_token_here"}
        
        try:
            response = requests.get(f"{self.base_url}/habits", headers=invalid_headers)
            if response.status_code == 401:
                self.log_result("authentication", "Invalid JWT Rejection", True, "Invalid token correctly rejected")
            else:
                self.log_result("authentication", "Invalid JWT Rejection", False, f"Should have rejected invalid token, got {response.status_code}")
        except Exception as e:
            self.log_result("authentication", "Invalid JWT Rejection", False, f"Exception: {str(e)}")
    
    def test_habit_creation(self):
        """Test creating new habits"""
        print("\n=== Testing Habit Creation ===")
        
        if not self.test_tokens:
            self.log_result("habit_management", "Habit Creation", False, "No authenticated users available")
            return
        
        email = list(self.test_tokens.keys())[0]
        token = self.test_tokens[email]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test creating a daily habit
        habit_data = {
            "title": "Morning Meditation",
            "frequency": "daily",
            "start_date": date.today().isoformat()
        }
        
        try:
            response = requests.post(f"{self.base_url}/habits", json=habit_data, headers=headers)
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data["title"] == habit_data["title"]:
                    self.test_habits[email] = data["id"]
                    self.log_result("habit_management", "Daily Habit Creation", True, f"Created habit: {data['title']}")
                else:
                    self.log_result("habit_management", "Daily Habit Creation", False, "Invalid habit data returned")
            else:
                self.log_result("habit_management", "Daily Habit Creation", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("habit_management", "Daily Habit Creation", False, f"Exception: {str(e)}")
        
        # Test creating a weekly habit
        weekly_habit = {
            "title": "Weekly Workout",
            "frequency": "weekly",
            "start_date": date.today().isoformat()
        }
        
        try:
            response = requests.post(f"{self.base_url}/habits", json=weekly_habit, headers=headers)
            if response.status_code == 200:
                self.log_result("habit_management", "Weekly Habit Creation", True, "Created weekly habit successfully")
            else:
                self.log_result("habit_management", "Weekly Habit Creation", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("habit_management", "Weekly Habit Creation", False, f"Exception: {str(e)}")
    
    def test_habit_fetching(self):
        """Test fetching user's habits with stats"""
        print("\n=== Testing Habit Fetching ===")
        
        if not self.test_tokens:
            self.log_result("habit_management", "Habit Fetching", False, "No authenticated users available")
            return
        
        email = list(self.test_tokens.keys())[0]
        token = self.test_tokens[email]
        headers = {"Authorization": f"Bearer {token}"}
        
        try:
            response = requests.get(f"{self.base_url}/habits", headers=headers)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    if len(data) > 0:
                        habit = data[0]
                        if "habit" in habit and "stats" in habit and "today_completed" in habit:
                            self.log_result("habit_management", "Habit Fetching with Stats", True, f"Retrieved {len(data)} habits with complete data")
                        else:
                            self.log_result("habit_management", "Habit Fetching with Stats", False, "Habits missing required fields (habit, stats, today_completed)")
                    else:
                        self.log_result("habit_management", "Habit Fetching with Stats", True, "No habits found (valid empty response)")
                else:
                    self.log_result("habit_management", "Habit Fetching with Stats", False, "Response is not a list")
            else:
                self.log_result("habit_management", "Habit Fetching with Stats", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("habit_management", "Habit Fetching with Stats", False, f"Exception: {str(e)}")
    
    def test_habit_logging(self):
        """Test habit logging (mark as completed/incomplete)"""
        print("\n=== Testing Habit Logging ===")
        
        if not self.test_habits:
            self.log_result("habit_management", "Habit Logging", False, "No test habits available")
            return
        
        email = list(self.test_habits.keys())[0]
        habit_id = self.test_habits[email]
        token = self.test_tokens[email]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test marking habit as completed
        log_data = {
            "date": date.today().isoformat(),
            "completed": True
        }
        
        try:
            response = requests.post(f"{self.base_url}/habits/{habit_id}/log", json=log_data, headers=headers)
            if response.status_code == 200:
                data = response.json()
                if data["completed"] == True and data["habit_id"] == habit_id:
                    self.log_result("habit_management", "Mark Habit Completed", True, "Successfully marked habit as completed")
                else:
                    self.log_result("habit_management", "Mark Habit Completed", False, "Log data doesn't match expected values")
            else:
                self.log_result("habit_management", "Mark Habit Completed", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("habit_management", "Mark Habit Completed", False, f"Exception: {str(e)}")
        
        # Test updating the same day's log
        log_data["completed"] = False
        
        try:
            response = requests.post(f"{self.base_url}/habits/{habit_id}/log", json=log_data, headers=headers)
            if response.status_code == 200:
                data = response.json()
                if data["completed"] == False:
                    self.log_result("habit_management", "Update Habit Log", True, "Successfully updated existing log")
                else:
                    self.log_result("habit_management", "Update Habit Log", False, "Log update didn't reflect new value")
            else:
                self.log_result("habit_management", "Update Habit Log", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("habit_management", "Update Habit Log", False, f"Exception: {str(e)}")
    
    def test_streak_calculation(self):
        """Test streak calculation logic"""
        print("\n=== Testing Streak Calculation ===")
        
        if not self.test_habits:
            self.log_result("habit_management", "Streak Calculation", False, "No test habits available")
            return
        
        email = list(self.test_habits.keys())[0]
        habit_id = self.test_habits[email]
        token = self.test_tokens[email]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create a streak by logging multiple consecutive days
        today = date.today()
        for i in range(3):  # Log 3 consecutive days
            log_date = today - timedelta(days=i)
            log_data = {
                "date": log_date.isoformat(),
                "completed": True
            }
            
            try:
                requests.post(f"{self.base_url}/habits/{habit_id}/log", json=log_data, headers=headers)
            except:
                pass  # Continue even if some logs fail
        
        # Wait a moment for stats to update
        time.sleep(1)
        
        # Check if streak is calculated correctly
        try:
            response = requests.get(f"{self.base_url}/habits", headers=headers)
            if response.status_code == 200:
                habits = response.json()
                target_habit = next((h for h in habits if h["habit"]["id"] == habit_id), None)
                
                if target_habit and "stats" in target_habit:
                    current_streak = target_habit["stats"]["current_streak"]
                    if current_streak >= 1:  # Should have at least 1 day streak
                        self.log_result("habit_management", "Streak Calculation", True, f"Streak calculated: {current_streak} days")
                    else:
                        self.log_result("habit_management", "Streak Calculation", False, f"Expected streak >= 1, got {current_streak}")
                else:
                    self.log_result("habit_management", "Streak Calculation", False, "Could not find habit or stats")
            else:
                self.log_result("habit_management", "Streak Calculation", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("habit_management", "Streak Calculation", False, f"Exception: {str(e)}")
    
    def test_friend_requests(self):
        """Test sending and managing friend requests"""
        print("\n=== Testing Friend Requests ===")
        
        if len(self.test_users) < 2:
            self.log_result("social_features", "Friend Requests", False, "Need at least 2 users for friend testing")
            return
        
        user1_email = self.test_users[0]["email"]
        user2_email = self.test_users[1]["email"]
        user1_token = self.test_tokens[user1_email]
        user2_token = self.test_tokens[user2_email]
        
        # Test sending friend request
        headers1 = {"Authorization": f"Bearer {user1_token}"}
        friend_request = {"friend_email": user2_email}
        
        try:
            response = requests.post(f"{self.base_url}/friends/request", json=friend_request, headers=headers1)
            if response.status_code == 200:
                self.log_result("social_features", "Send Friend Request", True, f"Friend request sent from {user1_email} to {user2_email}")
            else:
                self.log_result("social_features", "Send Friend Request", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("social_features", "Send Friend Request", False, f"Exception: {str(e)}")
        
        # Test getting friend requests
        headers2 = {"Authorization": f"Bearer {user2_token}"}
        
        try:
            response = requests.get(f"{self.base_url}/friends/requests", headers=headers2)
            if response.status_code == 200:
                requests_data = response.json()
                if isinstance(requests_data, list) and len(requests_data) > 0:
                    request_id = requests_data[0]["request_id"]
                    self.log_result("social_features", "Get Friend Requests", True, f"Retrieved {len(requests_data)} friend requests")
                    
                    # Test accepting friend request
                    try:
                        response = requests.post(f"{self.base_url}/friends/accept/{request_id}", headers=headers2)
                        if response.status_code == 200:
                            self.log_result("social_features", "Accept Friend Request", True, "Friend request accepted successfully")
                        else:
                            self.log_result("social_features", "Accept Friend Request", False, f"HTTP {response.status_code}: {response.text}")
                    except Exception as e:
                        self.log_result("social_features", "Accept Friend Request", False, f"Exception: {str(e)}")
                else:
                    self.log_result("social_features", "Get Friend Requests", False, "No friend requests found")
            else:
                self.log_result("social_features", "Get Friend Requests", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("social_features", "Get Friend Requests", False, f"Exception: {str(e)}")
    
    def test_friends_leaderboard(self):
        """Test fetching friends leaderboard"""
        print("\n=== Testing Friends Leaderboard ===")
        
        if not self.test_tokens:
            self.log_result("social_features", "Friends Leaderboard", False, "No authenticated users available")
            return
        
        email = list(self.test_tokens.keys())[0]
        token = self.test_tokens[email]
        headers = {"Authorization": f"Bearer {token}"}
        
        try:
            response = requests.get(f"{self.base_url}/feed/friends-streaks", headers=headers)
            if response.status_code == 200:
                leaderboard = response.json()
                if isinstance(leaderboard, list):
                    self.log_result("social_features", "Friends Leaderboard", True, f"Retrieved leaderboard with {len(leaderboard)} friends")
                else:
                    self.log_result("social_features", "Friends Leaderboard", False, "Leaderboard response is not a list")
            else:
                self.log_result("social_features", "Friends Leaderboard", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("social_features", "Friends Leaderboard", False, f"Exception: {str(e)}")
    
    def test_authorization(self):
        """Test that users can only access their own data"""
        print("\n=== Testing Authorization ===")
        
        if len(self.test_users) < 2 or not self.test_habits:
            self.log_result("authorization", "Data Access Control", False, "Need multiple users and habits for authorization testing")
            return
        
        # Try to access another user's habit with wrong token
        user1_email = list(self.test_habits.keys())[0]
        user1_habit_id = self.test_habits[user1_email]
        
        # Find a different user
        user2_email = None
        for email in self.test_tokens.keys():
            if email != user1_email:
                user2_email = email
                break
        
        if not user2_email:
            self.log_result("authorization", "Data Access Control", False, "Could not find second user for testing")
            return
        
        user2_token = self.test_tokens[user2_email]
        headers2 = {"Authorization": f"Bearer {user2_token}"}
        
        # Try to log habit that belongs to user1 using user2's token
        log_data = {
            "date": date.today().isoformat(),
            "completed": True
        }
        
        try:
            response = requests.post(f"{self.base_url}/habits/{user1_habit_id}/log", json=log_data, headers=headers2)
            if response.status_code == 404:
                self.log_result("authorization", "Habit Access Control", True, "Correctly prevented access to other user's habit")
            else:
                self.log_result("authorization", "Habit Access Control", False, f"Should have blocked access, got {response.status_code}")
        except Exception as e:
            self.log_result("authorization", "Habit Access Control", False, f"Exception: {str(e)}")
    
    def test_data_validation(self):
        """Test various edge cases and data validation"""
        print("\n=== Testing Data Validation ===")
        
        if not self.test_tokens:
            self.log_result("data_validation", "Data Validation", False, "No authenticated users available")
            return
        
        email = list(self.test_tokens.keys())[0]
        token = self.test_tokens[email]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test invalid habit data
        invalid_habit = {
            "title": "",  # Empty title
            "frequency": "invalid_frequency",
            "start_date": "invalid_date"
        }
        
        try:
            response = requests.post(f"{self.base_url}/habits", json=invalid_habit, headers=headers)
            if response.status_code >= 400:
                self.log_result("data_validation", "Invalid Habit Data Rejection", True, "Correctly rejected invalid habit data")
            else:
                self.log_result("data_validation", "Invalid Habit Data Rejection", False, f"Should have rejected invalid data, got {response.status_code}")
        except Exception as e:
            self.log_result("data_validation", "Invalid Habit Data Rejection", False, f"Exception: {str(e)}")
        
        # Test invalid friend request
        invalid_friend = {"friend_email": "not_an_email"}
        
        try:
            response = requests.post(f"{self.base_url}/friends/request", json=invalid_friend, headers=headers)
            if response.status_code >= 400:
                self.log_result("data_validation", "Invalid Email Rejection", True, "Correctly rejected invalid email format")
            else:
                self.log_result("data_validation", "Invalid Email Rejection", False, f"Should have rejected invalid email, got {response.status_code}")
        except Exception as e:
            self.log_result("data_validation", "Invalid Email Rejection", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Comprehensive Backend Testing for One Thing Habit Tracker")
        print(f"Testing against: {self.base_url}")
        print("=" * 80)
        
        # Authentication Flow
        self.test_user_registration()
        self.test_user_login()
        self.test_jwt_validation()
        
        # Habit Management
        self.test_habit_creation()
        self.test_habit_fetching()
        self.test_habit_logging()
        self.test_streak_calculation()
        
        # Social Features
        self.test_friend_requests()
        self.test_friends_leaderboard()
        
        # Security & Validation
        self.test_authorization()
        self.test_data_validation()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 80)
        print("🏁 TEST SUMMARY")
        print("=" * 80)
        
        total_passed = 0
        total_failed = 0
        
        for category, results in self.test_results.items():
            passed = results["passed"]
            failed = results["failed"]
            total_passed += passed
            total_failed += failed
            
            print(f"\n📊 {category.upper().replace('_', ' ')}")
            print(f"   ✅ Passed: {passed}")
            print(f"   ❌ Failed: {failed}")
            
            if results["details"]:
                for detail in results["details"]:
                    print(f"   {detail}")
        
        print(f"\n🎯 OVERALL RESULTS")
        print(f"   ✅ Total Passed: {total_passed}")
        print(f"   ❌ Total Failed: {total_failed}")
        print(f"   📈 Success Rate: {(total_passed/(total_passed+total_failed)*100):.1f}%" if (total_passed+total_failed) > 0 else "N/A")
        
        if total_failed == 0:
            print("\n🎉 ALL TESTS PASSED! Backend is working correctly.")
        else:
            print(f"\n⚠️  {total_failed} tests failed. Review the details above.")
        
        print("=" * 80)

if __name__ == "__main__":
    tester = HabitTrackerTester()
    tester.run_all_tests()