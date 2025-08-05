import React, { useState, useEffect, createContext, useContext } from "react";
import {
  ChakraProvider,
  ColorModeScript,
  Box,
  Flex,
  Text,
  Button,
  VStack,
  HStack,
  Image,
  Input,
  Select,
  FormControl,
  FormLabel,
  Card,
  CardBody,
  useDisclosure,
  useToast,
  Container,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Divider,
  Grid,
  GridItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Circle,
} from "@chakra-ui/react";
import { extendTheme } from "@chakra-ui/react";
import { AddIcon, CheckIcon } from "@chakra-ui/icons";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Theme configuration
const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
}

const theme = extendTheme({
  config,
  fonts: {
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
  },
  colors: {
    brand: {
      50: '#e6f3ff',
      100: '#b3daff',
      200: '#80c1ff',
      300: '#4da8ff',
      400: '#1a8fff',
      500: '#00AEEF',
      600: '#0099d6',
      700: '#0084bd',
      800: '#006fa4',
      900: '#0D2B8E',
    },
    surface: '#0E1117',
    card: '#15191E',
    success: '#00E778',
    missed: '#FF6B00',
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'surface' : 'white',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
      },
    }),
  },
  components: {
    Button: {
      variants: {
        primary: {
          background: 'linear-gradient(135deg, #0D2B8E 0%, #00AEEF 100%)',
          color: 'white',
          _hover: {
            background: 'linear-gradient(135deg, #0a2478 0%, #0099d6 100%)',
            transform: 'translateY(-1px)',
          },
          _active: {
            transform: 'translateY(0)',
          },
        },
        secondary: {
          bg: 'gray.700',
          color: 'white',
          _hover: {
            bg: 'gray.600',
          },
        },
      },
    },
    Card: {
      baseStyle: (props) => ({
        container: {
          bg: props.colorMode === 'dark' ? 'card' : 'white',
          borderRadius: 'xl',
          boxShadow: 'lg',
        },
      }),
    },
  },
});

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

