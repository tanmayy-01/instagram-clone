import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StoryCircle } from './StoryCircle';
import { LIGHT_COLORS } from '@/constants';
import { Story, StoryTrayProps } from '@/types';


export const StoryTray: React.FC<StoryTrayProps> = ({
  userStories,
  otherStories,
  userAvatar,
  username,
  onOpenStory,
  onAddStory,
}) => {
  const hasUserActiveStory = userStories.length > 0;

  // Group other users' stories so each followed user has exactly ONE story circle in the tray
  const uniqueOtherUsersStories = otherStories.reduce<Story[]>((acc, story) => {
    const exists = acc.some(
      (s) =>
        (s.userId && s.userId === story.userId) ||
        (s.username && s.username === story.username),
    );
    if (!exists) {
      acc.push(story);
    }
    return acc;
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Story Circle ("Your story") */}
        <StoryCircle
          isUserStory={true}
          hasActiveStory={hasUserActiveStory}
          userAvatar={userAvatar}
          username={username}
          onPress={() => {
            if (hasUserActiveStory) {
              onOpenStory(userStories[0]);
            } else {
              onAddStory();
            }
          }}
          onAddPress={onAddStory}
          onLongPress={onAddStory}
        />

        {/* Other Users' Stories: 1 circle per user */}
        {uniqueOtherUsersStories.map((story) => (
          <StoryCircle
            key={story.userId || story.id}
            story={story}
            onPress={() => onOpenStory(story)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: LIGHT_COLORS.white,
    borderBottomWidth: 0.5,
    borderBottomColor: LIGHT_COLORS.action_btn,
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
});
