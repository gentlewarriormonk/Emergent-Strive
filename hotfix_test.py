#!/usr/bin/env python3
"""
Hotfix Testing for Add Habit API Changes
Tests the specific hotfix changes to POST /habits endpoint:
- New field names: { name, repeats, startDate }
- 201 status code response
- Field mapping: name -> title, repeats -> frequency
- Response format with recent_logs array
"""

import requests
import json
import uuid
from datetime import date, datetime, timedelta
import time

# Get backend URL from frontend env
BACKEND_URL = "https://e1775d52-63b1-4e94-ab13-bc0364a8e8b7.preview.emergentagent.com/api"

class HotfixTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_token = None
        self.test_user_email = None
        self.test_results = []
    
    def log_result(self, test_name, passed, details=""):
        """Log test result"""
        status = "✅ PASS" if passed else "❌ FAIL"
        result = f"{status}: {test_name} - {details}"
        self.test_results.append(result)
        print(result)
    
    def setup_test_user(self):
        """Create a test user for authentication"""
        print("\n=== Setting up test user ===")
        
        # First create a teacher to create a class
        teacher_data = {
            "name": "Test Teacher",
            "email": f"teacher.{uuid.uuid4().hex[:8]}@test.com",
            "password": "TestPass123!",
            "role": "teacher",
            "class_name": "Test Class Hotfix"
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/register", json=teacher_data)
            if response.status_code == 200:
                data = response.json()
                self.test_token = data["token"]
                self.test_user_email = teacher_data["email"]
                self.log_result("Test User Setup", True, f"Created test user: {teacher_data['email']}")
                return True
            else:
                self.log_result("Test User Setup", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Test User Setup", False, f"Exception: {str(e)}")
            return False
    
    def test_habit_creation_with_new_fields(self):
        """Test POST /habits with new field names: { name, repeats, startDate }"""
        print("\n=== Testing Habit Creation with New Field Names ===")
        
        if not self.test_token:
            self.log_result("Habit Creation New Fields", False, "No authentication token available")
            return
        
        headers = {"Authorization": f"Bearer {self.test_token}"}
        
        # Test with all new field names
        habit_data = {
            "name": "Test Reading Habit",
            "repeats": "daily",
            "startDate": "2024-08-05"
        }
        
        try:
            response = requests.post(f"{self.base_url}/habits", json=habit_data, headers=headers)
            
            # Check status code is 201
            if response.status_code == 201:
                self.log_result("201 Status Code", True, "POST /habits returns 201 status code")
                
                data = response.json()
                
                # Check response structure
                required_fields = ["habit", "today_completed", "recent_logs", "stats"]
                if all(field in data for field in required_fields):
                    self.log_result("Response Structure", True, "Response includes habit, today_completed, recent_logs, and stats")
                    
                    # Check habit object has correct mapped fields
                    habit = data["habit"]
                    if habit.get("title") == habit_data["name"]:
                        self.log_result("Name to Title Mapping", True, f"'name' correctly mapped to 'title': {habit['title']}")
                    else:
                        self.log_result("Name to Title Mapping", False, f"Expected title '{habit_data['name']}', got '{habit.get('title')}'")
                    
                    if habit.get("frequency") == habit_data["repeats"]:
                        self.log_result("Repeats to Frequency Mapping", True, f"'repeats' correctly mapped to 'frequency': {habit['frequency']}")
                    else:
                        self.log_result("Repeats to Frequency Mapping", False, f"Expected frequency '{habit_data['repeats']}', got '{habit.get('frequency')}'")
                    
                    if habit.get("start_date") == habit_data["startDate"]:
                        self.log_result("StartDate Mapping", True, f"'startDate' correctly mapped to 'start_date': {habit['start_date']}")
                    else:
                        self.log_result("StartDate Mapping", False, f"Expected start_date '{habit_data['startDate']}', got '{habit.get('start_date')}'")
                    
                    # Check recent_logs is an array
                    if isinstance(data["recent_logs"], list):
                        self.log_result("Recent Logs Array", True, f"recent_logs is an array with {len(data['recent_logs'])} items")
                    else:
                        self.log_result("Recent Logs Array", False, f"recent_logs is not an array: {type(data['recent_logs'])}")
                    
                    # Check stats object structure
                    stats = data["stats"]
                    expected_stats = ["habit_id", "current_streak", "best_streak", "percent_complete"]
                    if all(field in stats for field in expected_stats):
                        self.log_result("Stats Object Structure", True, "Stats object has all required fields")
                        
                        # Check initial values for new habit
                        if (stats["current_streak"] == 0 and 
                            stats["best_streak"] == 0 and 
                            stats["percent_complete"] == 0.0):
                            self.log_result("Initial Stats Values", True, "Stats initialized with correct zero values for new habit")
                        else:
                            self.log_result("Initial Stats Values", False, f"Stats not initialized correctly: {stats}")
                    else:
                        self.log_result("Stats Object Structure", False, f"Missing stats fields: {stats}")
                    
                else:
                    self.log_result("Response Structure", False, f"Missing required fields in response: {list(data.keys())}")
            else:
                self.log_result("201 Status Code", False, f"Expected 201, got {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Habit Creation New Fields", False, f"Exception: {str(e)}")
    
    def test_habit_creation_without_start_date(self):
        """Test habit creation without startDate (should default to today)"""
        print("\n=== Testing Habit Creation Without StartDate ===")
        
        if not self.test_token:
            self.log_result("Habit Creation No StartDate", False, "No authentication token available")
            return
        
        headers = {"Authorization": f"Bearer {self.test_token}"}
        
        # Test without startDate
        habit_data = {
            "name": "Test Exercise Habit",
            "repeats": "weekly"
        }
        
        try:
            response = requests.post(f"{self.base_url}/habits", json=habit_data, headers=headers)
            
            if response.status_code == 201:
                data = response.json()
                habit = data["habit"]
                
                # Check if start_date defaults to today
                today = date.today().isoformat()
                if habit.get("start_date") == today:
                    self.log_result("Default StartDate", True, f"startDate correctly defaults to today: {today}")
                else:
                    self.log_result("Default StartDate", False, f"Expected start_date '{today}', got '{habit.get('start_date')}'")
            else:
                self.log_result("Habit Creation No StartDate", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Habit Creation No StartDate", False, f"Exception: {str(e)}")
    
    def test_custom_repeats_option(self):
        """Test the 'custom' repeats option"""
        print("\n=== Testing Custom Repeats Option ===")
        
        if not self.test_token:
            self.log_result("Custom Repeats Option", False, "No authentication token available")
            return
        
        headers = {"Authorization": f"Bearer {self.test_token}"}
        
        # Test with custom repeats
        habit_data = {
            "name": "Test Custom Habit",
            "repeats": "custom",
            "startDate": "2024-08-10"
        }
        
        try:
            response = requests.post(f"{self.base_url}/habits", json=habit_data, headers=headers)
            
            if response.status_code == 201:
                data = response.json()
                habit = data["habit"]
                
                if habit.get("frequency") == "custom":
                    self.log_result("Custom Repeats Option", True, "Custom repeats option works correctly")
                else:
                    self.log_result("Custom Repeats Option", False, f"Expected frequency 'custom', got '{habit.get('frequency')}'")
            else:
                self.log_result("Custom Repeats Option", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Custom Repeats Option", False, f"Exception: {str(e)}")
    
    def test_field_mapping_validation(self):
        """Test comprehensive field mapping validation"""
        print("\n=== Testing Field Mapping Validation ===")
        
        if not self.test_token:
            self.log_result("Field Mapping Validation", False, "No authentication token available")
            return
        
        headers = {"Authorization": f"Bearer {self.test_token}"}
        
        # Create habit with specific values to verify mapping
        habit_data = {
            "name": "Comprehensive Test Habit",
            "repeats": "daily",
            "startDate": "2024-08-15"
        }
        
        try:
            response = requests.post(f"{self.base_url}/habits", json=habit_data, headers=headers)
            
            if response.status_code == 201:
                data = response.json()
                habit = data["habit"]
                
                # Verify all field mappings
                mappings_correct = True
                mapping_details = []
                
                if habit.get("title") != habit_data["name"]:
                    mappings_correct = False
                    mapping_details.append(f"name->title failed: expected '{habit_data['name']}', got '{habit.get('title')}'")
                else:
                    mapping_details.append(f"name->title: ✓ '{habit_data['name']}'")
                
                if habit.get("frequency") != habit_data["repeats"]:
                    mappings_correct = False
                    mapping_details.append(f"repeats->frequency failed: expected '{habit_data['repeats']}', got '{habit.get('frequency')}'")
                else:
                    mapping_details.append(f"repeats->frequency: ✓ '{habit_data['repeats']}'")
                
                if habit.get("start_date") != habit_data["startDate"]:
                    mappings_correct = False
                    mapping_details.append(f"startDate->start_date failed: expected '{habit_data['startDate']}', got '{habit.get('start_date')}'")
                else:
                    mapping_details.append(f"startDate->start_date: ✓ '{habit_data['startDate']}'")
                
                # Check that old field names are not present in the habit object
                old_fields_present = []
                if "name" in habit:
                    old_fields_present.append("name")
                if "repeats" in habit:
                    old_fields_present.append("repeats")
                if "startDate" in habit:
                    old_fields_present.append("startDate")
                
                if old_fields_present:
                    mappings_correct = False
                    mapping_details.append(f"Old field names still present: {old_fields_present}")
                else:
                    mapping_details.append("Old field names correctly removed from response")
                
                self.log_result("Field Mapping Validation", mappings_correct, "; ".join(mapping_details))
            else:
                self.log_result("Field Mapping Validation", False, f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_result("Field Mapping Validation", False, f"Exception: {str(e)}")
    
    def run_hotfix_tests(self):
        """Run all hotfix-specific tests"""
        print("🔧 Starting Hotfix Testing for Add Habit API Changes")
        print(f"Testing against: {self.base_url}")
        print("=" * 80)
        
        # Setup
        if not self.setup_test_user():
            print("❌ Failed to setup test user. Cannot proceed with tests.")
            return
        
        # Run hotfix tests
        self.test_habit_creation_with_new_fields()
        self.test_habit_creation_without_start_date()
        self.test_custom_repeats_option()
        self.test_field_mapping_validation()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("🏁 HOTFIX TEST SUMMARY")
        print("=" * 80)
        
        passed_count = sum(1 for result in self.test_results if "✅ PASS" in result)
        failed_count = sum(1 for result in self.test_results if "❌ FAIL" in result)
        
        for result in self.test_results:
            print(f"   {result}")
        
        print(f"\n🎯 OVERALL RESULTS")
        print(f"   ✅ Total Passed: {passed_count}")
        print(f"   ❌ Total Failed: {failed_count}")
        print(f"   📈 Success Rate: {(passed_count/(passed_count+failed_count)*100):.1f}%" if (passed_count+failed_count) > 0 else "N/A")
        
        if failed_count == 0:
            print("\n🎉 ALL HOTFIX TESTS PASSED! Add Habit API changes are working correctly.")
        else:
            print(f"\n⚠️  {failed_count} tests failed. Review the details above.")
        
        print("=" * 80)

if __name__ == "__main__":
    tester = HotfixTester()
    tester.run_hotfix_tests()