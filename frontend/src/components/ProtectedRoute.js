import React from 'react'
import { useAuth } from './AuthProvider'
import { AuthForm } from './AuthForm'

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