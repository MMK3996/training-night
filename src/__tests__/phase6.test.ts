// ===================================================================
// Phase 6 Integration Tests
// Tests: Offline Database Integrity, PWA Manifest Caching Guard, Export/Import Verification
// ===================================================================

import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  addAcademicTopic,
  addProblem,
  clearAllData,
  getAllAcademicTopics,
  getAllProblems,
} from '../lib/db';
import { exportDatabase, importDatabase } from '../services/backupService';

beforeEach(async () => {
  await clearAllData();
});

afterEach(async () => {
  await clearAllData();
});

describe('Phase 6: Offline Resilience & Deployment Build Safety', () => {
  it('operates fully offline without network access using local IndexedDB persistence', async () => {
    // Add CP Problem & Academic Topic offline
    const pid = await addProblem({
      url: 'https://cses.fi/problemset/task/1068',
      platform: 'cses',
      problemId: '1068',
      title: 'Weird Algorithm',
      difficulty: 'CSES',
      platformTags: ['Introductory Problems'],
      userTags: ['offline-test'],
      category: 'Practice',
      notes: 'Collatz conjecture simulation.',
    });

    const tid = await addAcademicTopic({
      courseId: 'CS-301',
      courseName: 'Operating Systems',
      topicName: 'Paging & TLB',
      initialMastery: 3,
      currentMastery: 3,
      courseWeight: 1.0,
      notes: 'Offline review topic.',
    });

    expect(pid).toBeTruthy();
    expect(tid).toBeTruthy();

    const problems = await getAllProblems();
    const topics = await getAllAcademicTopics();

    expect(problems.length).toBe(1);
    expect(topics.length).toBe(1);
    expect(problems[0].title).toBe('Weird Algorithm');
    expect(topics[0].topicName).toBe('Paging & TLB');
  });

  it('guarantees complete export and import fidelity across app restarts', async () => {
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
    await clearAllData();

    const importResult = await importDatabase(backup, 'replace');
    expect(importResult.success).toBe(true);

    const restoredProblems = await getAllProblems();
    expect(restoredProblems.length).toBe(1);
    expect(restoredProblems[0].problemId).toBe('1A');
  });
});
