// ===================================================================
// University Priority Queue Engine
// Dynamic Priority Score Calculation & Sorting Logic
// ===================================================================

import type { CourseTopicItem } from '../types';

export interface PriorityScoreBreakdown {
  score: number;
  daysOverdue: number;
  daysUntilExam: number | null;
  examUrgencyFactor: number;
  masteryFactor: number;
  courseWeight: number;
}

/**
 * Calculates the number of days between two ISO date strings (date2 - date1).
 * Returns positive if date2 is after date1, negative if before.
 */
export function calculateDayDifference(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  
  // Clear time components for pure calendar day comparison
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);

  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Computes the Dynamic Priority Score (P) and detailed breakdown for an academic topic.
 * 
 * Formula:
 * P = W_course * (6 - Mastery) * (1 + max(0, DaysOverdue) / 3) * E_factor
 */
export function calculateTopicPriority(
  topic: CourseTopicItem,
  referenceDateStr?: string
): PriorityScoreBreakdown {
  const today = referenceDateStr ?? new Date().toISOString().split('T')[0];

  // 1. Course Weight (W_course)
  const courseWeight = Math.max(0.1, topic.courseWeight ?? 1.0);

  // 2. Mastery Factor (6 - CurrentMastery)
  // Clamp mastery between 1 and 5
  const clampedMastery = Math.min(5, Math.max(1, topic.currentMastery ?? topic.initialMastery ?? 3));
  const masteryFactor = 6 - clampedMastery;

  // 3. Days Overdue calculation
  let daysOverdue = 0;
  if (topic.srs && topic.srs.dueDate) {
    const diff = calculateDayDifference(topic.srs.dueDate, today);
    daysOverdue = Math.max(0, diff);
  }

  const overdueFactor = 1 + daysOverdue / 3;

  // 4. Exam Urgency Factor (E_factor)
  let daysUntilExam: number | null = null;
  let examUrgencyFactor = 1.0;

  if (topic.examDate) {
    const diffToExam = calculateDayDifference(today, topic.examDate);
    if (diffToExam >= 0) {
      daysUntilExam = diffToExam;
      if (daysUntilExam <= 14) {
        examUrgencyFactor = 1.0 + 14 / Math.max(1, daysUntilExam);
      }
    }
  }

  // 5. Total Priority Score
  const rawScore = courseWeight * masteryFactor * overdueFactor * examUrgencyFactor;
  const score = Number(rawScore.toFixed(4));

  return {
    score,
    daysOverdue,
    daysUntilExam,
    examUrgencyFactor,
    masteryFactor,
    courseWeight,
  };
}

/**
 * Sorts an array of CourseTopicItems by daily study recommendation priority.
 * 
 * Priority Rules:
 * 1. Urgency Rank: Items with DueDate <= Today, sorted descending by Priority Score P.
 * 2. Backlog / Upcoming: Items with DueDate > Today, sorted descending by Priority Score P.
 */
export function sortAcademicTopicsByPriority(
  topics: CourseTopicItem[],
  referenceDateStr?: string
): Array<{ topic: CourseTopicItem; breakdown: PriorityScoreBreakdown; isDue: boolean }> {
  const today = referenceDateStr ?? new Date().toISOString().split('T')[0];

  const mapped = topics.map((topic) => {
    const breakdown = calculateTopicPriority(topic, today);
    const isDue = topic.srs ? topic.srs.dueDate <= today : true;
    return { topic, breakdown, isDue };
  });

  return mapped.sort((a, b) => {
    // 1. Due items take precedence over non-due items
    if (a.isDue && !b.isDue) return -1;
    if (!a.isDue && b.isDue) return 1;

    // 2. Secondary sort: Priority score descending
    return b.breakdown.score - a.breakdown.score;
  });
}
