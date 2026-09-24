import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Post, toggleLikePost, toggleBookmarkPost } from '@/services/postService';
import {
  isFollowingUser,
  followUser,
  unfollowUser,
} from '@/services/followService';
import Icon from '@/components/Icon';
import { ICON_NAMES, LIGHT_COLORS } from '@/constants';
import { showToast } from '@/components/toast';

const { width } = Dimensions.get('window');

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onFollowChange?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId = '',
  onFollowChange,
}) => {
  const [isLiked, setIsLiked] = useState(post.likedBy.includes(currentUserId));
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isBookmarked, setIsBookmarked] = useState(
    post.bookmarkedBy.includes(currentUserId),
  );
  const [isMuted, setIsMuted] = useState(true);
  const [isFollowing, setIsFollowing] = useState(true);
  const [optionsVisible, setOptionsVisible] = useState(false);

  // Check initial follow status
  useEffect(() => {
    let active = true;
    if (currentUserId && post.userId !== currentUserId) {
      isFollowingUser(currentUserId, post.userId || post.username).then(
        (following) => {
          if (active) setIsFollowing(following);
        },
      );
    }
    return () => {
      active = false;
    };
  }, [currentUserId, post.userId, post.username]);

  const handleFollow = async () => {
    if (!currentUserId) return;
    setIsFollowing(true);
    await followUser(currentUserId, post.userId);
    showToast(`Following @${post.username}`);
    onFollowChange?.();
  };

  const handleUnfollow = async () => {
    if (!currentUserId) return;
    setIsFollowing(false);
    setOptionsVisible(false);
    await unfollowUser(currentUserId, post.userId, post.username);
    showToast(`Unfollowed @${post.username}`);
    onFollowChange?.();
  };

  // Heart pop animation
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleLike = async () => {
    // Optimistic UI update
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    // Pop animation
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1.3,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(heartScale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();

    if (currentUserId) {
      const res = await toggleLikePost(post.id, currentUserId);
      setLikesCount(res.newCount);
    }
  };

  const handleBookmark = async () => {
    const nextSaved = !isBookmarked;
    setIsBookmarked(nextSaved);
    showToast(nextSaved ? 'Saved to collection' : 'Removed from collection');

    if (currentUserId) {
      await toggleBookmarkPost(post.id, currentUserId);
    }
  };

  const formattedLikes = Number(likesCount).toLocaleString();

  return (
    <View style={styles.cardContainer}>
      {/* 1. Header: Avatar, Username, Audio, Options */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {post.userAvatar ? (
            <Image source={{ uri: post.userAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Text style={styles.placeholderAvatarText}>
                {post.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.userTextContainer}>
            <View style={styles.usernameRow}>
              <Text style={styles.usernameText}>{post.username}</Text>
              {post.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Icon
                    name={ICON_NAMES.CHECKMARK_CIRCLE}
                    size={14}
                    color={LIGHT_COLORS.brandBlue}
                  />
                </View>
              )}

              {/* Follow text button if not currently followed */}
              {Boolean(currentUserId) &&
                post.userId !== currentUserId &&
                !isFollowing && (
                  <TouchableOpacity
                    style={styles.followHeaderBtn}
                    onPress={handleFollow}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.followHeaderText}>• Follow</Text>
                  </TouchableOpacity>
                )}
            </View>

            {/* Audio track info or location */}
            {Boolean(post.audioTrack) && (
              <Text style={styles.audioText} numberOfLines={1}>
                ♫ {post.audioTrack}
              </Text>
            )}
          </View>
        </View>

        {/* Options (···) */}
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => setOptionsVisible(true)}
          activeOpacity={0.7}
        >
          <Icon
            name={ICON_NAMES.ELLIPSIS_HORIZONTAL}
            size={18}
            color={LIGHT_COLORS.black}
          />
        </TouchableOpacity>
      </View>

      {/* 2. Media Image Container */}
      <View style={styles.mediaContainer}>
        <Image
          source={{ uri: post.mediaUri }}
          style={styles.postImage}
          resizeMode="cover"
        />

        {/* Floating title banner on media (e.g. Indian Cricketer's Japan Diaries 🇯🇵) */}
        {Boolean(post.caption) && (
          <View style={styles.floatingBannerContainer}>
            <View style={styles.floatingBanner}>
              <Text style={styles.floatingBannerText}>{post.caption}</Text>
            </View>
          </View>
        )}

        {/* Audio Mute/Unmute Indicator */}
        <TouchableOpacity
          style={styles.muteButton}
          activeOpacity={0.8}
          onPress={() => setIsMuted(!isMuted)}
        >
          <Icon
            name={
              isMuted
                ? ICON_NAMES.VOLUME_MUTE_OUTLINE
                : ICON_NAMES.VOLUME_HIGH_OUTLINE
            }
            size={15}
            color={LIGHT_COLORS.white}
          />
        </TouchableOpacity>
      </View>

      {/* 3. Action Buttons Row: Heart + Comment + Repost + Share ... Bookmark */}
      <View style={styles.actionRow}>
        <View style={styles.actionLeft}>
          {/* Like */}
          <TouchableOpacity
            style={styles.actionButtonWithCount}
            onPress={handleLike}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Icon
                name={isLiked ? ICON_NAMES.HEART : ICON_NAMES.HEART_OUTLINE}
                size={24}
                color={isLiked ? LIGHT_COLORS.error : LIGHT_COLORS.black}
              />
            </Animated.View>
            <Text style={styles.actionCountText}>{formattedLikes}</Text>
          </TouchableOpacity>

          {/* Comment */}
          <TouchableOpacity
            style={styles.actionButtonWithCount}
            onPress={() => showToast('Comments')}
            activeOpacity={0.7}
          >
            <Icon
              name={ICON_NAMES.CHATBUBBLE_OUTLINE}
              size={22}
              color={LIGHT_COLORS.black}
            />
            <Text style={styles.actionCountText}>{post.commentsCount}</Text>
          </TouchableOpacity>

          {/* Repost / Repeat */}
          <TouchableOpacity
            style={styles.actionButtonWithCount}
            onPress={() => showToast('Repost')}
            activeOpacity={0.7}
          >
            <Icon
              name={ICON_NAMES.REPEAT_OUTLINE}
              size={23}
              color={LIGHT_COLORS.black}
            />
            <Text style={styles.actionCountText}>{post.sharesCount}</Text>
          </TouchableOpacity>

          {/* Share Airplane */}
          <TouchableOpacity
            style={styles.actionButtonIconOnly}
            onPress={() => showToast('Share post')}
            activeOpacity={0.7}
          >
            <Icon
              name={ICON_NAMES.SEND_OUTLINE}
              size={21}
              color={LIGHT_COLORS.black}
            />
          </TouchableOpacity>
        </View>

        {/* Bookmark / Save */}
        <TouchableOpacity
          style={styles.actionRight}
          onPress={handleBookmark}
          activeOpacity={0.7}
        >
          <Icon
            name={isBookmarked ? ICON_NAMES.BOOKMARK : ICON_NAMES.BOOKMARK_OUTLINE}
            size={23}
            color={LIGHT_COLORS.black}
          />
        </TouchableOpacity>
      </View>

      {/* 4. Caption & Details */}
      <View style={styles.detailsContainer}>
        {Boolean(post.caption) && (
          <Text style={styles.captionText} numberOfLines={3}>
            <Text style={styles.captionUsername}>{post.username} </Text>
            {post.caption}
          </Text>
        )}

        {post.commentsCount > 0 && (
          <TouchableOpacity
            onPress={() => showToast('View all comments')}
            activeOpacity={0.7}
          >
            <Text style={styles.viewCommentsText}>
              View all {post.commentsCount} comments
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.timeAgoText}>2 hours ago</Text>
      </View>

      {/* Post Options / Unfollow Modal */}
      <Modal
        visible={optionsVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setOptionsVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setOptionsVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHandle} />

                {Boolean(currentUserId) && post.userId !== currentUserId && (
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={isFollowing ? handleUnfollow : handleFollow}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name={isFollowing ? ICON_NAMES.CLOSE : ICON_NAMES.PERSON_ADD}
                      size={22}
                      color={
                        isFollowing ? LIGHT_COLORS.error : LIGHT_COLORS.brandBlue
                      }
                    />
                    <Text
                      style={[
                        styles.modalOptionText,
                        isFollowing && { color: LIGHT_COLORS.error },
                      ]}
                    >
                      {isFollowing
                        ? `Unfollow @${post.username}`
                        : `Follow @${post.username}`}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setOptionsVisible(false);
                    showToast('Link copied to clipboard');
                  }}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={ICON_NAMES.SEND_OUTLINE}
                    size={20}
                    color={LIGHT_COLORS.black}
                  />
                  <Text style={styles.modalOptionText}>Share post</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCancelOption}
                  onPress={() => setOptionsVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: LIGHT_COLORS.white,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#F3F4F6',
  },
  placeholderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  placeholderAvatarText: {
    fontWeight: 'bold',
    color: LIGHT_COLORS.textSecondary,
    fontSize: 14,
  },
  userTextContainer: {
    justifyContent: 'center',
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernameText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: LIGHT_COLORS.black,
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  followHeaderBtn: {
    marginLeft: 8,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  followHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: LIGHT_COLORS.brandBlue,
  },
  audioText: {
    fontSize: 11.5,
    color: LIGHT_COLORS.textSecondary,
    marginTop: 1,
    maxWidth: width * 0.6,
  },
  moreButton: {
    padding: 6,
  },
  mediaContainer: {
    position: 'relative',
    width: width,
    height: width * 1.25, // 4:5 aspect ratio
    backgroundColor: '#F3F4F6',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  floatingBannerContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  floatingBanner: {
    backgroundColor: LIGHT_COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingBannerText: {
    fontSize: 15,
    fontWeight: '800',
    color: LIGHT_COLORS.black,
  },
  muteButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionButtonIconOnly: {
    marginRight: 16,
  },
  actionCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: LIGHT_COLORS.black,
    marginLeft: 6,
  },
  actionRight: {
    padding: 2,
  },
  detailsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  captionText: {
    fontSize: 13.5,
    color: LIGHT_COLORS.black,
    lineHeight: 18,
    marginTop: 2,
  },
  captionUsername: {
    fontWeight: '700',
    color: LIGHT_COLORS.black,
  },
  viewCommentsText: {
    fontSize: 13,
    color: LIGHT_COLORS.textSecondary,
    marginTop: 5,
  },
  timeAgoText: {
    fontSize: 11,
    color: LIGHT_COLORS.textSecondary,
    marginTop: 3,
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: LIGHT_COLORS.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F3F4F6',
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: LIGHT_COLORS.black,
    marginLeft: 14,
  },
  modalCancelOption: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: LIGHT_COLORS.textSecondary,
  },
});
