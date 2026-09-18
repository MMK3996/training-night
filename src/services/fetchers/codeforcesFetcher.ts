// ===================================================================
// Codeforces Metadata Fetcher
// Uses official Codeforces REST API (CORS enabled)
// Endpoint: https://codeforces.com/api/problemset.problems
// ===================================================================

export interface CFProblemMetadata {
  title: string;
  difficulty: number;
  platformTags: string[];
}

interface CFProblem {
  contestId: number;
  index: string;
  name: string;
  rating?: number;
  tags: string[];
}

interface CFResponse {
  status: string;
  result?: {
    problems: CFProblem[];
  };
}

let problemCache: Map<string, CFProblem> | null = null;
let fetchPromise: Promise<Map<string, CFProblem>> | null = null;

async function loadProblemset(): Promise<Map<string, CFProblem>> {
  if (problemCache) return problemCache;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await fetch('https://codeforces.com/api/problemset.problems');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: CFResponse = await res.json();
      
      const map = new Map<string, CFProblem>();
      if (data.status === 'OK' && data.result?.problems) {
        for (const prob of data.result.problems) {
          const key = `${prob.contestId}${prob.index.toUpperCase()}`;
          map.set(key, prob);
        }
      }
      problemCache = map;
      return map;
    } catch (err) {
      fetchPromise = null;
      throw err;
    }
  })();

  return fetchPromise;
}

/**
 * Fetches problem metadata from Codeforces given contestId and index.
 */
export async function fetchCodeforcesMetadata(
  contestId: string,
  index: string
): Promise<CFProblemMetadata | null> {
  const key = `${contestId}${index.toUpperCase()}`;
  try {
    const map = await loadProblemset();
    const prob = map.get(key);
    if (!prob) return null;

    return {
      title: prob.name,
      difficulty: prob.rating ?? 0,
      platformTags: prob.tags ?? [],
    };
  } catch (err) {
    console.warn(`Failed to fetch Codeforces metadata for ${key}:`, err);
    return null;
  }
}
