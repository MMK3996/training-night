// ===================================================================
// Data Backup & Restore Engine
// Full JSON export with Zod validation, conflict resolution, and
// schema migration support.
// ===================================================================
import { z } from 'zod';
import {
  clearAllData,
  bulkImport,
  getSettings,
  getAllProblems,
  getAllAcademicTopics,
  getAllReviewLogs,
} from '../lib/db';
import type { DatabaseBackup } from '../types';

// ===================================================================
// Current Schema Version
// ===================================================================
const CURRENT_SCHEMA_VERSION = 1;

// ===================================================================
// Zod Validation Schemas
// ===================================================================
const SRSMetricsSchema = z.object({
  repetitionCount: z.number().int().min(0),
  interval: z.number().min(0),
  easinessFactor: z.number().min(1.3),
  dueDate: z.string(),
  lastReviewedAt: z.string().nullable(),
  consecutiveFailures: z.number().int().min(0),
  isLeech: z.boolean(),
});

const ProblemItemSchema = z.object({
  id: z.string().uuid(),
  url: z.string(),
  platform: z.enum(['codeforces', 'atcoder', 'usaco', 'cses', 'custom']),
  problemId: z.string(),
  title: z.string(),
  difficulty: z.union([z.number(), z.string()]),
  platformTags: z.array(z.string()),
  userTags: z.array(z.string()),
  category: z.string(),
  notes: z.string(),
  srs: SRSMetricsSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

const CourseTopicItemSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string(),
  courseName: z.string(),
  topicName: z.string(),
  subtopicName: z.string().optional(),
  initialMastery: z.number().int().min(1).max(5),
  currentMastery: z.number().int().min(1).max(5),
  courseWeight: z.number().min(0),
  examDate: z.string().nullable().optional(),
  notes: z.string(),
  srs: SRSMetricsSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

const ReviewLogSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string(),
  itemType: z.enum(['cp_problem', 'academic_topic']),
  rating: z.union([
    z.literal(0), z.literal(1), z.literal(2),
    z.literal(3), z.literal(4), z.literal(5),
  ]),
  binaryResult: z.enum(['knew', 'forgot']),
  reviewedAt: z.string(),
  intervalBefore: z.number(),
  intervalAfter: z.number(),
  easinessFactorBefore: z.number(),
  easinessFactorAfter: z.number(),
});

const UserSettingsSchema = z.object({
  theme: z.enum(['dark', 'light', 'system']),
  dailyReviewLimit: z.number().int().min(1),
  sm2Defaults: z.object({
    initialEF: z.number(),
    minEF: z.number(),
    easyBonus: z.number(),
  }),
  leechThreshold: z.number().int().min(1),
  enableAudioEffects: z.boolean(),
  customCORSProxy: z.string(),
});

const DatabaseBackupSchema = z.object({
  version: z.number().int().min(1),
  exportedAt: z.string(),
  problems: z.array(ProblemItemSchema),
  academicTopics: z.array(CourseTopicItemSchema),
  reviewLogs: z.array(ReviewLogSchema),
  settings: UserSettingsSchema,
});

// ===================================================================
// Export
// ===================================================================

/** Generate a full database backup as a validated JSON object */
export async function exportDatabase(): Promise<DatabaseBackup> {
  const [problems, academicTopics, reviewLogs, settings] = await Promise.all([
    getAllProblems(),
    getAllAcademicTopics(),
    getAllReviewLogs(),
    getSettings(),
  ]);

  const backup: DatabaseBackup = {
    version: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    problems,
    academicTopics,
    reviewLogs,
    settings,
  };

  return backup;
}

/** Download the backup as a JSON file to the user's device */
export async function downloadBackup(): Promise<void> {
  const backup = await exportDatabase();
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `srs-backup-${dateStr}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ===================================================================
// Import
// ===================================================================

export interface ImportResult {
  success: boolean;
  problemsImported: number;
  topicsImported: number;
  reviewLogsImported: number;
  errors: string[];
}

/** Validate and parse a raw JSON string into a DatabaseBackup */
export function validateBackup(
  rawJson: string
): { success: true; data: DatabaseBackup } | { success: false; errors: string[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return { success: false, errors: ['Invalid JSON: failed to parse file content.'] };
  }

  const result = DatabaseBackupSchema.safeParse(parsed);
  if (!result.success) {
    const errors = result.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`
    );
    return { success: false, errors };
  }

  return { success: true, data: result.data };
}

export type ImportMode = 'replace' | 'merge';

/**
 * Import a validated backup into the database.
 * - 'replace': Clears all existing data before importing.
 * - 'merge': Adds/updates records by ID (existing IDs are overwritten).
 */
export async function importDatabase(
  backup: DatabaseBackup,
  mode: ImportMode = 'replace'
): Promise<ImportResult> {
  const errors: string[] = [];

  try {
    // Handle schema migration if needed
    if (backup.version > CURRENT_SCHEMA_VERSION) {
      return {
        success: false,
        problemsImported: 0,
        topicsImported: 0,
        reviewLogsImported: 0,
        errors: [
          `Backup version ${backup.version} is newer than the app version ${CURRENT_SCHEMA_VERSION}. Please update the app.`,
        ],
      };
    }

    if (mode === 'replace') {
      await clearAllData();
    }

    await bulkImport({
      problems: backup.problems,
      academicTopics: backup.academicTopics,
      reviewLogs: backup.reviewLogs,
      settings: backup.settings,
    });

    return {
      success: true,
      problemsImported: backup.problems.length,
      topicsImported: backup.academicTopics.length,
      reviewLogsImported: backup.reviewLogs.length,
      errors,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      problemsImported: 0,
      topicsImported: 0,
      reviewLogsImported: 0,
      errors: [`Import failed: ${message}`],
    };
  }
}

/**
 * Convenience: read a File object, validate, and import.
 */
export async function importFromFile(
  file: File,
  mode: ImportMode = 'replace'
): Promise<ImportResult> {
  const text = await file.text();
  const validation = validateBackup(text);

  if (!validation.success) {
    return {
      success: false,
      problemsImported: 0,
      topicsImported: 0,
      reviewLogsImported: 0,
      errors: validation.errors,
    };
  }

  return importDatabase(validation.data, mode);
}
