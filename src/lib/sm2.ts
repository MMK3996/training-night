// ===================================================================
// Spaced Repetition System — Modified SM-2 Algorithm Implementation
// ===================================================================

import type { SRSMetrics } from '../types';

export interface SM2Options {
  /** Rating score from 0 to 5 */
  rating: 0 | 1 | 2 | 3 | 4 | 5;
  /** Custom leech threshold (default: 4 consecutive failures) */
  leechThreshold?: number;
  /** Optional reference date for due date calculation (YYYY-MM-DD, defaults to today) */
  referenceDate?: string;
}

/**
 * Calculates new SRS metrics given current metrics and a review rating (0..5).
 * 
 * Grade mappings:
 * 0 - Total blackout
 * 1 - Incorrect response; remembered upon revelation (Default "Didn't Know It")
 * 2 - Incorrect response; seemed easy to recall
 * 3 - Correct response after significant effort (Knew It - Hard)
 * 4 - Correct response after hesitation (Knew It - Good)
 * 5 - Perfect recall (Knew It - Easy)
 */
export function calculateSM2(
  currentMetrics: SRSMetrics,
  options: SM2Options
): SRSMetrics {
  const { rating, leechThreshold = 4, referenceDate } = options;

  const currentEF = currentMetrics.easinessFactor ?? 2.5;
  const currentRepetition = currentMetrics.repetitionCount ?? 0;
  const currentInterval = currentMetrics.interval ?? 0;
  const currentFailures = currentMetrics.consecutiveFailures ?? 0;

  // 1. Calculate new Easiness Factor (EF)
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const q = rating;
  const efDelta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  const newEF = Math.max(1.3, Number((currentEF + efDelta).toFixed(4)));

  let newRepetition: number;
  let newInterval: number;
  let newFailures: number;
  let isLeech: boolean;

  if (q < 3) {
    // Failure case
    newRepetition = 0;
    newInterval = 1;
    newFailures = currentFailures + 1;
    isLeech = newFailures >= leechThreshold;
  } else {
    // Success case
    newRepetition = currentRepetition + 1;
    newFailures = 0;
    isLeech = currentMetrics.isLeech && newFailures >= leechThreshold;

    if (newRepetition === 1) {
      newInterval = 1;
    } else if (newRepetition === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.ceil(currentInterval * newEF);
    }
  }

  // 2. Compute due date
  const refDateObj = referenceDate
    ? new Date(referenceDate)
    : new Date();
  
  // Ensure valid date
  const baseDate = isNaN(refDateObj.getTime()) ? new Date() : refDateObj;
  
  const dueDateObj = new Date(baseDate);
  dueDateObj.setDate(dueDateObj.getDate() + newInterval);
  const newDueDate = dueDateObj.toISOString().split('T')[0];

  const nowTimestamp = new Date().toISOString();

  return {
    repetitionCount: newRepetition,
    interval: newInterval,
    easinessFactor: newEF,
    dueDate: newDueDate,
    lastReviewedAt: nowTimestamp,
    consecutiveFailures: newFailures,
    isLeech,
  };
}

/**
 * Convenience wrapper for binary "Knew it" / "Didn't know it" review triggers.
 * - 'forgot' maps to grade q = 1
 * - 'knew' maps to grade q = 4
 */
export function calculateSM2Binary(
  currentMetrics: SRSMetrics,
  result: 'knew' | 'forgot',
  leechThreshold = 4,
  referenceDate?: string
): SRSMetrics {
  const rating: 0 | 1 | 2 | 3 | 4 | 5 = result === 'knew' ? 4 : 1;
  return calculateSM2(currentMetrics, {
    rating,
    leechThreshold,
    referenceDate,
  });
}
