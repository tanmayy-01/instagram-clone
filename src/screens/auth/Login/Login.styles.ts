import { StyleSheet, Platform } from 'react-native';
import { LIGHT_COLORS, FONT_SIZES, FONT_STYLES, FONT_WEIGHTS } from '../../../constants';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 16,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 8,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  languageText: {
    fontSize: FONT_SIZES.sm,
    color: LIGHT_COLORS.textSecondary,
    fontFamily: FONT_STYLES.regular,
  },
  mainSection: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  instagramLogo: {
    width: '25%',
    height: '25%',
    marginBottom: 44,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 12,
  },
  inputWrapper: {
    width: '100%',
    height: 52,
    backgroundColor: LIGHT_COLORS.inputBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.inputBorder,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  inputWrapperFocused: {
    borderColor: LIGHT_COLORS.inputBorderFocused,
    backgroundColor: LIGHT_COLORS.white,
  },
  input: {
    fontSize: FONT_SIZES.sm,
    color: LIGHT_COLORS.textPrimary,
    fontFamily: FONT_STYLES.regular,
    paddingVertical: 0,
  },
  passwordInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordTextInput: {
    flex: 1,
  },
  passwordToggle: {
    paddingLeft: 10,
    paddingVertical: 4,
  },
  passwordToggleText: {
    fontSize: FONT_SIZES.xs,
    color: LIGHT_COLORS.textSecondary,
    fontFamily: FONT_STYLES.medium,
  },
  loginButton: {
    width: '100%',
    height: 48,
    backgroundColor: LIGHT_COLORS.brandBlue,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 18,
  },
  loginButtonDisabled: {
    opacity: 0.65,
  },
  loginButtonText: {
    color: LIGHT_COLORS.white,
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_STYLES.medium,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  forgotPasswordText: {
    color: LIGHT_COLORS.textPrimary,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_STYLES.medium,
    fontWeight: '600',
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 8,
  },
  createAccountButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: LIGHT_COLORS.brandBlue,
    backgroundColor: LIGHT_COLORS.transparent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  createAccountButtonText: {
    color: LIGHT_COLORS.brandBlue,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_STYLES.medium,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  metaLogo: {
    width: 82,
    height: 17,
  },
});