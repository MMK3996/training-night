// ===================================================================
// USACO Metadata Fetcher
// Uses local static dictionary of historical USACO problem CPIDs
// with CORS proxy fallback.
// ===================================================================

export interface USACOMetadata {
  title: string;
  difficulty: string;
  platformTags: string[];
}

const STATIC_USACO_CATALOG: Record<string, { title: string; division: string; yearMonth: string }> = {
  '1021': { title: 'Social Distancing I', division: 'Bronze', yearMonth: '2020 US Open' },
  '1022': { title: 'Social Distancing II', division: 'Bronze', yearMonth: '2020 US Open' },
  '1023': { title: 'Cowntact Tracing', division: 'Bronze', yearMonth: '2020 US Open' },
  '1035': { title: 'Word Processor', division: 'Bronze', yearMonth: '2020 January' },
  '1036': { title: 'Photoshoot', division: 'Bronze', yearMonth: '2020 January' },
  '1037': { title: 'Race', division: 'Bronze', yearMonth: '2020 January' },
  '1060': { title: 'Do You Know Your ABCs?', division: 'Bronze', yearMonth: '2020 December' },
  '1061': { title: 'Daisy Chains', division: 'Bronze', yearMonth: '2020 December' },
  '1062': { title: 'Stuck in a Rut', division: 'Bronze', yearMonth: '2020 December' },
  '1083': { title: 'Uddered but Not Herd', division: 'Bronze', yearMonth: '2021 January' },
  '1084': { title: 'Even More Odd Photos', division: 'Bronze', yearMonth: '2021 January' },
  '1085': { title: 'Just Stalling', division: 'Bronze', yearMonth: '2021 January' },
  '1155': { title: 'Lonely Photo', division: 'Bronze', yearMonth: '2021 December' },
  '1156': { title: 'Air Cownditioning', division: 'Bronze', yearMonth: '2021 December' },
  '1157': { title: 'Drought', division: 'Bronze', yearMonth: '2021 December' },
};

/**
 * Fetches USACO problem metadata given CPID (e.g. '1060' or 'usaco-1060').
 */
export async function fetchUSACOMetadata(
  cpidInput: string,
  corsProxy = 'https://api.allorigins.win/raw?url='
): Promise<USACOMetadata | null> {
  const cpid = cpidInput.replace(/^usaco-/i, '');
  const localMatch = STATIC_USACO_CATALOG[cpid];

  if (localMatch) {
    return {
      title: localMatch.title,
      difficulty: localMatch.division,
      platformTags: [localMatch.division, localMatch.yearMonth],
    };
  }

  // CORS proxy fallback
  try {
    const targetUrl = `http://usaco.org/index.php?page=viewproblem2&cpid=${cpid}`;
    const res = await fetch(`${corsProxy}${encodeURIComponent(targetUrl)}`);
    if (res.ok) {
      const html = await res.text();
      const titleMatch = html.match(/<h2>\s*USACO[^\n<]*:\s*([^<]+)<\/h2>/i) || html.match(/<h2>([^<]+)<\/h2>/i);
      if (titleMatch) {
        return {
          title: titleMatch[1].trim(),
          difficulty: 'USACO',
          platformTags: ['USACO'],
        };
      }
    }
  } catch {
    // Ignore proxy error
  }

  return {
    title: `USACO Problem #${cpid}`,
    difficulty: 'USACO',
    platformTags: ['USACO'],
  };
}
