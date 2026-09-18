// ===================================================================
// Competitive Programming Problem URL Parser & Router
// Supports: Codeforces, AtCoder, CSES, USACO
// ===================================================================

import type { CPPlatform } from '../types';

export interface ParsedURL {
  platform: CPPlatform;
  problemId: string;
  contestId?: string;
  index?: string;
  url: string;
  isValid: boolean;
}

/**
 * Parses a competitive programming problem URL and extracts platform metadata.
 */
export function parseProblemURL(rawUrl: string): ParsedURL {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { platform: 'custom', problemId: '', url: '', isValid: false };
  }

  try {
    const urlObj = new URL(trimmed);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname;

    // 1. Codeforces
    if (hostname.includes('codeforces.com')) {
      // Pattern: /contest/{contestId}/problem/{index}
      const contestMatch = pathname.match(/\/contest\/(\d+)\/problem\/([A-Za-z0-9]+)/i);
      if (contestMatch) {
        const contestId = contestMatch[1];
        const index = contestMatch[2].toUpperCase();
        return {
          platform: 'codeforces',
          problemId: `${contestId}${index}`,
          contestId,
          index,
          url: trimmed,
          isValid: true,
        };
      }

      // Pattern: /problemset/problem/{contestId}/{index}
      const problemsetMatch = pathname.match(/\/problemset\/problem\/(\d+)\/([A-Za-z0-9]+)/i);
      if (problemsetMatch) {
        const contestId = problemsetMatch[1];
        const index = problemsetMatch[2].toUpperCase();
        return {
          platform: 'codeforces',
          problemId: `${contestId}${index}`,
          contestId,
          index,
          url: trimmed,
          isValid: true,
        };
      }

      // Pattern: /gym/{contestId}/problem/{index}
      const gymMatch = pathname.match(/\/gym\/(\d+)\/problem\/([A-Za-z0-9]+)/i);
      if (gymMatch) {
        const contestId = gymMatch[1];
        const index = gymMatch[2].toUpperCase();
        return {
          platform: 'codeforces',
          problemId: `gym-${contestId}${index}`,
          contestId,
          index,
          url: trimmed,
          isValid: true,
        };
      }
    }

    // 2. AtCoder
    if (hostname.includes('atcoder.jp')) {
      // Pattern: /contests/{contestId}/tasks/{problemId}
      const atcoderMatch = pathname.match(/\/contests\/([^/]+)\/tasks\/([^/]+)/i);
      if (atcoderMatch) {
        const contestId = atcoderMatch[1].toLowerCase();
        const problemId = atcoderMatch[2].toLowerCase();
        return {
          platform: 'atcoder',
          problemId,
          contestId,
          url: trimmed,
          isValid: true,
        };
      }
    }

    // 3. CSES
    if (hostname.includes('cses.fi')) {
      // Pattern: /problemset/task/{id}
      const csesMatch = pathname.match(/\/problemset\/task\/(\d+)/i);
      if (csesMatch) {
        const problemId = csesMatch[1];
        return {
          platform: 'cses',
          problemId,
          url: trimmed,
          isValid: true,
        };
      }
    }

    // 4. USACO
    if (hostname.includes('usaco.org')) {
      // Pattern: cpid={cpid} in search params
      const cpid = urlObj.searchParams.get('cpid');
      if (cpid) {
        return {
          platform: 'usaco',
          problemId: `usaco-${cpid}`,
          contestId: cpid,
          url: trimmed,
          isValid: true,
        };
      }
    }

    // Fallback for custom / unsupported platform URLs
    return {
      platform: 'custom',
      problemId: pathname.replace(/[^a-zA-Z0-9-]/g, '_').slice(-20) || 'custom',
      url: trimmed,
      isValid: true,
    };
  } catch {
    return { platform: 'custom', problemId: '', url: trimmed, isValid: false };
  }
}
