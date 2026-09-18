// ===================================================================
// Phase 1 Integration Tests
// Tests: Types, Database CRUD, Backup/Restore, and Zustand Store
// ===================================================================
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  addAcademicTopic,
  addProblem,
  addReviewLog,
  clearAllData,
  deleteAcademicTopic,
  deleteProblem,
  getAllAcademicTopics,
  getAllProblems,
  getAllReviewLogs,
  getAcademicTopicById,
  getDueAcademicTopics,
  getDueProblems,
  getProblemById,
  getReviewLogsForItem,
  getSettings,
  updateAcademicTopic,
  updateProblem,
  updateSettings,
} from '../lib/db';
import {
  exportDatabase,
  importDatabase,
  validateBackup,
} from '../services/backupService';
import { useAppStore } from '../store/useAppStore';
import {
  createDefaultSRSMetrics,
  createDefaultSettings,
} from '../types';
import type { DatabaseBackup } from '../types';

// ===================================================================
// Setup & Teardown
// ===================================================================
beforeEach(async () => {
  await clearAllData();
  // Reset Zustand store
  useAppStore.setState({
    theme: 'system',
    activeTab: 'dashboard',
    activeModal: null,
    modalData: {},
    reviewSessionActive: false,
    reviewItemIds: [],
    currentReviewIndex: 0,
  });
});

afterEach(async () => {
  await clearAllData();
});

