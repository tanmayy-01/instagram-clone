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
