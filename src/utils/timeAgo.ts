
export const formatTimeAgo = (timestamp?: number | string | any): string => {
  if (!timestamp) return 'Just now';

  let timeMs: number;
  if (typeof timestamp === 'number') {
    timeMs = timestamp;
  } else if (typeof timestamp === 'string') {
    const parsed = Date.parse(timestamp);
    timeMs = isNaN(parsed) ? Number(timestamp) : parsed;
  } else if (timestamp && typeof timestamp.toDate === 'function') {
    // Firestore Timestamp instance
    timeMs = timestamp.toDate().getTime();
  } else if (timestamp && typeof timestamp.seconds === 'number') {
    // Firestore Timestamp serialized object { seconds, nanoseconds }
    timeMs = timestamp.seconds * 1000;
  } else {
    timeMs = Number(timestamp);
  }

  if (isNaN(timeMs) || timeMs <= 0) {
    return 'Just now';
  }

  const now = Date.now();
  const diffMs = now - timeMs;

  if (diffMs < 0) {
    return 'Just now';
  }

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) {
    return 'Just now';
  } else if (diffMinutes === 1) {
    return '1 minute ago';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`;
  } else if (diffHours === 1) {
    return '1 hour ago';
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return '1 day ago';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffWeeks === 1) {
    return '1 week ago';
  } else if (diffWeeks < 4) {
    return `${diffWeeks} weeks ago`;
  } else if (diffMonths === 1) {
    return '1 month ago';
  } else if (diffMonths < 12) {
    return `${diffMonths} months ago`;
  } else if (diffYears === 1) {
    return '1 year ago';
  } else {
    return `${diffYears} years ago`;
  }
};
