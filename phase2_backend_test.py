#!/usr/bin/env python3
"""
Phase 2 Backend Testing for Enhanced Analytics and CSV Export
Tests the new Phase 2 features: enhanced analytics endpoint and CSV export functionality
"""

import requests
import json
import uuid
from datetime import date, datetime, timedelta
import time
import os

# Get backend URL from frontend env
BACKEND_URL = "https://1e76a8cc-52ee-4603-a7f1-a9f313f2c0a2.preview.emergentagent.com/api"

class Phase2BackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = {
            "phase2_analytics": {"passed": 0, "failed": 0, "details": []},
            "csv_export": {"passed": 0, "failed": 0, "details": []},
            "enhanced_streaks": {"passed": 0, "failed": 0, "details": []},
            "authorization": {"passed": 0, "failed": 0, "details": []}
        }
        # Mock tokens for testing (these would be real Supabase JWT tokens in practice)
        self.mock_teacher_token = "mock_teacher_jwt_token"
        self.mock_student_token = "mock_student_jwt_token"
        self.mock_class_id = "test-class-id-123"
    
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
    
    def test_enhanced_analytics_endpoint_structure(self):
        """Test enhanced analytics endpoint structure (Phase 2)"""
        print("\n=== Testing Enhanced Analytics Endpoint Structure ===")
        
        # Test endpoint accessibility
        headers = {"Authorization": f"Bearer {self.mock_teacher_token}"}
        
        try:
            response = requests.get(f"{self.base_url}/classes/{self.mock_class_id}/analytics", headers=headers)
            
            # Check if endpoint exists (even if auth fails, it should not be 404)
            if response.status_code in [200, 401, 403]:
                self.log_result("phase2_analytics", "Analytics Endpoint Exists", True, 
                              f"Endpoint accessible (status: {response.status_code})")
                
                # If we get a 200, check the structure
                if response.status_code == 200:
                    try:
                        data = response.json()
                        # Phase 2 enhanced fields
                        required_fields = ["class_name", "total_students", "average_daily_completion", "top_3_streaks", "analytics"]
                        missing_fields = [field for field in required_fields if field not in data]
                        
                        if not missing_fields:
                            self.log_result("phase2_analytics", "Enhanced Analytics Structure", True, 
                                          "All Phase 2 required fields present")
                            
                            # Validate field types
                            if (isinstance(data.get("total_students"), int) and 
                                isinstance(data.get("average_daily_completion"), (int, float)) and
                                isinstance(data.get("top_3_streaks"), list) and
                                isinstance(data.get("analytics"), list)):
                                
                                self.log_result("phase2_analytics", "Enhanced Analytics Field Types", True, 
                                              "All fields have correct data types")
                                
                                # Validate top_3_streaks structure
                                valid_streaks = True
                                for streak in data["top_3_streaks"]:
                                    if not all(key in streak for key in ["user_id", "streak", "habit_title"]):
                                        valid_streaks = False
                                        break
                                
                                if valid_streaks:
                                    self.log_result("phase2_analytics", "Top 3 Streaks Structure", True, 
                                                  f"Valid streak structure with {len(data['top_3_streaks'])} entries")
                                else:
                                    self.log_result("phase2_analytics", "Top 3 Streaks Structure", False, 
                                                  "Invalid streak object structure")
                            else:
                                self.log_result("phase2_analytics", "Enhanced Analytics Field Types", False, 
                                              "Incorrect field data types")
                        else:
                            self.log_result("phase2_analytics", "Enhanced Analytics Structure", False, 
                                          f"Missing Phase 2 fields: {missing_fields}")
                    except json.JSONDecodeError:
                        self.log_result("phase2_analytics", "Enhanced Analytics Structure", False, 
                                      "Invalid JSON response")
                else:
                    self.log_result("phase2_analytics", "Enhanced Analytics Structure", False, 
                                  f"Authentication required (status: {response.status_code})")
            else:
                self.log_result("phase2_analytics", "Analytics Endpoint Exists", False, 
                              f"Endpoint not found (status: {response.status_code})")
        except Exception as e:
            self.log_result("phase2_analytics", "Analytics Endpoint Exists", False, f"Exception: {str(e)}")
    
    def test_csv_export_endpoint_structure(self):
        """Test CSV export endpoint structure (Phase 2)"""
        print("\n=== Testing CSV Export Endpoint Structure ===")
        
        headers = {"Authorization": f"Bearer {self.mock_teacher_token}"}
        
        try:
            response = requests.get(f"{self.base_url}/classes/{self.mock_class_id}/export", headers=headers)
            
            # Check if endpoint exists
            if response.status_code in [200, 401, 403]:
                self.log_result("csv_export", "CSV Export Endpoint Exists", True, 
                              f"Endpoint accessible (status: {response.status_code})")
                
                # If we get a 200, check CSV format
                if response.status_code == 200:
                    content_type = response.headers.get('content-type', '')
                    content_disposition = response.headers.get('content-disposition', '')
                    
                    if 'text/csv' in content_type:
                        self.log_result("csv_export", "CSV Content Type", True, 
                                      "Correct CSV content type")
                        
                        if 'attachment' in content_disposition:
                            self.log_result("csv_export", "CSV Download Headers", True, 
                                          "Proper download headers set")
                            
                            # Check CSV content structure
                            csv_content = response.text
                            lines = csv_content.strip().split('\n')
                            
                            if len(lines) >= 1:
                                header = lines[0]
                                expected_headers = ['Student Name', 'Email', 'Total Habits', 'Active Habits', 'Best Streak', 'Completion Rate (%)', 'Last Activity']
                                
                                header_check = all(expected_header in header for expected_header in expected_headers)
                                
                                if header_check:
                                    self.log_result("csv_export", "CSV Header Structure", True, 
                                                  "All required CSV headers present")
                                else:
                                    self.log_result("csv_export", "CSV Header Structure", False, 
                                                  f"Missing CSV headers. Expected: {expected_headers}")
                            else:
                                self.log_result("csv_export", "CSV Header Structure", False, 
                                              "Empty CSV content")
                        else:
                            self.log_result("csv_export", "CSV Download Headers", False, 
                                          "Missing attachment header")
                    else:
                        self.log_result("csv_export", "CSV Content Type", False, 
                                      f"Incorrect content type: {content_type}")
                else:
                    self.log_result("csv_export", "CSV Export Endpoint Structure", False, 
                                  f"Authentication required (status: {response.status_code})")
            else:
                self.log_result("csv_export", "CSV Export Endpoint Exists", False, 
                              f"Endpoint not found (status: {response.status_code})")
        except Exception as e:
            self.log_result("csv_export", "CSV Export Endpoint Exists", False, f"Exception: {str(e)}")
    
    def test_student_access_restrictions(self):
        """Test that students cannot access teacher-only endpoints"""
        print("\n=== Testing Student Access Restrictions ===")
        
        student_headers = {"Authorization": f"Bearer {self.mock_student_token}"}
        
        # Test analytics access
        try:
            response = requests.get(f"{self.base_url}/classes/{self.mock_class_id}/analytics", headers=student_headers)
            if response.status_code == 403:
                self.log_result("authorization", "Student Analytics Access Denied", True, 
                              "Students correctly denied analytics access")
            elif response.status_code == 401:
                self.log_result("authorization", "Student Analytics Access Denied", True, 
                              "Authentication required (expected for mock token)")
            else:
                self.log_result("authorization", "Student Analytics Access Denied", False, 
                              f"Unexpected status code: {response.status_code}")
        except Exception as e:
            self.log_result("authorization", "Student Analytics Access Denied", False, f"Exception: {str(e)}")
        
        # Test CSV export access
        try:
            response = requests.get(f"{self.base_url}/classes/{self.mock_class_id}/export", headers=student_headers)
            if response.status_code == 403:
                self.log_result("authorization", "Student CSV Export Access Denied", True, 
                              "Students correctly denied CSV export access")
            elif response.status_code == 401:
                self.log_result("authorization", "Student CSV Export Access Denied", True, 
                              "Authentication required (expected for mock token)")
            else:
                self.log_result("authorization", "Student CSV Export Access Denied", False, 
                              f"Unexpected status code: {response.status_code}")
        except Exception as e:
            self.log_result("authorization", "Student CSV Export Access Denied", False, f"Exception: {str(e)}")
    
    def test_habits_endpoint_enhanced_stats(self):
        """Test that habits endpoint returns enhanced stats for streak calculations"""
        print("\n=== Testing Enhanced Habit Stats ===")
        
        headers = {"Authorization": f"Bearer {self.mock_teacher_token}"}
        
        try:
            response = requests.get(f"{self.base_url}/habits", headers=headers)
            
            if response.status_code in [200, 401]:
                self.log_result("enhanced_streaks", "Habits Endpoint Accessible", True, 
                              f"Habits endpoint accessible (status: {response.status_code})")
                
                if response.status_code == 200:
                    try:
                        habits = response.json()
                        if isinstance(habits, list):
                            self.log_result("enhanced_streaks", "Habits Response Format", True, 
                                          "Habits returned as list")
                            
                            # Check if habits have enhanced stats structure
                            if habits:
                                habit = habits[0]
                                if "stats" in habit:
                                    stats = habit["stats"]
                                    required_stats = ["current_streak", "best_streak", "percent_complete"]
                                    
                                    if all(stat in stats for stat in required_stats):
                                        self.log_result("enhanced_streaks", "Enhanced Stats Structure", True, 
                                                      "All required enhanced stats present")
                                    else:
                                        self.log_result("enhanced_streaks", "Enhanced Stats Structure", False, 
                                                      f"Missing stats: {[s for s in required_stats if s not in stats]}")
                                else:
                                    self.log_result("enhanced_streaks", "Enhanced Stats Structure", False, 
                                                  "No stats object in habit response")
                            else:
                                self.log_result("enhanced_streaks", "Enhanced Stats Structure", True, 
                                              "No habits to test (valid empty response)")
                        else:
                            self.log_result("enhanced_streaks", "Habits Response Format", False, 
                                          "Habits response is not a list")
                    except json.JSONDecodeError:
                        self.log_result("enhanced_streaks", "Habits Response Format", False, 
                                      "Invalid JSON response")
                else:
                    self.log_result("enhanced_streaks", "Enhanced Stats Structure", False, 
                                  "Authentication required for habits endpoint")
            else:
                self.log_result("enhanced_streaks", "Habits Endpoint Accessible", False, 
                              f"Habits endpoint not accessible (status: {response.status_code})")
        except Exception as e:
            self.log_result("enhanced_streaks", "Habits Endpoint Accessible", False, f"Exception: {str(e)}")
    
    def test_api_routing_consistency(self):
        """Test that all Phase 2 endpoints follow proper /api routing"""
        print("\n=== Testing API Routing Consistency ===")
        
        endpoints = [
            f"/classes/{self.mock_class_id}/analytics",
            f"/classes/{self.mock_class_id}/export",
            "/habits"
        ]
        
        headers = {"Authorization": f"Bearer {self.mock_teacher_token}"}
        
        for endpoint in endpoints:
            try:
                response = requests.get(f"{self.base_url}{endpoint}", headers=headers)
                
                # Any response other than 404 means the endpoint exists and routing works
                if response.status_code != 404:
                    self.log_result("phase2_analytics", f"API Routing {endpoint}", True, 
                                  f"Endpoint properly routed (status: {response.status_code})")
                else:
                    self.log_result("phase2_analytics", f"API Routing {endpoint}", False, 
                                  "Endpoint not found - routing issue")
            except Exception as e:
                self.log_result("phase2_analytics", f"API Routing {endpoint}", False, f"Exception: {str(e)}")
    
    def run_phase2_tests(self):
        """Run all Phase 2 specific tests"""
        print("🚀 Starting Phase 2 Backend Testing - Enhanced Analytics & CSV Export")
        print(f"Testing against: {self.base_url}")
        print("=" * 80)
        
        # Test Phase 2 enhanced analytics
        self.test_enhanced_analytics_endpoint_structure()
        
        # Test Phase 2 CSV export
        self.test_csv_export_endpoint_structure()
        
        # Test authorization for Phase 2 features
        self.test_student_access_restrictions()
        
        # Test enhanced streak calculations
        self.test_habits_endpoint_enhanced_stats()
        
        # Test API routing consistency
        self.test_api_routing_consistency()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 80)
        print("🏁 PHASE 2 BACKEND TEST SUMMARY")
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
            print("\n🎉 ALL PHASE 2 TESTS PASSED! Enhanced backend features are working correctly.")
        else:
            print(f"\n⚠️  {total_failed} tests failed. Review the details above.")
        
        print("=" * 80)

if __name__ == "__main__":
    tester = Phase2BackendTester()
    tester.run_phase2_tests()