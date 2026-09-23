import {
  View,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import React, { useState } from 'react';
import { styles } from './ForgotPassword.styles';
import { isIOS } from '@/utils';
import Icon from '@/components/Icon';
import { ICON_NAMES, LIGHT_COLORS, SCREEN_NAMES } from '@/constants';
import * as Navigation from '@/utils';
import { showToast } from '@/components/toast';
import { sendPasswordReset } from '@/services/userService';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEmailValid = EMAIL_REGEX.test(email.trim());

  const handleGoBack = () => {
    Navigation.goBack();
  };

  const handleSendEmail = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      showToast('Please enter your email or username');
      return;
    }

    if (trimmed.includes('@') && !EMAIL_REGEX.test(trimmed)) {
      showToast('Please enter a valid email address');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    try {
      const res = await sendPasswordReset(trimmed);
      if (res.success) {
        setEmail('');
        setTimeout(() => {
          Navigation.navigate(SCREEN_NAMES.LOGIN);
        }, 1500);
      }
    } catch (err) {
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <KeyboardAvoidingView
          keyboardVerticalOffset={isIOS ? 10 : 0}
          behavior={isIOS ? 'padding' : undefined}
          style={styles.keyboardAvoid}
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

          {/* Body */}
          <View style={styles.body}>
            {/* Heading Text */}
            <Text style={styles.heading_text}>Find your account</Text>

            {/* Body Text */}
            <View style={styles.body_text_container}>
              <Text style={styles.body_text}>
                Enter your email address to find your account.
              </Text>
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
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
                    returnKeyType="done"
                    onSubmitEditing={handleSendEmail}
                    autoFocus={true}
                    editable={!loading}
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
            </View>

            {/* Send Button */}
            <TouchableOpacity
              style={[
                styles.send_button,
                (!email.trim().length || loading) && styles.send_button_disabled,
              ]}
              onPress={handleSendEmail}
              disabled={!email.trim().length || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={LIGHT_COLORS.white} size="small" />
              ) : (
                <Text style={styles.send_text}>Send login link</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default ForgotPassword;
