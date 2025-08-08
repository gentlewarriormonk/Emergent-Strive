import React from 'react'
import { Badge } from './ui/badge'
import { Flame, Trophy, Crown, Star } from 'lucide-react'

const StreakBadge = ({ streak, size = 'default' }) => {
  if (streak < 7) return null

  const getBadgeConfig = (streak) => {
    if (streak >= 30) {
      return {
        variant: 'streak',
        icon: <Crown className="h-3 w-3" />,
        text: `🏆 ${streak}`,
        title: 'Legendary Streak!'
      }
    } else if (streak >= 14) {
      return {
        variant: 'warning',
        icon: <Trophy className="h-3 w-3" />,
        text: `🔥 ${streak}`,
        title: 'Amazing Streak!'
      }
    } else if (streak >= 7) {
      return {
        variant: 'success',
        icon: <Flame className="h-3 w-3" />,
        text: `⚡ ${streak}`,
        title: 'Great Streak!'
      }
    }
  }

  const config = getBadgeConfig(streak)
  if (!config) return null

  return (
    <Badge 
      variant={config.variant} 
      className={`${size === 'sm' ? 'text-xs px-2 py-1' : ''} animate-pulse`}
      title={config.title}
    >
      <span className="flex items-center gap-1">
        {config.text}
      </span>
    </Badge>
  )
}

export default StreakBadge