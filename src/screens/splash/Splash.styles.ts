import { StyleSheet } from 'react-native';
import { LIGHT_COLORS, FONT_SIZES, FONT_STYLES } from '../../constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LIGHT_COLORS.background,
  },
  main_logo: {
    width: '25%',
    height: '25%',
  },
  bottom_text: {
    fontFamily: FONT_STYLES.regular,
    fontSize: FONT_SIZES.xl,
    color: LIGHT_COLORS.textPrimary,
    textAlign:'center'
  },
  bottom_container: {
    position: 'absolute',
    bottom: '10%',
  },
  meta_logo: {
    width: 100,
    height: 30,
  },
});
