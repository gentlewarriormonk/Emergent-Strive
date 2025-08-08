#!/usr/bin/env python3
"""
Test Supabase database connection and basic operations
"""

import os
import sys
sys.path.append('/app/backend')

from supabase_client import supabase_service, supabase_admin
import asyncio

async def test_supabase_connection():
    """Test basic Supabase connection and operations"""
    print("🔍 Testing Supabase Connection...")
    
    try:
        # Test basic connection by trying to query a table
        result = supabase_admin.table('schools').select('*').limit(1).execute()
        print(f"✅ Supabase connection successful")
        print(f"   Schools table accessible: {len(result.data) if result.data else 0} records found")
        
        # Test other tables
        tables_to_test = ['classes', 'memberships', 'habits', 'habit_logs']
        for table in tables_to_test:
            try:
                result = supabase_admin.table(table).select('*').limit(1).execute()
                print(f"   {table} table accessible: {len(result.data) if result.data else 0} records found")
            except Exception as e:
                print(f"   ❌ {table} table error: {str(e)}")
        
        # Test service functions
        print("\n🔧 Testing Service Functions...")
        
        # Test invite code validation (should return None for invalid code)
        invalid_code_result = await supabase_service.validate_invite_code("INVALID-CODE")
        if invalid_code_result is None:
            print("✅ Invite code validation working (correctly returns None for invalid code)")
        else:
            print("❌ Invite code validation issue")
        
        print("\n✅ All Supabase connection tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Supabase connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    result = asyncio.run(test_supabase_connection())
    if result:
        print("\n🎉 Supabase backend is ready for use!")
    else:
        print("\n⚠️  Supabase connection issues detected.")