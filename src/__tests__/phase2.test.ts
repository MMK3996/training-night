// ===================================================================
// Phase 2 Unit Tests
// Tests: SM-2 SRS Algorithm and University Priority Scheduler Engine
// ===================================================================

import { describe, expect, it } from 'vitest';
import { calculateSM2, calculateSM2Binary } from '../lib/sm2';
import {
  calculateDayDifference,
  calculateTopicPriority,
  sortAcademicTopicsByPriority,
} from '../lib/priorityScheduler';
import { createDefaultSRSMetrics } from '../types';
import type { CourseTopicItem, SRSMetrics } from '../types';

// ===================================================================
// SM-2 Algorithm Tests
// ===================================================================
describe('SM-2 Algorithm (calculateSM2 & calculateSM2Binary)', () => {
  const refDate = '2026-09-18';

  it('handles first successful review (q = 4)', () => {
    const initial = createDefaultSRSMetrics();
    const result = calculateSM2(initial, { rating: 4, referenceDate: refDate });

    expect(result.repetitionCount).toBe(1);
    expect(result.interval).toBe(1);
    expect(result.dueDate).toBe('2026-09-19'); // 1 day after refDate
    expect(result.consecutiveFailures).toBe(0);
    expect(result.isLeech).toBe(false);
    // EF' = 2.5 + (0.1 - (5 - 4) * (0.08 + (5 - 4) * 0.02)) = 2.5 + 0.0 = 2.5
    expect(result.easinessFactor).toBe(2.5);
  });

  it('handles second successful review (q = 4)', () => {
    const metrics: SRSMetrics = {
      repetitionCount: 1,
      interval: 1,
      easinessFactor: 2.5,
      dueDate: refDate,
      lastReviewedAt: refDate,
      consecutiveFailures: 0,
      isLeech: false,
    };

    const result = calculateSM2(metrics, { rating: 4, referenceDate: refDate });

    expect(result.repetitionCount).toBe(2);
    expect(result.interval).toBe(6);
    expect(result.dueDate).toBe('2026-09-24'); // 6 days after refDate
  });

  it('handles third successful review (q = 5, easy bonus)', () => {
    const metrics: SRSMetrics = {
      repetitionCount: 2,
      interval: 6,
      easinessFactor: 2.5,
      dueDate: refDate,
      lastReviewedAt: refDate,
      consecutiveFailures: 0,
      isLeech: false,
    };

    const result = calculateSM2(metrics, { rating: 5, referenceDate: refDate });

    // EF' = 2.5 + (0.1 - 0) = 2.6
    expect(result.easinessFactor).toBe(2.6);
    expect(result.repetitionCount).toBe(3);
    // Interval = ceil(6 * 2.6) = 16
    expect(result.interval).toBe(16);
    expect(result.dueDate).toBe('2026-10-04'); // 16 days after refDate
  });

  it('handles failed review (q = 1, "Didn\'t know it")', () => {
    const metrics: SRSMetrics = {
      repetitionCount: 5,
      interval: 30,
      easinessFactor: 2.5,
      dueDate: refDate,
      lastReviewedAt: refDate,
      consecutiveFailures: 1,
      isLeech: false,
    };

    const result = calculateSM2(metrics, { rating: 1, referenceDate: refDate });

    expect(result.repetitionCount).toBe(0); // Reset repetitions
    expect(result.interval).toBe(1); // Reset interval
    expect(result.consecutiveFailures).toBe(2);
    expect(result.dueDate).toBe('2026-09-19');
    // EF' = 2.5 + (0.1 - (4) * (0.08 + 4 * 0.02)) = 2.5 + (0.1 - 4 * 0.16) = 2.5 - 0.54 = 1.96
    expect(result.easinessFactor).toBe(1.96);
  });

  it('enforces minimum Easiness Factor (EF >= 1.3)', () => {
    const metrics: SRSMetrics = {
      repetitionCount: 0,
      interval: 1,
      easinessFactor: 1.3,
      dueDate: refDate,
      lastReviewedAt: refDate,
      consecutiveFailures: 3,
      isLeech: false,
    };

    const result = calculateSM2(metrics, { rating: 0, referenceDate: refDate });

    expect(result.easinessFactor).toBe(1.3);
  });

  it('detects leeches when consecutive failures reach threshold', () => {
    const metrics: SRSMetrics = {
      repetitionCount: 0,
      interval: 1,
      easinessFactor: 1.8,
      dueDate: refDate,
      lastReviewedAt: refDate,
      consecutiveFailures: 3,
      isLeech: false,
    };

    const result = calculateSM2(metrics, { rating: 1, leechThreshold: 4, referenceDate: refDate });

    expect(result.consecutiveFailures).toBe(4);
    expect(result.isLeech).toBe(true);
  });

  it('resets consecutive failures on successful review', () => {
    const metrics: SRSMetrics = {
      repetitionCount: 0,
      interval: 1,
      easinessFactor: 1.8,
      dueDate: refDate,
      lastReviewedAt: refDate,
      consecutiveFailures: 3,
      isLeech: false,
    };

    const result = calculateSM2(metrics, { rating: 4, referenceDate: refDate });

    expect(result.consecutiveFailures).toBe(0);
    expect(result.isLeech).toBe(false);
  });

  it('handles calculateSM2Binary ("knew" vs "forgot")', () => {
    const initial = createDefaultSRSMetrics();

    const knewResult = calculateSM2Binary(initial, 'knew', 4, refDate);
    expect(knewResult.repetitionCount).toBe(1);
    expect(knewResult.interval).toBe(1);

    const forgotResult = calculateSM2Binary(initial, 'forgot', 4, refDate);
    expect(forgotResult.repetitionCount).toBe(0);
    expect(forgotResult.consecutiveFailures).toBe(1);
  });
});

