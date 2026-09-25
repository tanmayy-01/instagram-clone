import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Animated,
  StatusBar,
  Alert,
} from 'react-native';
import { deleteStory } from '@/services/storyService';
import { unfollowUser } from '@/services/followService';
import Icon from '@/components/Icon';
import { FONT_SIZES, FONT_WEIGHTS, ICON_NAMES, LIGHT_COLORS } from '@/constants';
import { showToast } from '@/components/toast';
import { scale } from '@/lib/scale';
import { Story } from '@/types';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000; 

interface StoryViewerModalProps {
  visible: boolean;
  stories: Story[];
  initialIndex?: number;
  currentUserId?: string;
  onClose: () => void;
  onUnfollow?: () => void;
  onAddNewStory?: () => void;
  onStoryDeleted?: (storyId: string) => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  visible,
  stories,
  initialIndex = 0,
  currentUserId = '',
  onClose,
  onUnfollow,
  onAddNewStory,
  onStoryDeleted,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [storyMenuVisible, setStoryMenuVisible] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const isPaused = useRef(false);
  const currentStory = stories[currentIndex];

  const handleNextStory = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev < stories.length - 1) {
        return prev + 1;
      } else {
        onClose();
        return prev;
      }
    });
  }, [stories.length, onClose]);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
    }
  }, [visible, initialIndex]);

  useEffect(() => {
    if (!visible || stories.length === 0) return;

    progressAnim.setValue(0);
    const anim = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });

    anim.start(({ finished }) => {
      if (finished && !isPaused.current) {
        handleNextStory();
      }
    });

    return () => {
      anim.stop();
    };
  }, [currentIndex, visible, stories.length, progressAnim, handleNextStory]);

  const handlePrevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      progressAnim.setValue(0);
    }
  };

  const handlePressIn = () => {
    isPaused.current = true;
    progressAnim.stopAnimation();
  };

  const handlePressOut = () => {
    isPaused.current = false;
    // @ts-ignore
    const currentVal = progressAnim._value || 0;
    const remainingTime = STORY_DURATION * (1 - currentVal);

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: remainingTime,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !isPaused.current) {
        handleNextStory();
      }
    });
  };

  const handleUnfollowStoryAuthor = async () => {
    setStoryMenuVisible(false);
    if (currentUserId && currentStory) {
      await unfollowUser(
        currentUserId,
        currentStory.userId,
        currentStory.username,
      );
      showToast(`Unfollowed @${currentStory.username}`);
      onUnfollow?.();
      onClose();
    }
  };

  const isMine =
    Boolean(currentUserId) &&
    Boolean(currentStory?.userId) &&
    currentStory.userId === currentUserId;

  const handleDeleteStory = () => {
    isPaused.current = true;
    progressAnim.stopAnimation();
    setStoryMenuVisible(false);

    if (!isMine) {
      showToast('You can only delete your own story');
      handlePressOut();
      return;
    }

    Alert.alert(
      'Delete Story?',
      'Are you sure you want to delete this story? This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => handlePressOut(),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (currentStory && currentUserId) {
              const success = await deleteStory(currentStory.id, currentUserId);
              if (success) {
                showToast('Story deleted');
                onStoryDeleted?.(currentStory.id);
                onUnfollow?.();
                onClose();
              } else {
                showToast('Failed to delete story');
                handlePressOut();
              }
            }
          },
        },
      ],
    );
  };

  if (!visible || stories.length === 0) return null;

  if (!currentStory) return null;

  // Relative time computation
  const hoursAgo = Math.max(
    1,
    Math.round((Date.now() - currentStory.createdAt) / (1000 * 3600)),
  );

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" />
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.container}>
          {/* Full Screen Media Image */}
          <Image
            source={{ uri: currentStory.mediaUri }}
            style={styles.mediaImage}
            resizeMode="cover"
          />

          {/* Top Progress Bar & Header Container */}
          <View style={styles.topOverlay}>
            {/* Progress Bars Row */}
            <View style={styles.progressRow}>
              {stories.map((s, index) => {
                let barWidth: any = '0%';
                if (index < currentIndex) {
                  barWidth = '100%';
                } else if (index === currentIndex) {
                  barWidth = progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  });
                }

                return (
                  <View key={s.id} style={styles.progressBarBackground}>
                    <Animated.View
                      style={[styles.progressBarFill, { width: barWidth }]}
                    />
                  </View>
                );
              })}
            </View>

            {/* Story Header: Avatar, Username, Time, Close */}
            <View style={styles.headerRow}>
              <View style={styles.userInfoRow}>
                {currentStory.userAvatar ? (
                  <Image
                    source={{ uri: currentStory.userAvatar }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarLetter}>
                      {currentStory.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={styles.usernameText}>
                  {currentStory.username}
                </Text>
                <Text style={styles.timeText}>{hoursAgo}h</Text>
              </View>

              <View style={styles.headerRightActions}>
                {isMine && Boolean(onAddNewStory) && (
                  <TouchableOpacity
                    onPress={() => {
                      isPaused.current = true;
                      progressAnim.stopAnimation();
                      onClose();
                      onAddNewStory?.();
                    }}
                    style={styles.addStoryHeaderBtn}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name={ICON_NAMES.PLUS}
                      size={18}
                      color={LIGHT_COLORS.white}
                    />
                    <Text style={styles.addStoryHeaderText}>Add</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => {
                    isPaused.current = true;
                    progressAnim.stopAnimation();
                    setStoryMenuVisible(true);
                  }}
                  style={styles.moreButton}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={
                      isMine
                        ? ICON_NAMES.TRASH
                        : ICON_NAMES.ELLIPSIS_HORIZONTAL
                    }
                    size={20}
                    color={LIGHT_COLORS.white}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={ICON_NAMES.CLOSE}
                    size={24}
                    color={LIGHT_COLORS.white}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Left/Right Touch Controls for navigation */}
          <View style={styles.touchNavigationRow}>
            <TouchableOpacity
              style={styles.leftTouch}
              onPress={handlePrevStory}
              activeOpacity={1}
            />
            <TouchableOpacity
              style={styles.rightTouch}
              onPress={handleNextStory}
              activeOpacity={1}
            />
          </View>

          {/* Optional Story Caption Overlay */}
          {Boolean(currentStory.caption) && (
            <View style={styles.storyCaptionContainer}>
              <Text style={styles.storyCaptionText}>
                {currentStory.caption}
              </Text>
            </View>
          )}

          {/* Story Options Action Sheet */}
          <Modal
            visible={storyMenuVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => {
              setStoryMenuVisible(false);
              handlePressOut();
            }}
          >
            <TouchableWithoutFeedback
              onPress={() => {
                setStoryMenuVisible(false);
                handlePressOut();
              }}
            >
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHandle} />
                    {isMine ? (
                      <>
                        {Boolean(onAddNewStory) && (
                          <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => {
                              setStoryMenuVisible(false);
                              onClose();
                              onAddNewStory?.();
                            }}
                            activeOpacity={0.7}
                          >
                            <Icon
                              name={ICON_NAMES.PLUS}
                              size={22}
                              color={LIGHT_COLORS.brandBlue}
                            />
                            <Text
                              style={[
                                styles.modalOptionText,
                                { color: LIGHT_COLORS.brandBlue },
                              ]}
                            >
                              Add another story
                            </Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={styles.modalOption}
                          onPress={handleDeleteStory}
                          activeOpacity={0.7}
                        >
                          <Icon
                            name={ICON_NAMES.TRASH}
                            size={22}
                            color={LIGHT_COLORS.error}
                          />
                          <Text
                            style={[
                              styles.modalOptionText,
                              { color: LIGHT_COLORS.error },
                            ]}
                          >
                            Delete story
                          </Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity
                        style={styles.modalOption}
                        onPress={handleUnfollowStoryAuthor}
                        activeOpacity={0.7}
                      >
                        <Icon
                          name={ICON_NAMES.CLOSE}
                          size={22}
                          color={LIGHT_COLORS.error}
                        />
                        <Text
                          style={[
                            styles.modalOptionText,
                            { color: LIGHT_COLORS.error },
                          ]}
                        >
                          Unfollow @{currentStory.username}
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.modalCancelOption}
                      onPress={() => {
                        setStoryMenuVisible(false);
                        handlePressOut();
                      }}
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
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.black,
  },
  mediaImage: {
    width: width,
    height: height,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  topOverlay: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    zIndex: 10,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressBarBackground: {
    flex: 1,
    height: 2.5,
    backgroundColor: LIGHT_COLORS.progress_bar,
    borderRadius: 1.5,
    marginHorizontal: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: LIGHT_COLORS.white,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: LIGHT_COLORS.white,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: LIGHT_COLORS.avatar_placeholder_2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarLetter: {
    color: LIGHT_COLORS.white,
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.sm,
  },
  usernameText: {
    color: LIGHT_COLORS.white,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.sm,
    marginRight: 8,
  },
  timeText: {
    color: LIGHT_COLORS.time_text,
    fontSize: FONT_SIZES.xs,
  },
  closeButton: {
    padding: 4,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addStoryHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_COLORS.add_story_btn,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
    marginRight: 6,
  },
  addStoryHeaderText: {
    color: LIGHT_COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    marginLeft: 3,
  },
  moreButton: {
    padding: 6,
    marginRight: 6,
  },
  touchNavigationRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  leftTouch: {
    width: '30%',
    height: '100%',
  },
  rightTouch: {
    width: '70%',
    height: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.overlay_bg,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: LIGHT_COLORS.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: LIGHT_COLORS.bg_4,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: LIGHT_COLORS.avatar_bg,
  },
  modalOptionText: {
    fontSize: scale.ms(15),
    fontWeight: FONT_WEIGHTS.semibold,
    marginLeft: 14,
  },
  modalCancelOption: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  modalCancelText: {
    fontSize: scale.ms(15),
    fontWeight: FONT_WEIGHTS.semibold,
    color: LIGHT_COLORS.textSecondary,
  },
  storyCaptionContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: LIGHT_COLORS.overlay_bg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyCaptionText: {
    color: LIGHT_COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    textAlign: 'center',
    lineHeight: 18,
  },
});
