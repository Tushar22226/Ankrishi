import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MyFarmStackParamList } from '../../navigation/types';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import FarmService from '../../services/FarmService';
import { FarmTask } from '../../models/Farm';
import LoadingQuote from '../../components/LoadingQuote';

// Define navigation type
type MyFarmNavigationProp = NativeStackNavigationProp<MyFarmStackParamList, 'MyFarmMain'>;

const MyFarmScreen = () => {
  const navigation = useNavigation<MyFarmNavigationProp>();
  const { userProfile } = useAuth();

  // State for data
  const [loading, setLoading] = useState<boolean>(true);
  const [tasks, setTasks] = useState<FarmTask[]>([]);

  // Load data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (userProfile) {
        loadData();
      }
      return () => {};
    }, [userProfile])
  );

  // Load all data
  const loadData = async () => {
    if (!userProfile) {
      console.error('User profile not found');
      return;
    }

    setLoading(true);
    try {
      // Load farm tasks
      const farmTasks = await FarmService.getTasks(userProfile.uid);
      // Sort by due date (ascending)
      const sortedTasks = farmTasks.sort((a, b) => a.dueDate - b.dueDate);
      setTasks(sortedTasks);

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (date: number | Date) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
    });
  };

  // Render main content
  const renderContent = () => {
    // If loading, show loading indicator
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <LoadingQuote type="finance" />
        </View>
      );
    }

    return (
      <>
        {/* Upcoming Tasks */}
        <Card style={styles.tasksCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Upcoming Tasks</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('TaskManagement' as never)}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {tasks.length > 0 ? (
            tasks.slice(0, 3).map((task) => (
              <View key={task.id} style={styles.taskItem}>
                <View style={styles.taskLeft}>
                  <View
                    style={[
                      styles.taskPriorityIndicator,
                      {
                        backgroundColor:
                          task.priority === 'high' ? colors.error :
                          task.priority === 'medium' ? colors.warning :
                          colors.primary
                      }
                    ]}
                  />
                  <View>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskDate}>Due: {formatDate(task.dueDate)}</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.taskStatusBadge,
                    {
                      backgroundColor:
                        task.status === 'completed' ? colors.success : colors.warning
                    }
                  ]}
                >
                  <Text style={styles.taskStatusText}>{task.status}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="calendar-outline" size={40} color={colors.lightGray} />
              <Text style={styles.emptyStateText}>No tasks yet</Text>
              <Text style={styles.emptyStateSubtext}>Add tasks to manage your farm activities</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.addTaskButton}
            onPress={() => navigation.navigate('AddTask' as never)}
          >
            <Ionicons name="add-circle" size={20} color={colors.primary} />
            <Text style={styles.addTaskText}>Add New Task</Text>
          </TouchableOpacity>
        </Card>

        {/* Farm Management */}
        <Card style={styles.farmManagementCard}>
          <Text style={styles.cardTitle}>Farm Management</Text>
          <View style={styles.farmManagementGrid}>
            <TouchableOpacity
              style={styles.farmManagementButton}
              onPress={() => navigation.navigate('CropManagement' as never)}
            >
              <View style={[styles.farmManagementIcon, { backgroundColor: colors.success }]}>
                <Ionicons name="leaf" size={24} color={colors.white} />
              </View>
              <Text style={styles.farmManagementText}>Crop Management</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.farmManagementButton}
              onPress={() => navigation.navigate('TaskManagement' as never)}
            >
              <View style={[styles.farmManagementIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="list-outline" size={24} color={colors.white} />
              </View>
              <Text style={styles.farmManagementText}>Task Management</Text>
            </TouchableOpacity>



            <TouchableOpacity
              style={styles.farmManagementButton}
              onPress={() => navigation.navigate('AddCrop' as never)}
            >
              <View style={[styles.farmManagementIcon, { backgroundColor: colors.success }]}>
                <Ionicons name="add-circle-outline" size={24} color={colors.white} />
              </View>
              <Text style={styles.farmManagementText}>Add Crop</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.farmManagementButton}
              onPress={() => navigation.navigate('AddTask' as never)}
            >
              <View style={[styles.farmManagementIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="add-circle-outline" size={24} color={colors.white} />
              </View>
              <Text style={styles.farmManagementText}>Add Task</Text>
            </TouchableOpacity>
          </View>
        </Card>



      </>
    );
  };





  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hello, {userProfile?.displayName || 'Farmer'}
          </Text>
          <Text style={styles.farmName}>
            {userProfile?.farmName || 'Your Farm'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile' as never)}
        >
          <Ionicons name="person-circle" size={40} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
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
    ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  greeting: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  farmName: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    flex: 1,
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    minHeight: 300,
  },

  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  viewMoreText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    marginRight: spacing.xs,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewAllText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },


  farmManagementCard: {
    marginBottom: spacing.md,
  },
  farmManagementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  farmManagementButton: {
    width: '30%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  farmManagementButtonDisabled: {
    width: '30%',
    alignItems: 'center',
    marginBottom: spacing.md,
    opacity: 0.7,
  },
  farmManagementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  farmManagementText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  farmManagementTextDisabled: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  tasksCard: {
    marginBottom: spacing.md,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskPriorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  taskTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  taskDate: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  taskStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  taskStatusText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.white,
    textTransform: 'capitalize',
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  addTaskText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  farmManagementButtonsContainer: {
    marginTop: spacing.sm,
  },
  farmManagementListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
  },
  farmManagementListButtonDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
    opacity: 0.7,
  },
  farmManagementListText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  farmManagementListTextDisabled: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },



  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    minHeight: 150,
  },
  emptyStateText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },

});

export default MyFarmScreen;
