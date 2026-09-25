import { FONT_SIZES, FONT_STYLES, FONT_WEIGHTS, LIGHT_COLORS } from '@/constants';
import { isIOS } from '@/utils';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.background,
    paddingHorizontal: 20,
  },
  keyboardAvoid: {
    flex: 1,
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
  heading_text: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONT_STYLES.bold,
    fontWeight: FONT_WEIGHTS.bold,
    color: LIGHT_COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  body: {
    flex: 1,
    paddingTop: 10,
  },
  body_text_container: {
    marginTop: 8,
    marginBottom: 24,
  },
  body_text: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_STYLES.regular,
    color: LIGHT_COLORS.textSecondary,
    lineHeight: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
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
  send_button: {
    width: '100%',
    height: 48,
    backgroundColor: LIGHT_COLORS.brandBlue,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 18,
  },
  send_button_disabled: {
    opacity: 0.65,
  },
  send_text: {
    color: LIGHT_COLORS.white,
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_STYLES.medium,
    fontWeight: FONT_WEIGHTS.semibold,
  },
});
