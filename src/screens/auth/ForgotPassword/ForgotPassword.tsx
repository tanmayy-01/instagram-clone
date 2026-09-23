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

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const handleGoBack = () => {
    Navigation.goBack();
  };
  const handleSendEmail = () => {
    // perform send email logic

    if(!email.trim().length){
      showToast('Enter Email ');
      return 
    }
  };
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <KeyboardAvoidingView
          keyboardVerticalOffset={isIOS ? 10 : 0}
          behavior={isIOS ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleGoBack}>
              <Icon name={ICON_NAMES.BACK} color={LIGHT_COLORS.black} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.body}>
            {/* Heading Text */}
            <View>
              <Text style={styles.heading_text}>Find your account</Text>
            </View>

            {/* Body Text */}
            <View style={styles.body_text_container}>
              <Text style={styles.body_text}>Enter your email.</Text>
            </View>

            {/* Email Input */}
            <View>
              <View style={styles.inputContainer}>
                <View
                  style={[
                    styles.inputWrapper,
                    isEmailFocused && styles.inputWrapperFocused,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={LIGHT_COLORS.placeholder}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                    returnKeyType="next"
                  />
                </View>
              </View>
            </View>

            {/* Send Button */}
            <TouchableOpacity
              style={[styles.send_button]}
              onPress={handleSendEmail}
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
