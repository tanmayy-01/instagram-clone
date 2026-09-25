import { FONT_SIZES, FONT_WEIGHTS, LIGHT_COLORS } from "@/constants";
import { scale } from "@/lib/scale";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: LIGHT_COLORS.action_btn,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_COLORS.action_btn,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: LIGHT_COLORS.black,
    marginLeft: 8,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  headerFollowListBtn: {
    marginLeft: 12,
    padding: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: scale.ms(15),
    fontWeight: FONT_WEIGHTS.bold,
    color: LIGHT_COLORS.black,
  },
  viewFollowingLink: {
    fontSize: scale.ms(13),
    fontWeight: FONT_WEIGHTS.semibold,
    color: LIGHT_COLORS.brandBlue,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: LIGHT_COLORS.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: LIGHT_COLORS.bg_2,
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: LIGHT_COLORS.avatar_bg,
  },
  placeholderAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: LIGHT_COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: LIGHT_COLORS.textSecondary,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernameText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: LIGHT_COLORS.black,
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  fullNameText: {
    fontSize: scale.ms(13),
    color: LIGHT_COLORS.textSecondary,
    marginTop: 1,
  },
  bioText: {
    fontSize: FONT_SIZES.xs,
    color: LIGHT_COLORS.bio_text,
    marginTop: 2,
  },
  followButton: {
    backgroundColor: LIGHT_COLORS.brandBlue,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingButton: {
    backgroundColor: LIGHT_COLORS.action_btn,
    borderWidth: 0.5,
    borderColor: LIGHT_COLORS.border_1,
  },
  followButtonText: {
    fontSize: scale.ms(13),
    fontWeight: FONT_WEIGHTS.bold,
    color: LIGHT_COLORS.white,
  },
  followingButtonText: {
    color: LIGHT_COLORS.black,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: LIGHT_COLORS.black,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: scale.ms(13),
    color: LIGHT_COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