// ===================================================================
// University Priority Scheduler Tests
// ===================================================================
describe('University Priority Scheduler (calculateTopicPriority & sort)', () => {
  const today = '2026-09-18';

  const baseTopic: CourseTopicItem = {
    id: 'topic-1',
    courseId: 'CS-101',
    courseName: 'Intro to CS',
    topicName: 'Arrays & Strings',
    initialMastery: 3,
    currentMastery: 3,
    courseWeight: 1.0,
    examDate: null,
    notes: '',
    srs: {
      repetitionCount: 1,
      interval: 1,
      easinessFactor: 2.5,
      dueDate: '2026-09-18',
      lastReviewedAt: '2026-09-17',
      consecutiveFailures: 0,
      isLeech: false,
    },
    createdAt: '2026-09-01',
    updatedAt: '2026-09-17',
  };

  it('calculates day differences correctly', () => {
    expect(calculateDayDifference('2026-09-18', '2026-09-18')).toBe(0);
    expect(calculateDayDifference('2026-09-18', '2026-09-20')).toBe(2);
    expect(calculateDayDifference('2026-09-20', '2026-09-18')).toBe(-2);
  });

  it('calculates priority score for standard topic on due date', () => {
    // Mastery = 3 -> Mastery factor = 6 - 3 = 3
    // Overdue = 0 -> Overdue factor = 1 + 0 = 1
    // Weight = 1.0, ExamUrgency = 1.0
    // Priority = 1.0 * 3 * 1 * 1 = 3.0
    const breakdown = calculateTopicPriority(baseTopic, today);

    expect(breakdown.score).toBe(3.0);
    expect(breakdown.masteryFactor).toBe(3);
    expect(breakdown.daysOverdue).toBe(0);
    expect(breakdown.examUrgencyFactor).toBe(1.0);
  });

  it('increases priority for overdue topics', () => {
    // Due 6 days ago (2026-09-12)
    const overdueTopic: CourseTopicItem = {
      ...baseTopic,
      srs: { ...baseTopic.srs, dueDate: '2026-09-12' },
    };

    const breakdown = calculateTopicPriority(overdueTopic, today);

    expect(breakdown.daysOverdue).toBe(6);
    // Overdue factor = 1 + 6 / 3 = 3.0
    // Priority = 1.0 * 3 * 3.0 * 1.0 = 9.0
    expect(breakdown.score).toBe(9.0);
  });

  it('increases priority for low mastery topics', () => {
    // Mastery = 1 -> Mastery factor = 6 - 1 = 5
    const lowMasteryTopic: CourseTopicItem = {
      ...baseTopic,
      currentMastery: 1,
    };

    const breakdown = calculateTopicPriority(lowMasteryTopic, today);
    expect(breakdown.masteryFactor).toBe(5);
    expect(breakdown.score).toBe(5.0);
  });

  it('boosts priority for upcoming exam within 14 days', () => {
    // Exam in 7 days (2026-09-25)
    // E_factor = 1.0 + 14 / 7 = 3.0
    const examTopic: CourseTopicItem = {
      ...baseTopic,
      examDate: '2026-09-25',
    };

    const breakdown = calculateTopicPriority(examTopic, today);
    expect(breakdown.daysUntilExam).toBe(7);
    expect(breakdown.examUrgencyFactor).toBe(3.0);
    // Score = 1.0 * 3 * 1 * 3.0 = 9.0
    expect(breakdown.score).toBe(9.0);
  });

  it('handles course weight scaling', () => {
    const weightedTopic: CourseTopicItem = {
      ...baseTopic,
      courseWeight: 2.0,
    };

    const breakdown = calculateTopicPriority(weightedTopic, today);
    expect(breakdown.courseWeight).toBe(2.0);
    // Score = 2.0 * 3 * 1 * 1 = 6.0
    expect(breakdown.score).toBe(6.0);
  });

  it('sorts academic topics by due status and priority score', () => {
    const dueLowPriority: CourseTopicItem = {
      ...baseTopic,
      id: 'due-low',
      currentMastery: 5, // Score = 1.0 * 1 * 1 = 1.0
      srs: { ...baseTopic.srs, dueDate: today },
    };

    const dueHighPriority: CourseTopicItem = {
      ...baseTopic,
      id: 'due-high',
      currentMastery: 1, // Score = 1.0 * 5 * 1 = 5.0
      srs: { ...baseTopic.srs, dueDate: today },
    };

    const notDueHighPriority: CourseTopicItem = {
      ...baseTopic,
      id: 'not-due-high',
      currentMastery: 1, // Score = 5.0, but due in future
      srs: { ...baseTopic.srs, dueDate: '2026-10-01' },
    };

    const sorted = sortAcademicTopicsByPriority(
      [dueLowPriority, notDueHighPriority, dueHighPriority],
      today
    );

    // Order should be: dueHighPriority -> dueLowPriority -> notDueHighPriority
    expect(sorted[0].topic.id).toBe('due-high');
    expect(sorted[1].topic.id).toBe('due-low');
    expect(sorted[2].topic.id).toBe('not-due-high');
  });
});
