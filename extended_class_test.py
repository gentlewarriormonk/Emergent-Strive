#!/usr/bin/env python3
"""
Extended Class-Based Testing - Multiple Users in Same Class
Tests analytics system with multiple students and more comprehensive data
"""

import requests
import json
import uuid
from datetime import date, datetime, timedelta
import time

BACKEND_URL = "https://e1775d52-63b1-4e94-ab13-bc0364a8e8b7.preview.emergentagent.com/api"

class ExtendedClassTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.teacher_data = None
        self.teacher_token = None
        self.students = []
        self.student_tokens = {}
        self.class_name = f"Extended Test Class {uuid.uuid4().hex[:6]}"
        
    def create_teacher_and_class(self):
        """Create teacher and class"""
        print(f"\n=== Creating Teacher and Class: {self.class_name} ===")
        
        self.teacher_data = {
            "name": "Prof. Michael Chen",
            "email": f"michael.chen.{uuid.uuid4().hex[:8]}@university.edu",
            "password": "ProfPass789!",
            "role": "teacher",
            "class_name": self.class_name
        }
        
        response = requests.post(f"{self.base_url}/auth/register", json=self.teacher_data)
        if response.status_code == 200:
            data = response.json()
            self.teacher_token = data["token"]
            self.class_id = data["user"]["class_id"]
            print(f"✅ Teacher created: {self.teacher_data['name']}")
            return True
        else:
            print(f"❌ Failed to create teacher: {response.status_code} - {response.text}")
            return False
    
    def create_multiple_students(self, count=4):
        """Create multiple students in the same class"""
        print(f"\n=== Creating {count} Students in Class ===")
        
        student_names = [
            "Alice Rodriguez", "Bob Thompson", "Carol Kim", "David Patel",
            "Eva Martinez", "Frank Wilson", "Grace Lee", "Henry Brown"
        ]
        
        for i in range(count):
            student_data = {
                "name": student_names[i],
                "email": f"{student_names[i].lower().replace(' ', '.')}.{uuid.uuid4().hex[:6]}@university.edu",
                "password": f"Student{i+1}Pass!",
                "role": "student",
                "class_name": self.class_name
            }
            
            response = requests.post(f"{self.base_url}/auth/register", json=student_data)
            if response.status_code == 200:
                data = response.json()
                self.students.append(student_data)
                self.student_tokens[student_data["email"]] = data["token"]
                print(f"✅ Student created: {student_data['name']}")
            else:
                print(f"❌ Failed to create student {student_data['name']}: {response.status_code}")
    
    def create_habits_for_students(self):
        """Create different habits for each student"""
        print(f"\n=== Creating Habits for Students ===")
        
        habit_templates = [
            {"title": "Morning Exercise", "frequency": "daily"},
            {"title": "Read for 30 minutes", "frequency": "daily"},
            {"title": "Practice Piano", "frequency": "daily"},
            {"title": "Weekly Project Review", "frequency": "weekly"},
            {"title": "Meditation", "frequency": "daily"},
            {"title": "Journal Writing", "frequency": "daily"}
        ]
        
        for i, student in enumerate(self.students):
            token = self.student_tokens[student["email"]]
            headers = {"Authorization": f"Bearer {token}"}
            
            # Create 2-3 habits per student
            num_habits = 2 + (i % 2)  # 2 or 3 habits
            for j in range(num_habits):
                habit_data = habit_templates[j % len(habit_templates)].copy()
                habit_data["start_date"] = date.today().isoformat()
                
                response = requests.post(f"{self.base_url}/habits", json=habit_data, headers=headers)
                if response.status_code == 200:
                    print(f"✅ Created habit '{habit_data['title']}' for {student['name']}")
                else:
                    print(f"❌ Failed to create habit for {student['name']}")
    
    def simulate_habit_activity(self):
        """Simulate different levels of habit activity for students"""
        print(f"\n=== Simulating Habit Activity ===")
        
        for i, student in enumerate(self.students):
            token = self.student_tokens[student["email"]]
            headers = {"Authorization": f"Bearer {token}"}
            
            # Get student's habits
            response = requests.get(f"{self.base_url}/habits", headers=headers)
            if response.status_code == 200:
                habits = response.json()
                
                # Simulate different activity levels
                activity_level = (i % 3) + 1  # 1, 2, or 3 (low, medium, high)
                
                for habit_data in habits:
                    habit_id = habit_data["habit"]["id"]
                    
                    # Log habits for past few days with different completion rates
                    for day_offset in range(7):  # Past 7 days
                        log_date = date.today() - timedelta(days=day_offset)
                        
                        # Different completion probability based on activity level
                        import random
                        completion_prob = 0.3 + (activity_level * 0.2)  # 0.5, 0.7, 0.9
                        completed = random.random() < completion_prob
                        
                        log_data = {
                            "date": log_date.isoformat(),
                            "completed": completed
                        }
                        
                        requests.post(f"{self.base_url}/habits/{habit_id}/log", 
                                    json=log_data, headers=headers)
                
                print(f"✅ Simulated activity for {student['name']} (level {activity_level})")
    
    def test_class_analytics_with_data(self):
        """Test class analytics with rich data"""
        print(f"\n=== Testing Class Analytics with Rich Data ===")
        
        headers = {"Authorization": f"Bearer {self.teacher_token}"}
        
        # Wait for stats to update
        time.sleep(2)
        
        response = requests.get(f"{self.base_url}/classes/{self.class_id}/analytics", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Class Analytics Retrieved:")
            print(f"   Class: {data['class_name']}")
            print(f"   Total Students: {data['total_students']}")
            print(f"   Analytics Records: {len(data['analytics'])}")
            
            for student_analytics in data['analytics']:
                print(f"   📊 {student_analytics['student_name']}:")
                print(f"      - Total Habits: {student_analytics['total_habits']}")
                print(f"      - Active Habits: {student_analytics['active_habits']}")
                print(f"      - Best Streak: {student_analytics['best_current_streak']}")
                print(f"      - Completion Rate: {student_analytics['average_completion_rate']}%")
                print(f"      - Last Activity: {student_analytics['last_activity']}")
            
            return True
        else:
            print(f"❌ Failed to get analytics: {response.status_code} - {response.text}")
            return False
    
    def test_class_feed_with_data(self):
        """Test class feed with rich data"""
        print(f"\n=== Testing Class Feed with Rich Data ===")
        
        # Test from student perspective
        student_email = self.students[0]["email"]
        token = self.student_tokens[student_email]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{self.base_url}/my-class/feed", headers=headers)
        if response.status_code == 200:
            feed_data = response.json()
            print(f"✅ Class Feed Retrieved ({len(feed_data)} members):")
            
            for i, member in enumerate(feed_data):
                print(f"   {i+1}. {member['name']} ({member['role']})")
                print(f"      - Best Streak: {member['current_best_streak']}")
                print(f"      - Total Habits: {member['total_habits']}")
                print(f"      - Completion Rate: {member['completion_rate']}%")
                print(f"      - Recent Activity: {member['recent_activity']}")
            
            return True
        else:
            print(f"❌ Failed to get class feed: {response.status_code} - {response.text}")
            return False
    
    def run_extended_tests(self):
        """Run all extended tests"""
        print("🚀 Starting Extended Class-Based Testing with Multiple Users")
        print(f"Testing against: {self.base_url}")
        print("=" * 80)
        
        success = True
        
        # Setup
        if not self.create_teacher_and_class():
            return False
        
        self.create_multiple_students(4)
        if len(self.students) < 4:
            print("❌ Failed to create enough students")
            return False
        
        self.create_habits_for_students()
        self.simulate_habit_activity()
        
        # Test analytics and feed
        success &= self.test_class_analytics_with_data()
        success &= self.test_class_feed_with_data()
        
        print("\n" + "=" * 80)
        if success:
            print("🎉 ALL EXTENDED TESTS PASSED! Class system works with multiple users.")
        else:
            print("⚠️  Some extended tests failed.")
        print("=" * 80)
        
        return success

if __name__ == "__main__":
    tester = ExtendedClassTester()
    tester.run_extended_tests()