// ===================================================================
// Type Factories
// ===================================================================
describe('Type Factories', () => {
  it('creates default SRS metrics with correct initial values', () => {
    const srs = createDefaultSRSMetrics();
    expect(srs.repetitionCount).toBe(0);
    expect(srs.interval).toBe(0);
    expect(srs.easinessFactor).toBe(2.5);
    expect(srs.lastReviewedAt).toBeNull();
    expect(srs.consecutiveFailures).toBe(0);
    expect(srs.isLeech).toBe(false);
    expect(srs.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('creates default settings with correct values', () => {
    const settings = createDefaultSettings();
    expect(settings.theme).toBe('system');
    expect(settings.dailyReviewLimit).toBe(50);
    expect(settings.sm2Defaults.initialEF).toBe(2.5);
    expect(settings.sm2Defaults.minEF).toBe(1.3);
    expect(settings.leechThreshold).toBe(4);
    expect(settings.enableAudioEffects).toBe(false);
  });
});

// ===================================================================
// Database CRUD — Problems
// ===================================================================
describe('Problem CRUD', () => {
  const sampleProblem = {
    url: 'https://codeforces.com/contest/158/problem/A',
    platform: 'codeforces' as const,
    problemId: '158A',
    title: 'Next Round',
    difficulty: 800,
    platformTags: ['implementation'],
    userTags: ['easy', 'warmup'],
    category: 'Practice',
    notes: 'Simple comparison problem.',
  };

  it('adds a problem and retrieves it by ID', async () => {
    const id = await addProblem(sampleProblem);
    expect(id).toBeTruthy();

    const problem = await getProblemById(id);
    expect(problem).toBeDefined();
    expect(problem!.title).toBe('Next Round');
    expect(problem!.platform).toBe('codeforces');
    expect(problem!.srs.easinessFactor).toBe(2.5);
    expect(problem!.createdAt).toBeTruthy();
  });

  it('lists all problems', async () => {
    await addProblem(sampleProblem);
    await addProblem({ ...sampleProblem, problemId: '158B', title: 'Taxi' });

    const all = await getAllProblems();
    expect(all.length).toBe(2);
  });

  it('updates a problem partially', async () => {
    const id = await addProblem(sampleProblem);
    await updateProblem(id, { title: 'Updated Title', difficulty: 900 });

    const updated = await getProblemById(id);
    expect(updated!.title).toBe('Updated Title');
    expect(updated!.difficulty).toBe(900);
    expect(updated!.platform).toBe('codeforces'); // unchanged
  });

  it('deletes a problem', async () => {
    const id = await addProblem(sampleProblem);
    await deleteProblem(id);
    const result = await getProblemById(id);
    expect(result).toBeUndefined();
  });

  it('returns due problems based on date', async () => {
    const id = await addProblem(sampleProblem);
    // The default SRS metrics set dueDate to today, so it should be due
    const due = await getDueProblems();
    expect(due.length).toBe(1);
    expect(due[0].id).toBe(id);

    // Set due date to far future — should not appear
    await updateProblem(id, {
      srs: { ...createDefaultSRSMetrics(), dueDate: '2099-12-31' },
    });
    const notDue = await getDueProblems();
    expect(notDue.length).toBe(0);
  });
});

// ===================================================================
// Database CRUD — Academic Topics
// ===================================================================
describe('Academic Topic CRUD', () => {
  const sampleTopic = {
    courseId: 'CS-301',
    courseName: 'Operating Systems',
    topicName: 'Virtual Memory',
    subtopicName: 'TLB Hit Ratio',
    initialMastery: 2,
    currentMastery: 2,
    courseWeight: 1.5,
    examDate: '2026-12-15',
    notes: 'Focus on page replacement algorithms.',
  };

  it('adds an academic topic and retrieves it', async () => {
    const id = await addAcademicTopic(sampleTopic);
    const topic = await getAcademicTopicById(id);
    expect(topic).toBeDefined();
    expect(topic!.courseName).toBe('Operating Systems');
    expect(topic!.initialMastery).toBe(2);
    expect(topic!.srs.easinessFactor).toBe(2.5);
  });

  it('updates an academic topic', async () => {
    const id = await addAcademicTopic(sampleTopic);
    await updateAcademicTopic(id, { currentMastery: 4 });
    const updated = await getAcademicTopicById(id);
    expect(updated!.currentMastery).toBe(4);
  });

  it('deletes an academic topic', async () => {
    const id = await addAcademicTopic(sampleTopic);
    await deleteAcademicTopic(id);
    const result = await getAcademicTopicById(id);
    expect(result).toBeUndefined();
  });

  it('returns due academic topics', async () => {
    await addAcademicTopic(sampleTopic);
    const due = await getDueAcademicTopics();
    expect(due.length).toBe(1);
  });
});

// ===================================================================
// Database CRUD — Review Logs
// ===================================================================
describe('Review Log CRUD', () => {
  it('adds and retrieves review logs for an item', async () => {
    const problemId = await addProblem({
      url: 'https://codeforces.com/contest/1/problem/A',
      platform: 'codeforces',
      problemId: '1A',
      title: 'Theatre Square',
      difficulty: 1000,
      platformTags: ['math'],
      userTags: [],
      category: 'Practice',
      notes: '',
    });

    const logId = await addReviewLog({
      itemId: problemId,
      itemType: 'cp_problem',
      rating: 4,
      binaryResult: 'knew',
      reviewedAt: new Date().toISOString(),
      intervalBefore: 0,
      intervalAfter: 1,
      easinessFactorBefore: 2.5,
      easinessFactorAfter: 2.5,
    });

    expect(logId).toBeTruthy();

    const logs = await getReviewLogsForItem(problemId);
    expect(logs.length).toBe(1);
    expect(logs[0].rating).toBe(4);
    expect(logs[0].binaryResult).toBe('knew');
  });

  it('lists all review logs', async () => {
    await addReviewLog({
      itemId: 'fake-id-1',
      itemType: 'cp_problem',
      rating: 1,
      binaryResult: 'forgot',
      reviewedAt: new Date().toISOString(),
      intervalBefore: 6,
      intervalAfter: 1,
      easinessFactorBefore: 2.5,
      easinessFactorAfter: 2.36,
    });
    await addReviewLog({
      itemId: 'fake-id-2',
      itemType: 'academic_topic',
      rating: 5,
      binaryResult: 'knew',
      reviewedAt: new Date().toISOString(),
      intervalBefore: 1,
      intervalAfter: 6,
      easinessFactorBefore: 2.5,
      easinessFactorAfter: 2.6,
    });

    const all = await getAllReviewLogs();
    expect(all.length).toBe(2);
  });
});

// ===================================================================
// Settings CRUD
// ===================================================================
describe('Settings', () => {
  it('returns defaults when no settings exist', async () => {
    const settings = await getSettings();
    expect(settings.theme).toBe('system');
    expect(settings.dailyReviewLimit).toBe(50);
  });

  it('updates settings and persists them', async () => {
    await updateSettings({ theme: 'dark', dailyReviewLimit: 100 });
    const settings = await getSettings();
    expect(settings.theme).toBe('dark');
    expect(settings.dailyReviewLimit).toBe(100);
    // Other defaults should be preserved
    expect(settings.leechThreshold).toBe(4);
  });
});

// ===================================================================
// Backup / Restore
// ===================================================================
describe('Backup & Restore', () => {
  it('exports a valid backup object', async () => {
    await addProblem({
      url: 'https://codeforces.com/contest/1/problem/A',
      platform: 'codeforces',
      problemId: '1A',
      title: 'Theatre Square',
      difficulty: 1000,
      platformTags: ['math'],
      userTags: [],
      category: 'Practice',
      notes: '',
    });

    const backup = await exportDatabase();
    expect(backup.version).toBe(1);
    expect(backup.problems.length).toBe(1);
    expect(backup.academicTopics.length).toBe(0);
    expect(backup.settings).toBeDefined();
    expect(backup.exportedAt).toBeTruthy();
  });

  it('validates correct JSON and rejects invalid JSON', () => {
    const invalidResult = validateBackup('not json at all');
    expect(invalidResult.success).toBe(false);

    const missingFieldsResult = validateBackup(JSON.stringify({ version: 1 }));
    expect(missingFieldsResult.success).toBe(false);
  });

  it('round-trips: export → clear → import → verify', async () => {
    // Seed data
    await addProblem({
      url: 'https://atcoder.jp/contests/abc240/tasks/abc240_c',
      platform: 'atcoder',
      problemId: 'abc240_c',
      title: 'Jumping Takahashi',
      difficulty: 1200,
      platformTags: ['dp'],
      userTags: ['weak'],
      category: 'Contest',
      notes: 'BFS approach works too.',
    });

    await addAcademicTopic({
      courseId: 'MATH-201',
      courseName: 'Linear Algebra',
      topicName: 'Eigenvalues',
      initialMastery: 3,
      currentMastery: 3,
      courseWeight: 1.0,
      notes: 'Characteristic polynomial method.',
    });

    await updateSettings({ theme: 'dark' });

    // Export
    const backup = await exportDatabase();

    // Clear everything
    await clearAllData();
    expect((await getAllProblems()).length).toBe(0);
    expect((await getAllAcademicTopics()).length).toBe(0);

    // Import
    const result = await importDatabase(backup, 'replace');
    expect(result.success).toBe(true);
    expect(result.problemsImported).toBe(1);
    expect(result.topicsImported).toBe(1);

    // Verify restored data
    const problems = await getAllProblems();
    expect(problems.length).toBe(1);
    expect(problems[0].title).toBe('Jumping Takahashi');

    const topics = await getAllAcademicTopics();
    expect(topics.length).toBe(1);
    expect(topics[0].topicName).toBe('Eigenvalues');

    const settings = await getSettings();
    expect(settings.theme).toBe('dark');
  });

  it('rejects backup with future schema version', async () => {
    const futureBackup: DatabaseBackup = {
      version: 999,
      exportedAt: new Date().toISOString(),
      problems: [],
      academicTopics: [],
      reviewLogs: [],
      settings: createDefaultSettings(),
    };
    const result = await importDatabase(futureBackup);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('newer');
  });
});

// ===================================================================
// Zustand Store
// ===================================================================
describe('AppStore (Zustand)', () => {
  it('initializes with default state', () => {
    const state = useAppStore.getState();
    expect(state.activeTab).toBe('dashboard');
    expect(state.activeModal).toBeNull();
    expect(state.reviewSessionActive).toBe(false);
    expect(state.theme).toBe('system');
  });

  it('changes active tab', () => {
    useAppStore.getState().setActiveTab('problems');
    expect(useAppStore.getState().activeTab).toBe('problems');
  });

  it('opens and closes modals', () => {
    useAppStore.getState().openModal('addProblem', { source: 'url-paste' });
    const state = useAppStore.getState();
    expect(state.activeModal).toBe('addProblem');
    expect(state.modalData.source).toBe('url-paste');

    useAppStore.getState().closeModal();
    expect(useAppStore.getState().activeModal).toBeNull();
    expect(useAppStore.getState().modalData).toEqual({});
  });

  it('manages problem filters', () => {
    useAppStore
      .getState()
      .setProblemFilters({ platforms: ['codeforces'], dueOnly: true });
    const filters = useAppStore.getState().problemFilters;
    expect(filters.platforms).toEqual(['codeforces']);
    expect(filters.dueOnly).toBe(true);
    expect(filters.tags).toEqual([]); // unchanged

    useAppStore.getState().resetProblemFilters();
    expect(useAppStore.getState().problemFilters.platforms).toEqual([]);
  });

  it('manages academic filters', () => {
    useAppStore
      .getState()
      .setAcademicFilters({ courseIds: ['CS-301'], dueOnly: true });
    const filters = useAppStore.getState().academicFilters;
    expect(filters.courseIds).toEqual(['CS-301']);
    expect(filters.dueOnly).toBe(true);

    useAppStore.getState().resetAcademicFilters();
    expect(useAppStore.getState().academicFilters.courseIds).toEqual([]);
  });

  it('manages review session lifecycle', () => {
    const ids = ['id-1', 'id-2', 'id-3'];
    useAppStore.getState().startReviewSession(ids);
    let state = useAppStore.getState();
    expect(state.reviewSessionActive).toBe(true);
    expect(state.reviewItemIds).toEqual(ids);
    expect(state.currentReviewIndex).toBe(0);

    useAppStore.getState().advanceReview();
    expect(useAppStore.getState().currentReviewIndex).toBe(1);

    useAppStore.getState().advanceReview();
    expect(useAppStore.getState().currentReviewIndex).toBe(2);

    // Advancing past the last item ends the session
    useAppStore.getState().advanceReview();
    state = useAppStore.getState();
    expect(state.reviewSessionActive).toBe(false);
    expect(state.reviewItemIds).toEqual([]);
    expect(state.currentReviewIndex).toBe(0);
  });

  it('can manually end a review session early', () => {
    useAppStore.getState().startReviewSession(['id-1', 'id-2']);
    useAppStore.getState().endReviewSession();
    const state = useAppStore.getState();
    expect(state.reviewSessionActive).toBe(false);
    expect(state.reviewItemIds).toEqual([]);
  });

  it('sets theme', () => {
    useAppStore.getState().setTheme('dark');
    expect(useAppStore.getState().theme).toBe('dark');
    expect(useAppStore.getState().resolvedTheme).toBe('dark');

    useAppStore.getState().setTheme('light');
    expect(useAppStore.getState().resolvedTheme).toBe('light');
  });
});
