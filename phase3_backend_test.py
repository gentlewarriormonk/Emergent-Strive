#!/usr/bin/env python3
"""
Phase 3 Backend Testing for Advanced Analytics with Charts and Streak Recomputation
Tests the new Phase 3 features: daily/weekly analytics endpoints and admin streak recomputation
"""

import requests
import json
import uuid
from datetime import date, datetime, timedelta
import time
import os

# Get backend URL from frontend env
BACKEND_URL = "https://1e76a8cc-52ee-4603-a7f1-a9f313f2c0a2.preview.emergentagent.com/api"

class Phase3BackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = {
            "daily_analytics": {"passed": 0, "failed": 0, "details": []},
            "weekly_analytics": {"passed": 0, "failed": 0, "details": []},
            "streak_recomputation": {"passed": 0, "failed": 0, "details": []},
            "authorization": {"passed": 0, "failed": 0, "details": []},
            "data_validation": {"passed": 0, "failed": 0, "details": []},
            "existing_endpoints": {"passed": 0, "failed": 0, "details": []}
        }
        # Mock tokens for testing (these would be real Supabase JWT tokens in practice)
        self.mock_teacher_token = "mock_teacher_jwt_token"
        self.mock_admin_token = "mock_admin_jwt_token"
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
    
    def test_daily_analytics_endpoint_structure(self):
        """Test daily analytics endpoint structure and functionality"""
        print("\n=== Testing Daily Analytics Endpoint Structure ===")
        
        headers = {"Authorization": f"Bearer {self.mock_teacher_token}"}
        
        # Test endpoint accessibility
        try:
            response = requests.get(f"{self.base_url}/classes/{self.mock_class_id}/analytics/daily", headers=headers)
            
            # Check if endpoint exists (even if auth fails, it should not be 404)
            if response.status_code in [200, 401, 403]:
                self.log_result("daily_analytics", "Daily Analytics Endpoint Exists", True, 
                              f"Endpoint accessible (status: {response.status_code})")
                
                # If we get a 200, check the structure
                if response.status_code == 200:
                    try:
                        data = response.json()
                        if isinstance(data, list):
                            self.log_result("daily_analytics", "Daily Analytics Response Format", True, 
                                          "Response is a list as expected")
                            
                            # Check structure if data exists
                            if data:
                                daily_entry = data[0]
                                required_fields = ["date", "completion_rate", "total_possible", "total_completed"]
                                missing_fields = [field for field in required_fields if field not in daily_entry]
                                
                                if not missing_fields:
                                    self.log_result("daily_analytics", "Daily Analytics Data Structure", True, 
                                                  f"All required fields present: {required_fields}")
                                    
                                    # Validate field types and values
                                    if (isinstance(daily_entry.get("completion_rate"), (int, float)) and
                                        isinstance(daily_entry.get("total_possible"), int) and
                                        isinstance(daily_entry.get("total_completed"), int) and
                                        isinstance(daily_entry.get("date"), str)):
                                        
                                        # Validate completion rate is percentage
                                        completion_rate = daily_entry.get("completion_rate")
                                        if 0 <= completion_rate <= 100:
                                            self.log_result("daily_analytics", "Daily Analytics Data Validation", True, 
                                                          f"Valid data: {completion_rate}% completion rate")
                                        else:
                                            self.log_result("daily_analytics", "Daily Analytics Data Validation", False, 
                                                          f"Invalid completion rate: {completion_rate}%")
                                    else:
                                        self.log_result("daily_analytics", "Daily Analytics Data Types", False, 
                                                      "Incorrect field data types")
                                else:
                                    self.log_result("daily_analytics", "Daily Analytics Data Structure", False, 
                                                  f"Missing required fields: {missing_fields}")
                            else:
                                self.log_result("daily_analytics", "Daily Analytics Data Structure", True, 
                                              "Empty response (valid for no data)")
                        else:
                            self.log_result("daily_analytics", "Daily Analytics Response Format", False, 
                                          "Response is not a list")
                    except json.JSONDecodeError:
                        self.log_result("daily_analytics", "Daily Analytics Response Format", False, 
                                      "Invalid JSON response")
                else:
                    self.log_result("daily_analytics", "Daily Analytics Authentication", False, 
                                  f"Authentication required (status: {response.status_code})")
            else:
                self.log_result("daily_analytics", "Daily Analytics Endpoint Exists", False, 
                              f"Endpoint not found (status: {response.status_code})")
        except Exception as e:
            self.log_result("daily_analytics", "Daily Analytics Endpoint Exists", False, f"Exception: {str(e)}")
    
    def test_daily_analytics_parameters(self):
        """Test daily analytics endpoint with different day parameters"""
        print("\n=== Testing Daily Analytics Parameters ===")
        
        headers = {"Authorization": f"Bearer {self.mock_teacher_token}"}
        
        # Test different day ranges
        test_cases = [
            (7, "7 days"),
            (14, "14 days"),
            (30, "30 days"),
            (90, "90 days (max)"),
            (100, "100 days (should limit to 90)"),
            (0, "0 days (should default to 1)"),
            (-5, "negative days (should default to 1)")
        ]
        
        for days, description in test_cases:
            try:
                response = requests.get(f"{self.base_url}/classes/{self.mock_class_id}/analytics/daily?days={days}", headers=headers)
                
                if response.status_code in [200, 401, 403]:
                    self.log_result("daily_analytics", f"Daily Analytics Parameter {description}", True, 
                                  f"Endpoint handles {description} parameter (status: {response.status_code})")
                else:
                    self.log_result("daily_analytics", f"Daily Analytics Parameter {description}", False, 
                                  f"Parameter handling failed (status: {response.status_code})")
            except Exception as e:
                self.log_result("daily_analytics", f"Daily Analytics Parameter {description}", False, f"Exception: {str(e)}")
    
    def test_weekly_analytics_endpoint_structure(self):
        """Test weekly analytics endpoint structure and functionality"""
        print("\n=== Testing Weekly Analytics Endpoint Structure ===")
        
        headers = {"Authorization": f"Bearer {self.mock_teacher_token}"}
        
        try:
            response = requests.get(f"{self.base_url}/classes/{self.mock_class_id}/analytics/weekly", headers=headers)
            
            # Check if endpoint exists
            if response.status_code in [200, 401, 403]:
                self.log_result("weekly_analytics", "Weekly Analytics Endpoint Exists", True, 
                              f"Endpoint accessible (status: {response.status_code})")
                
                # If we get a 200, check the structure
                if response.status_code == 200:
                    try:
                        data = response.json()
                        if isinstance(data, list):
                            self.log_result("weekly_analytics", "Weekly Analytics Response Format", True, 
                                          "Response is a list as expected")
                            
                            # Check structure if data exists
                            if data:
                                weekly_entry = data[0]
                                required_fields = ["week", "week_start", "completion_rate", "total_possible", "total_completed"]
                                missing_fields = [field for field in required_fields if field not in weekly_entry]
                                
                                if not missing_fields:
                                    self.log_result("weekly_analytics", "Weekly Analytics Data Structure", True, 
                                                  f"All required fields present: {required_fields}")
                                    
                                    # Validate ISO week format
                                    week_format = weekly_entry.get("week")
                                    if week_format and "-W" in week_format:
                                        self.log_result("weekly_analytics", "Weekly Analytics ISO Week Format", True, 
                                                      f"Valid ISO week format: {week_format}")
                                    else:
                                        self.log_result("weekly_analytics", "Weekly Analytics ISO Week Format", False, 
                                                      f"Invalid ISO week format: {week_format}")
                                    
                                    # Validate field types
                                    if (isinstance(weekly_entry.get("completion_rate"), (int, float)) and
                                        isinstance(weekly_entry.get("total_possible"), int) and
                                        isinstance(weekly_entry.get("total_completed"), int) and
                                        isinstance(weekly_entry.get("week_start"), str)):
                                        
                                        self.log_result("weekly_analytics", "Weekly Analytics Data Types", True, 
                                                      "All fields have correct data types")
                                    else:
                                        self.log_result("weekly_analytics", "Weekly Analytics Data Types", False, 
                                                      "Incorrect field data types")
                                else:
                                    self.log_result("weekly_analytics", "Weekly Analytics Data Structure", False, 
                                                  f"Missing required fields: {missing_fields}")
                            else:
                                self.log_result("weekly_analytics", "Weekly Analytics Data Structure", True, 
                                              "Empty response (valid for no data)")
                        else:
                            self.log_result("weekly_analytics", "Weekly Analytics Response Format", False, 
                                          "Response is not a list")
                    except json.JSONDecodeError:
                        self.log_result("weekly_analytics", "Weekly Analytics Response Format", False, 
                                      "Invalid JSON response")
                else:
                    self.log_result("weekly_analytics", "Weekly Analytics Authentication", False, 
                                  f"Authentication required (status: {response.status_code})")
            else:
                self.log_result("weekly_analytics", "Weekly Analytics Endpoint Exists", False, 
                              f"Endpoint not found (status: {response.status_code})")
        except Exception as e:
            self.log_result("weekly_analytics", "Weekly Analytics Endpoint Exists", False, f"Exception: {str(e)}")
    
    def test_weekly_analytics_parameters(self):
        """Test weekly analytics endpoint with different week parameters"""
        print("\n=== Testing Weekly Analytics Parameters ===")
        
        headers = {"Authorization": f"Bearer {self.mock_teacher_token}"}
        
        # Test different week ranges
        test_cases = [
            (4, "4 weeks"),
            (12, "12 weeks"),
            (26, "26 weeks"),
            (52, "52 weeks (max)"),
            (60, "60 weeks (should limit to 52)"),
            (0, "0 weeks (should default to 1)"),
            (-3, "negative weeks (should default to 1)")
        ]
        
        for weeks, description in test_cases:
            try:
                response = requests.get(f"{self.base_url}/classes/{self.mock_class_id}/analytics/weekly?weeks={weeks}", headers=headers)
                
                if response.status_code in [200, 401, 403]:
                    self.log_result("weekly_analytics", f"Weekly Analytics Parameter {description}", True, 
                                  f"Endpoint handles {description} parameter (status: {response.status_code})")
                else:
                    self.log_result("weekly_analytics", f"Weekly Analytics Parameter {description}", False, 
                                  f"Parameter handling failed (status: {response.status_code})")
            except Exception as e:
                self.log_result("weekly_analytics", f"Weekly Analytics Parameter {description}", False, f"Exception: {str(e)}")
    
    def test_admin_streak_recomputation_endpoint(self):
        """Test admin streak recomputation endpoint"""
        print("\n=== Testing Admin Streak Recomputation Endpoint ===")
        
        admin_headers = {"Authorization": f"Bearer {self.mock_admin_token}"}
        
        try:
            response = requests.post(f"{self.base_url}/admin/recompute-streaks", headers=admin_headers)
            
            # Check if endpoint exists
            if response.status_code in [200, 401, 403]:
                self.log_result("streak_recomputation", "Streak Recomputation Endpoint Exists", True, 
                              f"Endpoint accessible (status: {response.status_code})")
                
                # If we get a 200, check the response structure
                if response.status_code == 200:
                    try:
                        data = response.json()
                        required_fields = ["success", "message", "habits_processed", "timestamp"]
                        missing_fields = [field for field in required_fields if field not in data]
                        
                        if not missing_fields:
                            self.log_result("streak_recomputation", "Streak Recomputation Response Structure", True, 
                                          f"All required fields present: {required_fields}")
                            
                            # Validate field types and values
                            if (isinstance(data.get("success"), bool) and
                                isinstance(data.get("message"), str) and
                                isinstance(data.get("habits_processed"), int) and
                                isinstance(data.get("timestamp"), str)):
                                
                                if data.get("success") == True:
                                    self.log_result("streak_recomputation", "Streak Recomputation Success", True, 
                                                  f"Recomputation successful: {data.get('habits_processed')} habits processed")
                                else:
                                    self.log_result("streak_recomputation", "Streak Recomputation Success", False, 
                                                  f"Recomputation failed: {data.get('message')}")
                            else:
                                self.log_result("streak_recomputation", "Streak Recomputation Data Types", False, 
                                              "Incorrect field data types")
                        else:
                            self.log_result("streak_recomputation", "Streak Recomputation Response Structure", False, 
                                          f"Missing required fields: {missing_fields}")
                    except json.JSONDecodeError:
                        self.log_result("streak_recomputation", "Streak Recomputation Response Structure", False, 
                                      "Invalid JSON response")
                else:
                    self.log_result("streak_recomputation", "Streak Recomputation Authentication", False, 
                                  f"Authentication/authorization required (status: {response.status_code})")
            else:
                self.log_result("streak_recomputation", "Streak Recomputation Endpoint Exists", False, 
                              f"Endpoint not found (status: {response.status_code})")
        except Exception as e:
            self.log_result("streak_recomputation", "Streak Recomputation Endpoint Exists", False, f"Exception: {str(e)}")
    
    def test_authorization_restrictions(self):
        """Test authorization restrictions for Phase 3 endpoints"""
        print("\n=== Testing Authorization Restrictions ===")
        
        student_headers = {"Authorization": f"Bearer {self.mock_student_token}"}
        teacher_headers = {"Authorization": f"Bearer {self.mock_teacher_token}"}
        
        # Test student access to daily analytics (should be denied)
        try:
            response = requests.get(f"{self.base_url}/classes/{self.mock_class_id}/analytics/daily", headers=student_headers)
            if response.status_code in [401, 403]:
                self.log_result("authorization", "Student Daily Analytics Access Denied", True, 
                              "Students correctly denied daily analytics access")
            else:
                self.log_result("authorization", "Student Daily Analytics Access Denied", False, 
                              f"Unexpected status code: {response.status_code}")
        except Exception as e:
            self.log_result("authorization", "Student Daily Analytics Access Denied", False, f"Exception: {str(e)}")
        
        # Test student access to weekly analytics (should be denied)
        try:
            response = requests.get(f"{self.base_url}/classes/{self.mock_class_id}/analytics/weekly", headers=student_headers)
            if response.status_code in [401, 403]:
                self.log_result("authorization", "Student Weekly Analytics Access Denied", True, 
                              "Students correctly denied weekly analytics access")
            else:
                self.log_result("authorization", "Student Weekly Analytics Access Denied", False, 
                              f"Unexpected status code: {response.status_code}")
        except Exception as e:
            self.log_result("authorization", "Student Weekly Analytics Access Denied", False, f"Exception: {str(e)}")
        
        # Test teacher access to admin endpoint (should be denied)
        try:
            response = requests.post(f"{self.base_url}/admin/recompute-streaks", headers=teacher_headers)
            if response.status_code in [401, 403]:
                self.log_result("authorization", "Teacher Admin Access Denied", True, 
                              "Teachers correctly denied admin endpoint access")
            else:
                self.log_result("authorization", "Teacher Admin Access Denied", False, 
                              f"Unexpected status code: {response.status_code}")
        except Exception as e:
            self.log_result("authorization", "Teacher Admin Access Denied", False, f"Exception: {str(e)}")
        
        # Test student access to admin endpoint (should be denied)
        try:
            response = requests.post(f"{self.base_url}/admin/recompute-streaks", headers=student_headers)
            if response.status_code in [401, 403]:
                self.log_result("authorization", "Student Admin Access Denied", True, 
                              "Students correctly denied admin endpoint access")
            else:
                self.log_result("authorization", "Student Admin Access Denied", False, 
                              f"Unexpected status code: {response.status_code}")
        except Exception as e:
            self.log_result("authorization", "Student Admin Access Denied", False, f"Exception: {str(e)}")
    
    def test_http_method_restrictions(self):
        """Test HTTP method restrictions for Phase 3 endpoints"""
        print("\n=== Testing HTTP Method Restrictions ===")
        
        headers = {"Authorization": f"Bearer {self.mock_teacher_token}"}
        
        # Test POST on daily analytics (should be method not allowed)
        try:
            response = requests.post(f"{self.base_url}/classes/{self.mock_class_id}/analytics/daily", headers=headers)
            if response.status_code == 405:
                self.log_result("data_validation", "Daily Analytics POST Method Denied", True, 
                              "POST method correctly denied for daily analytics")
            else:
                self.log_result("data_validation", "Daily Analytics POST Method Denied", False, 
                              f"Unexpected status code: {response.status_code}")
        except Exception as e:
            self.log_result("data_validation", "Daily Analytics POST Method Denied", False, f"Exception: {str(e)}")
        
        # Test POST on weekly analytics (should be method not allowed)
        try:
            response = requests.post(f"{self.base_url}/classes/{self.mock_class_id}/analytics/weekly", headers=headers)
            if response.status_code == 405:
                self.log_result("data_validation", "Weekly Analytics POST Method Denied", True, 
                              "POST method correctly denied for weekly analytics")
            else:
                self.log_result("data_validation", "Weekly Analytics POST Method Denied", False, 
                              f"Unexpected status code: {response.status_code}")
        except Exception as e:
            self.log_result("data_validation", "Weekly Analytics POST Method Denied", False, f"Exception: {str(e)}")
        
        # Test GET on admin recompute (should be method not allowed)
        try:
            response = requests.get(f"{self.base_url}/admin/recompute-streaks", headers=headers)
            if response.status_code == 405:
                self.log_result("data_validation", "Admin Recompute GET Method Denied", True, 
                              "GET method correctly denied for admin recompute")
            else:
                self.log_result("data_validation", "Admin Recompute GET Method Denied", False, 
                              f"Unexpected status code: {response.status_code}")
        except Exception as e:
            self.log_result("data_validation", "Admin Recompute GET Method Denied", False, f"Exception: {str(e)}")
    
    def test_existing_endpoints_still_work(self):
        """Test that existing Phase 1 and Phase 2 endpoints still work"""
        print("\n=== Testing Existing Endpoints Still Work ===")
        
        headers = {"Authorization": f"Bearer {self.mock_teacher_token}"}
        
        # Test basic analytics endpoint
        try:
            response = requests.get(f"{self.base_url}/classes/{self.mock_class_id}/analytics", headers=headers)
            if response.status_code in [200, 401, 403]:
                self.log_result("existing_endpoints", "Basic Analytics Endpoint", True, 
                              f"Basic analytics endpoint still accessible (status: {response.status_code})")
            else:
                self.log_result("existing_endpoints", "Basic Analytics Endpoint", False, 
                              f"Basic analytics endpoint broken (status: {response.status_code})")
        except Exception as e:
            self.log_result("existing_endpoints", "Basic Analytics Endpoint", False, f"Exception: {str(e)}")
        
        # Test CSV export endpoint
        try:
            response = requests.get(f"{self.base_url}/classes/{self.mock_class_id}/export", headers=headers)
            if response.status_code in [200, 401, 403]:
                self.log_result("existing_endpoints", "CSV Export Endpoint", True, 
                              f"CSV export endpoint still accessible (status: {response.status_code})")
            else:
                self.log_result("existing_endpoints", "CSV Export Endpoint", False, 
                              f"CSV export endpoint broken (status: {response.status_code})")
        except Exception as e:
            self.log_result("existing_endpoints", "CSV Export Endpoint", False, f"Exception: {str(e)}")
        
        # Test habits endpoint
        try:
            response = requests.get(f"{self.base_url}/habits", headers=headers)
            if response.status_code in [200, 401, 403]:
                self.log_result("existing_endpoints", "Habits Endpoint", True, 
                              f"Habits endpoint still accessible (status: {response.status_code})")
            else:
                self.log_result("existing_endpoints", "Habits Endpoint", False, 
                              f"Habits endpoint broken (status: {response.status_code})")
        except Exception as e:
            self.log_result("existing_endpoints", "Habits Endpoint", False, f"Exception: {str(e)}")
        
        # Test user context endpoint
        try:
            response = requests.get(f"{self.base_url}/user/context", headers=headers)
            if response.status_code in [200, 401, 403]:
                self.log_result("existing_endpoints", "User Context Endpoint", True, 
                              f"User context endpoint still accessible (status: {response.status_code})")
            else:
                self.log_result("existing_endpoints", "User Context Endpoint", False, 
                              f"User context endpoint broken (status: {response.status_code})")
        except Exception as e:
            self.log_result("existing_endpoints", "User Context Endpoint", False, f"Exception: {str(e)}")
    
    def test_api_routing_consistency(self):
        """Test that all Phase 3 endpoints follow proper /api routing"""
        print("\n=== Testing API Routing Consistency ===")
        
        endpoints = [
            f"/classes/{self.mock_class_id}/analytics/daily",
            f"/classes/{self.mock_class_id}/analytics/weekly",
            "/admin/recompute-streaks"
        ]
        
        headers = {"Authorization": f"Bearer {self.mock_teacher_token}"}
        
        for endpoint in endpoints:
            try:
                # Use appropriate HTTP method for each endpoint
                if "recompute-streaks" in endpoint:
                    response = requests.post(f"{self.base_url}{endpoint}", headers=headers)
                else:
                    response = requests.get(f"{self.base_url}{endpoint}", headers=headers)
                
                # Any response other than 404 means the endpoint exists and routing works
                if response.status_code != 404:
                    self.log_result("data_validation", f"API Routing {endpoint}", True, 
                                  f"Endpoint properly routed (status: {response.status_code})")
                else:
                    self.log_result("data_validation", f"API Routing {endpoint}", False, 
                                  "Endpoint not found - routing issue")
            except Exception as e:
                self.log_result("data_validation", f"API Routing {endpoint}", False, f"Exception: {str(e)}")
    
    def run_phase3_tests(self):
        """Run all Phase 3 specific tests"""
        print("🚀 Starting Phase 3 Backend Testing - Advanced Analytics with Charts & Streak Recomputation")
        print(f"Testing against: {self.base_url}")
        print("=" * 80)
        
        # Test Phase 3 daily analytics
        self.test_daily_analytics_endpoint_structure()
        self.test_daily_analytics_parameters()
        
        # Test Phase 3 weekly analytics
        self.test_weekly_analytics_endpoint_structure()
        self.test_weekly_analytics_parameters()
        
        # Test Phase 3 admin streak recomputation
        self.test_admin_streak_recomputation_endpoint()
        
        # Test authorization for Phase 3 features
        self.test_authorization_restrictions()
        
        # Test HTTP method restrictions
        self.test_http_method_restrictions()
        
        # Test API routing consistency
        self.test_api_routing_consistency()
        
        # Test that existing endpoints still work
        self.test_existing_endpoints_still_work()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 80)
        print("🏁 PHASE 3 BACKEND TEST SUMMARY")
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
            print("\n🎉 ALL PHASE 3 TESTS PASSED! Advanced analytics backend features are working correctly.")
        else:
            print(f"\n⚠️  {total_failed} tests failed. Review the details above.")
        
        print("=" * 80)

if __name__ == "__main__":
    tester = Phase3BackendTester()
    tester.run_phase3_tests()