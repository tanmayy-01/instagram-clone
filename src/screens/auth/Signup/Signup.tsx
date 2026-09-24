import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Navigation from '@/utils';
import { isIOS } from '@/utils';
import Icon from '@/components/Icon';
import { EMAIL_REGEX, ICON_NAMES, LIGHT_COLORS, SCREEN_NAMES, USERNAME_REGEX } from '@/constants';
import { showToast } from '@/components/toast';
import { styles } from './Signup.styles';
import { registerNewUser } from '@/services/userService';
import { SignupStep } from '@/types/auth.types';



const Signup: React.FC = () => {
  const [step, setStep] = useState<SignupStep>('username');
  const [loading, setLoading] = useState<boolean>(false);

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberLoginInfo, setRememberLoginInfo] = useState(true);

  // Focus states
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const isUsernameValid = USERNAME_REGEX.test(username.trim());
  const isUsernameStepEnabled = username.trim().length > 0;

  const isEmailValid = EMAIL_REGEX.test(email.trim());
  const isEmailStepEnabled = email.trim().length > 0;

  const isPasswordStepEnabled = password.length >= 6;

  // Handle back navigation across steps
  const handleGoBack = () => {
    if (step === 'password') {
      setStep('email');
    } else if (step === 'email') {
      setStep('username');
    } else {
      Navigation.goBack();
    }
  };

  // Step 1: Validate and move to email step
  const handleNextFromUsername = () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      showToast('Please enter a username');
      return;
    }

    if (trimmedUsername.length < 3) {
      showToast('Username must be at least 3 characters');
      return;
    }

    if (!USERNAME_REGEX.test(trimmedUsername)) {
      showToast(
        'Username can only contain letters, numbers, periods, and underscores',
      );
      return;
    }

    Keyboard.dismiss();
    setStep('email');
  };

  // Step 2: Validate and move to password step
  const handleNextFromEmail = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      showToast('Please enter your email');
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      showToast('Please enter a valid email address');
      return;
    }

    Keyboard.dismiss();
    setStep('password');
  };

  // Step 3: Validate password and complete signup
  const handleNextFromPassword = async () => {
    if (!password) {
      showToast('Please enter a password');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters');
      return;
    }

    Keyboard.dismiss();

    if (!username || !email || !password) {
      showToast('Please fill out all input fields');
      return;
    }

    setLoading(true);
    try {
      const success = await registerNewUser({
        username: username.trim(),
        email: email.trim(),
        password,
      });

      if (success) {
        setUsername('');
        setEmail('');
        setPassword('');
        Navigation.resetAndNavigate(SCREEN_NAMES.HOME);
      }
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLearnMore = () => {
    Alert.alert(
      'Remember login info',
      'We will save your login information on this device so you won’t need to enter it next time you log in.',
    );
  };

  const handleGoToLogin = () => {
    Navigation.navigate(SCREEN_NAMES.LOGIN);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={isIOS ? 'padding' : undefined}
          keyboardVerticalOffset={isIOS ? 10 : 0}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleGoBack}
              style={styles.backButton}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Icon
                name={ICON_NAMES.BACK}
                size={26}
                color={LIGHT_COLORS.black}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Step 1: Username Input Step */}
            {step === 'username' && (
              <View style={styles.contentContainer}>
                {/* Title */}
                <Text style={styles.title}>Create a username</Text>

                {/* Subtitle */}
                <Text style={styles.subtitle}>
                  To begin creating an account, add a username or use our
                  suggestion. You can change this at any time.
                </Text>

                {/* Username Input Field */}
                <View
                  style={[
                    styles.inputCard,
                    isUsernameFocused && styles.inputCardFocused,
                  ]}
                >
                  <View style={styles.inputInnerWrapper}>
                    {(isUsernameFocused || username.length > 0) && (
                      <Text style={styles.inputLabel}>Username</Text>
                    )}
                    <TextInput
                      style={styles.input}
                      placeholder={
                        isUsernameFocused || username.length > 0
                          ? ''
                          : 'Username'
                      }
                      placeholderTextColor={LIGHT_COLORS.placeholder}
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setIsUsernameFocused(true)}
                      onBlur={() => setIsUsernameFocused(false)}
                      returnKeyType="next"
                      onSubmitEditing={handleNextFromUsername}
                      autoFocus={true}
                    />
                  </View>

                  {/* Valid Username Green Checkmark Icon */}
                  {isUsernameValid && (
                    <View style={styles.rightIconContainer}>
                      <Icon
                        name={ICON_NAMES.CHECKMARK_CIRCLE}
                        size={22}
                        color={LIGHT_COLORS.success}
                      />
                    </View>
                  )}
                </View>

                {/* Next Button */}
                <TouchableOpacity
                  style={[
                    styles.nextButton,
                    !isUsernameStepEnabled && styles.nextButtonDisabled,
                  ]}
                  onPress={handleNextFromUsername}
                  activeOpacity={0.8}
                >
                  <Text style={styles.nextButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 2: Email Input Step */}
            {step === 'email' && (
              <View style={styles.contentContainer}>
                {/* Title */}
                <Text style={styles.title}>What's your email?</Text>

                {/* Subtitle */}
                <Text style={styles.subtitle}>
                  Enter the email address where you can be contacted. No one
                  will see this on your profile.
                </Text>

                {/* Email Input Field */}
                <View
                  style={[
                    styles.inputCard,
                    isEmailFocused && styles.inputCardFocused,
                  ]}
                >
                  <View style={styles.inputInnerWrapper}>
                    {(isEmailFocused || email.length > 0) && (
                      <Text style={styles.inputLabel}>Email</Text>
                    )}
                    <TextInput
                      style={styles.input}
                      placeholder={
                        isEmailFocused || email.length > 0 ? '' : 'Email'
                      }
                      placeholderTextColor={LIGHT_COLORS.placeholder}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setIsEmailFocused(true)}
                      onBlur={() => setIsEmailFocused(false)}
                      returnKeyType="next"
                      onSubmitEditing={handleNextFromEmail}
                      autoFocus={true}
                    />
                  </View>

                  {/* Valid Email Green Checkmark Icon */}
                  {isEmailValid && (
                    <View style={styles.rightIconContainer}>
                      <Icon
                        name={ICON_NAMES.CHECKMARK_CIRCLE}
                        size={22}
                        color={LIGHT_COLORS.success}
                      />
                    </View>
                  )}
                </View>

                {/* Next Button */}
                <TouchableOpacity
                  style={[
                    styles.nextButton,
                    !isEmailStepEnabled && styles.nextButtonDisabled,
                  ]}
                  onPress={handleNextFromEmail}
                  activeOpacity={0.8}
                >
                  <Text style={styles.nextButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 3: Password Input Step */}
            {step === 'password' && (
              <View style={styles.contentContainer}>
                {/* Title */}
                <Text style={styles.title}>Create a password</Text>

                {/* Subtitle */}
                <Text style={styles.subtitle}>
                  Create a password with at least 6 letters or numbers. It
                  should be something others can't guess.
                </Text>

                {/* Password Input Field */}
                <View
                  style={[
                    styles.inputCard,
                    isPasswordFocused && styles.inputCardFocused,
                  ]}
                >
                  <View style={styles.inputInnerWrapper}>
                    {(isPasswordFocused || password.length > 0) && (
                      <Text style={styles.inputLabel}>Password</Text>
                    )}
                    <TextInput
                      style={styles.input}
                      placeholder={
                        isPasswordFocused || password.length > 0
                          ? ''
                          : 'Password'
                      }
                      placeholderTextColor={LIGHT_COLORS.placeholder}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                      returnKeyType="done"
                      onSubmitEditing={handleNextFromPassword}
                      autoFocus={true}
                    />
                  </View>

                  {/* Show/Hide Password Eye Icon */}
                  {password.length > 0 && (
                    <TouchableOpacity
                      style={styles.rightIconContainer}
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Icon
                        name={showPassword ? ICON_NAMES.SHOW : ICON_NAMES.HIDE}
                        size={22}
                        color={LIGHT_COLORS.textSecondary}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Remember Login Info Row */}
                <View style={styles.rememberContainer}>
                  <TouchableOpacity
                    style={styles.checkboxTouchable}
                    onPress={() => setRememberLoginInfo(!rememberLoginInfo)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.checkboxIcon}>
                      <Icon
                        name={
                          rememberLoginInfo
                            ? ICON_NAMES.CHECKBOX
                            : ICON_NAMES.CHECKBOX_OUTLINE
                        }
                        size={22}
                        color={
                          rememberLoginInfo
                            ? LIGHT_COLORS.brandBlue
                            : LIGHT_COLORS.textSecondary
                        }
                      />
                    </View>
                    <Text style={styles.rememberText}>
                      Remember login info.{' '}
                      <Text
                        style={styles.learnMoreText}
                        onPress={handleLearnMore}
                      >
                        Learn more
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </View>
                {/* Next Button */}
                <TouchableOpacity
                  style={[
                    styles.nextButton,
                    (!isPasswordStepEnabled || loading) &&
                      styles.nextButtonDisabled,
                  ]}
                  onPress={handleNextFromPassword}
                  disabled={!isPasswordStepEnabled || loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator
                      size="small"
                      color={LIGHT_COLORS.white}
                    />
                  ) : (
                    <Text style={styles.nextButtonText}>Next</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Bottom Section: Already have an account */}
            <View style={styles.bottomSection}>
              <TouchableOpacity
                style={styles.alreadyAccountButton}
                onPress={handleGoToLogin}
                activeOpacity={0.7}
              >
                <Text style={styles.alreadyAccountText}>
                  Already have an account?{' '}
                  <Text style={styles.loginLinkText}>Log in</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default Signup;
