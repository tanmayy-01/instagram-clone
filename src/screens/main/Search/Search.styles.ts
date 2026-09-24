import { LIGHT_COLORS } from "@/constants";
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
    borderBottomColor: '#EFEFEF',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFEFEF',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
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
    fontSize: 15,
    fontWeight: '700',
    color: LIGHT_COLORS.black,
  },
  viewFollowingLink: {
    fontSize: 13,
    fontWeight: '600',
    color: LIGHT_COLORS.brandBlue,
  },
  sectionSubtitle: {
    fontSize: 12,
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
    borderBottomColor: '#F8F9FA',
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
    backgroundColor: '#F3F4F6',
  },
  placeholderAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '700',
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
    fontSize: 14,
    fontWeight: '700',
    color: LIGHT_COLORS.black,
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  fullNameText: {
    fontSize: 13,
    color: LIGHT_COLORS.textSecondary,
    marginTop: 1,
  },
  bioText: {
    fontSize: 12,
    color: '#8E8E8E',
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
    backgroundColor: '#EFEFEF',
    borderWidth: 0.5,
    borderColor: '#DBDBDB',
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '700',
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
    fontSize: 16,
    fontWeight: '700',
    color: LIGHT_COLORS.black,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: LIGHT_COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
