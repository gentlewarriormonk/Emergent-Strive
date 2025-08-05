import React, { useState, useEffect, createContext, useContext } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('token', userToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// Components
const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    class_name: ''
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;
      
      const response = await axios.post(`${API}${endpoint}`, payload);
      login(response.data.user, response.data.token);
    } catch (error) {
      alert(error.response?.data?.detail || 'Authentication failed');
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
          <p className="text-gray-400">Track habits with your class</p>
        </div>
        
        <div className="flex mb-6 bg-gray-700 rounded-lg p-1">
          <button
            className={`flex-1 py-2 px-4 rounded-md transition-all font-medium ${
              isLogin ? 'bg-gradient-primary text-white shadow-sm' : 'text-gray-300 hover:text-white'
            }`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md transition-all font-medium ${
              !isLogin ? 'bg-gradient-primary text-white shadow-sm' : 'text-gray-300 hover:text-white'
            }`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                required
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {formData.role === 'teacher' ? 'Create Class Name' : 'Join Class Name'}
                </label>
                <input
                  type="text"
                  placeholder={formData.role === 'teacher' ? 'Create class name' : 'Ask teacher for class name'}
                  value={formData.class_name}
                  onChange={(e) => setFormData({...formData, class_name: e.target.value})}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  required
                />
                {formData.role === 'student' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Ask your teacher for the exact class name
                  </p>
                )}
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-primary text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg"
          >
            {loading ? 'Loading...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>
      </div>
    </div>
  );
};

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
      
      const log = recent_logs.find(l => l.date === dateStr);
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

const AddHabitModal = ({ isOpen, onClose, onHabitAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    repeats: 'daily',
    startDate: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a habit name');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/habits`, formData);
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

const Dashboard = () => {
  const [habits, setHabits] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [classData, setClassData] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('habits');
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchHabits();
    fetchClassData();
    fetchClassInfo();
    if (user?.role === 'teacher') {
      fetchAnalytics();
    }
  }, [user]);

  const fetchHabits = async () => {
    try {
      const response = await axios.get(`${API}/habits`);
      setHabits(response.data);
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  const fetchClassData = async () => {
    try {
      const response = await axios.get(`${API}/my-class/feed`);
      setClassData(response.data);
    } catch (error) {
      console.error('Error fetching class data:', error);
    }
  };

  const fetchClassInfo = async () => {
    try {
      const response = await axios.get(`${API}/my-class/info`);
      setClassInfo(response.data);
    } catch (error) {
      console.error('Error fetching class info:', error);
    }
  };

  const fetchAnalytics = async () => {
    if (user?.class_id) {
      try {
        const response = await axios.get(`${API}/classes/${user.class_id}/analytics`);
        setAnalytics(response.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    }
  };

  const toggleHabit = async (habitId, completed) => {
    try {
      await axios.post(`${API}/habits/${habitId}/log`, {
        date: new Date().toISOString().split('T')[0],
        completed: !completed
      });
      fetchHabits();
      fetchClassData();
    } catch (error) {
      console.error('Error logging habit:', error);
    }
  };

  const getTabs = () => {
    const tabs = [
      { id: 'habits', label: 'My Habits' },
      { id: 'class', label: 'My Class' }
    ];
    
    if (user?.role === 'teacher') {
      tabs.push({ id: 'analytics', label: 'Analytics' });
    }
    
    return tabs;
  };

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
                {classInfo && (
                  <p className="text-sm text-blue-100">📚 {classInfo.class_name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white text-sm">Welcome, {user?.name}</span>
              <button
                onClick={logout}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg text-white transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex space-x-1 bg-card rounded-lg p-1 mb-8 border border-gray-700">
          {getTabs().map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 rounded-md transition-all font-medium ${
                activeTab === tab.id 
                  ? 'bg-gradient-primary text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
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

        {activeTab === 'class' && (
          <div className="space-y-6">
            {/* Class Info */}
            {classInfo && (
              <div className="bg-card rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">📚 Class Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-brand-500">{classInfo.class_name}</div>
                    <div className="text-sm text-gray-400">Class Name</div>
                  </div>
                  <div className="text-center p-4 bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-success">{classInfo.teacher_name}</div>
                    <div className="text-sm text-gray-400">Teacher</div>
                  </div>
                  <div className="text-center p-4 bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-missed">{classInfo.student_count}</div>
                    <div className="text-sm text-gray-400">Students</div>
                  </div>
                </div>
              </div>
            )}

            {/* Class Leaderboard */}
            <div className="bg-card rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-6">🏆 Class Leaderboard</h3>
              {classData.length > 0 ? (
                <div className="space-y-3">
                  {classData.map((member, index) => (
                    <div key={member.name} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-500' : 'bg-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-white flex items-center space-x-2">
                            <span>{member.name}</span>
                            {member.role === 'teacher' && (
                              <span className="text-xs bg-purple-900 text-purple-200 px-2 py-1 rounded-full">
                                Teacher
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400">
                            {member.total_habits} habits • {member.completion_rate}% success
                          </div>
                          <div className="text-xs text-gray-500">{member.recent_activity}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-xl">🔥</span>
                        <span className="font-bold text-missed text-lg">{member.current_best_streak}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">👥</div>
                  <p className="text-gray-400">No class members found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && user?.role === 'teacher' && (
          <div className="bg-card rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-6">📊 Class Analytics</h3>
            
            {analytics ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center p-4 bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-brand-500">{analytics.class_name}</div>
                    <div className="text-sm text-gray-400">Class Name</div>
                  </div>
                  <div className="text-center p-4 bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-success">{analytics.total_students}</div>
                    <div className="text-sm text-gray-400">Total Students</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="text-left py-3 px-2 text-gray-300">Student</th>
                        <th className="text-center py-3 px-2 text-gray-300">Habits</th>
                        <th className="text-center py-3 px-2 text-gray-300">Active</th>
                        <th className="text-center py-3 px-2 text-gray-300">Best Streak</th>
                        <th className="text-center py-3 px-2 text-gray-300">Success Rate</th>
                        <th className="text-center py-3 px-2 text-gray-300">Last Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.analytics.map((student, index) => (
                        <tr key={student.student_email} className={index % 2 === 0 ? 'bg-gray-700 bg-opacity-30' : ''}>
                          <td className="py-3 px-2">
                            <div>
                              <div className="font-semibold text-white">{student.student_name}</div>
                              <div className="text-sm text-gray-400">{student.student_email}</div>
                            </div>
                          </td>
                          <td className="text-center py-3 px-2 font-semibold text-white">{student.total_habits}</td>
                          <td className="text-center py-3 px-2">
                            <span className={`px-2 py-1 rounded-full text-sm ${
                              student.active_habits > 0 ? 'bg-green-900 text-green-200' : 'bg-gray-800 text-gray-400'
                            }`}>
                              {student.active_habits}
                            </span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <div className="flex items-center justify-center space-x-1">
                              <span className="text-lg">🔥</span>
                              <span className="font-bold text-missed">{student.best_current_streak}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-2 font-semibold text-brand-500">
                            {student.average_completion_rate}%
                          </td>
                          <td className="text-center py-3 px-2 text-sm text-gray-400">
                            {student.last_activity ? new Date(student.last_activity).toLocaleDateString() : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {analytics.analytics.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">👥</div>
                    <p className="text-gray-400">No students in this class yet</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📈</div>
                <p className="text-gray-400">Loading analytics...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  const { token } = useAuth();
  
  return (
    <div className="App font-inter">
      {token ? <Dashboard /> : <AuthForm />}
    </div>
  );
}

const AppWithAuth = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default AppWithAuth;