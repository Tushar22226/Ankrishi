import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import GradientBackground from '../../components/GradientBackground';
import SocialButton from '../../components/SocialButton';
import { getPlatformTopSpacing } from '../../utils/platformUtils';

const LoginScreen = () => {
  const navigation = useNavigation();
  const { signInWithEmail } = useAuth();

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const { width } = Dimensions.get('window');

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Form validation
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    phoneNumber: '',
    verificationCode: '',
  });

  // Run animations when component mounts
  useEffect(() => {
    // Only run animations on iOS and web, not on Android
    if (Platform.OS !== 'android') {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: Platform.OS === 'ios',
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: Platform.OS === 'ios',
        }),
      ]).start();
    } else {
      // For Android, just set the final values without animation
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
    }
  }, []);

  // Handle email login
  const handleEmailLogin = async () => {
    // Validate form
    let isValid = true;
    const newErrors = { ...errors };

    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    } else {
      newErrors.email = '';
    }

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    } else {
      newErrors.password = '';
    }

    setErrors(newErrors);

    if (!isValid) return;

    // Submit form
    setLoading(true);

    try {
      await signInWithEmail(email, password);
      // Navigation is handled by the auth context
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle phone login
  const handleSendVerification = () => {
    // Validate phone number
    if (!phoneNumber) {
      setErrors({
        ...errors,
        phoneNumber: 'Phone number is required',
      });
      return;
    }

    // In a real app, this would send a verification code
    // For now, just simulate it
    setVerificationSent(true);
    Alert.alert('Verification Code Sent', 'A verification code has been sent to your phone number.');
  };

  const handlePhoneLogin = () => {
    // Validate verification code
    if (!verificationCode) {
      setErrors({
        ...errors,
        verificationCode: 'Verification code is required',
      });
      return;
    }

    // In a real app, this would verify the code and sign in
    // For now, just simulate it
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      Alert.alert('Login Failed', 'This feature is not implemented yet.');
    }, 1000);
  };

  // No longer needed as we use the tab buttons directly

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Welcome to FarmConnect</Text>
            <Text style={styles.subtitle}>Login to continue</Text>
          </Animated.View>

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              width: '100%'
            }}
          >
            <Card style={styles.card} elevation="high">
              <View style={styles.methodToggle}>
                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    loginMethod === 'email' && styles.activeMethodButton,
                  ]}
                  onPress={() => setLoginMethod('email')}
                >
                  <Ionicons
                    name="mail"
                    size={20}
                    color={loginMethod === 'email' ? colors.white : colors.mediumGray}
                  />
                  <Text
                    style={[
                      styles.methodButtonText,
                      loginMethod === 'email' && styles.activeMethodButtonText,
                    ]}
                  >
                    Email
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    loginMethod === 'phone' && styles.activeMethodButton,
                  ]}
                  onPress={() => setLoginMethod('phone')}
                >
                  <Ionicons
                    name="phone-portrait"
                    size={20}
                    color={loginMethod === 'phone' ? colors.white : colors.mediumGray}
                  />
                  <Text
                    style={[
                      styles.methodButtonText,
                      loginMethod === 'phone' && styles.activeMethodButtonText,
                    ]}
                  >
                    Phone
                  </Text>
                </TouchableOpacity>
              </View>

              {loginMethod === 'email' ? (
                <View style={styles.formContainer}>
                  <Input
                    label="Email"
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={errors.email}
                    touched={true}
                    leftIcon={<Ionicons name="mail-outline" size={20} color={colors.mediumGray} />}
                  />

                  <Input
                    label="Password"
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    error={errors.password}
                    touched={true}
                    leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.mediumGray} />}
                    isPassword
                  />

                  <View style={styles.optionsRow}>
                    <TouchableOpacity
                      style={styles.rememberMeContainer}
                      onPress={() => setRememberMe(!rememberMe)}
                    >
                      <View style={[
                        styles.checkbox,
                        rememberMe && styles.checkboxChecked
                      ]}>
                        {rememberMe && (
                          <Ionicons name="checkmark" size={14} color={colors.white} />
                        )}
                      </View>
                      <Text style={styles.rememberMeText}>Remember me</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.forgotPassword}>
                      <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>
                  </View>

                  <Button
                    title="Login"
                    onPress={handleEmailLogin}
                    loading={loading}
                    fullWidth
                    size="large"
                  />
                </View>
              ) : (
                <View style={styles.formContainer}>
                  {!verificationSent ? (
                    <>
                      <Input
                        label="Phone Number"
                        placeholder="Enter your phone number"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        error={errors.phoneNumber}
                        touched={true}
                        leftIcon={<Ionicons name="call-outline" size={20} color={colors.mediumGray} />}
                      />

                      <Button
                        title="Send Verification Code"
                        onPress={handleSendVerification}
                        fullWidth
                        size="large"
                      />
                    </>
                  ) : (
                    <>
                      <Input
                        label="Verification Code"
                        placeholder="Enter verification code"
                        value={verificationCode}
                        onChangeText={setVerificationCode}
                        keyboardType="number-pad"
                        error={errors.verificationCode}
                        touched={true}
                        leftIcon={<Ionicons name="key-outline" size={20} color={colors.mediumGray} />}
                      />

                      <Button
                        title="Verify & Login"
                        onPress={handlePhoneLogin}
                        loading={loading}
                        fullWidth
                        size="large"
                      />

                      <TouchableOpacity
                        style={styles.resendCode}
                        onPress={handleSendVerification}
                      >
                        <Text style={styles.resendCodeText}>Resend Code</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.divider} />
              </View>

              <View style={styles.socialButtonsContainer}>
                <SocialButton
                  icon={<FontAwesome name="google" size={20} color="#DB4437" />}
                  style={styles.socialButton}
                  onPress={() => Alert.alert('Info', 'Google login not implemented yet')}
                />
                <SocialButton
                  icon={<FontAwesome name="facebook" size={20} color="#4267B2" />}
                  style={styles.socialButton}
                  onPress={() => Alert.alert('Info', 'Facebook login not implemented yet')}
                />
                <SocialButton
                  icon={<FontAwesome name="apple" size={20} color="#000000" />}
                  style={styles.socialButton}
                  onPress={() => Alert.alert('Info', 'Apple login not implemented yet')}
                />
              </View>
            </Card>
          </Animated.View>

          <Animated.View
            style={[
              styles.footer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Signup' as never)}
            >
              <Text style={styles.signupText}>Sign Up</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    ...getPlatformTopSpacing('paddingTop', spacing.xl * 1.5, spacing.xl * 2.5),
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: spacing.md,
    borderRadius: 50,
    ...shadows.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
    marginBottom: spacing.xs,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  card: {
    marginBottom: spacing.xl,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm, // Reduced vertical padding
    paddingHorizontal: 0, // No horizontal padding
  },
  methodToggle: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginHorizontal: spacing.md,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  activeMethodButton: {
    backgroundColor: colors.primary,
  },
  methodButtonText: {
    marginLeft: spacing.xs,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.mediumGray,
  },
  activeMethodButtonText: {
    color: colors.white,
  },
  formContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs, // Reduced gap between form elements
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.mediumGray,
    marginRight: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rememberMeText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  resendCode: {
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  resendCodeText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.lightGray,
  },
  dividerText: {
    marginHorizontal: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  socialButton: {
    marginHorizontal: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  footerText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.white,
    marginRight: spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  signupText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  activeTab: {
    backgroundColor: colors.primaryLight,
  },
  tabText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
  },
});

export default LoginScreen;
