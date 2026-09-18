// ===================================================================
// Dexie.js IndexedDB Database Definition & CRUD Utilities
// ===================================================================
import Dexie, { type Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';
import type {
  ProblemItem,
  CourseTopicItem,
  ReviewLog,
  UserSettings,
} from '../types';
import { createDefaultSRSMetrics, createDefaultSettings } from '../types';

// ===================================================================
// Database Class
// ===================================================================
export class SRSDatabase extends Dexie {
  problems!: Table<ProblemItem, string>;
  academicTopics!: Table<CourseTopicItem, string>;
  reviewLogs!: Table<ReviewLog, string>;
  settings!: Table<UserSettings & { id: string }, string>;

  constructor() {
    super('srs-app-db');

    this.version(1).stores({
      problems:
        'id, platform, problemId, category, [platform+problemId], *platformTags, *userTags, srs.dueDate',
      academicTopics:
        'id, courseId, courseName, topicName, srs.dueDate',
      reviewLogs:
        'id, itemId, itemType, reviewedAt',
      settings: 'id',
    });
  }
}

/** Singleton database instance */
export const db = new SRSDatabase();

// ===================================================================
// Problem CRUD
// ===================================================================
export async function addProblem(
  data: Omit<ProblemItem, 'id' | 'srs' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = new Date().toISOString();
  const id = uuidv4();
  const problem: ProblemItem = {
    ...data,
    id,
    srs: createDefaultSRSMetrics(),
    createdAt: now,
    updatedAt: now,
  };
  await db.problems.add(problem);
  return id;
}

export async function updateProblem(
  id: string,
  changes: Partial<ProblemItem>
): Promise<void> {
  await db.problems.update(id, {
    ...changes,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteProblem(id: string): Promise<void> {
  await db.problems.delete(id);
}

export async function getProblemById(
  id: string
): Promise<ProblemItem | undefined> {
  return db.problems.get(id);
}

export async function getAllProblems(): Promise<ProblemItem[]> {
  return db.problems.toArray();
}

export async function getDueProblems(
  dateStr?: string
): Promise<ProblemItem[]> {
  const today = dateStr ?? new Date().toISOString().split('T')[0];
  return db.problems
    .filter((p) => p.srs.dueDate <= today)
    .toArray();
}

// ===================================================================
// Academic Topic CRUD
// ===================================================================
export async function addAcademicTopic(
  data: Omit<CourseTopicItem, 'id' | 'srs' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = new Date().toISOString();
  const id = uuidv4();
  const topic: CourseTopicItem = {
    ...data,
    id,
    srs: createDefaultSRSMetrics(),
    createdAt: now,
    updatedAt: now,
  };
  await db.academicTopics.add(topic);
  return id;
}

export async function updateAcademicTopic(
  id: string,
  changes: Partial<CourseTopicItem>
): Promise<void> {
  await db.academicTopics.update(id, {
    ...changes,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteAcademicTopic(id: string): Promise<void> {
  await db.academicTopics.delete(id);
}

export async function getAcademicTopicById(
  id: string
): Promise<CourseTopicItem | undefined> {
  return db.academicTopics.get(id);
}

export async function getAllAcademicTopics(): Promise<CourseTopicItem[]> {
  return db.academicTopics.toArray();
}

export async function getDueAcademicTopics(
  dateStr?: string
): Promise<CourseTopicItem[]> {
  const today = dateStr ?? new Date().toISOString().split('T')[0];
  return db.academicTopics
    .filter((t) => t.srs.dueDate <= today)
    .toArray();
}

// ===================================================================
// Review Log CRUD
// ===================================================================
export async function addReviewLog(
  data: Omit<ReviewLog, 'id'>
): Promise<string> {
  const id = uuidv4();
  const log: ReviewLog = { ...data, id };
  await db.reviewLogs.add(log);
  return id;
}

export async function getReviewLogsForItem(
  itemId: string
): Promise<ReviewLog[]> {
  return db.reviewLogs.where('itemId').equals(itemId).toArray();
}

export async function getAllReviewLogs(): Promise<ReviewLog[]> {
  return db.reviewLogs.toArray();
}

// ===================================================================
// Settings CRUD
// ===================================================================
const SETTINGS_KEY = 'user-settings';

export async function getSettings(): Promise<UserSettings> {
  const row = await db.settings.get(SETTINGS_KEY);
  if (row) {
    const { id: _, ...settings } = row;
    return settings as UserSettings;
  }
  const defaults = createDefaultSettings();
  await db.settings.put({ ...defaults, id: SETTINGS_KEY });
  return defaults;
}

export async function updateSettings(
  changes: Partial<UserSettings>
): Promise<void> {
  const current = await getSettings();
  await db.settings.put({ ...current, ...changes, id: SETTINGS_KEY });
}

// ===================================================================
// Bulk Operations (for import)
// ===================================================================
export async function clearAllData(): Promise<void> {
  await db.transaction(
    'rw',
    [db.problems, db.academicTopics, db.reviewLogs, db.settings],
    async () => {
      await db.problems.clear();
      await db.academicTopics.clear();
      await db.reviewLogs.clear();
      await db.settings.clear();
    }
  );
}

export async function bulkImport(data: {
  problems: ProblemItem[];
  academicTopics: CourseTopicItem[];
  reviewLogs: ReviewLog[];
  settings: UserSettings;
}): Promise<void> {
  await db.transaction(
    'rw',
    [db.problems, db.academicTopics, db.reviewLogs, db.settings],
    async () => {
      await db.problems.bulkPut(data.problems);
      await db.academicTopics.bulkPut(data.academicTopics);
      await db.reviewLogs.bulkPut(data.reviewLogs);
      await db.settings.put({ ...data.settings, id: SETTINGS_KEY });
    }
  );
}
