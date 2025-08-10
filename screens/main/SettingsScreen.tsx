import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Platform,
  Image,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage, Language } from '../../context/LanguageContext';
import { spacing, typography, borderRadius } from '../../theme';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { getPlatformTopSpacing } from '../../utils/platformUtils';
import WalletService from '../../services/WalletService';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { user, userProfile, logOut, updateUserProfile } = useAuth();
  const { isDarkMode, toggleDarkMode, colors } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [heldBalance, setHeldBalance] = useState<number | null>(null);
  const [pendingEarnings, setPendingEarnings] = useState<number | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);

  // Create styles with the current theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      ...getPlatformTopSpacing('paddingTop', spacing.md, spacing.xl),
      paddingBottom: spacing.md,
      backgroundColor: colors.white,
      borderBottomWidth: 1,
      borderBottomColor: colors.lightGray,
    },
    title: {
      fontSize: typography.fontSize.xl,
      fontFamily: typography.fontFamily.bold,
      color: colors.textPrimary,
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.md,
    },
    section: {
      marginBottom: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.white,
    },
    sectionTitle: {
      fontSize: typography.fontSize.md,
      fontFamily: typography.fontFamily.bold,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    profileInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.lightGray,
    },
    profileImage: {
      width: 70,
      height: 70,
      borderRadius: 35,
      marginRight: spacing.md,
    },
    profileImagePlaceholder: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: colors.surfaceLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    profileDetails: {
      flex: 1,
    },
    profileName: {
      fontSize: typography.fontSize.md,
      fontFamily: typography.fontFamily.bold,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    profileUsername: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.regular,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    profileRole: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.medium,
      color: colors.primary,
      textTransform: 'capitalize',
    },
    balanceText: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.medium,
      color: colors.success,
      marginTop: spacing.xs,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.lightGray,
    },
    settingItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    settingItemText: {
      fontSize: typography.fontSize.md,
      fontFamily: typography.fontFamily.regular,
      color: colors.textPrimary,
      marginLeft: spacing.md,
    },
    settingItemRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    settingItemValue: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.regular,
      color: colors.textSecondary,
      marginRight: spacing.sm,
    },
    logoutButton: {
      marginTop: spacing.md,
      marginBottom: spacing.xl,
      borderColor: colors.danger,
    },
    logoutButtonText: {
      color: colors.danger,
    },
    walletCard: {
      marginBottom: spacing.md,
      padding: spacing.lg,
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.veryLightGray,
      ...Platform.select({
        ios: {
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    walletHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.veryLightGray,
    },
    walletIcon: {
      marginRight: spacing.sm,
      backgroundColor: colors.primaryLight,
      padding: spacing.sm,
      borderRadius: borderRadius.round,
    },
    walletTitle: {
      fontSize: typography.fontSize.lg,
      fontFamily: typography.fontFamily.bold,
      color: colors.textPrimary,
    },
    walletBalance: {
      fontSize: typography.fontSize.xxl,
      fontFamily: typography.fontFamily.bold,
      color: colors.textPrimary,
      marginVertical: spacing.md,
      textAlign: 'center',
    },
    walletBalanceSmall: {
      fontSize: typography.fontSize.lg,
      fontFamily: typography.fontFamily.bold,
      textAlign: 'center',
    },
    walletButtonsContainer: {
      marginTop: spacing.md,
    },
    walletButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.lightGray,
    },
    walletButtonLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    walletButtonIcon: {
      marginRight: spacing.sm,
    },
    walletButtonText: {
      fontSize: typography.fontSize.md,
      fontFamily: typography.fontFamily.regular,
      color: colors.textPrimary,
      marginLeft: spacing.md,
    },
  });

  // Load user preferences from AsyncStorage
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const storedPreferences = await AsyncStorage.getItem('userPreferences');
        if (storedPreferences) {
          const preferences = JSON.parse(storedPreferences);
          setNotifications(preferences.notifications ?? true);
          setLocationServices(preferences.locationServices ?? true);
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    };

    loadUserPreferences();
  }, []);

  // Load wallet balance
  useEffect(() => {
    const loadWalletBalance = async () => {
      if (!user) return;

      try {
        setLoadingWallet(true);
        const balance = await WalletService.getBalance(user.uid);
        const available = await WalletService.getAvailableBalance(user.uid);
        const held = await WalletService.getHeldBalance(user.uid);

        // Get pending earnings (for farmers)
        let pending = 0;
        if (userProfile?.role === 'farmer') {
          pending = await WalletService.getPendingEarnings(user.uid);
        }

        setWalletBalance(balance);
        setAvailableBalance(available);
        setHeldBalance(held);
        setPendingEarnings(pending);
      } catch (error) {
        console.error('Error loading wallet balance:', error);
        Alert.alert('Error', 'Failed to load wallet balance');
      } finally {
        setLoadingWallet(false);
      }
    };

    loadWalletBalance();
  }, [user]);

  // Save user preferences to AsyncStorage
  const saveUserPreferences = async (key: string, value: any) => {
    try {
      const storedPreferences = await AsyncStorage.getItem('userPreferences');
      const preferences = storedPreferences ? JSON.parse(storedPreferences) : {};

      preferences[key] = value;
      await AsyncStorage.setItem('userPreferences', JSON.stringify(preferences));
    } catch (error) {
      console.error(`Error saving ${key} preference:`, error);
    }
  };

  // Handle notifications toggle
  const handleNotificationsToggle = (value: boolean) => {
    setNotifications(value);
    saveUserPreferences('notifications', value);
  };

  // Handle location services toggle
  const handleLocationServicesToggle = (value: boolean) => {
    setLocationServices(value);
    saveUserPreferences('locationServices', value);
  };

  // Handle dark mode toggle
  const handleDarkModeToggle = () => {
    toggleDarkMode();
  };

  // Handle language selection
  const handleLanguageSelect = () => {
    const languageOptions = availableLanguages.map(lang => ({
      text: lang,
      onPress: () => {
        setLanguage(lang);
      }
    }));

    Alert.alert(
      t('language'),
      t('chooseLanguage') || 'Choose your preferred language',
      [
        ...languageOptions,
        { text: t('cancel') || 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  // Handle edit profile
  const handleEditProfile = () => {
    navigation.navigate('EditProfile' as never);
  };

  // Handle help & support
  const handleHelpSupport = () => {
    Alert.alert(
      'Contact Support',
      'How would you like to contact our support team?',
      [
        {
          text: 'Email',
          onPress: () => {
            Linking.openURL('mailto:support@ankrishi.com');
          },
        },
        {
          text: 'Phone',
          onPress: () => {
            Linking.openURL('tel:+918000000000');
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  // Handle support center
  const handleSupportCenter = () => {
    navigation.navigate('SupportMain' as never);
  };

  // Handle terms & conditions
  const handleTermsConditions = () => {
    Alert.alert(
      'Terms & Conditions',
      'ankrishi Terms of Service\n\n' +
      'By using the ankrishi app, you agree to our terms of service which include fair usage policies, data privacy, and marketplace rules. For the complete terms, please visit our website.',
      [{ text: 'OK' }]
    );
  };

  // Handle privacy policy
  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'ankrishi Privacy Policy\n\n' +
      'We collect and process your data to provide our services. This includes location data, profile information, and usage statistics. We never sell your personal data to third parties. For the complete privacy policy, please visit our website.',
      [{ text: 'OK' }]
    );
  };

  // Handle about
  const handleAbout = () => {
    Alert.alert(
      'About ankrishi',
      `ankrishi\nVersion ${appVersion}\n\n` +
      'ankrishi is a platform designed to empower farmers by connecting them directly with buyers, providing access to resources, and offering AI-powered insights to improve farming practices and financial stability.',
      [{ text: 'OK' }]
    );
  };

  // Handle app guide
  const handleAppGuide = () => {
    navigation.navigate('AppGuide' as never);
  };

  // Handle wallet navigation
  const handleShowTransactions = () => {
    navigation.navigate('ShowAllTransaction' as never);
  };

  const handleAddBalance = () => {
    navigation.navigate('AddBalance' as never);
  };

  const handleWithdrawMoney = () => {
    navigation.navigate('WithdrawMoney' as never);
  };

  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await logOut();
            } catch (error: any) {
              Alert.alert('Logout Failed', error.message);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };



  // Render user profile section
  const renderProfileSection = () => {
    return (
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>

        <View style={styles.profileInfo}>
          {userProfile?.photoURL ? (
            <Image
              source={{ uri: userProfile.photoURL }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={40} color={colors.mediumGray} />
            </View>
          )}

          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>{userProfile?.displayName || 'User'}</Text>
            <Text style={styles.profileUsername}>@{userProfile?.username || 'username'}</Text>
            <Text style={styles.profileRole}>
              {userProfile?.role ? userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1) : 'User'}
            </Text>
            {walletBalance !== null && (
              <Text style={styles.balanceText}>
                Balance: ₹{walletBalance.toFixed(2)}
                {heldBalance !== null && heldBalance > 0 ? ` (₹${heldBalance.toFixed(2)} on hold)` : ''}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.settingItem} onPress={handleEditProfile}>
          <View style={styles.settingItemLeft}>
            <Ionicons name="person-outline" size={24} color={colors.primary} />
            <Text style={styles.settingItemText}>Edit Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.mediumGray} />
        </TouchableOpacity>
      </Card>
    );
  };

  // Render app settings section
  const renderAppSettings = () => {
    return (
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingItemLeft}>
            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
            <Text style={styles.settingItemText}>Notifications</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={handleNotificationsToggle}
            trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
            thumbColor={notifications ? colors.primary : colors.mediumGray}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingItemLeft}>
            <Ionicons name="location-outline" size={24} color={colors.primary} />
            <Text style={styles.settingItemText}>Location Services</Text>
          </View>
          <Switch
            value={locationServices}
            onValueChange={handleLocationServicesToggle}
            trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
            thumbColor={locationServices ? colors.primary : colors.mediumGray}
          />
        </View>

        {/* Dark Mode toggle disabled
        <View style={styles.settingItem}>
          <View style={styles.settingItemLeft}>
            <Ionicons name="moon-outline" size={24} color={colors.primary} />
            <Text style={styles.settingItemText}>Dark Mode</Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={handleDarkModeToggle}
            trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
            thumbColor={isDarkMode ? colors.primary : colors.mediumGray}
          />
        </View>
        */}

        {/* Language selection disabled
        <TouchableOpacity style={styles.settingItem} onPress={handleLanguageSelect}>
          <View style={styles.settingItemLeft}>
            <Ionicons name="language-outline" size={24} color={colors.primary} />
            <Text style={styles.settingItemText}>Language</Text>
          </View>
          <View style={styles.settingItemRight}>
            <Text style={styles.settingItemValue}>{language}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.mediumGray} />
          </View>
        </TouchableOpacity>
        */}
      </Card>
    );
  };

  // Render wallet section
  const renderWalletSection = () => {
    return (
      <Card style={styles.walletCard}>
        <View style={styles.walletHeader}>
          <View style={styles.walletIcon}>
            <Ionicons name="wallet-outline" size={24} color={colors.primary} />
          </View>
          <Text style={styles.walletTitle}>Ankrishi-Wallet</Text>
        </View>

        <View style={{ alignItems: 'center' }}>
          {loadingWallet ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={{width: '100%'}}>
              <View style={{alignItems: 'center', marginBottom: spacing.sm}}>
                <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs }}>Total Balance</Text>
                <Text style={styles.walletBalance}>₹{walletBalance !== null ? walletBalance.toFixed(2) : '0.00'}</Text>
              </View>

              <View style={{flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.md}}>
                <View style={{alignItems: 'center'}}>
                  <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs }}>Available</Text>
                  <Text style={[styles.walletBalanceSmall, {color: colors.success}]}>₹{availableBalance !== null ? availableBalance.toFixed(2) : '0.00'}</Text>
                </View>

                <View style={{alignItems: 'center'}}>
                  <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs }}>On Hold</Text>
                  <Text style={[styles.walletBalanceSmall, {color: colors.warning}]}>₹{heldBalance !== null ? heldBalance.toFixed(2) : '0.00'}</Text>
                </View>

                {userProfile?.role === 'farmer' && pendingEarnings !== null && pendingEarnings > 0 && (
                  <View style={{alignItems: 'center'}}>
                    <Text style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs }}>Pending</Text>
                    <Text style={[styles.walletBalanceSmall, {color: '#9C27B0'}]}>₹{pendingEarnings.toFixed(2)}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        <View style={styles.walletButtonsContainer}>
          <TouchableOpacity style={styles.walletButton} onPress={handleShowTransactions}>
            <View style={styles.walletButtonLeft}>
              <Ionicons name="list-outline" size={24} color={colors.primary} />
              <Text style={styles.walletButtonText}>Show All Transactions</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.mediumGray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.walletButton} onPress={handleAddBalance}>
            <View style={styles.walletButtonLeft}>
              <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
              <Text style={styles.walletButtonText}>Add Balance</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.mediumGray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.walletButton} onPress={handleWithdrawMoney}>
            <View style={styles.walletButtonLeft}>
              <Ionicons name="arrow-down-outline" size={24} color={colors.primary} />
              <Text style={styles.walletButtonText}>Withdraw Money</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.mediumGray} />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  // Render support section
  const renderSupportSection = () => {
    return (
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>

        <TouchableOpacity style={styles.settingItem} onPress={handleSupportCenter}>
          <View style={styles.settingItemLeft}>
            <Ionicons name="help-buoy" size={24} color={colors.primary} />
            <Text style={styles.settingItemText}>Support Center</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.mediumGray} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleHelpSupport}>
          <View style={styles.settingItemLeft}>
            <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.settingItemText}>Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.mediumGray} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleTermsConditions}>
          <View style={styles.settingItemLeft}>
            <Ionicons name="document-text-outline" size={24} color={colors.primary} />
            <Text style={styles.settingItemText}>Terms & Conditions</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.mediumGray} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyPolicy}>
          <View style={styles.settingItemLeft}>
            <Ionicons name="shield-outline" size={24} color={colors.primary} />
            <Text style={styles.settingItemText}>Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.mediumGray} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleAbout}>
          <View style={styles.settingItemLeft}>
            <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.settingItemText}>About</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.mediumGray} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleAppGuide}>
          <View style={styles.settingItemLeft}>
            <Ionicons name="book-outline" size={24} color={colors.primary} />
            <Text style={styles.settingItemText}>App Guide</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.mediumGray} />
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderProfileSection()}
        {renderWalletSection()}
        {renderAppSettings()}
        {renderSupportSection()}

        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
          leftIcon={<Ionicons name="log-out-outline" size={20} color={colors.danger} />}
          textStyle={styles.logoutButtonText}
        />
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;
