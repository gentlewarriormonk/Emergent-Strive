import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  HStack,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHabitAdded: () => void;
}

const AddHabitModal: React.FC<AddHabitModalProps> = ({
  isOpen,
  onClose,
  onHabitAdded,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    frequency: 'daily',
    start_date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
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

export default AddHabitModal;