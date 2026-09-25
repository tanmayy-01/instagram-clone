import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@/components/Icon';
import { FONT_SIZES, ICON_NAMES, LIGHT_COLORS } from '@/constants';
import { StoryCircleProps } from '@/types';

export const StoryCircle: React.FC<StoryCircleProps> = ({
  story,
  isUserStory = false,
  hasActiveStory = false,
  userAvatar,
  username = 'Your story',
  isViewed = false,
  onPress,
  onAddPress,
  onLongPress,
}) => {
  const avatarUri = isUserStory ? userAvatar : story?.userAvatar;
  const displayName = isUserStory ? 'Your story' : story?.username || username;

  // Instagram gradient ring simulation using layered borders
  const showGradientRing = !isUserStory || hasActiveStory;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.avatarWrapper}
        activeOpacity={0.8}
        onPress={() => {
          if (isUserStory && !hasActiveStory && onAddPress) {
            onAddPress();
          } else {
            onPress();
          }
        }}
        onLongPress={onLongPress || onAddPress}
      >
        {/* Outer Ring - key forces fresh native View on state change */}
        <View
          key={`ring_${showGradientRing ? 'active' : 'inactive'}_${
            isViewed ? 'viewed' : 'unviewed'
          }`}
          style={[
            styles.ring,
            showGradientRing &&
              (isViewed ? styles.viewedRing : styles.activeGradientRing),
          ]}
        >
          {/* Inner White Gap */}
          <View style={styles.innerWhiteGap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.placeholderAvatar}>
                <Icon
                  name={ICON_NAMES.PERSON}
                  size={36}
                  color={LIGHT_COLORS.textSecondary}
                />
              </View>
            )}
          </View>
        </View>

        {/* Blue '+' Badge for User Story: allows adding multiple stories anytime */}
        {isUserStory && (
          <TouchableOpacity
            style={[styles.addBadge, hasActiveStory && styles.activeAddBadge]}
            activeOpacity={0.8}
            onPress={onAddPress || onPress}
          >
            <Icon
              name={ICON_NAMES.PLUS}
              size={hasActiveStory ? 11 : 13}
              color={LIGHT_COLORS.white}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Username label underneath */}
      <Text style={styles.usernameText} numberOfLines={1}>
        {displayName}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 78,
    marginRight: 6,
  },
  avatarWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: 74,
    height: 74,
    borderRadius: 37,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderStyle: 'solid',
    borderColor: 'transparent',
  },
  activeGradientRing: {
    borderWidth: 2.5,
    borderColor: LIGHT_COLORS.story_border,
    borderRadius: 37,
  },
  viewedRing: {
    borderWidth: 1.5,
    borderColor: LIGHT_COLORS.highlight_bg,
    borderRadius: 37,
  },
  innerWhiteGap: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: LIGHT_COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: LIGHT_COLORS.white,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 61,
    height: 61,
    borderRadius: 30.5,
    backgroundColor: LIGHT_COLORS.avatar_bg,
  },
  placeholderAvatar: {
    width: 61,
    height: 61,
    borderRadius: 30.5,
    backgroundColor: LIGHT_COLORS.avatar_placeholder,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  addBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: LIGHT_COLORS.brandBlue,
    borderWidth: 2,
    borderColor: LIGHT_COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeAddBadge: {
    bottom: 1,
    right: 1,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: LIGHT_COLORS.white,
    backgroundColor: LIGHT_COLORS.brandBlue,
  },
  usernameText: {
    fontSize: FONT_SIZES.xs,
    color: LIGHT_COLORS.textPrimary,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 74,
  },
});
