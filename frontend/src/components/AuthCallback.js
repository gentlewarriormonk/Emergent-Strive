import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthProvider'
import axios from 'axios'

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL
const API = `${BACKEND_URL}/api`

const AuthCallback = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  useEffect(() => {
    handleAuthCallback()
  }, [])

  const handleAuthCallback = async () => {
    try {
      // Check for error in URL params
      const errorParam = searchParams.get('error')
      if (errorParam) {
        setError(`Authentication failed: ${errorParam}`)
        setLoading(false)
        return
      }

      // Exchange code for session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.href)
      
      if (exchangeError) {
        setError(`Session exchange failed: ${exchangeError.message}`)
        setLoading(false)
        return
      }

      // Wait for user to be available
      const user = data.user || data.session?.user
      if (!user) {
        setError('No user found in session')
        setLoading(false)
        return
      }

      // Check user's membership status and handle bootstrap
      await handleUserRouting(user)

    } catch (err) {
      console.error('Auth callback error:', err)
      setError(`Authentication error: ${err.message}`)
      setLoading(false)
    }
  }

  const handleUserRouting = async (user) => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      
      if (!token) {
        throw new Error('No access token available')
      }

      // Check user's context/memberships
      const response = await axios.get(`${API}/user/context`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const memberships = response.data.memberships || []
      
      if (memberships.length === 0) {
        // No memberships - bootstrap as admin
        console.log('No memberships found, bootstrapping user as admin...')
        await bootstrapUserAsAdmin(user, token)
        navigate('/teacher')
      } else {
        // Route based on role
        const primaryRole = memberships[0].role
        console.log('User role detected:', primaryRole)
        
        if (primaryRole === 'student') {
          navigate('/')
        } else if (primaryRole === 'teacher' || primaryRole === 'admin') {
          navigate('/teacher')
        } else {
          navigate('/')
        }
      }
      
      setLoading(false)
    } catch (error) {
      console.error('User routing error:', error)
      // If context check fails, try bootstrap anyway
      if (error.response?.status === 404) {
        console.log('User context not found, attempting bootstrap...')
        const token = (await supabase.auth.getSession()).data.session?.access_token
        await bootstrapUserAsAdmin(user, token)
        navigate('/teacher')
      } else {
        setError(`Failed to determine user role: ${error.message}`)
      }
      setLoading(false)
    }
  }

  const bootstrapUserAsAdmin = async (user, token) => {
    try {
      const response = await axios.post(`${API}/auth/bootstrap`, {
        user_id: user.id,
        email: user.email
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      console.log('Bootstrap successful:', response.data)
      return response.data
    } catch (error) {
      console.error('Bootstrap error:', error)
      throw new Error(`Failed to bootstrap user: ${error.response?.data?.detail || error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="bg-card rounded-2xl p-8 max-w-md w-full mx-4 text-center border border-gray-700">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <img src="/strive-logo.svg" alt="Strive" className="w-10 h-10 animate-spin" />
            <h1 className="text-2xl font-bold text-white">Strive</h1>
          </div>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-2 bg-blue-600 rounded-full w-full"></div>
            </div>
            <p className="text-gray-400">Completing authentication...</p>
            <p className="text-sm text-gray-500">Setting up your account and workspace</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="bg-card rounded-2xl p-8 max-w-md w-full mx-4 text-center border border-gray-700">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <img src="/strive-logo.svg" alt="Strive" className="w-10 h-10" />
            <h1 className="text-2xl font-bold text-white">Strive</h1>
          </div>
          <div className="space-y-4">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-red-400">Authentication Error</h2>
            <p className="text-gray-300 text-sm">{error}</p>
            <div className="space-y-2 pt-4">
              <button
                onClick={() => navigate('/')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = 'mailto:support@strive.app?subject=Auth%20Error&body=' + encodeURIComponent(error)}
                className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 px-4 rounded-lg transition-colors text-sm"
              >
                Report Issue
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default AuthCallback