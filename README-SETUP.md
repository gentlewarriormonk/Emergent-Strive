# Strive App - Supabase Setup Guide

## Overview
Strive is a multi-school habit tracking app with three user roles (admin, teacher, student) built with FastAPI, React, and Supabase.

## Architecture
- **Backend**: FastAPI with Supabase PostgreSQL
- **Frontend**: React with Supabase Auth
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Multi-tenancy**: Schools → Classes → Users

## Supabase Setup

### 1. Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. **Important**: Select **EU region** for GDPR compliance
4. Choose a project name (e.g., "strive-app")
5. Create a strong database password
6. Wait for project to be ready (~2 minutes)

### 2. Get API Keys
From your Supabase dashboard:
1. Go to Settings → API
2. Copy the following keys:
   - **Project URL** (starts with `https://`)
   - **anon/public key** (safe for frontend)
   - **service_role/secret key** (backend only, keep secret!)

### 3. Set up Database Schema
1. Go to SQL Editor in Supabase Dashboard
2. Run the contents of `db/schema.sql` first
3. Then run the contents of `db/rls.sql`
4. Verify tables and policies are created

### 4. Configure Environment Variables

#### Backend (.env)
```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...your-service-role-key
SUPABASE_ANON_KEY=eyJhbG...your-anon-key
```

#### Frontend (.env)
```bash
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbG...your-anon-key
REACT_APP_BACKEND_URL=https://your-preview.emergentagent.com
```

## Installation & Running

### Backend
```bash
cd backend
pip install -r requirements.txt
# Set environment variables in .env file
python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend
```bash
cd frontend
yarn install
# Set environment variables in .env file
yarn start
```

## User Flow

### 1. Admin Flow
1. Sign up with email link authentication
2. Create a school (backend endpoint)
3. Create classes within the school
4. Generate invite codes for teachers/students
5. View analytics across all classes

### 2. Teacher Flow
1. Join school via admin-generated invite code
2. Create classes or get assigned to classes
3. Generate invite codes for students
4. View class analytics and student progress

### 3. Student Flow
1. Join class via teacher-generated invite code
2. Create and track daily habits
3. View class leaderboard
4. See other students' progress (with privacy controls)

## API Endpoints

### Authentication
- Uses Supabase Auth with email magic links
- JWT tokens managed by Supabase

### Core Endpoints
- `POST /api/schools` - Create school (admin only)
- `POST /api/classes` - Create class (admin/teacher)
- `POST /api/classes/{id}/invite` - Generate invite code
- `POST /api/join` - Join via invite code
- `GET /api/habits` - Get user's habits
- `POST /api/habits` - Create habit
- `POST /api/habits/{id}/log` - Log habit completion

## Security Features
- Row Level Security (RLS) ensures data isolation
- Multi-tenant architecture prevents cross-school data access
- Role-based permissions (admin, teacher, student)
- Invite-only class joining for security

## Migration from MongoDB
If migrating from existing MongoDB data:
1. Export user, class, habit, and habit_log data
2. Transform data to match new schema
3. Import using Supabase client with proper school/class assignments
4. Update user roles and memberships

## Troubleshooting

### Common Issues
1. **RLS blocking queries**: Check membership tables and policies
2. **JWT errors**: Verify Supabase keys and auth setup
3. **Cross-school data leaks**: Validate RLS policies are working

### Verification
1. Test that users can only see their school's data
2. Verify role permissions work correctly
3. Test invite code flow end-to-end
4. Check analytics only show authorized data

## Development
- Backend runs on port 8001
- Frontend runs on port 3000 
- Use supervisor for service management in production
- All API routes must be prefixed with `/api`