// ===================================================================
// Phase 4 Unit & Integration Tests
// Tests: University Course Topics Management, Quick Mastery Adjuster, Priority Sorting
// ===================================================================

import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  addAcademicTopic,
  clearAllData,
  getAcademicTopicById,
  getAllAcademicTopics,
  updateAcademicTopic,
} from '../lib/db';
import { sortAcademicTopicsByPriority } from '../lib/priorityScheduler';

beforeEach(async () => {
  await clearAllData();
});

afterEach(async () => {
  await clearAllData();
});

describe('Phase 4: University Course & Topic Management', () => {
  it('creates an academic topic with initial mastery', async () => {
    const id = await addAcademicTopic({
      courseId: 'CS-301',
      courseName: 'Operating Systems',
      topicName: 'Process Synchronization',
      subtopicName: 'Semaphores & Mutexes',
      initialMastery: 2,
      currentMastery: 2,
      courseWeight: 1.5,
      examDate: '2026-10-15',
      notes: 'Mutex vs Semaphore difference.',
    });

    const topic = await getAcademicTopicById(id);
    expect(topic).toBeDefined();
    expect(topic!.courseName).toBe('Operating Systems');
    expect(topic!.initialMastery).toBe(2);
    expect(topic!.currentMastery).toBe(2);
    expect(topic!.courseWeight).toBe(1.5);
  });

  it('updates mastery level via Quick Mastery Adjuster', async () => {
    const id = await addAcademicTopic({
      courseId: 'MATH-201',
      courseName: 'Linear Algebra',
      topicName: 'Matrix Multiplication',
      initialMastery: 1,
      currentMastery: 1,
      courseWeight: 1.0,
      notes: '',
    });

    // Simulate clicking star rating 4
    await updateAcademicTopic(id, { currentMastery: 4 });

    const updated = await getAcademicTopicById(id);
    expect(updated!.currentMastery).toBe(4);
  });

  it('integrates with priority scheduler to rank topics dynamically', async () => {
    const today = '2026-09-18';

    await addAcademicTopic({
      courseId: 'CS-101',
      courseName: 'Intro',
      topicName: 'Low Mastery High Priority',
      initialMastery: 1,
      currentMastery: 1,
      courseWeight: 2.0,
      notes: '',
    });

    await addAcademicTopic({
      courseId: 'CS-101',
      courseName: 'Intro',
      topicName: 'High Mastery Low Priority',
      initialMastery: 5,
      currentMastery: 5,
      courseWeight: 1.0,
      notes: '',
    });

    const all = await getAllAcademicTopics();
    const sorted = sortAcademicTopicsByPriority(all, today);

    expect(sorted[0].topic.topicName).toBe('Low Mastery High Priority');
    expect(sorted[1].topic.topicName).toBe('High Mastery Low Priority');
  });
});