// HabitCard Component
const HabitCard = ({ habitData, onToggle }) => {
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
      
      let status;
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

  const getStatusColor = (status) => {
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

// AddHabitModal Component
const AddHabitModal = ({ isOpen, onClose, onHabitAdded }) => {
  const [formData, setFormData] = useState({
    title: '',
    frequency: 'daily',
    start_date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a habit name',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/habits`, formData);
      toast({
        title: 'Success',
        description: 'Habit created successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onHabitAdded();
      onClose();
      setFormData({
        title: '',
        frequency: 'daily',
        start_date: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create habit',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent bg="card" maxW="400px">
        <ModalHeader color="white">Add New Habit</ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody pb={6}>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel color="gray.300" fontSize="sm" fontWeight="medium">
                  Name
                </FormLabel>
                <Input
                  placeholder="e.g., Read 10 pages"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  bg="gray.700"
                  border="1px solid"
                  borderColor="gray.600"
                  color="white"
                  _placeholder={{ color: 'gray.400' }}
                  _focus={{
                    borderColor: 'brand.500',
                    boxShadow: '0 0 0 1px #00AEEF',
                  }}
                />
              </FormControl>

              <FormControl>
                <FormLabel color="gray.300" fontSize="sm" fontWeight="medium">
                  Repeats
                </FormLabel>
                <Select
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({ ...formData, frequency: e.target.value })
                  }
                  bg="gray.700"
                  border="1px solid"
                  borderColor="gray.600"
                  color="white"
                  _focus={{
                    borderColor: 'brand.500',
                    boxShadow: '0 0 0 1px #00AEEF',
                  }}
                >
                  <option value="daily" style={{ backgroundColor: '#2D3748' }}>
                    Daily
                  </option>
                  <option value="weekly" style={{ backgroundColor: '#2D3748' }}>
                    Weekly
                  </option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel color="gray.300" fontSize="sm" fontWeight="medium">
                  Start date (optional)
                </FormLabel>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                  bg="gray.700"
                  border="1px solid"
                  borderColor="gray.600"
                  color="white"
                  _focus={{
                    borderColor: 'brand.500',
                    boxShadow: '0 0 0 1px #00AEEF',
                  }}
                />
              </FormControl>

              <HStack w="full" spacing={3} pt={4}>
                <Button
                  variant="secondary"
                  onClick={onClose}
                  flex={1}
                  isDisabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  flex={1}
                  isLoading={loading}
                  loadingText="Creating..."
                >
                  Create Habit
                </Button>
              </HStack>
            </VStack>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

// Navbar Component
const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <Box
      bg="linear-gradient(135deg, #0D2B8E 0%, #00AEEF 100%)"
      px={6}
      py={4}
      borderBottom="1px solid"
      borderColor="gray.700"
    >
      <Container maxW="6xl">
        <Flex justify="space-between" align="center">
          <HStack spacing={3}>
            <Image src="/strive-logo.svg" alt="Strive" w="40px" h="40px" />
          </HStack>
          
          {user && (
            <HStack spacing={4}>
              <Text color="white" fontSize="sm">
                Welcome, {user.name}
              </Text>
              <Button variant="secondary" size="sm" onClick={logout}>
                Logout
              </Button>
            </HStack>
          )}
        </Flex>
      </Container>
    </Box>
  );
};

// Auth Form Component
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
  const toast = useToast();

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
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Authentication failed',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="md" py={20}>
      <Card>
        <CardBody p={8}>
          <VStack spacing={6}>
            <VStack spacing={2}>
              <HStack spacing={3}>
                <Image src="/strive-logo.svg" alt="Strive" w="48px" h="48px" />
                <Text fontSize="3xl" fontWeight="bold" color="white">
                  Strive
                </Text>
              </HStack>
              <Text color="gray.400" textAlign="center">
                Track habits with your class
              </Text>
            </VStack>
            
            <HStack w="full" bg="gray.700" p={1} borderRadius="lg">
              <Button
                variant={isLogin ? "primary" : "ghost"}
                onClick={() => setIsLogin(true)}
                flex={1}
                size="sm"
              >
                Login
              </Button>
              <Button
                variant={!isLogin ? "primary" : "ghost"}
                onClick={() => setIsLogin(false)}
                flex={1}
                size="sm"
              >
                Sign Up
              </Button>
            </HStack>

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <VStack spacing={4}>
                {!isLogin && (
                  <FormControl>
                    <FormLabel color="gray.300">Full Name</FormLabel>
                    <Input
                      type="text"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      bg="gray.700"
                      border="1px solid"
                      borderColor="gray.600"
                      required
                    />
                  </FormControl>
                )}
                
                <FormControl>
                  <FormLabel color="gray.300">Email</FormLabel>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    bg="gray.700"
                    border="1px solid"
                    borderColor="gray.600"
                    required
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel color="gray.300">Password</FormLabel>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    bg="gray.700"
                    border="1px solid"
                    borderColor="gray.600"
                    required
                  />
                </FormControl>

                {!isLogin && (
                  <>
                    <FormControl>
                      <FormLabel color="gray.300">Role</FormLabel>
                      <Select
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        bg="gray.700"
                        border="1px solid"
                        borderColor="gray.600"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                      </Select>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel color="gray.300">
                        {formData.role === 'teacher' ? 'Create Class Name' : 'Join Class Name'}
                      </FormLabel>
                      <Input
                        type="text"
                        placeholder={formData.role === 'teacher' ? 'Create class name' : 'Ask teacher for class name'}
                        value={formData.class_name}
                        onChange={(e) => setFormData({...formData, class_name: e.target.value})}
                        bg="gray.700"
                        border="1px solid"
                        borderColor="gray.600"
                        required
                      />
                      {formData.role === 'student' && (
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          Ask your teacher for the exact class name
                        </Text>
                      )}
                    </FormControl>
                  </>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  w="full"
                  isLoading={loading}
                  loadingText={isLogin ? 'Logging in...' : 'Signing up...'}
                >
                  {isLogin ? 'Login' : 'Sign Up'}
                </Button>
              </VStack>
            </form>
          </VStack>
        </CardBody>
      </Card>
    </Container>
  );
};

// Dashboard Component
const Dashboard = () => {
  const [habits, setHabits] = useState([]);
  const [classData, setClassData] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const { user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    fetchHabits();
    fetchClassData();
    fetchClassInfo();
    if (user?.role === 'teacher') {
      fetchAnalytics();
    }
  }, [user]);

  const fetchHabits = async () => {
    try {
      const response = await axios.get(`${API}/habits`);
      setHabits(response.data);
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  const fetchClassData = async () => {
    try {
      const response = await axios.get(`${API}/my-class/feed`);
      setClassData(response.data);
    } catch (error) {
      console.error('Error fetching class data:', error);
    }
  };

  const fetchClassInfo = async () => {
    try {
      const response = await axios.get(`${API}/my-class/info`);
      setClassInfo(response.data);
    } catch (error) {
      console.error('Error fetching class info:', error);
    }
  };

  const fetchAnalytics = async () => {
    if (user?.class_id) {
      try {
        const response = await axios.get(`${API}/classes/${user.class_id}/analytics`);
        setAnalytics(response.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    }
  };

  const toggleHabit = async (habitId, completed) => {
    try {
      await axios.post(`${API}/habits/${habitId}/log`, {
        date: new Date().toISOString().split('T')[0],
        completed: !completed
      });
      fetchHabits();
      fetchClassData();
      toast({
        title: 'Success',
        description: completed ? 'Habit unmarked' : 'Habit completed! 🔥',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update habit',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleHabitAdded = () => {
    fetchHabits();
  };

  return (
    <Box>
      <Navbar />
      
      <Container maxW="6xl" py={8}>
        <Tabs colorScheme="brand" variant="soft-rounded">
          <TabList mb={8} bg="card" p={2} borderRadius="xl">
            <Tab>My Habits</Tab>
            <Tab>My Class</Tab>
            {user?.role === 'teacher' && <Tab>Analytics</Tab>}
          </TabList>

          <TabPanels>
            {/* My Habits Tab */}
            <TabPanel p={0}>
              <VStack spacing={6} align="stretch">
                <Flex justify="space-between" align="center">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="2xl" fontWeight="bold" color="white">
                      Today's Habits
                    </Text>
                    {classInfo && (
                      <Text color="gray.400" fontSize="sm">
                        📚 {classInfo.class_name}
                      </Text>
                    )}
                  </VStack>
                  <Button
                    variant="primary"
                    leftIcon={<AddIcon />}
                    onClick={onOpen}
                  >
                    Add Habit
                  </Button>
                </Flex>

                {/* Single-column habit list */}
                <Container maxW="480px" px={0}>
                  <VStack spacing={4} align="stretch">
                    {habits.map((habitData) => (
                      <HabitCard
                        key={habitData.habit.id}
                        habitData={habitData}
                        onToggle={toggleHabit}
                      />
                    ))}
                    
                    {habits.length === 0 && (
                      <Card>
                        <CardBody textAlign="center" py={12}>
                          <Text fontSize="4xl" mb={4}>🎯</Text>
                          <Text fontSize="lg" fontWeight="semibold" color="white" mb={2}>
                            No habits yet
                          </Text>
                          <Text color="gray.400" mb={6}>
                            Start building your daily routine!
                          </Text>
                          <Button variant="primary" leftIcon={<AddIcon />} onClick={onOpen}>
                            Add Your First Habit
                          </Button>
                        </CardBody>
                      </Card>
                    )}
                  </VStack>
                </Container>
              </VStack>
            </TabPanel>

            {/* My Class Tab */}
            <TabPanel p={0}>
              <VStack spacing={6} align="stretch">
                {/* Class Info */}
                {classInfo && (
                  <Card>
                    <CardBody>
                      <Text fontSize="xl" fontWeight="bold" color="white" mb={4}>
                        📚 Class Overview
                      </Text>
                      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={6}>
                        <GridItem>
                          <Text fontSize="2xl" fontWeight="bold" color="brand.500">
                            {classInfo.class_name}
                          </Text>
                          <Text fontSize="sm" color="gray.400">Class Name</Text>
                        </GridItem>
                        <GridItem>
                          <Text fontSize="2xl" fontWeight="bold" color="success">
                            {classInfo.teacher_name}
                          </Text>
                          <Text fontSize="sm" color="gray.400">Teacher</Text>
                        </GridItem>
                        <GridItem>
                          <Text fontSize="2xl" fontWeight="bold" color="missed">
                            {classInfo.student_count}
                          </Text>
                          <Text fontSize="sm" color="gray.400">Students</Text>
                        </GridItem>
                      </Grid>
                    </CardBody>
                  </Card>
                )}

                {/* Class Leaderboard */}
                <Card>
                  <CardBody>
                    <Text fontSize="xl" fontWeight="bold" color="white" mb={4}>
                      🏆 Class Leaderboard
                    </Text>
                    {classData.length > 0 ? (
                      <VStack spacing={3} align="stretch">
                        {classData.map((member, index) => (
                          <Box
                            key={member.name}
                            p={4}
                            bg="gray.700"
                            borderRadius="lg"
                            border={index < 3 ? "2px solid" : "1px solid"}
                            borderColor={
                              index === 0 ? "yellow.400" :
                              index === 1 ? "gray.300" :
                              index === 2 ? "orange.400" : "gray.600"
                            }
                          >
                            <Flex justify="space-between" align="center">
                              <HStack spacing={4}>
                                <Flex
                                  w="32px"
                                  h="32px"
                                  bg={
                                    index === 0 ? "yellow.400" :
                                    index === 1 ? "gray.300" :
                                    index === 2 ? "orange.400" : "brand.500"
                                  }
                                  color={index < 3 ? "black" : "white"}
                                  borderRadius="full"
                                  align="center"
                                  justify="center"
                                  fontWeight="bold"
                                >
                                  {index + 1}
                                </Flex>
                                <VStack align="start" spacing={1}>
                                  <HStack>
                                    <Text fontWeight="semibold" color="white">
                                      {member.name}
                                    </Text>
                                    {member.role === 'teacher' && (
                                      <Badge colorScheme="purple" size="sm">
                                        Teacher
                                      </Badge>
                                    )}
                                  </HStack>
                                  <Text fontSize="sm" color="gray.400">
                                    {member.total_habits} habits • {member.completion_rate}% success
                                  </Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {member.recent_activity}
                                  </Text>
                                </VStack>
                              </HStack>
                              <HStack>
                                <Text fontSize="lg">🔥</Text>
                                <Text fontSize="xl" fontWeight="bold" color="missed">
                                  {member.current_best_streak}
                                </Text>
                              </HStack>
                            </Flex>
                          </Box>
                        ))}
                      </VStack>
                    ) : (
                      <Box textAlign="center" py={8}>
                        <Text fontSize="4xl" mb={4}>👥</Text>
                        <Text color="gray.400">No class members found</Text>
                      </Box>
                    )}
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Analytics Tab (Teachers only) */}
            {user?.role === 'teacher' && (
              <TabPanel p={0}>
                <Card>
                  <CardBody>
                    <Text fontSize="xl" fontWeight="bold" color="white" mb={6}>
                      📊 Class Analytics
                    </Text>
                    
                    {analytics ? (
                      <VStack spacing={6} align="stretch">
                        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={6}>
                          <GridItem textAlign="center" p={4} bg="gray.700" borderRadius="lg">
                            <Text fontSize="2xl" fontWeight="bold" color="brand.500">
                              {analytics.class_name}
                            </Text>
                            <Text fontSize="sm" color="gray.400">Class Name</Text>
                          </GridItem>
                          <GridItem textAlign="center" p={4} bg="gray.700" borderRadius="lg">
                            <Text fontSize="2xl" fontWeight="bold" color="success">
                              {analytics.total_students}
                            </Text>
                            <Text fontSize="sm" color="gray.400">Total Students</Text>
                          </GridItem>
                        </Grid>

                        <Box overflowX="auto">
                          <Table variant="simple">
                            <Thead>
                              <Tr>
                                <Th color="gray.400">Student</Th>
                                <Th color="gray.400" isNumeric>Total Habits</Th>
                                <Th color="gray.400" isNumeric>Active Habits</Th>
                                <Th color="gray.400" isNumeric>Best Streak</Th>
                                <Th color="gray.400" isNumeric>Avg. Success</Th>
                                <Th color="gray.400">Last Activity</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {analytics.analytics.map((student) => (
                                <Tr key={student.student_email}>
                                  <Td>
                                    <VStack align="start" spacing={1}>
                                      <Text fontWeight="semibold" color="white">
                                        {student.student_name}
                                      </Text>
                                      <Text fontSize="sm" color="gray.400">
                                        {student.student_email}
                                      </Text>
                                    </VStack>
                                  </Td>
                                  <Td isNumeric>
                                    <Text fontWeight="semibold" color="white">
                                      {student.total_habits}
                                    </Text>
                                  </Td>
                                  <Td isNumeric>
                                    <Badge
                                      colorScheme={student.active_habits > 0 ? "green" : "gray"}
                                    >
                                      {student.active_habits}
                                    </Badge>
                                  </Td>
                                  <Td isNumeric>
                                    <HStack justify="flex-end">
                                      <Text fontSize="lg">🔥</Text>
                                      <Text fontWeight="bold" color="missed">
                                        {student.best_current_streak}
                                      </Text>
                                    </HStack>
                                  </Td>
                                  <Td isNumeric>
                                    <Text fontWeight="semibold" color="brand.500">
                                      {student.average_completion_rate}%
                                    </Text>
                                  </Td>
                                  <Td>
                                    <Text fontSize="sm" color="gray.400">
                                      {student.last_activity 
                                        ? new Date(student.last_activity).toLocaleDateString()
                                        : 'Never'
                                      }
                                    </Text>
                                  </Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </Box>

                        {analytics.analytics.length === 0 && (
                          <Box textAlign="center" py={8}>
                            <Text fontSize="4xl" mb={4}>👥</Text>
                            <Text color="gray.400">No students in this class yet</Text>
                          </Box>
                        )}
                      </VStack>
                    ) : (
                      <Box textAlign="center" py={8}>
                        <Text fontSize="4xl" mb={4}>📈</Text>
                        <Text color="gray.400">Loading analytics...</Text>
                      </Box>
                    )}
                  </CardBody>
                </Card>
              </TabPanel>
            )}
          </TabPanels>
        </Tabs>
      </Container>

      <AddHabitModal
        isOpen={isOpen}
        onClose={onClose}
        onHabitAdded={handleHabitAdded}
      />
    </Box>
  );
};

function App() {
  const { token } = useAuth();
  
  return (
    <>
      <ColorModeScript initialColorMode="dark" />
      <ChakraProvider theme={theme}>
        <Box minH="100vh" bg="surface">
          {token ? <Dashboard /> : <AuthForm />}
        </Box>
      </ChakraProvider>
    </>
  );
}

const AppWithAuth = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default AppWithAuth;