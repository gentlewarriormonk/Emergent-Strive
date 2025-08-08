import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useSearchParams, useNavigate } from 'react-router-dom';
import "./App.css";
import axios from "axios";
import { AuthProvider, useAuth } from './components/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import AuthCallback from './components/AuthCallback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { EmptyState } from './components/ui/empty-state';
import StreakBadge from './components/StreakBadge';
import TeacherDashboard from './components/TeacherDashboard';
import { supabase } from './lib/supabase';
import { 
  Users, 
  Target, 
  Plus, 
  Copy,
  CheckCircle,
  Circle,
  Settings,
  LogOut,
  School,
  UserPlus,
  Trophy,
  BarChart3,
  Calendar,
  Flame,
  RefreshCw
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Teacher Dashboard Route
const TeacherRoute = () => {
  return (
    <ProtectedRoute>
      <TeacherDashboardPage />
    </ProtectedRoute>
  );
};

// Teacher Dashboard Page Component
const TeacherDashboardPage = () => {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, signOut, getAccessToken } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserContext();
    }
  }, [user]);

  const fetchUserContext = async () => {
    try {
      const token = getAccessToken();
      const response = await axios.get(`${API}/user/context`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContext(response.data.current_context);
    } catch (error) {
      console.error('Error fetching context:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-white text-xl">Loading teacher dashboard...</div>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img 
                src="/strive-logo-white-on-transparent.png" 
                alt="Strive" 
                style={{ width: '160px', maxWidth: '160px' }}
              />
              <h1 className="text-2xl font-bold text-white">Teacher Dashboard</h1>
            </div>
            <CardDescription>
              Welcome to your teacher dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<School className="h-12 w-12 text-gray-400" />}
              title="Setting Up..."
              description="We're setting up your teacher workspace. Please wait a moment."
              action={
                <Button onClick={fetchUserContext} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <img src="/strive-logo.svg" alt="Strive" className="w-10 h-10" />
              <div>
                <h1 className="text-2xl font-bold text-white font-inter">Strive</h1>
                <p className="text-sm text-blue-100 flex items-center gap-1">
                  <School className="h-3 w-3" />
                  {context.schools?.name || context.classes?.name || 'Teacher Dashboard'} • {context.role}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white text-sm">Welcome, {user?.email}</span>
              <Button
                onClick={signOut}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <TeacherDashboard context={context} />
      </div>
    </div>
  );
};

// Join Class Component
const JoinClass = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { getAccessToken } = useAuth();

  const inviteCode = searchParams.get('code');

  useEffect(() => {
    if (inviteCode) {
      handleJoinClass();
    }
  }, [inviteCode]);

  const handleJoinClass = async () => {
    if (!inviteCode) return;
    
    setLoading(true);
    try {
      const token = getAccessToken();
      
      const response = await axios.post(`${API}/join`, 
        { invite_code: inviteCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessage(`✅ ${response.data.message}`);
      setTimeout(() => navigate('/'), 2000);
      
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.detail || 'Failed to join class'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src="/strive-logo.svg" alt="Strive" className="w-10 h-10" />
            <h1 className="text-2xl font-bold text-white">Join Class</h1>
          </div>
        </CardHeader>
        <CardContent className="text-center">
          {loading ? (
            <div>
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-gray-400">Joining class...</p>
            </div>
          ) : message ? (
            <div>
              <div className="text-4xl mb-4">
                {message.includes('✅') ? '🎉' : '😞'}
              </div>
              <p className={message.includes('✅') ? 'text-green-200' : 'text-red-200'}>
                {message}
              </p>
              {message.includes('✅') && (
                <p className="text-sm text-gray-400 mt-2">Redirecting to dashboard...</p>
              )}
            </div>
          ) : (
            <div>
              <div className="text-4xl mb-4">🔗</div>
              <p className="text-gray-400">
                {inviteCode ? `Using invite code: ${inviteCode}` : 'No invite code found'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// School Management Component
const SchoolManagement = ({ onSchoolCreated }) => {
  const [showCreateSchool, setShowCreateSchool] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(false);
  const { getAccessToken } = useAuth();

  const handleCreateSchool = async (e) => {
    e.preventDefault();
    if (!schoolName.trim()) return;

    setLoading(true);
    try {
      const token = getAccessToken();
      
      const response = await axios.post(`${API}/schools`, 
        { name: schoolName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSchoolName('');
      setShowCreateSchool(false);
      onSchoolCreated();
      
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to create school');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setShowCreateSchool(!showCreateSchool)}
        className="w-full"
        variant="outline"
      >
        <School className="h-4 w-4 mr-2" />
        Create New School
      </Button>

      {showCreateSchool && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create School</CardTitle>
            <CardDescription>
              Start a new school to manage multiple classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSchool} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">School Name</label>
                <input
                  type="text"
                  placeholder="e.g., Lincoln High School"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  type="button"
                  onClick={() => setShowCreateSchool(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Creating...' : 'Create School'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Enhanced HabitCard with real-time updates
const HabitCard = ({ habitData, onToggle }) => {
  const { habit, today_completed, stats, recent_logs = [] } = habitData;
  const [isAnimating, setIsAnimating] = useState(false);
  
  const handleToggle = async () => {
    setIsAnimating(true);
    await onToggle(habit.id, today_completed);
    setTimeout(() => setIsAnimating(false), 300);
  };
  
  const getLast7DaysStatus = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const log = recent_logs.find(l => l.occurred_on === dateStr);
      const isToday = i === 0;
      
      let status;
      if (isToday) {
        status = today_completed ? 'completed' : 'today';
      } else if (log) {
        status = log.completed ? 'completed' : 'missed';
      } else {
        const habitStartDate = new Date(habit.start_date);
        status = date < habitStartDate ? 'future' : 'missed';
      }
      
      days.push({ date: dateStr, status, isToday });
    }
    
    return days;
  };

  const statusDots = getLast7DaysStatus();

  return (
    <Card className={`transition-all duration-300 ${isAnimating ? 'scale-105' : ''} hover:shadow-lg`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-white">{habit.title}</h3>
              {stats.current_streak > 0 && (
                <StreakBadge streak={stats.current_streak} size="sm" />
              )}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Flame className="h-3 w-3" />
                {stats.current_streak} day streak
              </span>
              <span>•</span>
              <span>{Math.round(stats.percent_complete)}% completion</span>
            </div>
          </div>
          
          <Button
            onClick={handleToggle}
            variant={today_completed ? "default" : "outline"}
            size="sm"
            className={`transition-all ${today_completed ? 'bg-green-600 hover:bg-green-700' : ''}`}
          >
            {today_completed ? (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                Done
              </>
            ) : (
              <>
                <Circle className="h-4 w-4 mr-1" />
                Mark
              </>
            )}
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last 7 Days</p>
          <div className="flex space-x-2">
            {statusDots.map((day, index) => (
              <div
                key={day.date}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  day.status === 'completed' ? 'bg-green-500' :
                  day.status === 'missed' ? 'bg-red-500' :
                  day.status === 'today' ? 'bg-blue-400 ring-2 ring-blue-200' :
                  'bg-gray-600'
                }`}
                title={`${day.date}: ${day.status}`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced AddHabitModal
const AddHabitModal = ({ isOpen, onClose, onHabitAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    repeats: 'daily',
    startDate: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const { getAccessToken } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a habit name');
      return;
    }

    setLoading(true);
    try {
      const token = getAccessToken();
      const response = await axios.post(`${API}/habits`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onHabitAdded();
      onClose();
      setFormData({
        name: '',
        repeats: 'daily',
        startDate: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      alert('Failed to create habit');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Add New Habit</CardTitle>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
            >
              ×
            </Button>
          </div>
          <CardDescription>
            Create a new habit to track daily
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
              <input
                type="text"
                placeholder="e.g., Read 10 pages"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Frequency</label>
              <select
                value={formData.repeats}
                onChange={(e) => setFormData({ ...formData, repeats: e.target.value })}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Habit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Dashboard Component (student view)
const Dashboard = () => {
  const [habits, setHabits] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [context, setContext] = useState(null);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const { user, signOut, getAccessToken } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserContext();
      fetchHabits();
      setupRealTimeUpdates();
    }
  }, [user]);

  const setupRealTimeUpdates = () => {
    if (realTimeEnabled) return;
    
    const channel = supabase
      .channel('habit-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'habit_logs' },
        (payload) => {
          console.log('Real-time habit update:', payload);
          fetchHabits();
        }
      )
      .subscribe();

    setRealTimeEnabled(true);
    
    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchUserContext = async () => {
    try {
      const token = getAccessToken();
      const response = await axios.get(`${API}/user/context`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContext(response.data.current_context);
    } catch (error) {
      console.error('Error fetching context:', error);
    }
  };

  const fetchHabits = async () => {
    try {
      const token = getAccessToken();
      const response = await axios.get(`${API}/habits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHabits(response.data);
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  const toggleHabit = async (habitId, completed) => {
    try {
      const token = getAccessToken();
      await axios.post(`${API}/habits/${habitId}/log`, {
        date: new Date().toISOString().split('T')[0],
        completed: !completed
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchHabits();
      
      if (completed && !completed) {
        console.log('Streak broken notification would be sent');
      }
    } catch (error) {
      console.error('Error logging habit:', error);
    }
  };

  if (!context) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img src="/strive-logo.svg" alt="Strive" className="w-10 h-10" />
              <h1 className="text-2xl font-bold text-white">Welcome to Strive</h1>
            </div>
            <CardDescription>
              Multi-school habit tracking platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <EmptyState
              icon={<School className="h-12 w-12 text-gray-400" />}
              title="No School Access"
              description="You're not part of any school yet. Create a school to get started or join with an invite link."
            />
            
            <SchoolManagement onSchoolCreated={fetchUserContext} />
            
            <div className="text-center">
              <Button
                onClick={signOut}
                variant="outline"
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <img src="/strive-logo.svg" alt="Strive" className="w-10 h-10" />
              <div>
                <h1 className="text-2xl font-bold text-white font-inter">Strive</h1>
                <p className="text-sm text-blue-100 flex items-center gap-1">
                  <School className="h-3 w-3" />
                  {context.classes?.name || 'My Dashboard'} • {context.role}
                  {realTimeEnabled && (
                    <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                      Live
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white text-sm">Welcome, {user?.email}</span>
              <Button
                onClick={signOut}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Today's Habits</h2>
              <p className="text-gray-400">Build consistency, achieve your goals</p>
            </div>
            <Button
              onClick={() => setShowAddForm(true)}
              size="lg"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Habit
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {habits.map((habitData) => (
              <HabitCard
                key={habitData.habit.id}
                habitData={habitData}
                onToggle={toggleHabit}
              />
            ))}
            
            {habits.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  icon={<Target className="h-12 w-12 text-gray-400" />}
                  title="No Habits Yet"
                  description="Create your first habit to start building a consistent routine."
                  action={
                    <Button
                      onClick={() => setShowAddForm(true)}
                      size="lg"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Habit
                    </Button>
                  }
                />
              </div>
            )}
          </div>

          <AddHabitModal
            isOpen={showAddForm}
            onClose={() => setShowAddForm(false)}
            onHabitAdded={() => {
              setShowAddForm(false);
              fetchHabits();
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App font-inter">
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/join" element={
              <ProtectedRoute>
                <JoinClass />
              </ProtectedRoute>
            } />
            <Route path="/teacher" element={<TeacherRoute />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

