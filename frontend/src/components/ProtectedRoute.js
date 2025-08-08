import React from 'react'
import { useAuth } from './AuthProvider'

const AuthForm = () => {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [showResend, setShowResend] = React.useState(false);
  const { signInWithMagicLink, resendMagicLink } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage('');
    
    try {
      const result = await signInWithMagicLink(email);
      setMessage(result.message);
      setShowResend(true);
    } catch (error) {
      setMessage(error.message || 'Authentication failed');
      setShowResend(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      const result = await resendMagicLink(email);
      setMessage(result.message);
    } catch (error) {
      setMessage(error.message || 'Failed to resend link');
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
              disabled={loading}
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
            message.includes('Check your email') || message.includes('resent')
              ? 'bg-green-900 text-green-200' 
              : 'bg-red-900 text-red-200'
          }`}>
            {message}
            {showResend && !loading && (
              <div className="mt-2">
                <button
                  onClick={handleResend}
                  className="text-green-100 underline hover:no-underline text-sm"
                >
                  Resend magic link
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 space-y-3">
          <div className="text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-gray-400">Need help?</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2 text-center text-sm">
            <a 
              href="/join" 
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Have an invite code? → Join class
            </a>
            <button 
              onClick={() => window.open('mailto:admin@strive.app?subject=School Access Request', '_blank')}
              className="text-gray-400 hover:text-gray-300 transition-colors"
            >
              Request school access
            </button>
          </div>
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