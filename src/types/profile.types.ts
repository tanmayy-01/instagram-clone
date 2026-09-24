export interface FollowListModalProps {
  visible: boolean;
  initialTab?: 'followers' | 'following';
  currentUserId: string;
  currentUsername: string;
  onClose: () => void;
  onCountsChanged?: (followersCount: number, followingCount: number) => void;
}
