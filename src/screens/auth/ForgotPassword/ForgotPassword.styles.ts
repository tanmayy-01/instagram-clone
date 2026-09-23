import { FONT_SIZES, FONT_STYLES, FONT_WEIGHTS, LIGHT_COLORS } from '@/constants';
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
    height: '5%',
    justifyContent: 'center',
  },
  heading_text: {
    fontSize: FONT_SIZES.huge,
    fontFamily: FONT_STYLES.headline,
  },
  body: {
    marginTop: '8%',
  },
  body_text: {
     fontSize: FONT_SIZES.xl,
    fontFamily: FONT_STYLES.regular,
    fontWeight: FONT_WEIGHTS.medium,
  },
  body_text_container: {marginVertical:'5%'},
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
  send_text: {
    color: LIGHT_COLORS.white,
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_STYLES.medium,
    fontWeight: '600',
  },
    send_button: {
    width: '100%',
    height: 48,
    backgroundColor: LIGHT_COLORS.brandBlue,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 18,
  },
});
