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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { styles } from './Login.styles';
import { IMAGE_URLS, LIGHT_COLORS, SCREEN_NAMES } from '@/constants';
import { ICON_NAMES } from '@/constants/constants';
import Icon from '@/components/Icon';

const Login: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isIdentifierFocused, setIsIdentifierFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const isLoginEnabled =
    identifier.trim().length > 0 && password.trim().length > 0;

  const handleLogin = () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert(
        'Required Fields',
        'Please enter your username/email and password.',
      );
      return;
    }
    Keyboard.dismiss();
    Alert.alert('Login', `Attempting login for: ${identifier.trim()}`);
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'Password reset instructions have been triggered.',
    );
  };

  const handleCreateNewAccount = () => {
    navigation.navigate(SCREEN_NAMES.SIGNUP);
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

              {/* Email  Input */}
              <View style={styles.inputContainer}>
                <View
                  style={[
                    styles.inputWrapper,
                    isIdentifierFocused && styles.inputWrapperFocused,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="Username, email or mobile number"
                    placeholderTextColor={LIGHT_COLORS.placeholder}
                    value={identifier}
                    onChangeText={setIdentifier}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setIsIdentifierFocused(true)}
                    onBlur={() => setIsIdentifierFocused(false)}
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View
                  style={[
                    styles.inputWrapper,
                    isPasswordFocused && styles.inputWrapperFocused,
                  ]}
                >
                  <View style={styles.passwordInputRow}>
                    <TextInput
                      style={[styles.input, styles.passwordTextInput]}
                      placeholder="Password"
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
                    />
                    {password.length > 0 && (
                      <TouchableOpacity
                        style={styles.passwordToggle}
                        onPress={() => setShowPassword(!showPassword)}
                        activeOpacity={0.7}
                      >
                        <Icon
                          name={
                            showPassword ? ICON_NAMES.SHOW : ICON_NAMES.HIDE
                          }
                          color={LIGHT_COLORS.textSecondary}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              {/* Log in Button */}
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  !isLoginEnabled && styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>Log in</Text>
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
