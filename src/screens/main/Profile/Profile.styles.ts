import { StyleSheet } from 'react-native';
import {
  FONT_SIZES,
  FONT_STYLES,
  FONT_WEIGHTS,
  LIGHT_COLORS,
} from '@/constants';
import { scale } from '@/lib/scale';
import { isIOS } from '@/utils';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.white,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: LIGHT_COLORS.white,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerUsername: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONT_STYLES.bold,
    fontWeight: FONT_WEIGHTS.bold,
    color: LIGHT_COLORS.black,
    letterSpacing: -0.3,
  },
  headerChevron: {
    marginLeft: 6,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    marginLeft: 18,
    padding: 2,
  },

  // Profile Info Section
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 24,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: LIGHT_COLORS.avatar_bg,
  },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: LIGHT_COLORS.avatar_placeholder,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LIGHT_COLORS.avatar_placeholder,
  },
  avatarInitial: {
    fontSize: FONT_SIZES.huge,
    fontFamily: FONT_STYLES.bold,
    fontWeight: FONT_WEIGHTS.bold,
    color: LIGHT_COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  addStoryBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: LIGHT_COLORS.brandBlue,
    borderWidth: 2.5,
    borderColor: LIGHT_COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeAddStoryBadge: {
    bottom: 1,
    right: 1,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  profileStoryRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.8,
    borderColor: 'transparent',
    borderStyle: 'solid',
  },
  profileStoryRingActive: {
    borderColor: '#DD2A7B',
  },
  profileAvatarInnerGap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: LIGHT_COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileAvatarWithRing: {
    width: 78,
    height: 78,
    borderRadius: 39,
  },

  // Stats
  profileDetailsCol: {
    flex: 1,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width:'85%'
  },
  statColumn: {

    minWidth: 54,
  },
  statNumber: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONT_STYLES.bold,
    // fontWeight: FONT_WEIGHTS.bold,
    color: LIGHT_COLORS.black,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONT_STYLES.regular,
    color: LIGHT_COLORS.textPrimary,
    marginTop: 2,
  },

  // Bio Section
  bioSection: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 14,
  },
  fullName: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_STYLES.bold,
    // fontWeight: FONT_WEIGHTS.bold,
    color: LIGHT_COLORS.black,
    marginBottom: 2,
  },
  bioCategory: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_STYLES.regular,
    color: LIGHT_COLORS.textSecondary,
    marginBottom: 2,
  },
  bioText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_STYLES.regular,
    color: LIGHT_COLORS.textPrimary,
    lineHeight: 18,
  },

  // Action Buttons Row
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    height: 34,
    backgroundColor: LIGHT_COLORS.action_btn,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonMiddle: {
    marginHorizontal: 6,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_STYLES.medium,
    fontWeight: FONT_WEIGHTS.semibold,
    color: LIGHT_COLORS.black,
  },
  actionIconButton: {
    width: 34,
    height: 34,
    backgroundColor: LIGHT_COLORS.action_btn,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Story Highlights
  highlightsSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  highlightItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  newHighlightCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.highlight_bg,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LIGHT_COLORS.white,
  },
  highlightLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONT_STYLES.regular,
    color: LIGHT_COLORS.black,
    marginTop: 5,
  },

  // Media Tabs Bar
  tabsBar: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: LIGHT_COLORS.border_1,
    backgroundColor: LIGHT_COLORS.white,
  },
  tabButton: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: LIGHT_COLORS.black,
  },

  // 3-Column Posts Grid
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '33.333%',
    aspectRatio: 1,
    padding: 1,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },

  // Empty Posts Section (Zero posts)
  emptyPostsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: LIGHT_COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONT_STYLES.bold,
    fontWeight: FONT_WEIGHTS.bold,
    color: LIGHT_COLORS.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_STYLES.regular,
    color: LIGHT_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  emptyActionText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_STYLES.medium,
    fontWeight: FONT_WEIGHTS.semibold,
    color: LIGHT_COLORS.brandBlue,
  },

  // Modal / Bottom Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: LIGHT_COLORS.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 12,
    paddingBottom: isIOS ? 34 : 20,
    paddingHorizontal: 20,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: LIGHT_COLORS.border_1,
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_STYLES.bold,
    fontWeight: FONT_WEIGHTS.bold,
    color: LIGHT_COLORS.black,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: LIGHT_COLORS.bg_1,
  },
  modalOptionText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_STYLES.regular,
    color: LIGHT_COLORS.black,
    marginLeft: 14,
  },
  modalLogoutText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_STYLES.medium,
    fontWeight: FONT_WEIGHTS.semibold,
    color: LIGHT_COLORS.error,
    marginLeft: 14,
  },
  logoutIndicator: {
    marginLeft: 14,
  },

  // Edit Profile Modal
  editModalContainer: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.white,
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: LIGHT_COLORS.border_1,
  },
  editModalCancelText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_STYLES.regular,
    color: LIGHT_COLORS.black,
  },
  editModalTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_STYLES.bold,
    fontWeight: FONT_WEIGHTS.bold,
    color: LIGHT_COLORS.black,
  },
  editModalDoneText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_STYLES.bold,
    fontWeight: FONT_WEIGHTS.bold,
    color: LIGHT_COLORS.brandBlue,
  },
  editAvatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  editAvatarButton: {
    marginTop: 10,
  },
  editAvatarButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_STYLES.medium,
    fontWeight: FONT_WEIGHTS.semibold,
    color: LIGHT_COLORS.brandBlue,
  },
  editFieldContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: LIGHT_COLORS.action_btn,
  },
  editFieldLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONT_STYLES.regular,
    color: LIGHT_COLORS.textSecondary,
    marginBottom: 4,
  },
  editFieldInput: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_STYLES.regular,
    color: LIGHT_COLORS.black,
    paddingVertical: 2,
    paddingHorizontal: 0,
  },
  thereads: {
    fontFamily: FONT_STYLES.headline,
    fontSize: scale.ms(25),
    textAlign: 'center',
    paddingBottom: '1%'
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: LIGHT_COLORS.bg_1,
  },
  modalCancelText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_STYLES.medium,
    fontWeight: FONT_WEIGHTS.semibold,
    color: LIGHT_COLORS.textSecondary,
  },
  // Post Detail Viewer Modal
  postDetailModalContainer: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.white,
  },
  postDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: LIGHT_COLORS.action_btn,
    backgroundColor: LIGHT_COLORS.white,
  },
  postDetailHeaderBack: {
    padding: 6,
  },
  postDetailHeaderCenter: {
    alignItems: 'center',
  },
  postDetailHeaderSubtitle: {
    fontSize: 11,
    fontFamily: FONT_STYLES.medium,
    color: LIGHT_COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  postDetailHeaderTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_STYLES.bold,
    fontWeight: FONT_WEIGHTS.bold,
    color: LIGHT_COLORS.black,
  },
  postDetailScroll: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.white,
  },
  postDetailHeaderSpacer: {
    width: 32,
  },
});
