import { StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES, FONT_STYLES } from '../../constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  main_logo: {
    backgroundColor: '#000',
    width: '25%',
    height: '25%',
  },
  bottom_text: {
    fontFamily: FONT_STYLES.regular,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textSecondary,
  },
  bottom_container: {
    position: 'absolute',
    bottom: '15%',
  },
});
