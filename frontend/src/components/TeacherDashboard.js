import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { EmptyState } from './ui/empty-state'
import AnalyticsTile from './AnalyticsTile'
import StreakBadge from './StreakBadge'
import { useAuth } from './AuthProvider'
import { 
  Users, 
  TrendingUp, 
  Trophy, 
  Download,
  GraduationCap,
  Target,
  Calendar,
  BarChart3
} from 'lucide-react'
import axios from 'axios'

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL
const API = `${BACKEND_URL}/api`

const TeacherDashboard = ({ context }) => {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const { getAccessToken } = useAuth()

  useEffect(() => {
    if (context.class_id) {
      fetchAnalytics()
    }
  }, [context.class_id])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const token = getAccessToken()
      const response = await axios.get(`${API}/classes/${context.class_id}/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAnalytics(response.data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      setExporting(true)
      const token = getAccessToken()
      const response = await axios.get(`${API}/classes/${context.class_id}/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `class_export_${Date.now()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      alert('Failed to export CSV')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!analytics) {
    return (
      <EmptyState 
        icon={<BarChart3 className="h-12 w-12 text-gray-400" />}
        title="No Analytics Available"
        description="Unable to load class analytics. Please try again."
        action={
          <Button onClick={fetchAnalytics} variant="outline">
            Retry
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Analytics Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnalyticsTile
          title="Total Students"
          value={analytics.total_students}
          description="Enrolled in this class"
          icon={<Users className="h-4 w-4" />}
        />
        <AnalyticsTile
          title="Daily Completion"
          value={`${analytics.average_daily_completion}%`}
          description="Last 7 days average"
          icon={<TrendingUp className="h-4 w-4" />}
          trend={
            analytics.average_daily_completion >= 75 
              ? { direction: 'up', value: 'Excellent' }
              : analytics.average_daily_completion >= 50
              ? { direction: 'neutral', value: 'Good' }
              : { direction: 'down', value: 'Needs attention' }
          }
        />
        <AnalyticsTile
          title="Top Streak"
          value={analytics.top_3_streaks[0]?.streak || 0}
          description="Best current streak"
          icon={<Trophy className="h-4 w-4" />}
        />
      </div>

      {/* Top Performers */}
      {analytics.top_3_streaks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Performers
            </CardTitle>
            <CardDescription className="text-gray-400">
              Students with the highest current streaks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.top_3_streaks.map((performer, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-800">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium">Student {performer.user_id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-400">{performer.habit_title}</p>
                    </div>
                  </div>
                  <StreakBadge streak={performer.streak} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Class Roster */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-white">Class Roster & Stats</CardTitle>
            <CardDescription className="text-gray-400">
              Detailed analytics for all students
            </CardDescription>
          </div>
          <Button 
            onClick={handleExportCSV}
            disabled={exporting}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Exporting...' : 'CSV Export'}
          </Button>
        </CardHeader>
        <CardContent>
          {analytics.analytics.length === 0 ? (
            <EmptyState
              icon={<GraduationCap className="h-12 w-12 text-gray-400" />}
              title="No Students Yet"
              description="Generate an invite code to get students to join your class."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700 text-left">
                    <th className="pb-3 text-sm font-medium text-gray-400">Student</th>
                    <th className="pb-3 text-sm font-medium text-gray-400 text-center">Habits</th>
                    <th className="pb-3 text-sm font-medium text-gray-400 text-center">Active</th>
                    <th className="pb-3 text-sm font-medium text-gray-400 text-center">Best Streak</th>
                    <th className="pb-3 text-sm font-medium text-gray-400 text-center">Success Rate</th>
                    <th className="pb-3 text-sm font-medium text-gray-400 text-center">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.analytics.map((student, index) => (
                    <tr key={student.user_id} className={`border-b border-gray-800 ${index % 2 === 0 ? 'bg-gray-900/50' : ''}`}>
                      <td className="py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {student.student_name.charAt(8).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-white">{student.student_name}</p>
                            <p className="text-sm text-gray-400">{student.student_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <span className="text-white font-semibold">{student.total_habits}</span>
                      </td>
                      <td className="py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-sm ${
                          student.active_habits > 0 
                            ? 'bg-green-900 text-green-200' 
                            : 'bg-gray-800 text-gray-400'
                        }`}>
                          {student.active_habits}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <div className="flex items-center justify-center">
                          {student.best_current_streak > 0 ? (
                            <StreakBadge streak={student.best_current_streak} size="sm" />
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <span className="text-blue-400 font-semibold">
                          {student.average_completion_rate}%
                        </span>
                      </td>
                      <td className="py-4 text-center text-sm text-gray-400">
                        {student.last_activity 
                          ? new Date(student.last_activity).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default TeacherDashboard