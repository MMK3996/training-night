// ===================================================================
// Unified CP Problem Metadata Resolver Engine
// Routes URLs to platform-specific fetchers and returns standard problem metadata.
// ===================================================================

import type { CPPlatform } from '../types';
import { parseProblemURL } from './urlParser';
import { fetchCodeforcesMetadata } from './fetchers/codeforcesFetcher';
import { fetchAtCoderMetadata } from './fetchers/atcoderFetcher';
import { fetchCSESMetadata } from './fetchers/csesFetcher';
import { fetchUSACOMetadata } from './fetchers/usacoFetcher';

export interface ResolvedMetadata {
  url: string;
  platform: CPPlatform;
  problemId: string;
  title: string;
  difficulty: number | string;
  platformTags: string[];
  isValid: boolean;
}

/**
 * Resolves metadata for any given competitive programming URL.
 */
export async function resolveProblemMetadata(
  rawUrl: string,
  corsProxy?: string
): Promise<ResolvedMetadata> {
  const parsed = parseProblemURL(rawUrl);

  if (!parsed.isValid) {
    return {
      url: rawUrl,
      platform: 'custom',
      problemId: '',
      title: 'Invalid URL',
      difficulty: 0,
      platformTags: [],
      isValid: false,
    };
  }

  try {
    switch (parsed.platform) {
      case 'codeforces': {
        if (parsed.contestId && parsed.index) {
          const cfData = await fetchCodeforcesMetadata(parsed.contestId, parsed.index);
          if (cfData) {
            return {
              url: parsed.url,
              platform: 'codeforces',
              problemId: parsed.problemId,
              title: cfData.title,
              difficulty: cfData.difficulty,
              platformTags: cfData.platformTags,
              isValid: true,
            };
          }
        }
        return {
          url: parsed.url,
          platform: 'codeforces',
          problemId: parsed.problemId,
          title: `Codeforces Problem ${parsed.problemId}`,
          difficulty: 0,
          platformTags: ['codeforces'],
          isValid: true,
        };
      }

      case 'atcoder': {
        const atCoderData = await fetchAtCoderMetadata(parsed.problemId);
        if (atCoderData) {
          return {
            url: parsed.url,
            platform: 'atcoder',
            problemId: parsed.problemId,
            title: atCoderData.title,
            difficulty: atCoderData.difficulty,
            platformTags: atCoderData.platformTags,
            isValid: true,
          };
        }
        return {
          url: parsed.url,
          platform: 'atcoder',
          problemId: parsed.problemId,
          title: `AtCoder Task ${parsed.problemId}`,
          difficulty: 0,
          platformTags: ['atcoder'],
          isValid: true,
        };
      }

      case 'cses': {
        const csesData = await fetchCSESMetadata(parsed.problemId, corsProxy);
        if (csesData) {
          return {
            url: parsed.url,
            platform: 'cses',
            problemId: parsed.problemId,
            title: csesData.title,
            difficulty: csesData.difficulty,
            platformTags: csesData.platformTags,
            isValid: true,
          };
        }
        break;
      }

      case 'usaco': {
        const usacoData = await fetchUSACOMetadata(parsed.problemId, corsProxy);
        if (usacoData) {
          return {
            url: parsed.url,
            platform: 'usaco',
            problemId: parsed.problemId,
            title: usacoData.title,
            difficulty: usacoData.difficulty,
            platformTags: usacoData.platformTags,
            isValid: true,
          };
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.warn('Metadata resolution warning:', err);
  }

  // Fallback for custom or failed fetch
  return {
    url: parsed.url,
    platform: parsed.platform,
    problemId: parsed.problemId,
    title: `${parsed.platform.toUpperCase()} Problem`,
    difficulty: 0,
    platformTags: [parsed.platform],
    isValid: true,
  };
}
