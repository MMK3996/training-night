// ===================================================================
// Phase 5 Integration Tests
// Tests: Flashcard Review Mode, Review Log Recording, Dashboard Analytics Data Logic
// ===================================================================

import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  addProblem,
  addReviewLog,
  clearAllData,
  getAllReviewLogs,
  getProblemById,
} from '../lib/db';
import { calculateSM2Binary } from '../lib/sm2';

beforeEach(async () => {
  await clearAllData();
});

afterEach(async () => {
  await clearAllData();
});

describe('Phase 5: Flashcard Review Execution & Analytics Data', () => {
  it('executes a review, updates item SRS metrics, and records a review log', async () => {
    const pid = await addProblem({
      url: 'https://codeforces.com/contest/158/problem/A',
      platform: 'codeforces',
      problemId: '158A',
      title: 'Next Round',
      difficulty: 800,
      platformTags: ['implementation'],
      userTags: [],
      category: 'Practice',
      notes: 'Initial notes.',
    });

    const initialProblem = await getProblemById(pid);
    expect(initialProblem).toBeDefined();

    // Simulate "Knew It" review action
    const newSRS = calculateSM2Binary(initialProblem!.srs, 'knew');
    expect(newSRS.repetitionCount).toBe(1);
    expect(newSRS.interval).toBe(1);

    // Record review log
    const logId = await addReviewLog({
      itemId: pid,
      itemType: 'cp_problem',
      rating: 4,
      binaryResult: 'knew',
      reviewedAt: new Date().toISOString(),
      intervalBefore: initialProblem!.srs.interval,
      intervalAfter: newSRS.interval,
      easinessFactorBefore: initialProblem!.srs.easinessFactor,
      easinessFactorAfter: newSRS.easinessFactor,
    });

    expect(logId).toBeTruthy();

    const logs = await getAllReviewLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].binaryResult).toBe('knew');
  });

  it('aggregates daily study activity for heatmap', async () => {
    const today = new Date().toISOString().split('T')[0];

    await addReviewLog({
      itemId: 'fake-item-1',
      itemType: 'cp_problem',
      rating: 4,
      binaryResult: 'knew',
      reviewedAt: `${today}T10:00:00.000Z`,
      intervalBefore: 0,
      intervalAfter: 1,
      easinessFactorBefore: 2.5,
      easinessFactorAfter: 2.5,
    });

    await addReviewLog({
      itemId: 'fake-item-2',
      itemType: 'academic_topic',
      rating: 1,
      binaryResult: 'forgot',
      reviewedAt: `${today}T11:30:00.000Z`,
      intervalBefore: 6,
      intervalAfter: 1,
      easinessFactorBefore: 2.5,
      easinessFactorAfter: 2.36,
    });

    const logs = await getAllReviewLogs();
    const todayLogs = logs.filter((log) => log.reviewedAt.startsWith(today));
    expect(todayLogs.length).toBe(2);
  });
});
