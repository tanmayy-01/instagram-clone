export type ActiveTab = 'grid' | 'reels' | 'tagged';

export interface FollowableUser {
  uid: string;
  username: string;
  fullName: string;
  avatar: string;
  bio?: string;
  isVerified?: boolean;
  followers?: string[];
  following?: string[];
  followersCount?: number;
  followingCount?: number;
}


export interface NotificationsModalProps {
  visible: boolean;
  currentUserId: string;
  onClose: () => void;
  onOpenChat?: (user: FollowableUser) => void;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  text: string;
  createdAt: number;
  replyTo?: {
    messageId: string;
    text: string;
    senderName: string;
    senderId: string;
  };
  status?: 'sent' | 'delivered' | 'read';
}

export interface ChatConversation {
  id: string;
  participants: string[];
  participantDetails: {
    [uid: string]: {
      username: string;
      fullName: string;
      avatar: string;
    };
  };
  lastMessage: string;
  lastMessageTime: number;
  lastSenderId: string;
  unreadCount?: {
    [uid: string]: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface UnifiedChatItem {
  user: FollowableUser;
  conversation?: ChatConversation;
  hasActiveStory: boolean;
}

export interface ChatRoomModalProps {
  visible: boolean;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  targetUser: {
    uid: string;
    username: string;
    fullName?: string;
    avatar?: string;
  } | null;
  onClose: () => void;
}

export interface NewChatModalProps {
  visible: boolean;
  users: FollowableUser[];
  onClose: () => void;
  onSelectUser: (user: FollowableUser) => void;
}

export interface CreateMediaModalProps {
  visible: boolean;
  user: UserData | null;
  initialMode?: 'post' | 'story' | null;
  onClose: () => void;
  onPostCreated?: () => void;
  onStoryCreated?: () => void;
}

export interface UserData {
  uid: string;
  username: string;
  email: string;
  fullName?: string;
  bio?: string;
  profilePicUrl?: string;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
  following?: string[];
  createdAt?: any;
}

export interface SignUpPayload {
  username: string;
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: UserData;
  error?: string;
}

 export interface AppNotification {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  title: string;
  body: string;
  type: 'chat_message' | 'follow' | 'like';
  chatId?: string;
  postId?: string;
  postMedia?: string;
  createdAt: number;
  read: boolean;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  mediaUri: string;
  caption?: string;
  location?: string;
  audioTrack?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  likedBy: string[];
  bookmarkedBy: string[];
  createdAt: number;
  isVerified?: boolean;
}

export interface Story {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  mediaUri: string;
  caption?: string;
  createdAt: number;
  expiresAt: number;
  viewers?: string[];
  isUserStory?: boolean;
}