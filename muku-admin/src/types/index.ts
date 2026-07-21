export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  xp: number;
  streak: number;
  hearts: number;
  locality?: string;
  onboarded: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  color: string;
  borderColor: string;
  order: number;
  unlockLevel: number;
  isLocked: boolean;
}

export interface Word {
  id: string;
  categoryId: string;
  nepali: string;
  nepaliRoman: string;
  english: string;
  phonetic: string;
  emoji: string;
  order: number;
  audioUrl?: string;
  category?: Category;
}

export interface Progress {
  id: string;
  userId: string;
  categoryId: string;
  wordsLearned: number;
  correctAnswers: number;
  totalAnswers: number;
  lastPlayedAt?: string;
  user?: User;
  category?: Category;
}

export interface Session {
  id: string;
  userId: string;
  categoryId: string;
  xpGained: number;
  accuracy: number;
  durationSec: number;
  locality?: string;
  completedAt: string;
  user?: User;
  category?: Category;
}

export interface Badge {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  description?: string;
}

export interface UserBadge {
  userId: string;
  badgeId: string;
  awardedAt: string;
  user?: User;
  badge?: Badge;
}

export interface OverviewStats {
  users: number;
  categories: number;
  words: number;
  badges: number;
}

export interface DataDeletionRequest {
  id: string;
  email: string;
  reason?: string;
  status: string;
  createdAt: string;
}
