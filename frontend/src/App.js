import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useSearchParams, useNavigate } from 'react-router-dom';
import "./App.css";
import axios from "axios";
import { AuthProvider, useAuth } from './components/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Form Component
export const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { signInWithEmail } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage('');
    
    try {
      const result = await signInWithEmail(email);
      setMessage(result.message);
    } catch (error) {
      setMessage(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-700">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src="/strive-logo.svg" alt="Strive" className="w-12 h-12" />
            <h1 className="text-4xl font-bold text-white font-inter">Strive</h1>
          </div>
          <p className="text-gray-400">Multi-school habit tracking</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              placeholder="Enter your email for magic link"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-primary text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg"
          >
            {loading ? 'Sending Link...' : 'Send Magic Link'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.includes('Check your email') 
              ? 'bg-green-900 text-green-200' 
              : 'bg-red-900 text-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>New to Strive? Join via invite link or request school access</p>
        </div>
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
      <div className="bg-card rounded-2xl p-8 w-full max-w-md border border-gray-700 text-center">
        <div className="flex items-center justify-center space-x-3 mb-6">
          <img src="/strive-logo.svg" alt="Strive" className="w-10 h-10" />
          <h1 className="text-2xl font-bold text-white">Join Class</h1>
        </div>
        
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
      </div>
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
    <div className="mb-6">
      <button
        onClick={() => setShowCreateSchool(!showCreateSchool)}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all"
      >
        + Create New School
      </button>

      {showCreateSchool && (
        <form onSubmit={handleCreateSchool} className="mt-4 p-4 bg-card rounded-lg border border-gray-700">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">School Name</label>
              <input
                type="text"
                placeholder="e.g., Lincoln High School"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateSchool(false)}
                className="flex-1 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create School'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

// Dashboard Component (updated for multi-school)
const Dashboard = () => {
  const [habits, setHabits] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [context, setContext] = useState(null);
  const [activeTab, setActiveTab] = useState('habits');
  const { user, signOut, getAccessToken } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserContext();
      fetchHabits();
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
    } catch (error) {
      console.error('Error logging habit:', error);
    }
  };

  if (!context) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl p-8 w-full max-w-md border border-gray-700 text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <img src="/strive-logo.svg" alt="Strive" className="w-10 h-10" />
            <h1 className="text-2xl font-bold text-white">Welcome to Strive</h1>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-400">You're not part of any school yet.</p>
            
            <SchoolManagement onSchoolCreated={fetchUserContext} />
            
            <div className="text-center text-sm text-gray-500">
              <p>Or join with an invite link from your teacher</p>
            </div>
            
            <button
              onClick={signOut}
              className="w-full bg-gray-700 text-gray-300 py-2 rounded-lg hover:bg-gray-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-gradient-primary border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <img src="/strive-logo.svg" alt="Strive" className="w-10 h-10" />
              <div>
                <h1 className="text-2xl font-bold text-white font-inter">Strive</h1>
                <p className="text-sm text-blue-100">
                  📚 {context.classes?.name || 'School Admin'} • {context.role}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white text-sm">Welcome, {user?.email}</span>
              <button
                onClick={signOut}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg text-white transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex space-x-1 bg-card rounded-lg p-1 mb-8 border border-gray-700">
          <button
            onClick={() => setActiveTab('habits')}
            className={`flex-1 py-3 px-4 rounded-md transition-all font-medium ${
              activeTab === 'habits' 
                ? 'bg-gradient-primary text-white shadow-lg' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            My Habits
          </button>
          {context.role !== 'student' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex-1 py-3 px-4 rounded-md transition-all font-medium ${
                activeTab === 'admin' 
                  ? 'bg-gradient-primary text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Admin
            </button>
          )}
        </div>

        {activeTab === 'habits' && (
          <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Today's Habits</h2>
                <p className="text-gray-400">Stay consistent, build your future</p>
              </div>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-primary text-white px-6 py-3 rounded-lg hover:opacity-90 transition-all flex items-center space-x-2 shadow-lg"
              >
                <span className="text-lg">+</span>
                <span>Add Habit</span>
              </button>
            </div>

            {/* Single-column habit list */}
            <div className="w-full max-w-lg mx-auto">
              <div className="space-y-4">
                {habits.map((habitData) => (
                  <HabitCard
                    key={habitData.habit.id}
                    habitData={habitData}
                    onToggle={toggleHabit}
                  />
                ))}
                
                {habits.length === 0 && (
                  <div className="bg-card rounded-xl p-12 text-center border border-gray-700 max-w-lg mx-auto">
                    <div className="text-6xl mb-4">🎯</div>
                    <h3 className="text-xl font-semibold text-white mb-2">No habits yet</h3>
                    <p className="text-gray-400 mb-6">Start building your daily routine!</p>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="bg-gradient-primary text-white px-6 py-3 rounded-lg hover:opacity-90 transition-all"
                    >
                      Add Your First Habit
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Add Habit Modal */}
            <AddHabitModal
              isOpen={showAddForm}
              onClose={() => setShowAddForm(false)}
              onHabitAdded={() => {
                setShowAddForm(false);
                fetchHabits();
              }}
            />
          </div>
        )}

        {activeTab === 'admin' && context.role !== 'student' && (
          <AdminPanel context={context} />
        )}
      </div>
    </div>
  );
};

// Admin Panel Component
const AdminPanel = ({ context }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { getAccessToken } = useAuth();

  const generateInvite = async () => {
    if (!context.class_id) return;
    
    setLoading(true);
    try {
      const token = getAccessToken();
      const response = await axios.post(`${API}/classes/${context.class_id}/invite`, 
        { role: 'student' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setInviteCode(response.data.invite_code);
    } catch (error) {
      alert('Failed to generate invite code');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/join?code=${inviteCode}`;
    navigator.clipboard.writeText(link);
    alert('Invite link copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">🔗 Generate Invite Code</h3>
        
        <div className="space-y-4">
          <button
            onClick={generateInvite}
            disabled={loading || !context.class_id}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Student Invite'}
          </button>
          
          {inviteCode && (
            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Invite Code:</p>
                  <code className="text-white font-mono">{inviteCode}</code>
                </div>
                <button
                  onClick={copyInviteLink}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                >
                  Copy Link
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Share this link: {window.location.origin}/join?code={inviteCode}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// HabitCard Component (same as before)
const HabitCard = ({ habitData, onToggle }) => {
  const { habit, today_completed, stats, recent_logs = [] } = habitData;
  
  // Generate last 7 days status
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
    <div className="bg-card rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">{habit.title}</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <span>🔥 {stats.current_streak} day streak</span>
            <span>•</span>
            <span>{Math.round(stats.percent_complete)}% completion rate</span>
          </div>
        </div>
        
        <button
          onClick={() => onToggle(habit.id, today_completed)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            today_completed 
              ? 'bg-gradient-primary text-white shadow-lg' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
          }`}
        >
          {today_completed ? '✓ Done' : 'Mark'}
        </button>
      </div>

      {/* 7-day status bar */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last 7 Days</p>
        <div className="flex space-x-2">
          {statusDots.map((day, index) => (
            <div
              key={day.date}
              className={`w-2.5 h-2.5 rounded-full ${
                day.status === 'completed' ? 'bg-success' :
                day.status === 'missed' ? 'bg-missed' :
                day.status === 'today' ? 'bg-gray-400 ring-2 ring-white' :
                'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// AddHabitModal Component (same as before)
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
      <div className="bg-card rounded-xl p-6 w-full max-w-md border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Add New Habit</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
            <input
              type="text"
              placeholder="e.g., Read 10 pages"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Repeats</label>
            <select
              value={formData.repeats}
              onChange={(e) => setFormData({ ...formData, repeats: e.target.value })}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Start date (optional)</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-all"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-primary text-white rounded-lg hover:opacity-90 transition-all shadow-lg"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Habit'}
            </button>
          </div>
        </form>
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
            <Route path="/join" element={
              <ProtectedRoute>
                <JoinClass />
              </ProtectedRoute>
            } />
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