import { StyleSheet } from 'react-native';
import { FONT_SIZES, FONT_STYLES, FONT_WEIGHTS, LIGHT_COLORS } from '@/constants';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.white,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: LIGHT_COLORS.white,
    borderBottomWidth: 0.5,
    borderBottomColor: LIGHT_COLORS.bg_1,
  },
  headerLeft: {
    padding: 2,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instagramLogoText: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONT_STYLES.headline,
    color: LIGHT_COLORS.black,
    letterSpacing: -0.5,
  },
  headerChevron: {
    marginLeft: 4,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    padding: 2,
  },

  // Feed list
  feedList: {
    backgroundColor: LIGHT_COLORS.white,
  },
  feedListContent: {
    paddingBottom: 24,
  },

  // Loading container
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: FONT_SIZES.sm,
    color: LIGHT_COLORS.textSecondary,
  },
  emptyFeedContainer: {
    paddingVertical: 60,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFeedIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: LIGHT_COLORS.border_1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyFeedTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: LIGHT_COLORS.black,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyFeedSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: LIGHT_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyFeedButton: {
    backgroundColor: LIGHT_COLORS.brandBlue,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 8,
  },
  emptyFeedButtonText: {
    color: LIGHT_COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
  },
});
