import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '../../theme';
import Card from '../../components/Card';
import { useAuth } from '../../context/AuthContext';
import FarmService from '../../services/FarmService';
import { FarmTask, TaskPriority } from '../../models/Farm';

const TaskManagementScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();

  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [tasks, setTasks] = useState<FarmTask[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Load tasks on component mount
  useEffect(() => {
    if (userProfile?.uid) {
      loadTasks();
    } else {
      setLoading(false);
    }
  }, []);

  // Load tasks from Firebase
  const loadTasks = async () => {
    if (!userProfile?.uid) return;

    try {
      setLoading(true);

      // Get tasks from Firebase
      const taskData = await FarmService.getTasks(userProfile.uid);
      setTasks(taskData);
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', 'Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadTasks();
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  // Sort tasks by due date and priority
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // First sort by status (pending first)
    if (a.status !== b.status) {
      return a.status === 'pending' ? -1 : 1;
    }

    // Then sort by due date (earlier first)
    if (a.dueDate !== b.dueDate) {
      return a.dueDate - b.dueDate;
    }

    // Then sort by priority (high first)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Get priority color
  const getPriorityColor = (priority: TaskPriority) => {
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

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Check if task is overdue
  const isOverdue = (dueDate: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  // Toggle task status
  const toggleTaskStatus = async (taskId: string) => {
    if (!userProfile?.uid) return;

    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const newStatus = task.status === 'completed' ? 'pending' : 'completed';

      // Update task status in Firebase
      await FarmService.updateTaskStatus(userProfile.uid, taskId, newStatus);

      // Update local state
      setTasks(tasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            status: newStatus,
            completedAt: newStatus === 'completed' ? Date.now() : undefined,
          };
        }
        return task;
      }));
    } catch (error) {
      console.error('Error updating task status:', error);
      Alert.alert('Error', 'Failed to update task status. Please try again.');
    }
  };

  // Render task item
  const renderTaskItem = ({ item }: { item: FarmTask }) => (
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

            {item.cropName && (
              <Text style={styles.taskCrop}>
                {item.cropName}
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>
            {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
          </Text>
        </View>
      </View>

      {item.description && (
        <Text style={styles.taskDescription}>{item.description}</Text>
      )}

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

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="list-outline" size={64} color={colors.lightGray} />
      <Text style={styles.emptyTitle}>No Tasks Found</Text>
      <Text style={styles.emptyText}>
        {filter === 'all' ? 'You have no tasks yet. Add your first task to get started.' :
         filter === 'pending' ? 'You have no pending tasks. Great job!' :
         'You have no completed tasks yet.'}
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('AddTask')}
      >
        <Text style={styles.emptyButtonText}>Add New Task</Text>
      </TouchableOpacity>
    </View>
  );

  // Render loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }
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
        data={sortedTasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.tasksList, sortedTasks.length === 0 && styles.emptyList]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: Platform.OS === 'android' ? 32 : 48,
    marginBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    height: 56,
  },
  backButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  activeFilterText: {
    color: colors.white,
  },
  tasksList: {
    padding: 16,
    paddingBottom: 100, // Extra padding for the floating button
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  taskCard: {
    marginBottom: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  checkbox: {
    marginRight: 8,
    paddingTop: 2,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  taskCrop: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  priorityText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  taskDescription: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 16,
    marginLeft: 32, // Align with the title after checkbox
    lineHeight: 20,
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
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  overdueText: {
    color: colors.error,
    fontWeight: '500',
  },
  editButton: {
    padding: 8,
  },
  addButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
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
