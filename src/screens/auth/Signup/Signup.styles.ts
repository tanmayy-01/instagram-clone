import { StyleSheet } from 'react-native';
import {
  FONT_SIZES,
  FONT_STYLES,
  FONT_WEIGHTS,
  LIGHT_COLORS,
} from '@/constants';
import { isIOS } from '@/utils';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.background,
    paddingHorizontal: 20,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  header: {
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 10,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONT_STYLES.bold,
    fontWeight: FONT_WEIGHTS.bold,
    color: LIGHT_COLORS.textPrimary,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_STYLES.regular,
    color: LIGHT_COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  inputCard: {
    width: '100%',
    minHeight: 56,
    backgroundColor: LIGHT_COLORS.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: LIGHT_COLORS.inputBorder,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputCardFocused: {
    borderColor: LIGHT_COLORS.inputBorderFocused,
  },
  inputInnerWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONT_STYLES.regular,
    color: LIGHT_COLORS.textSecondary,
    marginBottom: 2,
  },
  input: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_STYLES.regular,
    color: LIGHT_COLORS.textPrimary,
    paddingVertical: isIOS ? 2 : 0,
    paddingHorizontal: 0,
  },
  rightIconContainer: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  checkboxTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxIcon: {
    marginRight: 10,
  },
  rememberText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_STYLES.regular,
    color: LIGHT_COLORS.textPrimary,
  },
  learnMoreText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_STYLES.medium,
    fontWeight: FONT_WEIGHTS.semibold,
    color: LIGHT_COLORS.brandBlue,
  },
  nextButton: {
    width: '100%',
    height: 48,
    backgroundColor: LIGHT_COLORS.brandBlue,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  nextButtonDisabled: {
    opacity: 0.65,
  },
  nextButtonText: {
    color: LIGHT_COLORS.white,
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_STYLES.medium,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  bottomSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  alreadyAccountButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  alreadyAccountText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_STYLES.regular,
    color: LIGHT_COLORS.textSecondary,
  },
  loginLinkText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_STYLES.medium,
    fontWeight: FONT_WEIGHTS.semibold,
    color: LIGHT_COLORS.brandBlue,
  },
});
