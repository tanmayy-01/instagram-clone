import { Dimensions } from "react-native";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const USERNAME_REGEX = /^[a-zA-Z0-9._]{3,30}$/;
export const STORY_DURATION = 5000; 

const { width, height } = Dimensions.get('window');

export const METRICS = {
  WIDTH: width,
  HEIGHT: height,
};

export const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000; // Exactly 24 Hours in milliseconds
export const STORIES_STORAGE_KEY = 'cached_stories_tray';
export const POSTS_STORAGE_KEY = 'cached_feed_posts';
export const CHATS_CACHE_KEY_PREFIX = 'cached_chats_for_user_';
export const FCM_TOKEN_STORAGE_KEY = 'user_fcm_token';
