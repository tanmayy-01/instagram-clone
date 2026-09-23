import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Navigation from '@/utils';
import { styles } from './Login.styles';
import { ICON_NAMES, IMAGE_URLS, LIGHT_COLORS, SCREEN_NAMES } from '@/constants';
import { showToast } from '@/components/toast';
import { loginUser } from '@/services/userService';

import Icon from '@/components/Icon';

const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isIdentifierFocused, setIsIdentifierFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const isLoginEnabled =
    identifier.trim().length > 0 && password.trim().length > 0;

  const handleLogin = async () => {
    const cleanId = identifier.trim();
    if (!cleanId || !password.trim()) {
      showToast('Please enter your username/email and password.');
      return;
    }
    Keyboard.dismiss();
    setLoading(true);
    try {
      const result = await loginUser(cleanId, password);
      if (result.success) {
        Navigation.resetAndNavigate(SCREEN_NAMES.HOME);
        setIdentifier('');
        setPassword('');
      } else {
        showToast('Wrong Credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Navigation.navigate(SCREEN_NAMES.FORGOT_PASSWORD);
  };

  const handleCreateNewAccount = () => {
    Navigation.navigate(SCREEN_NAMES.SIGNUP);
  };

  const handleLanguageSelect = () => {
    Alert.alert('Select Language', 'Language selector options');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topSection}>
              <TouchableOpacity
                style={styles.languageSelector}
                onPress={handleLanguageSelect}
                activeOpacity={0.7}
              >
                <Text style={styles.languageText}>English (US)</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.mainSection}>
              {/* Instagram Logo */}
              <Image
                source={IMAGE_URLS.instagram_logo}
                style={styles.instagramLogo}
                resizeMode="contain"
              />

              {/* Identifier Input */}
              <View style={styles.inputContainer}>
                <View
                  style={[
                    styles.inputCard,
                    isIdentifierFocused && styles.inputCardFocused,
                  ]}
                >
                  <View style={styles.inputInnerWrapper}>
                    {(isIdentifierFocused || identifier.length > 0) && (
                      <Text style={styles.inputLabel}>
                        Username or Email
                      </Text>
                    )}
                    <TextInput
                      style={styles.input}
                      placeholder={
                        isIdentifierFocused || identifier.length > 0
                          ? ''
                          : 'Username or Email '
                      }
                      placeholderTextColor={LIGHT_COLORS.placeholder}
                      value={identifier}
                      onChangeText={setIdentifier}
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setIsIdentifierFocused(true)}
                      onBlur={() => setIsIdentifierFocused(false)}
                      returnKeyType="next"
                      editable={!loading}
                    />
                  </View>
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
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
                      onSubmitEditing={handleLogin}
                      editable={!loading}
                    />
                  </View>
                  {password.length > 0 && (
                    <TouchableOpacity
                      style={styles.rightIconContainer}
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Icon
                        name={
                          showPassword ? ICON_NAMES.SHOW : ICON_NAMES.HIDE
                        }
                        size={22}
                        color={LIGHT_COLORS.textSecondary}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Log in Button */}
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  (!isLoginEnabled || loading) && styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={!isLoginEnabled || loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={LIGHT_COLORS.white} size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Log in</Text>
                )}
              </TouchableOpacity>

              {/* Forgot Password */}
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={handleForgotPassword}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Section: Create New Account & Meta Logo 2 */}
            <View style={styles.bottomSection}>
              <TouchableOpacity
                style={styles.createAccountButton}
                onPress={handleCreateNewAccount}
                activeOpacity={0.8}
              >
                <Text style={styles.createAccountButtonText}>
                  Create new account
                </Text>
              </TouchableOpacity>

              {/* Meta Logo 2 */}
              <Image
                source={IMAGE_URLS.meta_logo_2}
                style={styles.metaLogo}
                resizeMode="contain"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default Login;
