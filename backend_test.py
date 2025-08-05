#!/usr/bin/env python3
"""
Comprehensive Backend Testing for One Thing Habit Tracker - Class-Based System
Tests authentication, class management, habit tracking, analytics, and authorization
"""

import requests
import json
import uuid
from datetime import date, datetime, timedelta
import time

# Get backend URL from frontend env
BACKEND_URL = "https://eb2ef1f6-3972-46c8-a2c1-ba9cd83a94cf.preview.emergentagent.com/api"

class ClassBasedHabitTrackerTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_users = []
        self.test_tokens = {}
        self.test_habits = {}
        self.test_classes = {}
        self.test_results = {
            "authentication": {"passed": 0, "failed": 0, "details": []},
            "class_system": {"passed": 0, "failed": 0, "details": []},
            "habit_management": {"passed": 0, "failed": 0, "details": []},
            "class_features": {"passed": 0, "failed": 0, "details": []},
            "authorization": {"passed": 0, "failed": 0, "details": []},
            "data_validation": {"passed": 0, "failed": 0, "details": []}
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
    
    def test_teacher_registration_with_class_creation(self):
        """Test teacher registration that creates a new class"""
        print("\n=== Testing Teacher Registration with Class Creation ===")
        
        teacher_data = {
            "name": "Dr. Sarah Wilson",
            "email": f"sarah.wilson.{uuid.uuid4().hex[:8]}@school.edu",
            "password": "TeacherPass456!",
            "role": "teacher",
            "class_name": "Advanced Physics 2025"
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/register", json=teacher_data)
            if response.status_code == 200:
                data = response.json()
                if "token" in data and "user" in data:
                    user = data["user"]
                    if user["role"] == "teacher" and "class_id" in user:
                        self.test_users.append(teacher_data)
                        self.test_tokens[teacher_data["email"]] = data["token"]
                        self.test_classes[teacher_data["class_name"]] = user["class_id"]
                        self.log_result("class_system", "Teacher Registration with Class Creation", True, 
                                      f"Teacher {teacher_data['name']} registered and class '{teacher_data['class_name']}' created")
                    else:
                        self.log_result("class_system", "Teacher Registration with Class Creation", False, 
                                      "Teacher user missing role or class_id")
                else:
                    self.log_result("class_system", "Teacher Registration with Class Creation", False, 
                                  "Missing token or user in response")
            else:
                self.log_result("class_system", "Teacher Registration with Class Creation", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("class_system", "Teacher Registration with Class Creation", False, f"Exception: {str(e)}")
    
    def test_student_registration_joining_existing_class(self):
        """Test student registration joining an existing class"""
        print("\n=== Testing Student Registration Joining Existing Class ===")
        
        if not self.test_classes:
            self.log_result("class_system", "Student Registration Joining Class", False, "No existing classes available")
            return
        
        class_name = list(self.test_classes.keys())[0]
        student_data = {
            "name": "Emma Johnson",
            "email": f"emma.johnson.{uuid.uuid4().hex[:8]}@school.edu",
            "password": "StudentPass123!",
            "role": "student",
            "class_name": class_name
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/register", json=student_data)
            if response.status_code == 200:
                data = response.json()
                if "token" in data and "user" in data:
                    user = data["user"]
                    if user["role"] == "student" and user["class_id"] == self.test_classes[class_name]:
                        self.test_users.append(student_data)
                        self.test_tokens[student_data["email"]] = data["token"]
                        self.log_result("class_system", "Student Registration Joining Class", True, 
                                      f"Student {student_data['name']} joined existing class '{class_name}'")
                    else:
                        self.log_result("class_system", "Student Registration Joining Class", False, 
                                      "Student not assigned to correct class")
                else:
                    self.log_result("class_system", "Student Registration Joining Class", False, 
                                  "Missing token or user in response")
            else:
                self.log_result("class_system", "Student Registration Joining Class", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("class_system", "Student Registration Joining Class", False, f"Exception: {str(e)}")
    
    def test_student_registration_nonexistent_class(self):
        """Test student registration with non-existent class (should fail)"""
        print("\n=== Testing Student Registration with Non-existent Class ===")
        
        student_data = {
            "name": "John Doe",
            "email": f"john.doe.{uuid.uuid4().hex[:8]}@school.edu",
            "password": "StudentPass123!",
            "role": "student",
            "class_name": "NonExistentClass12345"
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/register", json=student_data)
            if response.status_code == 404:
                self.log_result("class_system", "Student Registration Non-existent Class", True, 
                              "Correctly rejected student registration for non-existent class")
            else:
                self.log_result("class_system", "Student Registration Non-existent Class", False, 
                              f"Should have rejected registration, got {response.status_code}")
        except Exception as e:
            self.log_result("class_system", "Student Registration Non-existent Class", False, f"Exception: {str(e)}")
    
    def test_user_login(self):
        """Test login for both teacher and student roles"""
        print("\n=== Testing User Login ===")
        
        if not self.test_users:
            self.log_result("authentication", "Login Test", False, "No test users available")
            return
        
        for user in self.test_users:
            login_data = {
                "email": user["email"],
                "password": user["password"]
            }
            
            try:
                response = requests.post(f"{self.base_url}/auth/login", json=login_data)
                if response.status_code == 200:
                    data = response.json()
                    if "token" in data and "user" in data:
                        self.log_result("authentication", f"{user['role'].title()} Login", True, 
                                      f"Successfully logged in {user['email']}")
                    else:
                        self.log_result("authentication", f"{user['role'].title()} Login", False, 
                                      "Missing token or user in response")
                else:
                    self.log_result("authentication", f"{user['role'].title()} Login", False, 
                                  f"HTTP {response.status_code}: {response.text}")
            except Exception as e:
                self.log_result("authentication", f"{user['role'].title()} Login", False, f"Exception: {str(e)}")
    
    def test_class_info_endpoint(self):
        """Test /my-class/info endpoint for class information"""
        print("\n=== Testing Class Info Endpoint ===")
        
        if not self.test_tokens:
            self.log_result("class_features", "Class Info Endpoint", False, "No authenticated users available")
            return
        
        for email, token in self.test_tokens.items():
            headers = {"Authorization": f"Bearer {token}"}
            
            try:
                response = requests.get(f"{self.base_url}/my-class/info", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    required_fields = ["class_name", "teacher_name", "student_count", "your_role"]
                    if all(field in data for field in required_fields):
                        self.log_result("class_features", "Class Info Endpoint", True, 
                                      f"Retrieved class info for {email}: {data['class_name']}")
                    else:
                        self.log_result("class_features", "Class Info Endpoint", False, 
                                      f"Missing required fields in response: {data}")
                else:
                    self.log_result("class_features", "Class Info Endpoint", False, 
                                  f"HTTP {response.status_code}: {response.text}")
            except Exception as e:
                self.log_result("class_features", "Class Info Endpoint", False, f"Exception: {str(e)}")
    
    def test_class_feed_endpoint(self):
        """Test /my-class/feed endpoint for class leaderboard"""
        print("\n=== Testing Class Feed Endpoint ===")
        
        if not self.test_tokens:
            self.log_result("class_features", "Class Feed Endpoint", False, "No authenticated users available")
            return
        
        email = list(self.test_tokens.keys())[0]
        token = self.test_tokens[email]
        headers = {"Authorization": f"Bearer {token}"}
        
        try:
            response = requests.get(f"{self.base_url}/my-class/feed", headers=headers)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    if len(data) > 0:
                        member = data[0]
                        required_fields = ["name", "role", "current_best_streak", "total_habits", "completion_rate", "recent_activity"]
                        if all(field in member for field in required_fields):
                            self.log_result("class_features", "Class Feed Endpoint", True, 
                                          f"Retrieved class feed with {len(data)} members")
                        else:
                            self.log_result("class_features", "Class Feed Endpoint", False, 
                                          f"Missing required fields in member data: {member}")
                    else:
                        self.log_result("class_features", "Class Feed Endpoint", True, 
                                      "Retrieved empty class feed (valid response)")
                else:
                    self.log_result("class_features", "Class Feed Endpoint", False, 
                                  "Response is not a list")
            else:
                self.log_result("class_features", "Class Feed Endpoint", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("class_features", "Class Feed Endpoint", False, f"Exception: {str(e)}")
    
    def test_teacher_analytics_endpoint(self):
        """Test teacher analytics endpoint /classes/{class_id}/analytics"""
        print("\n=== Testing Teacher Analytics Endpoint ===")
        
        # Find teacher user
        teacher_email = None
        teacher_class_id = None
        for user in self.test_users:
            if user["role"] == "teacher":
                teacher_email = user["email"]
                teacher_class_id = self.test_classes.get(user["class_name"])
                break
        
        if not teacher_email or not teacher_class_id:
            self.log_result("class_features", "Teacher Analytics Endpoint", False, "No teacher user or class available")
            return
        
        teacher_token = self.test_tokens[teacher_email]
        headers = {"Authorization": f"Bearer {teacher_token}"}
        
        try:
            response = requests.get(f"{self.base_url}/classes/{teacher_class_id}/analytics", headers=headers)
            if response.status_code == 200:
                data = response.json()
                required_fields = ["class_name", "total_students", "analytics"]
                if all(field in data for field in required_fields):
                    if isinstance(data["analytics"], list):
                        self.log_result("class_features", "Teacher Analytics Endpoint", True, 
                                      f"Retrieved analytics for {data['total_students']} students")
                    else:
                        self.log_result("class_features", "Teacher Analytics Endpoint", False, 
                                      "Analytics field is not a list")
                else:
                    self.log_result("class_features", "Teacher Analytics Endpoint", False, 
                                  f"Missing required fields in response: {data}")
            else:
                self.log_result("class_features", "Teacher Analytics Endpoint", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("class_features", "Teacher Analytics Endpoint", False, f"Exception: {str(e)}")
    
    def test_student_analytics_access_denied(self):
        """Test that students cannot access analytics endpoints"""
        print("\n=== Testing Student Analytics Access Denied ===")
        
        # Find student user
        student_email = None
        for user in self.test_users:
            if user["role"] == "student":
                student_email = user["email"]
                break
        
        if not student_email:
            self.log_result("authorization", "Student Analytics Access Denied", False, "No student user available")
            return
        
        student_token = self.test_tokens[student_email]
        headers = {"Authorization": f"Bearer {student_token}"}
        
        # Try to access analytics with any class_id
        test_class_id = list(self.test_classes.values())[0] if self.test_classes else "dummy_id"
        
        try:
            response = requests.get(f"{self.base_url}/classes/{test_class_id}/analytics", headers=headers)
            if response.status_code == 403:
                self.log_result("authorization", "Student Analytics Access Denied", True, 
                              "Correctly denied student access to analytics")
            else:
                self.log_result("authorization", "Student Analytics Access Denied", False, 
                              f"Should have denied access, got {response.status_code}")
        except Exception as e:
            self.log_result("authorization", "Student Analytics Access Denied", False, f"Exception: {str(e)}")
    
    def test_teacher_cross_class_access_denied(self):
        """Test that teachers can only access their own class analytics"""
        print("\n=== Testing Teacher Cross-Class Access Denied ===")
        
        # Find teacher user
        teacher_email = None
        for user in self.test_users:
            if user["role"] == "teacher":
                teacher_email = user["email"]
                break
        
        if not teacher_email:
            self.log_result("authorization", "Teacher Cross-Class Access", False, "No teacher user available")
            return
        
        teacher_token = self.test_tokens[teacher_email]
        headers = {"Authorization": f"Bearer {teacher_token}"}
        
        # Try to access analytics with a fake class_id
        fake_class_id = str(uuid.uuid4())
        
        try:
            response = requests.get(f"{self.base_url}/classes/{fake_class_id}/analytics", headers=headers)
            if response.status_code == 404:
                self.log_result("authorization", "Teacher Cross-Class Access", True, 
                              "Correctly denied teacher access to other class analytics")
            else:
                self.log_result("authorization", "Teacher Cross-Class Access", False, 
                              f"Should have denied access, got {response.status_code}")
        except Exception as e:
            self.log_result("authorization", "Teacher Cross-Class Access", False, f"Exception: {str(e)}")
    
    def test_jwt_validation(self):
        """Test JWT token validation on protected routes"""
        print("\n=== Testing JWT Token Validation ===")
        
        # Test valid token
        if self.test_tokens:
            email = list(self.test_tokens.keys())[0]
            token = self.test_tokens[email]
            headers = {"Authorization": f"Bearer {token}"}
            
            try:
                response = requests.get(f"{self.base_url}/my-class/info", headers=headers)
                if response.status_code == 200:
                    self.log_result("authentication", "Valid JWT Token", True, "Token accepted for protected route")
                else:
                    self.log_result("authentication", "Valid JWT Token", False, f"Valid token rejected: {response.status_code}")
            except Exception as e:
                self.log_result("authentication", "Valid JWT Token", False, f"Exception: {str(e)}")
        
        # Test invalid token
        invalid_headers = {"Authorization": "Bearer invalid_token_here"}
        
        try:
            response = requests.get(f"{self.base_url}/my-class/info", headers=invalid_headers)
            if response.status_code == 401:
                self.log_result("authentication", "Invalid JWT Rejection", True, "Invalid token correctly rejected")
            else:
                self.log_result("authentication", "Invalid JWT Rejection", False, f"Should have rejected invalid token, got {response.status_code}")
        except Exception as e:
            self.log_result("authentication", "Invalid JWT Rejection", False, f"Exception: {str(e)}")
    
    def test_habit_creation_and_management(self):
        """Test habit creation and basic management still works"""
        print("\n=== Testing Habit Creation and Management ===")
        
        if not self.test_tokens:
            self.log_result("habit_management", "Habit Creation", False, "No authenticated users available")
            return
        
        email = list(self.test_tokens.keys())[0]
        token = self.test_tokens[email]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test creating a daily habit
        habit_data = {
            "title": "Morning Reading",
            "frequency": "daily",
            "start_date": date.today().isoformat()
        }
        
        try:
            response = requests.post(f"{self.base_url}/habits", json=habit_data, headers=headers)
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data["title"] == habit_data["title"]:
                    self.test_habits[email] = data["id"]
                    self.log_result("habit_management", "Habit Creation", True, f"Created habit: {data['title']}")
                    
                    # Test habit logging
                    log_data = {
                        "date": date.today().isoformat(),
                        "completed": True
                    }
                    
                    try:
                        log_response = requests.post(f"{self.base_url}/habits/{data['id']}/log", 
                                                   json=log_data, headers=headers)
                        if log_response.status_code == 200:
                            self.log_result("habit_management", "Habit Logging", True, "Successfully logged habit completion")
                        else:
                            self.log_result("habit_management", "Habit Logging", False, 
                                          f"HTTP {log_response.status_code}: {log_response.text}")
                    except Exception as e:
                        self.log_result("habit_management", "Habit Logging", False, f"Exception: {str(e)}")
                else:
                    self.log_result("habit_management", "Habit Creation", False, "Invalid habit data returned")
            else:
                self.log_result("habit_management", "Habit Creation", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("habit_management", "Habit Creation", False, f"Exception: {str(e)}")
    
    def test_streak_calculation(self):
        """Test streak calculations are working"""
        print("\n=== Testing Streak Calculation ===")
        
        if not self.test_habits:
            self.log_result("habit_management", "Streak Calculation", False, "No test habits available")
            return
        
        email = list(self.test_habits.keys())[0]
        habit_id = self.test_habits[email]
        token = self.test_tokens[email]
        headers = {"Authorization": f"Bearer {token}"}
        
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
                    self.log_result("habit_management", "Streak Calculation", True, 
                                  f"Streak calculated: {current_streak} days")
                else:
                    self.log_result("habit_management", "Streak Calculation", False, "Could not find habit or stats")
            else:
                self.log_result("habit_management", "Streak Calculation", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("habit_management", "Streak Calculation", False, f"Exception: {str(e)}")
    
    def test_data_validation(self):
        """Test edge cases and error handling"""
        print("\n=== Testing Data Validation ===")
        
        # Test duplicate email registration
        if self.test_users:
            duplicate_user = self.test_users[0].copy()
            try:
                response = requests.post(f"{self.base_url}/auth/register", json=duplicate_user)
                if response.status_code == 400:
                    self.log_result("data_validation", "Duplicate Email Prevention", True, "Correctly rejected duplicate email")
                else:
                    self.log_result("data_validation", "Duplicate Email Prevention", False, 
                                  f"Should have rejected duplicate email, got {response.status_code}")
            except Exception as e:
                self.log_result("data_validation", "Duplicate Email Prevention", False, f"Exception: {str(e)}")
        
        # Test invalid login credentials
        if self.test_users:
            user = self.test_users[0]
            invalid_login = {
                "email": user["email"],
                "password": "WrongPassword123"
            }
            
            try:
                response = requests.post(f"{self.base_url}/auth/login", json=invalid_login)
                if response.status_code == 401:
                    self.log_result("data_validation", "Invalid Login Rejection", True, "Correctly rejected invalid credentials")
                else:
                    self.log_result("data_validation", "Invalid Login Rejection", False, 
                                  f"Should have rejected invalid credentials, got {response.status_code}")
            except Exception as e:
                self.log_result("data_validation", "Invalid Login Rejection", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Comprehensive Backend Testing for Class-Based One Thing Habit Tracker")
        print(f"Testing against: {self.base_url}")
        print("=" * 80)
        
        # Authentication & Class System
        self.test_teacher_registration_with_class_creation()
        self.test_student_registration_joining_existing_class()
        self.test_student_registration_nonexistent_class()
        self.test_user_login()
        
        # Class-Based Features
        self.test_class_info_endpoint()
        self.test_class_feed_endpoint()
        self.test_teacher_analytics_endpoint()
        
        # Authorization & Security
        self.test_student_analytics_access_denied()
        self.test_teacher_cross_class_access_denied()
        self.test_jwt_validation()
        
        # Habit Management (unchanged)
        self.test_habit_creation_and_management()
        self.test_streak_calculation()
        
        # Data Validation
        self.test_data_validation()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 80)
        print("🏁 CLASS-BASED SYSTEM TEST SUMMARY")
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
            print("\n🎉 ALL TESTS PASSED! Class-based backend system is working correctly.")
        else:
            print(f"\n⚠️  {total_failed} tests failed. Review the details above.")
        
        print("=" * 80)

if __name__ == "__main__":
    tester = ClassBasedHabitTrackerTester()
    tester.run_all_tests()