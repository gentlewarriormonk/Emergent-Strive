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
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import axios from "axios";
import { theme } from "./theme";
import HabitCard from "./components/HabitCard";
import AddHabitModal from "./components/AddHabitModal";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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