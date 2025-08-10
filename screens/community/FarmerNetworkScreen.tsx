import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import LoadingQuote from '../../components/LoadingQuote';
import * as ImagePicker from 'expo-image-picker';
import { storage, database } from '../../firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateGroupCode } from '../../utils/idGenerator';

// Mock events data only - as per requirements

// Mock events data
const mockEvents = [
  {
    id: '1',
    title: 'Organic Farming Workshop',
    date: 'May 25, 2023',
    time: '10:00 AM - 2:00 PM',
    location: 'Agricultural Extension Center, Pune',
    organizer: 'Maharashtra Organic Farmers Association',
    description: 'Learn practical techniques for transitioning to organic farming methods.',
    attendees: 45,
  },
  {
    id: '2',
    title: 'Farmer Market Day',
    date: 'June 5, 2023',
    time: '8:00 AM - 4:00 PM',
    location: 'Community Grounds, Chandigarh',
    organizer: 'Local Farmers Collective',
    description: 'Direct selling opportunity for farmers to connect with urban consumers.',
    attendees: 120,
  },
  {
    id: '3',
    title: 'Soil Health Management Seminar',
    date: 'June 15, 2023',
    time: '9:00 AM - 1:00 PM',
    location: 'District Agricultural Office, Lucknow',
    organizer: 'UP Agricultural University',
    description: 'Expert talks on improving soil health and fertility through sustainable practices.',
    attendees: 75,
  },
  {
    id: '4',
    title: 'Farm Equipment Demonstration',
    date: 'July 2, 2023',
    time: '10:00 AM - 4:00 PM',
    location: 'Agricultural Fair Grounds, Ahmedabad',
    organizer: 'Gujarat Agricultural Department',
    description: 'Demonstration of new farm equipment and technologies for small and medium farmers.',
    attendees: 200,
  },
  {
    id: '5',
    title: 'Crop Insurance Awareness Camp',
    date: 'July 10, 2023',
    time: '11:00 AM - 3:00 PM',
    location: 'Village Community Hall, Bhopal District',
    organizer: 'Agricultural Insurance Company',
    description: 'Information session about crop insurance schemes and how to apply for coverage.',
    attendees: 90,
  },
];

