// ===================================================================
// AtCoder Metadata Fetcher
// Uses Kenkoooo API:
// - Problems: https://kenkoooo.com/atcoder/resources/problems.json
// - Models: https://kenkoooo.com/atcoder/resources/problem-models.json
// ===================================================================

export interface AtCoderMetadata {
  title: string;
  difficulty: number;
  platformTags: string[];
}

interface KenkooooProblem {
  id: string;
  contest_id: string;
  title: string;
  name: string;
}

interface KenkooooModel {
  difficulty?: number;
  rawDifficulty?: number;
  is_experimental?: boolean;
}

let atCoderCache: Map<string, { title: string; contest_id: string }> | null = null;
let atCoderModelCache: Map<string, number> | null = null;

async function loadAtCoderData() {
  if (!atCoderCache) {
    try {
      const res = await fetch('https://kenkoooo.com/atcoder/resources/problems.json');
      if (res.ok) {
        const data: KenkooooProblem[] = await res.json();
        const map = new Map<string, { title: string; contest_id: string }>();
        for (const item of data) {
          map.set(item.id, { title: item.title || item.name, contest_id: item.contest_id });
        }
        atCoderCache = map;
      }
    } catch {
      // Fallback ignore error
    }
  }

  if (!atCoderModelCache) {
    try {
      const res = await fetch('https://kenkoooo.com/atcoder/resources/problem-models.json');
      if (res.ok) {
        const data: Record<string, KenkooooModel> = await res.json();
        const map = new Map<string, number>();
        for (const [id, model] of Object.entries(data)) {
          if (typeof model.difficulty === 'number') {
            map.set(id, Math.max(0, model.difficulty));
          }
        }
        atCoderModelCache = map;
      }
    } catch {
      // Fallback ignore error
    }
  }
}

/**
 * Fetches AtCoder problem metadata given problemId (e.g., 'abc240_c').
 */
export async function fetchAtCoderMetadata(
  problemId: string
): Promise<AtCoderMetadata | null> {
  const cleanId = problemId.toLowerCase();
  await loadAtCoderData();

  const probInfo = atCoderCache?.get(cleanId);
  if (!probInfo) return null;

  const difficulty = atCoderModelCache?.get(cleanId) ?? 0;

  return {
    title: probInfo.title,
    difficulty,
    platformTags: [probInfo.contest_id],
  };
}
