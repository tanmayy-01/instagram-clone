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
export const NOTIFICATIONS_STORAGE_PREFIX = 'cached_notifications_';
export const FOLLOWING_STORAGE_KEY_PREFIX = 'user_following_list_';
export const FOLLOWERS_STORAGE_KEY_PREFIX = 'user_followers_list_';
export const ALL_USERS_STORAGE_KEY = 'cached_all_search_users';

// Set of demo mock accounts to remove completely
export const MOCK_USER_IDENTIFIERS = new Set([
  'user_chaitali',
  'chaitali._.9',
  'user_reshu',
  '_r_e_s_h_u__09',
  'user_shrav',
  'hey_shrav_',
  'instant_bollywood_official',
  'instantbollywood',
  'user_rohit',
  'rohit_sharma45',
  'user_anushka',
  'anushkasharma',
  'user_traveler',
  'japan_explorer',
  'user_foodie',
  'delhi_streetfood',
]);