const FarmerNetworkScreen = () => {
  const navigation = useNavigation();
  const { userProfile, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('groups');
  const [searchQuery, setSearchQuery] = useState('');
  const [farmerGroups, setFarmerGroups] = useState([]);
  const [communityGroups, setCommunityGroups] = useState([]);
  const [resources, setResources] = useState([]);
  const [events, setEvents] = useState(mockEvents);
  const [joinGroupModalVisible, setJoinGroupModalVisible] = useState(false);
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [groupCodeInput, setGroupCodeInput] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupTags, setNewGroupTags] = useState('');
  const [selectedGroupType, setSelectedGroupType] = useState('farmer');
  const [groupLogo, setGroupLogo] = useState('');

  // Load network data
  useEffect(() => {
    const loadNetworkData = async () => {
      try {
        setLoading(true);

        // Load groups from AsyncStorage first (for faster loading)
        try {
          const storedGroups = await AsyncStorage.getItem('farmerGroups');
          if (storedGroups) {
            const parsedGroups = JSON.parse(storedGroups);
            setFarmerGroups(parsedGroups);
          }
        } catch (storageError) {
          console.error('Error loading groups from AsyncStorage:', storageError);
        }

        // Then try to load from Firebase if user is logged in
        if (user) {
          // Get user's joined groups
          const userGroupsRef = database().ref(`users/${user.uid}/groups`);
          userGroupsRef.once('value', async (snapshot) => {
            if (snapshot.exists()) {
              const userGroups = snapshot.val();
              const groupsArray = [];

              // Fetch each group's details
              for (const groupId in userGroups) {
                try {
                  const groupRef = database().ref(`groups/${groupId}`);
                  const groupSnapshot = await groupRef.once('value');

                  if (groupSnapshot.exists()) {
                    const groupData = groupSnapshot.val();
                    groupsArray.push({
                      ...groupData,
                      id: groupId,
                      isJoined: true
                    });
                  }
                } catch (groupError) {
                  console.error(`Error fetching group ${groupId}:`, groupError);
                }
              }

              // Update state and AsyncStorage
              if (groupsArray.length > 0) {
                setFarmerGroups(groupsArray);
                await AsyncStorage.setItem('farmerGroups', JSON.stringify(groupsArray));
              }
            }
          });

          // Load all available groups for discovery
          try {
            const allGroupsRef = database().ref('groups');
            const allGroupsSnapshot = await allGroupsRef.once('value');

            if (allGroupsSnapshot.exists()) {
              const allGroups = [];
              const userJoinedGroupIds = {};

              // First get the IDs of groups the user has already joined
              const userGroupsSnapshot = await userGroupsRef.once('value');
              if (userGroupsSnapshot.exists()) {
                const userGroupsData = userGroupsSnapshot.val();
                Object.keys(userGroupsData).forEach(groupId => {
                  userJoinedGroupIds[groupId] = true;
                });
              }

              // Process all groups
              allGroupsSnapshot.forEach(groupSnapshot => {
                const groupId = groupSnapshot.key;
                const groupData = groupSnapshot.val();

                // Skip if this is the user's own group or already in farmerGroups
                const isJoined = userJoinedGroupIds[groupId] === true;

                // Add to appropriate array
                if (!isJoined) {
                  allGroups.push({
                    ...groupData,
                    id: groupId,
                    isJoined: false
                  });
                }
              });

              // Update community groups state
              setCommunityGroups(allGroups);
            }
          } catch (error) {
            console.error('Error loading all groups:', error);
          }
        }

        // Load resources (empty for now)
        setResources([]);

        // Load mock events
        setEvents(mockEvents);

        // Simulate loading time for initial render
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error loading network data:', error);
        Alert.alert('Error', 'Failed to load community data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadNetworkData();
  }, [user, userProfile]);

  // Handle joining a group
  const handleJoinGroup = async (groupId: string) => {
    const group = farmerGroups.find(g => g.id === groupId);
    if (!group) return;

    if (!user) {
      Alert.alert('Error', 'You must be logged in to join groups');
      return;
    }

    // Check if we're trying to join or leave
    const isJoining = !group.isJoined;

    try {
      if (!group.isJoined) {
        // User is joining the group

        // Create a batch of updates
        const updates = {};

        // 1. Add group to user's groups
        updates[`/users/${user.uid}/groups/${groupId}`] = true;

        // 2. Get current group data
        const groupRef = database().ref(`groups/${groupId}`);
        const groupSnapshot = await groupRef.once('value');

        if (!groupSnapshot.exists()) {
          // If the group doesn't exist in Firebase yet, create it
          updates[`/groups/${groupId}`] = {
            ...group,
            members: 1,
            memberIds: {
              [user.uid]: true
            },
            memberRoles: {
              [user.uid]: 'member'
            }
          };
        } else {
          // Get current group data
          const currentData = groupSnapshot.val();

          // Update members count and add user to memberIds
          updates[`/groups/${groupId}/members`] = (currentData.members || 0) + 1;
          updates[`/groups/${groupId}/memberIds/${user.uid}`] = true;
          updates[`/groups/${groupId}/memberRoles/${user.uid}`] = 'member';
        }

        // 3. Create or update chat entry
        const chatId = `group_${groupId}`;
        const chatRef = database().ref(`chats/${chatId}`);
        const chatSnapshot = await chatRef.once('value');

        if (!chatSnapshot.exists()) {
          // Create new chat entry
          updates[`/chats/${chatId}`] = {
            isGroup: true,
            participants: {
              [user.uid]: true,
            },
            participantDetails: {
              [user.uid]: {
                displayName: userProfile?.displayName || 'Unknown User',
                photoURL: userProfile?.photoURL || '',
                role: userProfile?.role || 'farmer',
              }
            },
            groupDetails: {
              id: groupId,
              name: group.name,
              logo: group.logo || null,
              memberCount: (groupSnapshot.exists() ? groupSnapshot.val().members || 0 : 0) + 1,
            },
            lastMessage: {
              text: `${userProfile?.displayName || 'A new user'} joined the group`,
              timestamp: database.ServerValue.TIMESTAMP,
              senderId: 'system',
            },
            createdAt: database.ServerValue.TIMESTAMP,
            updatedAt: database.ServerValue.TIMESTAMP,
          };
        } else {
          // Update existing chat
          const currentChat = chatSnapshot.val();

          // Add user to participants
          updates[`/chats/${chatId}/participants/${user.uid}`] = true;

          // Add user details
          updates[`/chats/${chatId}/participantDetails/${user.uid}`] = {
            displayName: userProfile?.displayName || 'Unknown User',
            photoURL: userProfile?.photoURL || '',
            role: userProfile?.role || 'farmer',
          };

          // Update last message
          updates[`/chats/${chatId}/lastMessage`] = {
            text: `${userProfile?.displayName || 'A new user'} joined the group`,
            timestamp: database.ServerValue.TIMESTAMP,
            senderId: 'system',
          };

          // Update timestamp
          updates[`/chats/${chatId}/updatedAt`] = database.ServerValue.TIMESTAMP;

          // Update member count
          updates[`/chats/${chatId}/groupDetails/memberCount`] =
            (currentChat.groupDetails?.memberCount || 0) + 1;
        }

        // 4. Add chat to user's chats
        updates[`/users/${user.uid}/chats/${chatId}`] = true;

        // Execute all updates
        await database().ref().update(updates);

        // 5. Update local state AFTER successful Firebase update
        setFarmerGroups(prevGroups => {
          const updatedGroups = prevGroups.map(g =>
            g.id === groupId
              ? { ...g, isJoined: true }
              : g
          );

          // Save to AsyncStorage
          AsyncStorage.setItem('farmerGroups', JSON.stringify(updatedGroups))
            .catch(error => console.error('Error saving groups to AsyncStorage:', error));

          return updatedGroups;
        });

        // 6. Show success notification
        Alert.alert('Success', `You have joined ${group.name}`);
      } else {
        // User is leaving the group

        // Create a batch of updates
        const updates = {};

        // 1. Remove group from user's groups
        updates[`/users/${user.uid}/groups/${groupId}`] = null;

        // 2. Get current group data
        const groupRef = database().ref(`groups/${groupId}`);
        const groupSnapshot = await groupRef.once('value');

        if (groupSnapshot.exists()) {
          const currentData = groupSnapshot.val();

          // Update members count
          updates[`/groups/${groupId}/members`] = Math.max((currentData.members || 1) - 1, 0);

          // Remove user from memberIds
          updates[`/groups/${groupId}/memberIds/${user.uid}`] = null;

          // Remove user role
          updates[`/groups/${groupId}/memberRoles/${user.uid}`] = null;

          // If user is admin and there are other members, transfer admin role
          if (currentData.adminId === user.uid && currentData.members > 1) {
            // Find another member to make admin
            const memberIds = Object.keys(currentData.memberIds || {}).filter(id => id !== user.uid);
            if (memberIds.length > 0) {
              updates[`/groups/${groupId}/adminId`] = memberIds[0];
              updates[`/groups/${groupId}/memberRoles/${memberIds[0]}`] = 'admin';
            }
          }

          // If this was the last member, delete the group
          if (currentData.members <= 1) {
            updates[`/groups/${groupId}`] = null;
          }
        }

        // 3. Update chat
        const chatId = `group_${groupId}`;
        const chatRef = database().ref(`chats/${chatId}`);
        const chatSnapshot = await chatRef.once('value');

        if (chatSnapshot.exists()) {
          const currentChat = chatSnapshot.val();

          // Remove user from participants
          updates[`/chats/${chatId}/participants/${user.uid}`] = null;

          // Remove user details
          updates[`/chats/${chatId}/participantDetails/${user.uid}`] = null;

          // Update last message
          updates[`/chats/${chatId}/lastMessage`] = {
            text: `${userProfile?.displayName || 'A user'} left the group`,
            timestamp: database.ServerValue.TIMESTAMP,
            senderId: 'system',
          };

          // Update timestamp
          updates[`/chats/${chatId}/updatedAt`] = database.ServerValue.TIMESTAMP;

          // Update member count
          const newMemberCount = Math.max((currentChat.groupDetails?.memberCount || 1) - 1, 0);
          updates[`/chats/${chatId}/groupDetails/memberCount`] = newMemberCount;

          // If this was the last member, delete the chat
          if (newMemberCount <= 0) {
            updates[`/chats/${chatId}`] = null;
          }
        }

        // 4. Remove chat from user's chats
        updates[`/users/${user.uid}/chats/${chatId}`] = null;

        // Execute all updates
        await database().ref().update(updates);

        // 5. Show success notification
        Alert.alert('Success', `You have left ${group.name}`);
      }
    } catch (error) {
      console.error('Error updating group membership:', error);
      Alert.alert('Error', 'Failed to update group membership. Please try again.');

      // Revert the local state change on error
      setFarmerGroups(prevGroups =>
        prevGroups.map(g =>
          g.id === groupId
            ? { ...g, isJoined: !g.isJoined }
            : g
        )
      );
    }
  };

  // Handle joining a community group
  const handleJoinCommunityGroup = async (groupId: string) => {
    // Find the group in communityGroups
    const group = communityGroups.find(g => g.id === groupId);
    if (!group) return;

    if (!user) {
      Alert.alert('Error', 'You must be logged in to join groups');
      return;
    }

    try {
      setLoading(true);

      // Create a batch of updates
      const updates = {};

      // 1. Add group to user's groups
      updates[`/users/${user.uid}/groups/${groupId}`] = true;

      // 2. Get current group data
      const groupRef = database().ref(`groups/${groupId}`);
      const groupSnapshot = await groupRef.once('value');

      if (!groupSnapshot.exists()) {
        throw new Error('Group not found');
      }

      const currentData = groupSnapshot.val();

      // 3. Update members count and add user to memberIds
      updates[`/groups/${groupId}/members`] = (currentData.members || 0) + 1;
      updates[`/groups/${groupId}/memberIds/${user.uid}`] = true;
      updates[`/groups/${groupId}/memberRoles/${user.uid}`] = 'member';

      // 4. Create or update chat entry
      const chatId = `group_${groupId}`;
      const chatRef = database().ref(`chats/${chatId}`);
      const chatSnapshot = await chatRef.once('value');

      if (!chatSnapshot.exists()) {
        // Create new chat entry
        updates[`/chats/${chatId}`] = {
          isGroup: true,
          participants: {
            [user.uid]: true,
          },
          participantDetails: {
            [user.uid]: {
              displayName: userProfile?.displayName || 'Unknown User',
              photoURL: userProfile?.photoURL || '',
              role: userProfile?.role || 'farmer',
            }
          },
          groupDetails: {
            id: groupId,
            name: group.name,
            logo: group.logo || null,
            memberCount: (currentData.members || 0) + 1,
          },
          lastMessage: {
            text: `${userProfile?.displayName || 'A new user'} joined the group`,
            timestamp: database.ServerValue.TIMESTAMP,
            senderId: 'system',
          },
          createdAt: database.ServerValue.TIMESTAMP,
          updatedAt: database.ServerValue.TIMESTAMP,
        };
      } else {
        // Update existing chat
        const chatData = chatSnapshot.val();

        // Add user to participants
        updates[`/chats/${chatId}/participants/${user.uid}`] = true;

        // Add user details
        updates[`/chats/${chatId}/participantDetails/${user.uid}`] = {
          displayName: userProfile?.displayName || 'Unknown User',
          photoURL: userProfile?.photoURL || '',
          role: userProfile?.role || 'farmer',
        };

        // Update member count
        updates[`/chats/${chatId}/groupDetails/memberCount`] = (currentData.members || 0) + 1;

        // Update last message
        updates[`/chats/${chatId}/lastMessage`] = {
          text: `${userProfile?.displayName || 'A new user'} joined the group`,
          timestamp: database.ServerValue.TIMESTAMP,
          senderId: 'system',
        };

        updates[`/chats/${chatId}/updatedAt`] = database.ServerValue.TIMESTAMP;
      }

      // 5. Add chat to user's chats
      updates[`/users/${user.uid}/chats/${chatId}`] = true;

      // Execute all updates
      await database().ref().update(updates);

      // 6. Update local state
      // Move the group from communityGroups to farmerGroups
      const updatedGroup = {
        ...group,
        isJoined: true,
        members: (group.members || 0) + 1
      };

      setCommunityGroups(prev => prev.filter(g => g.id !== groupId));
      setFarmerGroups(prev => [updatedGroup, ...prev]);

      // Update AsyncStorage
      const updatedFarmerGroups = [updatedGroup, ...farmerGroups];
      await AsyncStorage.setItem('farmerGroups', JSON.stringify(updatedFarmerGroups));

      // 7. Show success notification
      Alert.alert('Success', `You have joined ${group.name}`);
    } catch (error) {
      console.error('Error joining community group:', error);
      Alert.alert('Error', 'Failed to join group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle joining a group by code
  const handleJoinByCode = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to join groups');
      return;
    }

    if (!groupCodeInput.trim()) {
      Alert.alert('Error', 'Please enter a group code');
      return;
    }

    try {
      setLoading(true);

      // First check local groups
      const localGroup = farmerGroups.find(g => g.code === groupCodeInput);
      if (localGroup && localGroup.isJoined) {
        Alert.alert('Already Joined', `You are already a member of ${localGroup.name}`);
        setJoinGroupModalVisible(false);
        setGroupCodeInput('');
        setLoading(false);
        return;
      }

      // If not found locally or not joined, search in Firebase
      const groupsRef = database().ref('groups');
      const snapshot = await groupsRef.orderByChild('code').equalTo(groupCodeInput).once('value');

      if (!snapshot.exists()) {
        Alert.alert('Error', 'Invalid group code. Please check and try again.');
        setLoading(false);
        return;
      }

      // Get the group data
      let groupId = '';
      let groupData = null;

      snapshot.forEach((childSnapshot) => {
        groupId = childSnapshot.key || '';
        groupData = childSnapshot.val();
        return true; // Break the forEach loop after the first match
      });

      if (!groupId || !groupData) {
        Alert.alert('Error', 'Failed to retrieve group data. Please try again.');
        setLoading(false);
        return;
      }

      // Check if user is already a member
      if (groupData.memberIds && groupData.memberIds[user.uid]) {
        Alert.alert('Already Joined', `You are already a member of ${groupData.name}`);
        setJoinGroupModalVisible(false);
        setGroupCodeInput('');
        setLoading(false);
        return;
      }

      // Create a batch of updates
      const updates = {};

      // 1. Add group to user's groups
      updates[`/users/${user.uid}/groups/${groupId}`] = true;

      // 2. Update members count and add user to memberIds
      updates[`/groups/${groupId}/members`] = (groupData.members || 0) + 1;
      updates[`/groups/${groupId}/memberIds/${user.uid}`] = true;
      updates[`/groups/${groupId}/memberRoles/${user.uid}`] = 'member';

      // 3. Create or update chat entry
      const chatId = `group_${groupId}`;
      const chatRef = database().ref(`chats/${chatId}`);
      const chatSnapshot = await chatRef.once('value');

      if (!chatSnapshot.exists()) {
        // Create new chat entry
        updates[`/chats/${chatId}`] = {
          isGroup: true,
          participants: {
            [user.uid]: true,
          },
          participantDetails: {
            [user.uid]: {
              displayName: userProfile?.displayName || 'Unknown User',
              photoURL: userProfile?.photoURL || '',
              role: userProfile?.role || 'farmer',
            }
          },
          groupDetails: {
            id: groupId,
            name: groupData.name,
            logo: groupData.logo || null,
            memberCount: (groupData.members || 0) + 1,
          },
          lastMessage: {
            text: `${userProfile?.displayName || 'A new user'} joined the group`,
            timestamp: database.ServerValue.TIMESTAMP,
            senderId: 'system',
          },
          createdAt: database.ServerValue.TIMESTAMP,
          updatedAt: database.ServerValue.TIMESTAMP,
        };
      } else {
        // Update existing chat
        const chatData = chatSnapshot.val();

        // Add user to participants
        updates[`/chats/${chatId}/participants/${user.uid}`] = true;

        // Add user details
        updates[`/chats/${chatId}/participantDetails/${user.uid}`] = {
          displayName: userProfile?.displayName || 'Unknown User',
          photoURL: userProfile?.photoURL || '',
          role: userProfile?.role || 'farmer',
        };

        // Update member count
        updates[`/chats/${chatId}/groupDetails/memberCount`] = (groupData.members || 0) + 1;

        // Update last message
        updates[`/chats/${chatId}/lastMessage`] = {
          text: `${userProfile?.displayName || 'A new user'} joined the group`,
          timestamp: database.ServerValue.TIMESTAMP,
          senderId: 'system',
        };

        updates[`/chats/${chatId}/updatedAt`] = database.ServerValue.TIMESTAMP;
      }

      // 4. Add chat to user's chats
      updates[`/users/${user.uid}/chats/${chatId}`] = true;

      // Execute all updates
      await database().ref().update(updates);

      // 5. Update local state
      const groupWithId = {
        ...groupData,
        id: groupId,
        isJoined: true
      };

      // Add to farmerGroups
      setFarmerGroups(prev => [groupWithId, ...prev]);

      // Update AsyncStorage
      const updatedFarmerGroups = [groupWithId, ...farmerGroups];
      await AsyncStorage.setItem('farmerGroups', JSON.stringify(updatedFarmerGroups));

      // Show success notification
      Alert.alert('Success', `You have joined ${groupData.name}`);

      setJoinGroupModalVisible(false);
      setGroupCodeInput('');
    } catch (error) {
      console.error('Error joining group by code:', error);
      Alert.alert('Error', 'Failed to join group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle creating a new group
  const handleCreateGroup = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a group');
      return;
    }

    if (!newGroupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (!newGroupDescription.trim()) {
      Alert.alert('Error', 'Please enter a group description');
      return;
    }

    try {
      setLoading(true);

      const tags = newGroupTags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag);

      // Generate a unique ID for the group
      const groupId = database().ref('groups').push().key;
      if (!groupId) {
        throw new Error('Failed to generate group ID');
      }

      // Generate a consistent group code based on the group ID
      const groupCode = generateGroupCode(groupId);

      // Upload logo if available
      let logoUrl = null;
      if (groupLogo) {
        try {
          // Convert image to blob
          const response = await fetch(groupLogo);
          const blob = await response.blob();

          // Upload to Firebase Storage
          const logoRef = storage().ref(`group_logos/${groupId}.jpg`);
          await logoRef.put(blob);

          // Get download URL
          logoUrl = await logoRef.getDownloadURL();
        } catch (uploadError) {
          console.error('Error uploading group logo:', uploadError);
          // Continue without logo if upload fails
        }
      }

      // Create the group object for Firebase
      const newGroup = {
        name: newGroupName,
        members: 1, // Just the creator initially
        location: userProfile?.location?.address || 'Unknown Location',
        description: newGroupDescription,
        tags: tags.length > 0 ? tags : ['new group'],
        code: groupCode,
        logo: logoUrl, // Include the group logo URL if available
        createdBy: user.uid, // Store the creator's ID
        createdAt: database.ServerValue.TIMESTAMP,
        adminId: user.uid, // The creator is the admin
        memberRoles: {
          [user.uid]: 'admin' // Set the creator as admin
        },
        memberIds: {
          [user.uid]: true
        }
      };

      // Create a batch of updates to ensure atomicity
      const updates = {};

      // Save group to Firebase
      updates[`/groups/${groupId}`] = newGroup;

      // Add group to user's groups
      updates[`/users/${user.uid}/groups/${groupId}`] = true;

      // Create initial group chat
      const chatId = `group_${groupId}`;
      updates[`/chats/${chatId}`] = {
        isGroup: true,
        participants: {
          [user.uid]: true,
        },
        participantDetails: {
          [user.uid]: {
            displayName: userProfile?.displayName || 'Unknown User',
            photoURL: userProfile?.photoURL || '',
            role: userProfile?.role || 'farmer',
          }
        },
        groupDetails: {
          id: groupId,
          name: newGroupName,
          logo: logoUrl,
          memberCount: 1,
          adminId: user.uid,
        },
        lastMessage: {
          text: `${userProfile?.displayName || 'A new user'} created the group`,
          timestamp: database.ServerValue.TIMESTAMP,
          senderId: 'system',
        },
        createdAt: database.ServerValue.TIMESTAMP,
        updatedAt: database.ServerValue.TIMESTAMP,
      };

      // Add chat to user's chats
      updates[`/users/${user.uid}/chats/${chatId}`] = true;

      // Execute all updates in a single operation
      await database().ref().update(updates);

      // Add to local state
      const groupForState = {
        ...newGroup,
        id: groupId,
        isJoined: true,
        createdAt: Date.now() // Convert ServerValue.TIMESTAMP to actual timestamp for local state
      };

      setFarmerGroups(prev => [groupForState, ...prev]);

      // Save to AsyncStorage
      const updatedGroups = [groupForState, ...farmerGroups];
      await AsyncStorage.setItem('farmerGroups', JSON.stringify(updatedGroups));

      // Reset form and close modal
      setNewGroupName('');
      setNewGroupDescription('');
      setNewGroupTags('');
      setGroupLogo('');
      setCreateGroupModalVisible(false);

      // Show success message with group code
      Alert.alert(
        'Group Created Successfully',
        `Your group "${newGroup.name}" has been created!\n\nGroup Code: ${groupCode}\n\nShare this code with others to invite them to your group.`
      );
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle event RSVP
  const handleRSVP = (eventId: string) => {
    Alert.alert('RSVP', `This would register you for the event ID: ${eventId}`);
  };

  // Handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    Alert.alert('Search', `This would search for: ${searchQuery}`);
  };

  // Handle picking and uploading a group logo
  const handlePickGroupLogo = async () => {
    try {
      // Request permission to access the image library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photos to upload a group logo.');
        return;
      }

      // Launch the image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setGroupLogo(selectedImage.uri);

        // In a real app, we would upload the image to Firebase Storage here
        /*
        if (user) {
          const timestamp = Date.now();
          const filename = `group_logos/${user.uid}_${timestamp}.jpg`;
          const reference = storage().ref(filename);

          // Convert image to blob
          const response = await fetch(selectedImage.uri);
          const blob = await response.blob();

          // Upload to Firebase Storage
          await reference.put(blob);

          // Get download URL
          const downloadURL = await reference.getDownloadURL();
          setGroupLogo(downloadURL);
        }
        */
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Render farmer groups tab
  const renderGroupsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabDescription}>
        Connect with farmer groups and communities based on your location, crops, or interests. Share knowledge, resources, and support each other.
      </Text>

      <View style={styles.groupActions}>
        <Button
          title="Join Group by Code"
          onPress={() => setJoinGroupModalVisible(true)}
          style={[styles.groupActionButton, { marginRight: spacing.sm }]}
          leftIcon={<Ionicons name="enter" size={16} color={colors.primary} style={styles.buttonIcon} />}
          variant="outline"
        />
        <Button
          title="Create New Group"
          onPress={() => setCreateGroupModalVisible(true)}
          style={styles.groupActionButton}
          leftIcon={<Ionicons name="add-circle" size={16} color={colors.primary} style={styles.buttonIcon} />}
          variant="outline"
        />
      </View>

      {farmerGroups.length > 0 ? (
        farmerGroups.map(group => (
          <Card key={group.id} style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <View style={styles.groupHeaderContent}>
                {group.logo ? (
                  <Image source={{ uri: group.logo }} style={styles.groupLogo} />
                ) : (
                  <View style={styles.groupLogoPlaceholder}>
                    <Ionicons name="people" size={24} color={colors.primary} />
                  </View>
                )}
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupMeta}>{group.members} members • {group.location}</Text>
                  <Text style={styles.groupCode}>Group Code: {group.code}</Text>
                </View>
              </View>
              <Button
                title={group.isJoined ? 'Joined' : 'Join'}
                variant={group.isJoined ? 'outline' : 'solid'}
                onPress={() => handleJoinGroup(group.id)}
                style={styles.joinButton}
              />
            </View>

            <Text style={styles.groupDescription}>{group.description}</Text>

            <View style={styles.tagsContainer}>
              {group.tags.map((tag, index) => (
                <View key={index} style={styles.tagBadge}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>

            {group.isJoined && (
              <View style={styles.groupActions}>
                <Button
                  title="View Group"
                  variant="outline"
                  onPress={() => {
                    // Create a clean copy of the group data to ensure it's serializable
                    const cleanGroupData = {
                      id: group.id,
                      name: group.name || 'Group',
                      description: group.description || 'No description available',
                      members: group.members || 1,
                      location: group.location || 'Unknown location',
                      code: group.code || '',
                      tags: Array.isArray(group.tags) ? [...group.tags] : [],
                      logo: group.logo || null,
                      adminId: group.adminId || user?.uid,
                      createdBy: group.createdBy || user?.uid,
                      isJoined: group.isJoined || false,
                    };

                    console.log('Navigating to GroupDetails with data:', JSON.stringify(cleanGroupData, null, 2));

                    navigation.navigate('GroupDetails' as never, {
                      groupId: group.id,
                      groupData: cleanGroupData,
                    } as never);
                  }}
                  style={[styles.groupActionButton, { marginRight: spacing.sm }]}
                  leftIcon={<Ionicons name="people" size={16} color={colors.primary} style={styles.buttonIcon} />}
                />
                <Button
                  title="Chat"
                  variant="outline"
                  onPress={() => navigation.navigate('ChatScreen' as never, {
                    chatId: `group_${group.id}`,
                    recipientId: `group_${group.id}`,
                    recipientName: group.name,
                    recipientPhoto: '',
                  } as never)}
                  style={styles.groupActionButton}
                  leftIcon={<Ionicons name="chatbubble" size={16} color={colors.primary} style={styles.buttonIcon} />}
                />
              </View>
            )}
          </Card>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyContent}>
            <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Farmer Groups</Text>
            <Text style={styles.emptyDescription}>
              There are no farmer groups available yet. Create a new group or join an existing one using a group code.
            </Text>
          </View>
        </Card>
      )}
    </View>
  );

  // Render community groups tab
  const renderCommunityTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabDescription}>
        Join community groups to connect with farmers and other stakeholders in your region. Collaborate on local initiatives and share resources.
      </Text>

      <View style={styles.groupActions}>
        <Button
          title="Join Group by Code"
          onPress={() => setJoinGroupModalVisible(true)}
          style={[styles.groupActionButton, { marginRight: spacing.sm }]}
          leftIcon={<Ionicons name="enter" size={16} color={colors.primary} style={styles.buttonIcon} />}
          variant="outline"
        />
        <Button
          title="Create New Group"
          onPress={() => {
            setSelectedGroupType('community');
            setCreateGroupModalVisible(true);
          }}
          style={styles.groupActionButton}
          leftIcon={<Ionicons name="add-circle" size={16} color={colors.primary} style={styles.buttonIcon} />}
          variant="outline"
        />
      </View>

      {communityGroups.length > 0 ? (
        communityGroups.map(group => (
          <Card key={group.id} style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <View>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupMeta}>{group.members} members • {group.location}</Text>
                <Text style={styles.groupCode}>Group Code: {group.code}</Text>
              </View>
              <Button
                title={group.isJoined ? 'Joined' : 'Join'}
                variant={group.isJoined ? 'outline' : 'solid'}
                onPress={() => handleJoinCommunityGroup(group.id)}
                style={styles.joinButton}
              />
            </View>

            <Text style={styles.groupDescription}>{group.description}</Text>

            <View style={styles.tagsContainer}>
              {group.tags.map((tag, index) => (
                <View key={index} style={styles.tagBadge}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>

            {group.isJoined && (
              <View style={styles.groupActions}>
                <Button
                  title="View Group"
                  variant="outline"
                  onPress={() => {
                    // Create a clean copy of the group data to ensure it's serializable
                    const cleanGroupData = {
                      id: group.id,
                      name: group.name || 'Group',
                      description: group.description || 'No description available',
                      members: group.members || 1,
                      location: group.location || 'Unknown location',
                      code: group.code || '',
                      tags: Array.isArray(group.tags) ? [...group.tags] : [],
                      logo: group.logo || null,
                      adminId: group.adminId || user?.uid,
                      createdBy: group.createdBy || user?.uid,
                      isJoined: group.isJoined || false,
                    };

                    navigation.navigate('GroupDetails' as never, {
                      groupId: group.id,
                      groupData: cleanGroupData,
                    } as never);
                  }}
                  style={[styles.groupActionButton, { marginRight: spacing.sm }]}
                  leftIcon={<Ionicons name="people" size={16} color={colors.primary} style={styles.buttonIcon} />}
                />
                <Button
                  title="Chat"
                  variant="outline"
                  onPress={() => navigation.navigate('ChatScreen' as never, {
                    chatId: `group_${group.id}`,
                    recipientId: `group_${group.id}`,
                    recipientName: group.name,
                    recipientPhoto: '',
                  } as never)}
                  style={styles.groupActionButton}
                  leftIcon={<Ionicons name="chatbubble" size={16} color={colors.primary} style={styles.buttonIcon} />}
                />
              </View>
            )}
          </Card>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyContent}>
            <Ionicons name="globe-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Community Groups</Text>
            <Text style={styles.emptyDescription}>
              There are no community groups available yet. Create a new group or join an existing one using a group code.
            </Text>
          </View>
        </Card>
      )}
    </View>
  );

  // Render resource sharing tab
  const renderResourcesTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabDescription}>
        Share equipment, transportation, storage, and other resources with nearby farmers (within 100km) to reduce costs.
      </Text>

      {resources.length > 0 ? (
        resources.map(resource => (
          <Card key={resource.id} style={styles.resourceCard}>
            <View style={styles.resourceContent}>
              <Image
                source={{ uri: resource.image || 'https://via.placeholder.com/100x100?text=Resource' }}
                style={styles.resourceImage}
                resizeMode="cover"
              />

              <View style={styles.resourceInfo}>
                <Text style={styles.resourceName}>{resource.name}</Text>
                <Text style={styles.resourceOwner}>Offered by: {resource.owner}</Text>
                <Text style={styles.resourceLocation}>
                  <Ionicons name="location" size={14} color={colors.textSecondary} /> {resource.location}
                </Text>
                <Text style={styles.resourceAvailability}>{resource.availability}</Text>
                <Text style={styles.resourceRate}>{resource.rate}</Text>

                <Button
                  title="Book Now"
                  onPress={() => Alert.alert('Book Resource', `This would open the booking form for ${resource.name}`)}
                  style={styles.bookButton}
                  size="small"
                />
              </View>
            </View>
          </Card>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyContent}>
            <Ionicons name="cube-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Resources Found</Text>
            <Text style={styles.emptyDescription}>
              No resources are available within 100km of your location. Add your own resources to share with other farmers.
            </Text>
          </View>
        </Card>
      )}

      <Button
        title="Share Your Resource"
        onPress={() => Alert.alert('Share Resource', 'This would open the resource sharing form')}
        style={styles.createButton}
        leftIcon={<Ionicons name="share" size={18} color={colors.white} style={styles.buttonIcon} />}
      />
    </View>
  );

  // Render events tab
  const renderEventsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabDescription}>
        Discover workshops, training sessions, and community events for farmers in your area.
      </Text>

      <Card style={styles.noteCard}>
        <View style={styles.noteContent}>
          <Ionicons name="information-circle" size={24} color={colors.primary} style={styles.noteIcon} />
          <Text style={styles.noteText}>
            Events are created by agricultural organizations and extension services. Farmers cannot create events directly.
          </Text>
        </View>
      </Card>

      {events.map(event => (
        <Card key={event.id} style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Button
              title="RSVP"
              onPress={() => handleRSVP(event.id)}
              style={styles.rsvpButton}
              size="small"
            />
          </View>

          <View style={styles.eventDetails}>
            <View style={styles.eventDetail}>
              <Ionicons name="calendar" size={16} color={colors.primary} style={styles.eventIcon} />
              <Text style={styles.eventDetailText}>{event.date}</Text>
            </View>

            <View style={styles.eventDetail}>
              <Ionicons name="time" size={16} color={colors.primary} style={styles.eventIcon} />
              <Text style={styles.eventDetailText}>{event.time}</Text>
            </View>

            <View style={styles.eventDetail}>
              <Ionicons name="location" size={16} color={colors.primary} style={styles.eventIcon} />
              <Text style={styles.eventDetailText}>{event.location}</Text>
            </View>

            <View style={styles.eventDetail}>
              <Ionicons name="people" size={16} color={colors.primary} style={styles.eventIcon} />
              <Text style={styles.eventDetailText}>{event.attendees} attending</Text>
            </View>
          </View>

          <Text style={styles.eventDescription}>{event.description}</Text>

          <Text style={styles.eventOrganizer}>Organized by: {event.organizer}</Text>
        </Card>
      ))}
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingQuote type="farmer" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Farmer Network</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search groups, resources, events..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'groups' && styles.activeTab]}
          onPress={() => setActiveTab('groups')}
        >
          <Ionicons
            name="people"
            size={24}
            color={activeTab === 'groups' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'groups' && styles.activeTabText,
            ]}
          >
            Groups
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'resources' && styles.activeTab]}
          onPress={() => setActiveTab('resources')}
        >
          <Ionicons
            name="share"
            size={24}
            color={activeTab === 'resources' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'resources' && styles.activeTabText,
            ]}
          >
            Resources
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'events' && styles.activeTab]}
          onPress={() => setActiveTab('events')}
        >
          <Ionicons
            name="calendar"
            size={24}
            color={activeTab === 'events' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'events' && styles.activeTabText,
            ]}
          >
            Events
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.scrollContainer}>
        {activeTab === 'groups' && renderGroupsTab()}
        {activeTab === 'resources' && renderResourcesTab()}
        {activeTab === 'events' && renderEventsTab()}
      </ScrollView>

      {/* Join Group Modal */}
      <Modal
        visible={joinGroupModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setJoinGroupModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Join Group by Code</Text>
              <TouchableOpacity
                onPress={() => setJoinGroupModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Enter the group code shared with you to join a farmer or community group.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Group Code</Text>
              <TextInput
                style={styles.textInput}
                value={groupCodeInput}
                onChangeText={setGroupCodeInput}
                placeholder="Enter group code (e.g., FG0001)"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setJoinGroupModalVisible(false)}
                variant="outline"
                style={[styles.modalButton, { marginRight: spacing.sm }]}
              />
              <Button
                title="Join Group"
                onPress={handleJoinByCode}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Group Modal */}
      <Modal
        visible={createGroupModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCreateGroupModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Group</Text>
              <TouchableOpacity
                onPress={() => setCreateGroupModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Create a new farmer group to connect with others and share knowledge, resources, and support.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Group Name</Text>
              <TextInput
                style={styles.textInput}
                value={newGroupName}
                onChangeText={setNewGroupName}
                placeholder="Enter group name"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                value={newGroupDescription}
                onChangeText={setNewGroupDescription}
                placeholder="Describe the purpose of your group"
                multiline={true}
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tags (comma separated)</Text>
              <TextInput
                style={styles.textInput}
                value={newGroupTags}
                onChangeText={setNewGroupTags}
                placeholder="e.g., organic, wheat, punjab"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Group Logo</Text>
              <View style={styles.logoUploadContainer}>
                {groupLogo ? (
                  <View style={styles.logoPreviewContainer}>
                    <Image source={{ uri: groupLogo }} style={styles.logoPreview} />
                    <TouchableOpacity
                      style={styles.logoRemoveButton}
                      onPress={() => setGroupLogo('')}
                    >
                      <Ionicons name="close-circle" size={24} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.logoUploadButton}
                    onPress={handlePickGroupLogo}
                  >
                    <Ionicons name="image" size={24} color={colors.primary} />
                    <Text style={styles.logoUploadText}>Upload Logo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setCreateGroupModalVisible(false)}
                variant="outline"
                style={[styles.modalButton, { marginRight: spacing.sm }]}
              />
              <Button
                title="Create Group"
                onPress={handleCreateGroup}
                style={styles.modalButton}
              />
            </View>
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
  // Modal styles
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
    maxHeight: '80%',
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
  modalDescription: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  textAreaInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
  // Empty state styles
  emptyCard: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.md,
  },
  // Note card styles
  noteCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.primaryLight,
  },
  noteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
  },
  noteIcon: {
    marginRight: spacing.sm,
  },
  noteText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    lineHeight: typography.lineHeight.md,
  },
  // Group code style
  groupCode: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  // Group logo styles
  groupHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupInfo: {
    flex: 1,
  },
  groupLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  groupLogoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  // Logo upload styles
  logoUploadContainer: {
    marginTop: spacing.xs,
  },
  logoUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: borderRadius.md,
    borderStyle: 'dashed',
    backgroundColor: colors.surfaceLight,
  },
  logoUploadText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  logoPreviewContainer: {
    position: 'relative',
    alignSelf: 'center',
  },
  logoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  logoRemoveButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: colors.white,
    borderRadius: 15,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingHorizontal: spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    marginHorizontal: spacing.xs,
  },
  activeTab: {
    borderBottomColor: colors.primary,
    backgroundColor: colors.primaryLight,
    borderTopLeftRadius: borderRadius.sm,
    borderTopRightRadius: borderRadius.sm,
  },
  tabText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
  tabDescription: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    lineHeight: typography.lineHeight.md,
  },
  // Groups tab styles
  groupCard: {
    marginBottom: spacing.md,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  groupName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  groupMeta: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  joinButton: {
    minWidth: 80,
  },
  groupDescription: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    lineHeight: typography.lineHeight.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
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
  groupActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  groupActionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  buttonIcon: {
    marginRight: spacing.xs,
  },
  createButton: {
    marginTop: spacing.md,
  },
  // Discussions tab styles
  discussionCard: {
    marginBottom: spacing.md,
  },
  discussionContent: {
    padding: spacing.xs,
  },
  discussionTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  discussionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  discussionAuthor: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  discussionDate: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  discussionPreview: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: typography.lineHeight.md,
  },
  discussionStats: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  discussionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  discussionStatText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  // Resources tab styles
  resourceCard: {
    marginBottom: spacing.md,
  },
  resourceContent: {
    flexDirection: 'row',
  },
  resourceImage: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.sm,
  },
  resourceInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  resourceName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  resourceOwner: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  resourceLocation: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  resourceAvailability: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  resourceRate: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  bookButton: {
    alignSelf: 'flex-start',
  },
  // Events tab styles
  eventCard: {
    marginBottom: spacing.md,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  eventTitle: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginRight: spacing.md,
  },
  rsvpButton: {
    minWidth: 80,
  },
  eventDetails: {
    marginBottom: spacing.md,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  eventIcon: {
    marginRight: spacing.sm,
  },
  eventDetailText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  eventDescription: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    lineHeight: typography.lineHeight.md,
  },
  eventOrganizer: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
});

export default FarmerNetworkScreen;
