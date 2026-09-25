import { StyleSheet } from 'react-native';
import { LIGHT_COLORS } from '@/constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.white,
  },
  // Top Header: [Spacer]  [username ⌵]  [Compose]
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
    fontSize: 17,
    fontWeight: '700',
    color: LIGHT_COLORS.black,
    letterSpacing: -0.3,
  },
  headerChevron: {
    marginLeft: 5,
    marginTop: 2,
  },
  composeBtn: {
    padding: 2,
  },

  // Segmented Tabs: "Messages" (left) | "Requests" (right)
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  tabMessagesText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: LIGHT_COLORS.black,
  },
  tabRequestsText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#4A55A2',
  },

  // Search Bar
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFEFEF',
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
    fontSize: 14,
    color: LIGHT_COLORS.black,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },

  // Chat Item Row
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
    borderColor: '#DD2A7B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F3F4F6',
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: '700',
    color: LIGHT_COLORS.textSecondary,
  },
  chatItemContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatItemName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: LIGHT_COLORS.black,
  },
  chatItemSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2.5,
  },
  chatItemSubtitle: {
    fontSize: 13,
    color: LIGHT_COLORS.textSecondary,
    flexShrink: 1,
  },
  chatItemSubtitleUnread: {
    fontWeight: '700',
    color: LIGHT_COLORS.black,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3797F0',
    marginLeft: 10,
  },
  cameraBtn: {
    padding: 6,
    marginLeft: 6,
  },

  // Empty State
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
    fontSize: 18,
    fontWeight: '700',
    color: LIGHT_COLORS.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: LIGHT_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  emptyActionBtn: {
    backgroundColor: '#3797F0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyActionBtnText: {
    color: LIGHT_COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },

  // Loading indicator
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});