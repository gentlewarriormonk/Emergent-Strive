import React from 'react';
import {
  Box,
  Card,
  CardBody,
  Text,
  Flex,
  Button,
  HStack,
  VStack,
  useColorModeValue,
  Circle,
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';

interface HabitData {
  habit: {
    id: string;
    title: string;
    frequency: string;
    start_date: string;
  };
  today_completed: boolean;
  stats: {
    current_streak: number;
    best_streak: number;
    percent_complete: number;
  };
  recent_logs?: Array<{
    date: string;
    completed: boolean;
  }>;
}

interface HabitCardProps {
  habitData: HabitData;
  onToggle: (habitId: string, completed: boolean) => void;
}

const HabitCard: React.FC<HabitCardProps> = ({ habitData, onToggle }) => {
  const { habit, today_completed, stats, recent_logs = [] } = habitData;
  
  // Generate last 7 days status
  const getLast7DaysStatus = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const log = recent_logs.find(l => l.date === dateStr);
      const isToday = i === 0;
      
      let status: 'completed' | 'missed' | 'future' | 'today';
      if (isToday) {
        status = today_completed ? 'completed' : 'today';
      } else if (log) {
        status = log.completed ? 'completed' : 'missed';
      } else {
        // For dates before habit start date, show as future/neutral
        const habitStartDate = new Date(habit.start_date);
        status = date < habitStartDate ? 'future' : 'missed';
      }
      
      days.push({ date: dateStr, status, isToday });
    }
    
    return days;
  };

  const statusDots = getLast7DaysStatus();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'missed':
        return 'missed';
      case 'today':
        return 'gray.400';
      case 'future':
        return 'gray.600';
      default:
        return 'gray.400';
    }
  };

  return (
    <Card>
      <CardBody>
        <Flex justify="space-between" align="start" mb={4}>
          <VStack align="start" spacing={1} flex={1}>
            <Text fontSize="lg" fontWeight="bold" color="white">
              {habit.title}
            </Text>
            <HStack>
              <Text fontSize="sm" color="gray.400">
                🔥 {stats.current_streak} day streak
              </Text>
              <Text fontSize="sm" color="gray.400">
                •
              </Text>
              <Text fontSize="sm" color="gray.400">
                {Math.round(stats.percent_complete)}% completion rate
              </Text>
            </HStack>
          </VStack>
          
          <Button
            variant={today_completed ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onToggle(habit.id, today_completed)}
            leftIcon={today_completed ? <CheckIcon /> : undefined}
            minW="80px"
          >
            {today_completed ? 'Done' : 'Mark'}
          </Button>
        </Flex>

        {/* 7-day status bar */}
        <VStack align="start" spacing={2}>
          <Text fontSize="xs" color="gray.500" fontWeight="medium">
            LAST 7 DAYS
          </Text>
          <HStack spacing={2}>
            {statusDots.map((day, index) => (
              <Circle
                key={day.date}
                size="10px"
                bg={getStatusColor(day.status)}
                border={day.isToday ? "2px solid" : "none"}
                borderColor={day.isToday ? "white" : "transparent"}
              />
            ))}
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default HabitCard;