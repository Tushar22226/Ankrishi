import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import Card from '../../components/Card';

// Mock tasks data
const mockTasks = [
  {
    id: 'task1',
    title: 'Apply fertilizer to wheat field',
    description: 'Apply 50kg of urea to the wheat field',
    dueDate: new Date(Date.now() + 86400000 * 2), // 2 days from now
    priority: 'high',
    status: 'pending',
    cropId: 'crop1',
    cropName: 'Wheat',
  },
  {
    id: 'task2',
    title: 'Irrigate tomato plants',
    description: 'Water tomato plants for 1 hour',
    dueDate: new Date(Date.now() + 86400000 * 1), // 1 day from now
    priority: 'medium',
    status: 'pending',
    cropId: 'crop2',
    cropName: 'Tomatoes',
  },
  {
    id: 'task3',
    title: 'Spray pesticide on rice field',
    description: 'Spray neem oil solution on rice plants',
    dueDate: new Date(Date.now() + 86400000 * 3), // 3 days from now
    priority: 'medium',
    status: 'pending',
    cropId: 'crop3',
    cropName: 'Rice',
  },
  {
    id: 'task4',
    title: 'Harvest ready tomatoes',
    description: 'Harvest ripe tomatoes from the field',
    dueDate: new Date(Date.now()), // Today
    priority: 'high',
    status: 'pending',
    cropId: 'crop2',
    cropName: 'Tomatoes',
  },
  {
    id: 'task5',
    title: 'Check wheat for pests',
    description: 'Inspect wheat field for any signs of pests or disease',
    dueDate: new Date(Date.now() - 86400000 * 1), // 1 day ago
    priority: 'low',
    status: 'completed',
    cropId: 'crop1',
    cropName: 'Wheat',
  },
];

const TaskManagementScreen = () => {
  const navigation = useNavigation();
  const [tasks, setTasks] = useState(mockTasks);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed'
  
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };
  
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const isOverdue = (date) => {
    return new Date(date) < new Date() && date.getDate() !== new Date().getDate();
  };
  
  const toggleTaskStatus = (taskId) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          status: task.status === 'completed' ? 'pending' : 'completed',
        };
      }
      return task;
    }));
  };
  
  const renderTaskItem = ({ item }) => (
    <Card style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <View style={styles.taskTitleContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => toggleTaskStatus(item.id)}
          >
            <Ionicons
              name={item.status === 'completed' ? 'checkbox' : 'square-outline'}
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
          
          <View>
            <Text
              style={[
                styles.taskTitle,
                item.status === 'completed' && styles.completedTaskTitle,
              ]}
            >
              {item.title}
            </Text>
            
            <Text style={styles.taskCrop}>
              {item.cropName}
            </Text>
          </View>
        </View>
        
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>
            {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
          </Text>
        </View>
      </View>
      
      <Text style={styles.taskDescription}>{item.description}</Text>
      
      <View style={styles.taskFooter}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar" size={16} color={colors.textSecondary} />
          <Text
            style={[
              styles.dateText,
              isOverdue(item.dueDate) && item.status !== 'completed' && styles.overdueText,
            ]}
          >
            {formatDate(item.dueDate)}
            {isOverdue(item.dueDate) && item.status !== 'completed' ? ' (Overdue)' : ''}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            // In a real app, we would navigate to edit task screen
            Alert.alert('Edit Task', 'Edit task feature coming soon');
          }}
        >
          <Ionicons name="create-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </Card>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Task Management</Text>
      </View>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'all' && styles.activeFilterButton,
          ]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'all' && styles.activeFilterText,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'pending' && styles.activeFilterButton,
          ]}
          onPress={() => setFilter('pending')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'pending' && styles.activeFilterText,
            ]}
          >
            Pending
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'completed' && styles.activeFilterButton,
          ]}
          onPress={() => setFilter('completed')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'completed' && styles.activeFilterText,
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={filteredTasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.tasksList}
        showsVerticalScrollIndicator={false}
      />
      
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddTask')}
      >
        <Ionicons name="add" size={24} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.medium,
    paddingTop: spacing.large,
    paddingBottom: spacing.medium,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: spacing.medium,
  },
  title: {
    fontSize: typography.fontSizeLarge,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: spacing.medium,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.medium,
    borderRadius: borderRadius.medium,
    marginRight: spacing.small,
  },
  activeFilterButton: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: typography.fontSizeRegular,
    color: colors.textPrimary,
  },
  activeFilterText: {
    color: colors.white,
  },
  tasksList: {
    padding: spacing.medium,
    paddingBottom: 100, // Extra padding for the floating button
  },
  taskCard: {
    marginBottom: spacing.medium,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.small,
  },
  taskTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  checkbox: {
    marginRight: spacing.small,
    paddingTop: 2,
  },
  taskTitle: {
    fontSize: typography.fontSizeMedium,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  taskCrop: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
  },
  priorityBadge: {
    paddingHorizontal: spacing.small,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: spacing.small,
  },
  priorityText: {
    color: colors.white,
    fontSize: typography.fontSizeSmall,
  },
  taskDescription: {
    fontSize: typography.fontSizeRegular,
    color: colors.textPrimary,
    marginBottom: spacing.medium,
    marginLeft: 32, // Align with the title after checkbox
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 32, // Align with the title after checkbox
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  overdueText: {
    color: colors.error,
  },
  editButton: {
    padding: spacing.small,
  },
  addButton: {
    position: 'absolute',
    right: spacing.large,
    bottom: spacing.large,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

export default TaskManagementScreen;
