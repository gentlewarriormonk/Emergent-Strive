import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { useAuth } from './AuthProvider'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Calendar, BarChart3, TrendingUp, Filter } from 'lucide-react'
import axios from 'axios'

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL
const API = `${BACKEND_URL}/api`

const AdvancedAnalytics = ({ context }) => {
  const [analytics, setAnalytics] = useState(null)
  const [dailyData, setDailyData] = useState([])
  const [weeklyData, setWeeklyData] = useState([])
  const [dateRange, setDateRange] = useState(7)
  const [loading, setLoading] = useState(true)
  const { getAccessToken } = useAuth()

  useEffect(() => {
    if (context.class_id) {
      fetchAdvancedAnalytics()
    }
  }, [context.class_id, dateRange])

  const fetchAdvancedAnalytics = async () => {
    try {
      setLoading(true)
      const token = getAccessToken()
      
      // Fetch basic analytics
      const analyticsResponse = await axios.get(`${API}/classes/${context.class_id}/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAnalytics(analyticsResponse.data)
      
      // Fetch daily completion data
      const dailyResponse = await axios.get(`${API}/classes/${context.class_id}/analytics/daily?days=${Math.min(dateRange, 30)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setDailyData(dailyResponse.data)
      
      // Fetch weekly completion data
      const weeklyResponse = await axios.get(`${API}/classes/${context.class_id}/analytics/weekly?weeks=12`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setWeeklyData(weeklyResponse.data)
      
    } catch (error) {
      console.error('Error fetching advanced analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const dateRangeOptions = [
    { value: 7, label: 'Last 7 days' },
    { value: 14, label: 'Last 14 days' },
    { value: 30, label: 'Last 30 days' },
    { value: 90, label: 'Last 90 days' }
  ]

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatWeek = (weekString) => {
    const [year, week] = weekString.split('-W')
    return `W${week}`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-64 bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Advanced Analytics
            </CardTitle>
            <CardDescription className="text-gray-400">
              Detailed completion trends and patterns
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 text-white text-sm"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
      </Card>

      {/* Daily Completion Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            Daily Completion Rate
          </CardTitle>
          <CardDescription className="text-gray-400">
            Class-wide habit completion trends over the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                  formatter={(value) => [`${value}%`, 'Completion Rate']}
                  labelFormatter={(label) => `Date: ${formatDate(label)}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="completion_rate" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#60A5FA' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <p className="text-gray-400">Average</p>
              <p className="text-white font-semibold">
                {dailyData.length > 0 
                  ? Math.round(dailyData.reduce((acc, day) => acc + day.completion_rate, 0) / dailyData.length)
                  : 0}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">Highest</p>
              <p className="text-green-400 font-semibold">
                {dailyData.length > 0 
                  ? Math.max(...dailyData.map(d => d.completion_rate))
                  : 0}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">Lowest</p>
              <p className="text-red-400 font-semibold">
                {dailyData.length > 0 
                  ? Math.min(...dailyData.map(d => d.completion_rate))
                  : 0}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">Trend</p>
              <p className={`font-semibold ${
                dailyData.length >= 2 && dailyData[dailyData.length - 1].completion_rate > dailyData[0].completion_rate
                  ? 'text-green-400' 
                  : 'text-red-400'
              }`}>
                {dailyData.length >= 2
                  ? dailyData[dailyData.length - 1].completion_rate > dailyData[0].completion_rate
                    ? '↗ Improving'
                    : '↘ Declining'
                  : '→ Stable'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Completion Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-400" />
            Weekly Completion Overview
          </CardTitle>
          <CardDescription className="text-gray-400">
            12-week completion rate trends (aggregated by week)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="week" 
                  tickFormatter={formatWeek}
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                  formatter={(value) => [`${value}%`, 'Weekly Avg']}
                  labelFormatter={(label) => `Week: ${label}`}
                />
                <Bar 
                  dataKey="completion_rate" 
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center text-sm text-gray-400">
            <p>Weekly averages calculated from daily habit completion data</p>
          </div>
        </CardContent>
      </Card>

      {/* Class Performance Insights */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Performance Insights</CardTitle>
            <CardDescription className="text-gray-400">
              Key observations from your class data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700">
                <h4 className="text-blue-200 font-medium mb-2">Class Engagement</h4>
                <p className="text-sm text-gray-300">
                  {analytics.total_students > 0 && analytics.average_daily_completion >= 70 
                    ? `Strong engagement! ${analytics.total_students} students maintaining ${analytics.average_daily_completion}% completion rate.`
                    : analytics.average_daily_completion >= 50
                    ? `Moderate engagement. Consider strategies to boost the ${analytics.average_daily_completion}% completion rate.`
                    : `Low engagement detected. Only ${analytics.average_daily_completion}% average completion rate.`
                  }
                </p>
              </div>
              <div className="p-4 bg-green-900/20 rounded-lg border border-green-700">
                <h4 className="text-green-200 font-medium mb-2">Top Performers</h4>
                <p className="text-sm text-gray-300">
                  {analytics.top_3_streaks.length > 0 
                    ? `${analytics.top_3_streaks.length} students showing strong commitment with streaks up to ${analytics.top_3_streaks[0]?.streak || 0} days.`
                    : "No active streaks detected. Consider motivational strategies to encourage consistency."
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AdvancedAnalytics