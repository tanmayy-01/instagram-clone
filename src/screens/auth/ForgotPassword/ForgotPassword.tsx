import {
  View,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import React, { useState } from 'react';
import { styles } from './ForgotPassword.styles';
import { isIOS } from '@/utils';
import Icon from '@/components/Icon';
import { ICON_NAMES, LIGHT_COLORS } from '@/constants';
import * as Navigation from '@/utils';
import { showToast } from '@/components/toast';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  const isEmailValid = EMAIL_REGEX.test(email.trim());

  const handleGoBack = () => {
    Navigation.goBack();
  };

  const handleSendEmail = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      showToast('Please enter your email');
      return;
    }

    if (!EMAIL_REGEX.test(trimmed)) {
      showToast('Please enter a valid email address');
      return;
    }

    Keyboard.dismiss();
    showToast('Login code sent to your email');
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
                !email.trim().length && styles.send_button_disabled,
              ]}
              onPress={handleSendEmail}
              activeOpacity={0.8}
            >
              <Text style={styles.send_text}>Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default ForgotPassword;
