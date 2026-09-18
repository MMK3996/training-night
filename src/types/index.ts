// ===================================================================
// SRS Web Application — Core Type Definitions
// ===================================================================

/** Core SRS Metrics embedded in every trackable item */
export interface SRSMetrics {
  repetitionCount: number;
  interval: number;
  easinessFactor: number;
  dueDate: string;
  lastReviewedAt: string | null;
  consecutiveFailures: number;
  isLeech: boolean;
}

/** Factory for default SRS metrics */
export function createDefaultSRSMetrics(): SRSMetrics {
  const today = new Date().toISOString().split('T')[0];
  return {
    repetitionCount: 0,
    interval: 0,
    easinessFactor: 2.5,
    dueDate: today,
    lastReviewedAt: null,
    consecutiveFailures: 0,
    isLeech: false,
  };
}

/** Review log entry for historical analytics */
export interface ReviewLog {
  id: string;
  itemId: string;
  itemType: 'cp_problem' | 'academic_topic';
  rating: 0 | 1 | 2 | 3 | 4 | 5;
  binaryResult: 'knew' | 'forgot';
  reviewedAt: string;
  intervalBefore: number;
  intervalAfter: number;
  easinessFactorBefore: number;
  easinessFactorAfter: number;
}

/** Supported competitive programming platforms */
export type CPPlatform = 'codeforces' | 'atcoder' | 'usaco' | 'cses' | 'custom';

/** Module 1: Competitive Programming Problem */
export interface ProblemItem {
  id: string;
  url: string;
  platform: CPPlatform;
  problemId: string;
  title: string;
  difficulty: number | string;
  platformTags: string[];
  userTags: string[];
  category: string;
  notes: string;
  srs: SRSMetrics;
  createdAt: string;
  updatedAt: string;
}

/** Module 2: University Course Topic */
export interface CourseTopicItem {
  id: string;
  courseId: string;
  courseName: string;
  topicName: string;
  subtopicName?: string;
  initialMastery: number;
  currentMastery: number;
  courseWeight: number;
  examDate?: string | null;
  notes: string;
  srs: SRSMetrics;
  createdAt: string;
  updatedAt: string;
}

/** Application settings */
export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  dailyReviewLimit: number;
  sm2Defaults: {
    initialEF: number;
    minEF: number;
    easyBonus: number;
  };
  leechThreshold: number;
  enableAudioEffects: boolean;
  customCORSProxy: string;
}

/** Default settings factory */
export function createDefaultSettings(): UserSettings {
  return {
    theme: 'system',
    dailyReviewLimit: 50,
    sm2Defaults: {
      initialEF: 2.5,
      minEF: 1.3,
      easyBonus: 1.3,
    },
    leechThreshold: 4,
    enableAudioEffects: false,
    customCORSProxy: 'https://api.allorigins.win/raw?url=',
  };
}

/** Full database backup schema for JSON export/import */
export interface DatabaseBackup {
  version: number;
  exportedAt: string;
  problems: ProblemItem[];
  academicTopics: CourseTopicItem[];
  reviewLogs: ReviewLog[];
  settings: UserSettings;
}
