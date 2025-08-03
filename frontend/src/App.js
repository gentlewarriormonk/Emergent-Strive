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
          <p className="text-gray-600">Track your daily habits with friends</p>
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
                placeholder={formData.role === 'teacher' ? 'Create Class Name' : 'Join Class Name (optional)'}
                value={formData.class_name}
                onChange={(e) => setFormData({...formData, class_name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
  const [friends, setFriends] = useState([]);
  const [activeTab, setActiveTab] = useState('habits');
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchHabits();
    fetchFriends();
  }, []);

  const fetchHabits = async () => {
    try {
      const response = await axios.get(`${API}/habits`);
      setHabits(response.data);
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await axios.get(`${API}/feed/friends-streaks`);
      setFriends(response.data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const toggleHabit = async (habitId, completed) => {
    try {
      await axios.post(`${API}/habits/${habitId}/log`, {
        date: new Date().toISOString().split('T')[0],
        completed: !completed
      });
      fetchHabits();
    } catch (error) {
      console.error('Error logging habit:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">One Thing</h1>
            <p className="text-purple-100">Welcome back, {user?.name}!</p>
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
          <button
            onClick={() => setActiveTab('habits')}
            className={`flex-1 py-2 px-4 rounded-md transition-all ${
              activeTab === 'habits' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
            }`}
          >
            My Habits
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 px-4 rounded-md transition-all ${
              activeTab === 'friends' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
            }`}
          >
            Friends
          </button>
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

        {activeTab === 'friends' && (
          <div>
            <FriendsTab friends={friends} onUpdate={fetchFriends} />
          </div>
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

const FriendsTab = ({ friends, onUpdate }) => {
  const [friendEmail, setFriendEmail] = useState('');
  const [friendRequests, setFriendRequests] = useState([]);

  useEffect(() => {
    fetchFriendRequests();
  }, []);

  const fetchFriendRequests = async () => {
    try {
      const response = await axios.get(`${API}/friends/requests`);
      setFriendRequests(response.data);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const sendFriendRequest = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/friends/request`, { friend_email: friendEmail });
      setFriendEmail('');
      alert('Friend request sent!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Error sending friend request');
    }
  };

  const acceptFriendRequest = async (requestId) => {
    try {
      await axios.post(`${API}/friends/accept/${requestId}`);
      fetchFriendRequests();
      onUpdate();
    } catch (error) {
      alert('Error accepting friend request');
    }
  };

  return (
    <div className="space-y-8">
      {/* Add Friend */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Add Friend</h3>
        <form onSubmit={sendFriendRequest} className="flex space-x-3">
          <input
            type="email"
            placeholder="Friend's email"
            value={friendEmail}
            onChange={(e) => setFriendEmail(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Send Request
          </button>
        </form>
      </div>

      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Friend Requests</h3>
          <div className="space-y-3">
            {friendRequests.map((request) => (
              <div key={request.request_id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">{request.requester.name}</p>
                  <p className="text-sm text-gray-600">{request.requester.email}</p>
                </div>
                <button
                  onClick={() => acceptFriendRequest(request.request_id)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends Leaderboard */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">🏆 Friends Leaderboard</h3>
        {friends.length > 0 ? (
          <div className="space-y-3">
            {friends.map((friend, index) => (
              <div key={friend.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-semibold">{friend.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-xl">🔥</span>
                  <span className="font-bold text-orange-600">{friend.current_streak}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">👥</div>
            <p className="text-gray-600">No friends yet. Start by adding some!</p>
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