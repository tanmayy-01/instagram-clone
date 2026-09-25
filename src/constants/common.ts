import { Dimensions } from "react-native";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const USERNAME_REGEX = /^[a-zA-Z0-9._]{3,30}$/;
export const STORY_DURATION = 5000; 

const { width, height } = Dimensions.get('window');

export const METRICS = {
  WIDTH: width,
  HEIGHT: height,
};