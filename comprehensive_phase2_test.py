#!/usr/bin/env python3
"""
Comprehensive Phase 2 Backend Testing with Real Supabase Integration
Tests Phase 2 features: enhanced analytics, CSV export, and enhanced streak calculations
"""

import requests
import json
import uuid
from datetime import date, datetime, timedelta
import time
import os
from supabase import create_client, Client

# Configuration
BACKEND_URL = "https://ab4df00f-3ade-4cc6-840e-ec03f13bb7d7.preview.emergentagent.com/api"
SUPABASE_URL = "https://ehcrxbnhnyxpzuryxthz.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoY3J4Ym5obnl4cHp1cnl4dGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MjI5OTMsImV4cCI6MjA3MDE5ODk5M30.iwDxAhnyX6-Mpcgdy5iVH-CJ2QVCb0IORofg1r-GWB4"

class ComprehensivePhase2Tester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        self.test_results = {
            "setup": {"passed": 0, "failed": 0, "details": []},
            "phase2_analytics": {"passed": 0, "failed": 0, "details": []},
            "csv_export": {"passed": 0, "failed": 0, "details": []},
            "enhanced_streaks": {"passed": 0, "failed": 0, "details": []},
            "authorization": {"passed": 0, "failed": 0, "details": []}
        }
        self.test_users = {}
        self.test_class_id = None
        self.test_school_id = None
    
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
    
    def create_test_users(self):
        """Create test users for Phase 2 testing"""
        print("\n=== Creating Test Users ===")
        
        # Create teacher user
        teacher_email = f"teacher.phase2.{uuid.uuid4().hex[:8]}@test.edu"
        teacher_password = "TestTeacher123!"
        
        try:
            teacher_response = self.supabase.auth.sign_up({
                "email": teacher_email,
                "password": teacher_password
            })
            
            if teacher_response.user:
                self.test_users['teacher'] = {
                    'email': teacher_email,
                    'password': teacher_password,
                    'user_id': teacher_response.user.id,
                    'token': teacher_response.session.access_token if teacher_response.session else None
                }
                self.log_result("setup", "Teacher User Creation", True, f"Created teacher: {teacher_email}")
            else:
                self.log_result("setup", "Teacher User Creation", False, "Failed to create teacher user")
                return False
        except Exception as e:
            self.log_result("setup", "Teacher User Creation", False, f"Exception: {str(e)}")
            return False
        
        # Create student user
        student_email = f"student.phase2.{uuid.uuid4().hex[:8]}@test.edu"
        student_password = "TestStudent123!"
        
        try:
            student_response = self.supabase.auth.sign_up({
                "email": student_email,
                "password": student_password
            })
            
            if student_response.user:
                self.test_users['student'] = {
                    'email': student_email,
                    'password': student_password,
                    'user_id': student_response.user.id,
                    'token': student_response.session.access_token if student_response.session else None
                }
                self.log_result("setup", "Student User Creation", True, f"Created student: {student_email}")
                return True
            else:
                self.log_result("setup", "Student User Creation", False, "Failed to create student user")
                return False
        except Exception as e:
            self.log_result("setup", "Student User Creation", False, f"Exception: {str(e)}")
            return False
    
    def setup_test_environment(self):
        """Set up test school, class, and users"""
        print("\n=== Setting Up Test Environment ===")
        
        if not self.test_users.get('teacher', {}).get('token'):
            self.log_result("setup", "Test Environment Setup", False, "No teacher token available")
            return False
        
        teacher_token = self.test_users['teacher']['token']
        headers = {"Authorization": f"Bearer {teacher_token}"}
        
        # Create school
        school_data = {"name": f"Phase2 Test School {uuid.uuid4().hex[:8]}"}
        
        try:
            response = requests.post(f"{self.base_url}/schools", json=school_data, headers=headers)
            if response.status_code == 200:
                school_info = response.json()
                self.test_school_id = school_info['school']['id']
                self.log_result("setup", "School Creation", True, f"Created school: {school_info['school']['name']}")
            else:
                self.log_result("setup", "School Creation", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("setup", "School Creation", False, f"Exception: {str(e)}")
            return False
        
        # Create class
        class_data = {
            "name": f"Phase2 Test Class {uuid.uuid4().hex[:8]}",
            "school_id": self.test_school_id
        }
        
        try:
            response = requests.post(f"{self.base_url}/classes", json=class_data, headers=headers)
            if response.status_code == 200:
                class_info = response.json()
                self.test_class_id = class_info['class']['id']
                self.log_result("setup", "Class Creation", True, f"Created class: {class_info['class']['name']}")
                return True
            else:
                self.log_result("setup", "Class Creation", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("setup", "Class Creation", False, f"Exception: {str(e)}")
            return False
    
    def test_enhanced_analytics_with_auth(self):
        """Test enhanced analytics endpoint with proper authentication"""
        print("\n=== Testing Enhanced Analytics with Authentication ===")
        
        if not self.test_users.get('teacher', {}).get('token') or not self.test_class_id:
            self.log_result("phase2_analytics", "Enhanced Analytics Auth Test", False, "Missing teacher token or class ID")
            return
        
        teacher_token = self.test_users['teacher']['token']
        headers = {"Authorization": f"Bearer {teacher_token}"}
        
        try:
            response = requests.get(f"{self.base_url}/classes/{self.test_class_id}/analytics", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check Phase 2 enhanced fields
                required_fields = ["class_name", "total_students", "average_daily_completion", "top_3_streaks", "analytics"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_result("phase2_analytics", "Enhanced Analytics Structure", True, 
                                  f"All Phase 2 fields present: {list(data.keys())}")
                    
                    # Validate field types and values
                    if (isinstance(data.get("total_students"), int) and 
                        isinstance(data.get("average_daily_completion"), (int, float)) and
                        isinstance(data.get("top_3_streaks"), list) and
                        isinstance(data.get("analytics"), list)):
                        
                        self.log_result("phase2_analytics", "Enhanced Analytics Data Types", True, 
                                      f"Correct data types: students={data['total_students']}, avg_completion={data['average_daily_completion']}%")
                        
                        # Test top_3_streaks structure
                        valid_streaks = True
                        for streak in data["top_3_streaks"]:
                            if not isinstance(streak, dict) or not all(key in streak for key in ["user_id", "streak", "habit_title"]):
                                valid_streaks = False
                                break
                        
                        if valid_streaks:
                            self.log_result("phase2_analytics", "Top 3 Streaks Structure", True, 
                                          f"Valid streak structure with {len(data['top_3_streaks'])} entries")
                        else:
                            self.log_result("phase2_analytics", "Top 3 Streaks Structure", False, 
                                          "Invalid streak object structure")
                    else:
                        self.log_result("phase2_analytics", "Enhanced Analytics Data Types", False, 
                                      "Incorrect field data types")
                else:
                    self.log_result("phase2_analytics", "Enhanced Analytics Structure", False, 
                                  f"Missing Phase 2 fields: {missing_fields}")
            elif response.status_code == 403:
                self.log_result("phase2_analytics", "Enhanced Analytics Auth Test", False, 
                              "Access denied - check user permissions")
            else:
                self.log_result("phase2_analytics", "Enhanced Analytics Auth Test", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("phase2_analytics", "Enhanced Analytics Auth Test", False, f"Exception: {str(e)}")
    
    def test_csv_export_with_auth(self):
        """Test CSV export endpoint with proper authentication"""
        print("\n=== Testing CSV Export with Authentication ===")
        
        if not self.test_users.get('teacher', {}).get('token') or not self.test_class_id:
            self.log_result("csv_export", "CSV Export Auth Test", False, "Missing teacher token or class ID")
            return
        
        teacher_token = self.test_users['teacher']['token']
        headers = {"Authorization": f"Bearer {teacher_token}"}
        
        try:
            response = requests.get(f"{self.base_url}/classes/{self.test_class_id}/export", headers=headers)
            
            if response.status_code == 200:
                # Check CSV response headers
                content_type = response.headers.get('content-type', '')
                content_disposition = response.headers.get('content-disposition', '')
                
                if 'text/csv' in content_type:
                    self.log_result("csv_export", "CSV Content Type", True, 
                                  f"Correct CSV content type: {content_type}")
                    
                    if 'attachment' in content_disposition and 'filename=' in content_disposition:
                        self.log_result("csv_export", "CSV Download Headers", True, 
                                      f"Proper download headers: {content_disposition}")
                        
                        # Check CSV content
                        csv_content = response.text
                        lines = csv_content.strip().split('\n')
                        
                        if len(lines) >= 1:
                            header = lines[0]
                            expected_headers = ['Student Name', 'Email', 'Total Habits', 'Active Habits', 'Best Streak', 'Completion Rate (%)', 'Last Activity']
                            
                            header_check = all(expected_header in header for expected_header in expected_headers)
                            
                            if header_check:
                                self.log_result("csv_export", "CSV Header Structure", True, 
                                              f"All required headers present in {len(lines)} lines")
                                
                                # Check for summary section
                                summary_found = any('CLASS SUMMARY' in line for line in lines)
                                if summary_found:
                                    self.log_result("csv_export", "CSV Summary Section", True, 
                                                  "Class summary section included")
                                else:
                                    self.log_result("csv_export", "CSV Summary Section", False, 
                                                  "Missing class summary section")
                            else:
                                self.log_result("csv_export", "CSV Header Structure", False, 
                                              f"Missing headers. Expected: {expected_headers}")
                        else:
                            self.log_result("csv_export", "CSV Header Structure", False, 
                                          "Empty CSV content")
                    else:
                        self.log_result("csv_export", "CSV Download Headers", False, 
                                      f"Missing proper download headers: {content_disposition}")
                else:
                    self.log_result("csv_export", "CSV Content Type", False, 
                                  f"Incorrect content type: {content_type}")
            elif response.status_code == 403:
                self.log_result("csv_export", "CSV Export Auth Test", False, 
                              "Access denied - check user permissions")
            else:
                self.log_result("csv_export", "CSV Export Auth Test", False, 
                              f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("csv_export", "CSV Export Auth Test", False, f"Exception: {str(e)}")
    
    def test_student_access_restrictions_real(self):
        """Test student access restrictions with real authentication"""
        print("\n=== Testing Student Access Restrictions (Real Auth) ===")
        
        if not self.test_users.get('student', {}).get('token') or not self.test_class_id:
            self.log_result("authorization", "Student Access Test", False, "Missing student token or class ID")
            return
        
        student_token = self.test_users['student']['token']
        headers = {"Authorization": f"Bearer {student_token}"}
        
        # Test analytics access
        try:
            response = requests.get(f"{self.base_url}/classes/{self.test_class_id}/analytics", headers=headers)
            if response.status_code == 403:
                self.log_result("authorization", "Student Analytics Access Denied", True, 
                              "Students correctly denied analytics access")
            else:
                self.log_result("authorization", "Student Analytics Access Denied", False, 
                              f"Unexpected status code: {response.status_code}")
        except Exception as e:
            self.log_result("authorization", "Student Analytics Access Denied", False, f"Exception: {str(e)}")
        
        # Test CSV export access
        try:
            response = requests.get(f"{self.base_url}/classes/{self.test_class_id}/export", headers=headers)
            if response.status_code == 403:
                self.log_result("authorization", "Student CSV Export Access Denied", True, 
                              "Students correctly denied CSV export access")
            else:
                self.log_result("authorization", "Student CSV Export Access Denied", False, 
                              f"Unexpected status code: {response.status_code}")
        except Exception as e:
            self.log_result("authorization", "Student CSV Export Access Denied", False, f"Exception: {str(e)}")
    
    def test_enhanced_habit_stats_real(self):
        """Test enhanced habit statistics with real data"""
        print("\n=== Testing Enhanced Habit Statistics ===")
        
        if not self.test_users.get('teacher', {}).get('token'):
            self.log_result("enhanced_streaks", "Enhanced Habit Stats", False, "Missing teacher token")
            return
        
        teacher_token = self.test_users['teacher']['token']
        headers = {"Authorization": f"Bearer {teacher_token}"}
        
        # Create a test habit first
        habit_data = {
            "name": "Phase2 Test Habit",
            "repeats": "daily",
            "startDate": date.today().isoformat()
        }
        
        try:
            create_response = requests.post(f"{self.base_url}/habits", json=habit_data, headers=headers)
            if create_response.status_code == 201:
                habit_info = create_response.json()
                habit_id = habit_info['habit']['id']
                
                self.log_result("enhanced_streaks", "Test Habit Creation", True, 
                              f"Created test habit: {habit_info['habit']['title']}")
                
                # Log some habit completions
                for i in range(3):
                    log_date = date.today() - timedelta(days=i)
                    log_data = {
                        "date": log_date.isoformat(),
                        "completed": True
                    }
                    
                    try:
                        requests.post(f"{self.base_url}/habits/{habit_id}/log", json=log_data, headers=headers)
                    except:
                        pass
                
                # Wait for calculations
                time.sleep(2)
                
                # Check enhanced stats
                response = requests.get(f"{self.base_url}/habits", headers=headers)
                if response.status_code == 200:
                    habits = response.json()
                    target_habit = next((h for h in habits if h["habit"]["id"] == habit_id), None)
                    
                    if target_habit and "stats" in target_habit:
                        stats = target_habit["stats"]
                        required_stats = ["current_streak", "best_streak", "percent_complete"]
                        
                        if all(stat in stats for stat in required_stats):
                            current_streak = stats["current_streak"]
                            best_streak = stats["best_streak"]
                            percent_complete = stats["percent_complete"]
                            
                            if (current_streak >= 0 and best_streak >= current_streak and 
                                0 <= percent_complete <= 100):
                                self.log_result("enhanced_streaks", "Enhanced Streak Calculations", True, 
                                              f"Valid stats: current={current_streak}, best={best_streak}, completion={percent_complete}%")
                            else:
                                self.log_result("enhanced_streaks", "Enhanced Streak Calculations", False, 
                                              f"Invalid values: current={current_streak}, best={best_streak}, completion={percent_complete}%")
                        else:
                            self.log_result("enhanced_streaks", "Enhanced Streak Calculations", False, 
                                          f"Missing stats: {[s for s in required_stats if s not in stats]}")
                    else:
                        self.log_result("enhanced_streaks", "Enhanced Streak Calculations", False, 
                                      "No stats found in habit response")
                else:
                    self.log_result("enhanced_streaks", "Enhanced Streak Calculations", False, 
                                  f"Failed to get habits: {response.status_code}")
            else:
                self.log_result("enhanced_streaks", "Test Habit Creation", False, 
                              f"Failed to create habit: {create_response.status_code}")
        except Exception as e:
            self.log_result("enhanced_streaks", "Enhanced Habit Stats", False, f"Exception: {str(e)}")
    
    def run_comprehensive_phase2_tests(self):
        """Run comprehensive Phase 2 tests with real authentication"""
        print("🚀 Starting Comprehensive Phase 2 Backend Testing")
        print(f"Testing against: {self.base_url}")
        print("=" * 80)
        
        # Setup phase
        if not self.create_test_users():
            print("❌ Failed to create test users. Skipping authenticated tests.")
            return
        
        if not self.setup_test_environment():
            print("❌ Failed to setup test environment. Skipping environment-dependent tests.")
            return
        
        # Phase 2 feature tests
        self.test_enhanced_analytics_with_auth()
        self.test_csv_export_with_auth()
        self.test_student_access_restrictions_real()
        self.test_enhanced_habit_stats_real()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 80)
        print("🏁 COMPREHENSIVE PHASE 2 TEST SUMMARY")
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
            print("\n🎉 ALL COMPREHENSIVE PHASE 2 TESTS PASSED!")
        else:
            print(f"\n⚠️  {total_failed} tests failed. Review the details above.")
        
        print("=" * 80)

if __name__ == "__main__":
    tester = ComprehensivePhase2Tester()
    tester.run_comprehensive_phase2_tests()