import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';
import database from '@react-native-firebase/database';

// Define the navigation and route types
type RootStackParamList = {
  GroupDetails: { groupId: string; groupData: any };
  [key: string]: any | undefined;
};

// Member role types
type MemberRole = 'admin' | 'officer' | 'member';

// Member interface
interface GroupMember {
  id: string;
  displayName: string;
  photoURL: string | null;
  role: MemberRole;
  isMuted?: boolean;
  isBanned?: boolean;
  joinedAt: number;
}

const GroupDetailsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'GroupDetails'>>();
  const { userProfile, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [activeTab, setActiveTab] = useState('about');
  const [memberActionModalVisible, setMemberActionModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<MemberRole>('member');

  // Log auth state for debugging
  useEffect(() => {
    console.log('Auth state in GroupDetailsScreen:', {
      userExists: !!user,
      userId: user?.uid,
      profileExists: !!userProfile,
      displayName: userProfile?.displayName
    });
  }, [user, userProfile]);

  // Get group data from route params
  useEffect(() => {
    // Don't load data if user is not available yet
    if (!user) {
      console.log('Waiting for user to be available...');
      return;
    }

    const loadGroupData = async () => {
      try {
        setLoading(true);

        // Check if route.params exists
        if (!route.params) {
          console.error('No route params provided');
          setLoading(false);
          return;
        }

        // Log the route params for debugging
        console.log('Route params:', JSON.stringify(route.params, null, 2));

        // In a real app, we would fetch this data from Firebase
        const { groupId, groupData } = route.params;

        // Log the group data for debugging
        console.log('Group data:', JSON.stringify(groupData, null, 2));

        if (groupData) {
          // Create a safe user ID
          const safeUserId = user?.uid || 'unknown_user';

          // Ensure the group data has all required fields
          const safeGroupData = {
            id: groupData.id || groupId || `group_${Date.now()}`,
            name: groupData.name || 'Group',
            description: groupData.description || 'No description available',
            members: groupData.members || 1,
            location: groupData.location || 'Unknown location',
            code: groupData.code || '',
            tags: Array.isArray(groupData.tags) ? groupData.tags : [],
            logo: groupData.logo || null,
            adminId: groupData.adminId || safeUserId,
            createdBy: groupData.createdBy || safeUserId,
            isJoined: groupData.isJoined || false,
          };

          console.log('Setting group with safe data:', JSON.stringify(safeGroupData, null, 2));
          setGroup(safeGroupData);

          // Try to fetch real members from Firebase
          try {
            const membersRef = database().ref(`groups/${safeGroupData.id}/memberRoles`);
            const membersSnapshot = await membersRef.once('value');

            if (membersSnapshot.exists()) {
              console.log('Found real member roles:', JSON.stringify(membersSnapshot.val(), null, 2));

              // Get member IDs
              const memberIdsRef = database().ref(`groups/${safeGroupData.id}/memberIds`);
              const memberIdsSnapshot = await memberIdsRef.once('value');

              if (memberIdsSnapshot.exists()) {
                const memberRoles = membersSnapshot.val() || {};
                const memberIds = Object.keys(memberIdsSnapshot.val() || {});
                const realMembers: GroupMember[] = [];

                // Process each member
                for (const memberId of memberIds) {
                  // Get user profile for this member
                  const userProfileRef = database().ref(`users/${memberId}`);
                  const userProfileSnapshot = await userProfileRef.once('value');
                  const memberProfile = userProfileSnapshot.val();

                  realMembers.push({
                    id: memberId,
                    displayName: memberProfile?.displayName || `User ${memberId.substring(0, 6)}`,
                    photoURL: memberProfile?.photoURL || null,
                    role: memberRoles[memberId] || 'member', // Default to 'member' if role not specified
                    joinedAt: memberProfile?.createdAt || Date.now(),
                  });
                }

                console.log('Real members:', JSON.stringify(realMembers, null, 2));
                setMembers(realMembers);

                // Set current user's role
                const currentMember = realMembers.find(m => m.id === user?.uid);
                if (currentMember) {
                  setCurrentUserRole(currentMember.role);
                }

                // Skip mock data generation
                return;
              }
            }
          } catch (error) {
            console.error('Error fetching real members:', error);
            // Continue with mock data as fallback
          }

          // Fallback to mock members if real data couldn't be fetched
          console.log('Using mock member data as fallback');
          const mockMembers: GroupMember[] = [
            {
              id: safeUserId,
              displayName: userProfile?.displayName || 'Group Creator',
              photoURL: userProfile?.photoURL || null,
              role: safeGroupData.adminId === safeUserId ? 'admin' : 'member',
              joinedAt: Date.now() - 86400000, // Joined 1 day ago
            }
          ];

          // Add some mock members
          if (safeGroupData.members > 1) {
            const additionalMembers = Math.min(safeGroupData.members - 1, 10); // Show up to 10 members
            for (let i = 0; i < additionalMembers; i++) {
              mockMembers.push({
                id: `member_${i}`,
                displayName: `Member ${i + 1}`,
                photoURL: null,
                role: 'member', // All additional members should be regular members
                isMuted: false,
                isBanned: false,
                joinedAt: Date.now() - (Math.random() * 86400000 * 30), // Random join date within last 30 days
              });
            }
          }

          setMembers(mockMembers);

          // Set current user's role
          const currentMember = mockMembers.find(m => m.id === user?.uid);
          if (currentMember) {
            setCurrentUserRole(currentMember.role);
          }
        }
      } catch (error) {
        console.error('Error loading group data:', error);
        Alert.alert('Error', 'Failed to load group details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadGroupData();
  }, [route.params, user, userProfile]);

  // Handle member action (promote, demote, mute, ban)
  const handleMemberAction = async (action: 'promote' | 'demote' | 'mute' | 'unmute' | 'ban' | 'unban') => {
    if (!selectedMember || !group || !user) return;

    try {
      // Clone the members array
      const updatedMembers = [...members];
      const memberIndex = updatedMembers.findIndex(m => m.id === selectedMember.id);

      if (memberIndex === -1) return;

      // Create updates object for Firebase
      const updates: {[key: string]: any} = {};

      // Update the member based on the action
      switch (action) {
        case 'promote':
          if (selectedMember.role === 'member') {
            // Update local state
            updatedMembers[memberIndex].role = 'officer';

            // Update Firebase
            updates[`/groups/${group.id}/memberRoles/${selectedMember.id}`] = 'officer';

            Alert.alert('Success', `${selectedMember.displayName} has been promoted to Officer`);
          }
          break;
        case 'demote':
          if (selectedMember.role === 'officer') {
            // Update local state
            updatedMembers[memberIndex].role = 'member';

            // Update Firebase
            updates[`/groups/${group.id}/memberRoles/${selectedMember.id}`] = 'member';

            Alert.alert('Success', `${selectedMember.displayName} has been demoted to Member`);
          }
          break;
        case 'mute':
          // Update local state
          updatedMembers[memberIndex].isMuted = true;

          // Update Firebase
          updates[`/groups/${group.id}/mutedMembers/${selectedMember.id}`] = true;

          Alert.alert('Success', `${selectedMember.displayName} has been muted`);
          break;
        case 'unmute':
          // Update local state
          updatedMembers[memberIndex].isMuted = false;

          // Update Firebase
          updates[`/groups/${group.id}/mutedMembers/${selectedMember.id}`] = null;

          Alert.alert('Success', `${selectedMember.displayName} has been unmuted`);
          break;
        case 'ban':
          // Update local state
          updatedMembers[memberIndex].isBanned = true;

          // Update Firebase
          updates[`/groups/${group.id}/bannedMembers/${selectedMember.id}`] = true;

          Alert.alert('Success', `${selectedMember.displayName} has been banned from the group`);
          break;
        case 'unban':
          // Update local state
          updatedMembers[memberIndex].isBanned = false;

          // Update Firebase
          updates[`/groups/${group.id}/bannedMembers/${selectedMember.id}`] = null;

          Alert.alert('Success', `${selectedMember.displayName} has been unbanned`);
          break;
      }

      // Apply Firebase updates
      if (Object.keys(updates).length > 0) {
        await database().ref().update(updates);
        console.log('Firebase updates applied:', updates);
      }

      // Update the members state
      setMembers(updatedMembers);
      setSelectedMember(null);
      setMemberActionModalVisible(false);
    } catch (error) {
      console.error('Error updating member status:', error);
      Alert.alert('Error', 'Failed to update member status. Please try again.');
    }
  };

  // Render about tab
  const renderAboutTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.aboutCard}>
        <Text style={styles.sectionTitle}>Group Information</Text>
        <Text style={styles.groupDescription}>
          {group?.description || 'No description available for this group.'}
        </Text>

        <View style={styles.infoRow}>
          <Ionicons name="location" size={18} color={colors.primary} style={styles.infoIcon} />
          <Text style={styles.infoText}>
            {group?.location || 'Location not specified'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="people" size={18} color={colors.primary} style={styles.infoIcon} />
          <Text style={styles.infoText}>
            {typeof group?.members === 'number' ? `${group.members} members` : 'Members count unknown'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="key" size={18} color={colors.primary} style={styles.infoIcon} />
          <Text style={styles.infoText}>
            Group Code: {group?.code || 'Not available'}
          </Text>
        </View>

        {group?.createdBy && (
          <View style={styles.infoRow}>
            <Ionicons name="person" size={18} color={colors.primary} style={styles.infoIcon} />
            <Text style={styles.infoText}>
              Created by: {user && group.createdBy === user.uid ? 'You' : 'Another user'}
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Tags</Text>
        <View style={styles.tagsContainer}>
          {group?.tags && Array.isArray(group.tags) && group.tags.length > 0 ? (
            group.tags.map((tag: string, index: number) => (
              <View key={index} style={styles.tagBadge}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))
          ) : (
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>No tags</Text>
            </View>
          )}
        </View>
      </Card>
    </View>
  );

  // Render members tab
  const renderMembersTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.membersCard}>
        <Text style={styles.sectionTitle}>Group Members ({members.length})</Text>
        <Text style={styles.membersNote}>Only admins and officers can see the full member list</Text>

        {members.map((member, index) => (
          <View key={member.id} style={styles.memberItem}>
            <View style={styles.memberInfo}>
              {member.photoURL ? (
                <Image source={{ uri: member.photoURL }} style={styles.memberAvatar} />
              ) : (
                <View style={styles.memberAvatarPlaceholder}>
                  <Text style={styles.memberAvatarText}>
                    {member.displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.memberDetails}>
                <Text style={styles.memberName}>
                  {member.displayName}
                  {user && member.id === user.uid && ' (You)'}
                </Text>
                <View style={styles.memberRoleContainer}>
                  <Text style={[
                    styles.memberRole,
                    member.role === 'admin' && styles.adminRole,
                    member.role === 'officer' && styles.officerRole,
                  ]}>
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </Text>
                  {member.isMuted && (
                    <View style={styles.memberStatusBadge}>
                      <Text style={styles.memberStatusText}>Muted</Text>
                    </View>
                  )}
                  {member.isBanned && (
                    <View style={[styles.memberStatusBadge, styles.bannedBadge]}>
                      <Text style={styles.memberStatusText}>Banned</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Show action button for admins and officers */}
            {user && (currentUserRole === 'admin' || (currentUserRole === 'officer' && member.role === 'member')) &&
             member.id !== user.uid && (
              <TouchableOpacity
                style={styles.memberActionButton}
                onPress={() => {
                  setSelectedMember(member);
                  setMemberActionModalVisible(true);
                }}
              >
                <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </Card>
    </View>
  );

  // Loading state
  if (loading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingQuote type="farmer" />
        {!user && (
          <Text style={styles.loadingText}>
            Waiting for user authentication...
          </Text>
        )}
      </View>
    );
  }

  // If group not found
  if (!group) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              try {
                navigation.goBack();
              } catch (error) {
                console.error('Navigation error:', error);
                // Fallback to navigating to the home screen
                navigation.navigate('Home');
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group Details</Text>
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Group Not Found</Text>
          <Text style={styles.errorMessage}>The group you're looking for doesn't exist or you don't have permission to view it.</Text>
          <Button
            title="Go Back"
            onPress={() => {
              try {
                navigation.goBack();
              } catch (error) {
                console.error('Navigation error:', error);
                // Fallback to navigating to the home screen
                navigation.navigate('Home');
              }
            }}
            style={styles.errorButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            try {
              navigation.goBack();
            } catch (error) {
              console.error('Navigation error:', error);
              // Fallback to navigating to the home screen
              navigation.navigate('Home');
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{group.name}</Text>
      </View>

      <View style={styles.groupBanner}>
        {group.logo ? (
          <View>
            <Image
              source={{ uri: group.logo }}
              style={styles.groupLogo}
              onError={(e) => {
                console.log('Error loading group logo:', e.nativeEvent.error);
              }}
            />
            {/* Fallback icon in case the image fails to load but doesn't trigger onError */}
            <View style={styles.logoFallback}>
              <Ionicons name="people" size={36} color={colors.primaryLight} />
            </View>
          </View>
        ) : (
          <View style={styles.groupLogoPlaceholder}>
            <Ionicons name="people" size={36} color={colors.primary} />
          </View>
        )}

        {/* Display group name if it's not shown in the header */}
        {!group.name && (
          <Text style={styles.groupBannerName}>
            {group.id ? `Group ${group.id.substring(0, 6)}...` : 'Group Chat'}
          </Text>
        )}
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'about' && styles.activeTab]}
          onPress={() => setActiveTab('about')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'about' && styles.activeTabText,
            ]}
          >
            About
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'members' && styles.activeTab]}
          onPress={() => setActiveTab('members')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'members' && styles.activeTabText,
            ]}
          >
            Members
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {activeTab === 'about' && renderAboutTab()}
        {activeTab === 'members' && renderMembersTab()}
      </ScrollView>

      {/* Member Action Modal */}
      <Modal
        visible={memberActionModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMemberActionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Member Actions</Text>
              <TouchableOpacity
                onPress={() => setMemberActionModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedMember && (
              <View style={styles.selectedMemberInfo}>
                <Text style={styles.selectedMemberName}>{selectedMember.displayName}</Text>
                <Text style={styles.selectedMemberRole}>
                  Current Role: {selectedMember.role.charAt(0).toUpperCase() + selectedMember.role.slice(1)}
                </Text>
              </View>
            )}

            <View style={styles.actionButtonsContainer}>
              {/* Role management (admin only) */}
              {currentUserRole === 'admin' && selectedMember && (
                <>
                  {selectedMember.role === 'member' && (
                    <Button
                      title="Promote to Officer"
                      onPress={() => handleMemberAction('promote')}
                      variant="outline"
                      style={styles.actionButton}
                      leftIcon={<Ionicons name="arrow-up" size={16} color={colors.primary} />}
                    />
                  )}

                  {selectedMember.role === 'officer' && (
                    <Button
                      title="Demote to Member"
                      onPress={() => handleMemberAction('demote')}
                      variant="outline"
                      style={styles.actionButton}
                      leftIcon={<Ionicons name="arrow-down" size={16} color={colors.primary} />}
                    />
                  )}
                </>
              )}

              {/* Mute/Unmute (admin and officers) */}
              {selectedMember && (
                <>
                  {!selectedMember.isMuted ? (
                    <Button
                      title="Mute Member"
                      onPress={() => handleMemberAction('mute')}
                      variant="outline"
                      style={styles.actionButton}
                      leftIcon={<Ionicons name="volume-mute" size={16} color={colors.primary} />}
                    />
                  ) : (
                    <Button
                      title="Unmute Member"
                      onPress={() => handleMemberAction('unmute')}
                      variant="outline"
                      style={styles.actionButton}
                      leftIcon={<Ionicons name="volume-high" size={16} color={colors.primary} />}
                    />
                  )}
                </>
              )}

              {/* Ban/Unban (admin and officers) */}
              {selectedMember && (
                <>
                  {!selectedMember.isBanned ? (
                    <Button
                      title="Ban from Group"
                      onPress={() => handleMemberAction('ban')}
                      variant="outline"
                      style={[styles.actionButton, styles.dangerButton]}
                      leftIcon={<Ionicons name="ban" size={16} color={colors.error} />}
                    />
                  ) : (
                    <Button
                      title="Remove Ban"
                      onPress={() => handleMemberAction('unban')}
                      variant="outline"
                      style={styles.actionButton}
                      leftIcon={<Ionicons name="checkmark-circle" size={16} color={colors.primary} />}
                    />
                  )}
                </>
              )}
            </View>

            <Button
              title="Cancel"
              onPress={() => setMemberActionModalVisible(false)}
              variant="outline"
              style={styles.cancelButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    ...getPlatformTopSpacing('paddingTop', 0, spacing.md),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  errorButton: {
    minWidth: 150,
  },
  groupBanner: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  groupBannerName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  groupLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  groupLogoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  logoFallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
    fontFamily: typography.fontFamily.bold,
  },
  scrollContainer: {
    flex: 1,
  },
  tabContent: {
    padding: spacing.md,
  },
  aboutCard: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  groupDescription: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    lineHeight: typography.lineHeight.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoIcon: {
    marginRight: spacing.sm,
  },
  infoText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  tagText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  membersCard: {
    padding: spacing.md,
  },
  membersNote: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.italic,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  memberAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  memberAvatarText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  memberRoleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs / 2,
  },
  memberRole: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  adminRole: {
    color: colors.primary,
    fontFamily: typography.fontFamily.bold,
  },
  officerRole: {
    color: colors.success,
    fontFamily: typography.fontFamily.medium,
  },
  memberStatusBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 4,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
  },
  bannedBadge: {
    backgroundColor: colors.error,
  },
  memberStatusText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  memberActionButton: {
    padding: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  selectedMemberInfo: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
  },
  selectedMemberName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  selectedMemberRole: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  actionButtonsContainer: {
    marginBottom: spacing.md,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
  dangerButton: {
    borderColor: colors.error,
  },
  cancelButton: {
    marginTop: spacing.sm,
  },
});

export default GroupDetailsScreen;
