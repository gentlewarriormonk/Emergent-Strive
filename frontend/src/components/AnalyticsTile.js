import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { cn } from '../lib/utils'

const AnalyticsTile = ({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  className = "",
  valueClassName = "" 
}) => {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">
          {title}
        </CardTitle>
        {icon && <div className="text-gray-400">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold text-white", valueClassName)}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-gray-500 mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center pt-1">
            <span className={cn(
              "text-xs font-medium",
              trend.direction === 'up' ? 'text-green-500' : 
              trend.direction === 'down' ? 'text-red-500' : 'text-gray-400'
            )}>
              {trend.direction === 'up' ? '↗️' : trend.direction === 'down' ? '↘️' : '→'} {trend.value}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AnalyticsTile