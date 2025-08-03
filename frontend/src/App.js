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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">One Thing</h1>
          <p className="text-gray-600">Track habits with your class</p>
        </div>
        
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            className={`flex-1 py-2 px-4 rounded-md transition-all ${
              isLogin ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'
            }`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md transition-all ${
              !isLogin ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'
            }`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          )}
          
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />

          {!isLogin && (
            <>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
              
              <input
                type="text"
                placeholder={formData.role === 'teacher' ? 'Create Class Name' : 'Join Class Name'}
                value={formData.class_name}
                onChange={(e) => setFormData({...formData, class_name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              {formData.role === 'student' && (
                <p className="text-sm text-gray-500">Ask your teacher for the exact class name</p>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
          >
            {loading ? 'Loading...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
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
      fetchClassData(); // Refresh class data to show updated streaks
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">One Thing</h1>
            <p className="text-purple-100">
              Welcome back, {user?.name}! 
              {classInfo && <span className="ml-2">📚 {classInfo.class_name}</span>}
            </p>
          </div>
          <button
            onClick={logout}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-200 rounded-lg p-1 mb-6">
          {getTabs().map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 rounded-md transition-all ${
                activeTab === tab.id ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'habits' && (
          <div>
            {/* Add Habit Button */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Today's Habits</h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-teal-600 transition-all flex items-center space-x-2"
              >
                <span>+</span>
                <span>Add Habit</span>
              </button>
            </div>

            {/* Habits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {habits.map((habitData) => (
                <HabitCard
                  key={habitData.habit.id}
                  habitData={habitData}
                  onToggle={toggleHabit}
                />
              ))}
              
              {habits.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🎯</div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No habits yet</h3>
                  <p className="text-gray-500">Start building your daily routine!</p>
                </div>
              )}
            </div>

            {/* Add Habit Modal */}
            {showAddForm && (
              <AddHabitModal
                onClose={() => setShowAddForm(false)}
                onAdd={() => {
                  setShowAddForm(false);
                  fetchHabits();
                }}
              />
            )}
          </div>
        )}

        {activeTab === 'class' && (
          <ClassTab classData={classData} classInfo={classInfo} />
        )}

        {activeTab === 'analytics' && user?.role === 'teacher' && (
          <AnalyticsTab analytics={analytics} />
        )}
      </div>
    </div>
  );
};

const HabitCard = ({ habitData, onToggle }) => {
  const { habit, today_completed, stats } = habitData;
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-lg text-gray-800">{habit.title}</h3>
        <button
          onClick={() => onToggle(habit.id, today_completed)}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            today_completed 
              ? 'bg-green-500 text-white' 
              : 'border-2 border-gray-300 hover:border-green-500'
          }`}
        >
          {today_completed && '✓'}
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Current Streak</span>
          <div className="flex items-center space-x-1">
            <span className="text-xl">🔥</span>
            <span className="font-bold text-orange-600">{stats.current_streak}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Best Streak</span>
          <div className="flex items-center space-x-1">
            <span className="text-xl">🏆</span>
            <span className="font-bold text-yellow-600">{stats.best_streak}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Success Rate</span>
          <span className="font-bold text-blue-600">{Math.round(stats.percent_complete)}%</span>
        </div>
      </div>
    </div>
  );
};

const AddHabitModal = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    title: '',
    frequency: 'daily',
    start_date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/habits`, formData);
      onAdd();
    } catch (error) {
      alert('Error creating habit');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold mb-4">Add New Habit</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Habit name (e.g., Read 10 pages)"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          
          <select
            value={formData.frequency}
            onChange={(e) => setFormData({...formData, frequency: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
          
          <input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700"
            >
              Create Habit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ClassTab = ({ classData, classInfo }) => {
  return (
    <div className="space-y-6">
      {/* Class Info */}
      {classInfo && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">📚 Class Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{classInfo.class_name}</div>
              <div className="text-sm text-gray-600">Class Name</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{classInfo.teacher_name}</div>
              <div className="text-sm text-gray-600">Teacher</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{classInfo.student_count}</div>
              <div className="text-sm text-gray-600">Students</div>
            </div>
          </div>
        </div>
      )}

      {/* Class Leaderboard */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">🏆 Class Leaderboard</h3>
        {classData.length > 0 ? (
          <div className="space-y-3">
            {classData.map((member, index) => (
              <div key={member.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-gray-400' : 
                    index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold flex items-center space-x-2">
                      <span>{member.name}</span>
                      {member.role === 'teacher' && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">Teacher</span>}
                    </div>
                    <div className="text-sm text-gray-600">
                      {member.total_habits} habits • {member.completion_rate}% success rate
                    </div>
                    <div className="text-xs text-gray-500">{member.recent_activity}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-xl">🔥</span>
                  <span className="font-bold text-orange-600 text-lg">{member.current_best_streak}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">👥</div>
            <p className="text-gray-600">No class members found</p>
          </div>
        )}
      </div>
    </div>
  );
};

const AnalyticsTab = ({ analytics }) => {
  if (!analytics) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">📊 Class Analytics</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">📈</div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">📊 Class Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{analytics.class_name}</div>
            <div className="text-sm text-gray-600">Class Name</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{analytics.total_students}</div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>
        </div>

        {/* Student Analytics Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2">Student</th>
                <th className="text-center py-3 px-2">Total Habits</th>
                <th className="text-center py-3 px-2">Active Habits</th>
                <th className="text-center py-3 px-2">Best Streak</th>
                <th className="text-center py-3 px-2">Avg. Success</th>
                <th className="text-center py-3 px-2">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {analytics.analytics.map((student, index) => (
                <tr key={student.student_email} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="py-3 px-2">
                    <div>
                      <div className="font-semibold">{student.student_name}</div>
                      <div className="text-sm text-gray-600">{student.student_email}</div>
                    </div>
                  </td>
                  <td className="text-center py-3 px-2 font-semibold">{student.total_habits}</td>
                  <td className="text-center py-3 px-2">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      student.active_habits > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {student.active_habits}
                    </span>
                  </td>
                  <td className="text-center py-3 px-2">
                    <div className="flex items-center justify-center space-x-1">
                      <span className="text-lg">🔥</span>
                      <span className="font-bold text-orange-600">{student.best_current_streak}</span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-2 font-semibold text-blue-600">
                    {student.average_completion_rate}%
                  </td>
                  <td className="text-center py-3 px-2 text-sm text-gray-600">
                    {student.last_activity ? new Date(student.last_activity).toLocaleDateString() : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {analytics.analytics.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">👥</div>
            <p className="text-gray-600">No students in this class yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  const { token } = useAuth();
  
  return (
    <div className="App">
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