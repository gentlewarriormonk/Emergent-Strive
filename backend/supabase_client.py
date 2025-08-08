"""Supabase client configuration for backend service role operations."""
import os
from typing import Dict, Any, Optional
from supabase import create_client, Client
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    logger.error("Missing required Supabase environment variables")
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")

# Create Supabase clients
# Service role client for admin operations (bypasses RLS)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Anon client for user operations (respects RLS)
supabase_anon: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY) if SUPABASE_ANON_KEY else None

class SupabaseService:
    """Service class for Supabase operations."""
    
    def __init__(self):
        self.admin_client = supabase_admin
        self.anon_client = supabase_anon
    
    def get_user_client(self, jwt_token: str) -> Client:
        """Get a Supabase client with user JWT token."""
        client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        client.auth.set_session(jwt_token, None)
        return client
    
    async def create_school_and_admin(self, school_name: str, user_id: str) -> Dict[str, Any]:
        """Create a new school and assign user as admin (service role operation)."""
        try:
            # Create school
            school_result = self.admin_client.table('schools').insert({
                'name': school_name
            }).execute()
            
            if not school_result.data:
                raise Exception("Failed to create school")
            
            school = school_result.data[0]
            
            # Create admin membership
            membership_result = self.admin_client.table('memberships').insert({
                'user_id': user_id,
                'school_id': school['id'],
                'role': 'admin'
            }).execute()
            
            if not membership_result.data:
                raise Exception("Failed to create admin membership")
            
            return school
            
        except Exception as e:
            logger.error(f"Error creating school and admin: {e}")
            raise
    
    async def validate_invite_code(self, invite_code: str) -> Optional[Dict[str, Any]]:
        """Validate invite code and return class info."""
        try:
            result = self.admin_client.table('classes').select('*, schools(*)').eq(
                'invite_code', invite_code
            ).single().execute()
            
            return result.data if result.data else None
            
        except Exception as e:
            logger.error(f"Error validating invite code: {e}")
            return None
    
    async def add_user_to_class(self, user_id: str, class_id: str, school_id: str, role: str = 'student') -> bool:
        """Add user to class with specified role."""
        try:
            result = self.admin_client.table('memberships').insert({
                'user_id': user_id,
                'school_id': school_id,
                'class_id': class_id,
                'role': role
            }).execute()
            
            return bool(result.data)
            
        except Exception as e:
            logger.error(f"Error adding user to class: {e}")
            return False

# Global instance
supabase_service = SupabaseService()