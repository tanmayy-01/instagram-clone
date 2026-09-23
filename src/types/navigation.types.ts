
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  ForgotPassword: undefined;
//   Profile: { userId: string; username: string };
//   FeedDetails: { postId: string };
};


export type NavigateKey = keyof RootStackParamList;
