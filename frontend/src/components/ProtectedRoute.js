import React from 'react'
import { useAuth } from './AuthProvider'

const AuthForm = () => {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
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

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return children
}