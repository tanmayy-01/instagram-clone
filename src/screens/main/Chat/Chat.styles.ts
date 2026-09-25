import { StyleSheet } from 'react-native';
import {
  FONT_SIZES,
  FONT_STYLES,
  LIGHT_COLORS,
} from '@/constants';
import { scale } from '@/lib/scale';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: LIGHT_COLORS.white,
  },
  headerSpacer: {
    width: 28,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerUsername: {
    fontSize: scale.ms(17),
    color: LIGHT_COLORS.black,
    letterSpacing: -0.3,
    fontFamily: FONT_STYLES.bold,
  },
  headerChevron: {
    marginLeft: 5,
    marginTop: 2,
  },
  composeBtn: {
    padding: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  tabMessagesWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabMessagesText: {
    fontSize: scale.ms(15.5),
    color: LIGHT_COLORS.black,
    fontFamily: FONT_STYLES.bold,
  },
  tabBadge: {
    backgroundColor: LIGHT_COLORS.unread_dot,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  tabBadgeText: {
    color: LIGHT_COLORS.white,
    fontSize: scale.ms(10.5),
    fontFamily: FONT_STYLES.bold,
  },
  tabRequestsText: {
    fontSize: FONT_SIZES.sm,
    color: LIGHT_COLORS.brandBlue,
    fontFamily: FONT_STYLES.bold,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_COLORS.action_btn,
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 38,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: LIGHT_COLORS.black,
    paddingVertical: 0,
    fontFamily: FONT_STYLES.regular
  },
  clearSearchBtn: {
    padding: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
  chatItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  avatarWrap: {
    marginRight: 14,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: LIGHT_COLORS.story_border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: LIGHT_COLORS.avatar_bg,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: LIGHT_COLORS.avatar_placeholder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: FONT_SIZES.xl,
    color: LIGHT_COLORS.textSecondary,
    fontFamily: FONT_STYLES.bold,
  },
  chatItemContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatItemName: {
    fontSize: FONT_SIZES.sm,
    color: LIGHT_COLORS.black,
    fontFamily: FONT_STYLES.bold,
  },
  chatItemSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2.5,
  },
  chatItemSubtitle: {
    fontSize: scale.ms(13),
    color: LIGHT_COLORS.textSecondary,
    flexShrink: 1,
    fontFamily: FONT_STYLES.regular,
  },
  chatItemSubtitleUnread: {
    color: LIGHT_COLORS.black,
    fontFamily: FONT_STYLES.bold,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: LIGHT_COLORS.unread_dot,
    marginLeft: 10,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: LIGHT_COLORS.unread_dot,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 10,
  },
  unreadBadgeText: {
    color: LIGHT_COLORS.white,
    fontSize: scale.ms(11),
    fontFamily: FONT_STYLES.bold,
  },
  cameraBtn: {
    padding: 6,
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: LIGHT_COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    color: LIGHT_COLORS.black,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: FONT_STYLES.bold,
  },
  emptySubtitle: {
    fontSize: scale.ms(13),
    color: LIGHT_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    fontFamily: FONT_STYLES.regular,
  },
  emptyActionBtn: {
    backgroundColor: LIGHT_COLORS.unread_dot,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyActionBtnText: {
    color: LIGHT_COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_STYLES.bold,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
