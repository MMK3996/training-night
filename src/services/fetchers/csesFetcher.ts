// ===================================================================
// CSES Metadata Fetcher
// Uses local static dictionary of popular CSES problem IDs
// with CORS proxy fallback.
// ===================================================================

export interface CSESMetadata {
  title: string;
  difficulty: string;
  platformTags: string[];
}

const STATIC_CSES_CATALOG: Record<string, { title: string; category: string }> = {
  '1068': { title: 'Weird Algorithm', category: 'Introductory Problems' },
  '1083': { title: 'Missing Number', category: 'Introductory Problems' },
  '1069': { title: 'Repetitions', category: 'Introductory Problems' },
  '1094': { title: 'Increasing Array', category: 'Introductory Problems' },
  '1070': { title: 'Permutations', category: 'Introductory Problems' },
  '1071': { title: 'Number Spiral', category: 'Introductory Problems' },
  '1072': { title: 'Two Knights', category: 'Introductory Problems' },
  '1092': { title: 'Two Sets', category: 'Introductory Problems' },
  '1617': { title: 'Bit Strings', category: 'Introductory Problems' },
  '1618': { title: 'Trailing Zeros', category: 'Introductory Problems' },
  '1754': { title: 'Coin Piles', category: 'Introductory Problems' },
  '1755': { title: 'Palindrome Reorder', category: 'Introductory Problems' },
  '2205': { title: 'Gray Code', category: 'Introductory Problems' },
  '2165': { title: 'Tower of Hanoi', category: 'Introductory Problems' },
  '1622': { title: 'Creating Strings', category: 'Introductory Problems' },
  '1623': { title: 'Apple Division', category: 'Introductory Problems' },
  '1624': { title: 'Chessboard and Queens', category: 'Introductory Problems' },

  // Sorting and Searching
  '1621': { title: 'Distinct Numbers', category: 'Sorting and Searching' },
  '1084': { title: 'Apartments', category: 'Sorting and Searching' },
  '1090': { title: 'Ferris Wheel', category: 'Sorting and Searching' },
  '1091': { title: 'Concert Tickets', category: 'Sorting and Searching' },
  '1640': { title: 'Sum of Two Values', category: 'Sorting and Searching' },
  '1643': { title: 'Maximum Subarray Sum', category: 'Sorting and Searching' },

  // Dynamic Programming
  '1633': { title: 'Dice Combinations', category: 'Dynamic Programming' },
  '1634': { title: 'Minimizing Coins', category: 'Dynamic Programming' },
  '1635': { title: 'Coin Combinations I', category: 'Dynamic Programming' },
  '1636': { title: 'Coin Combinations II', category: 'Dynamic Programming' },
  '1637': { title: 'Removing Digits', category: 'Dynamic Programming' },
  '1638': { title: 'Grid Paths', category: 'Dynamic Programming' },
  '1158': { title: 'Book Shop', category: 'Dynamic Programming' },

  // Graph Algorithms
  '1192': { title: 'Counting Rooms', category: 'Graph Algorithms' },
  '1193': { title: 'Labyrinth', category: 'Graph Algorithms' },
  '1666': { title: 'Building Roads', category: 'Graph Algorithms' },
  '1667': { title: 'Message Route', category: 'Graph Algorithms' },
};

/**
 * Fetches CSES problem metadata given CSES task ID.
 */
export async function fetchCSESMetadata(
  problemId: string,
  corsProxy = 'https://api.allorigins.win/raw?url='
): Promise<CSESMetadata | null> {
  const localMatch = STATIC_CSES_CATALOG[problemId];
  if (localMatch) {
    return {
      title: localMatch.title,
      difficulty: 'CSES',
      platformTags: [localMatch.category],
    };
  }

  // CORS Proxy fallback
  try {
    const targetUrl = `https://cses.fi/problemset/task/${problemId}`;
    const res = await fetch(`${corsProxy}${encodeURIComponent(targetUrl)}`);
    if (res.ok) {
      const html = await res.text();
      const titleMatch = html.match(/<h1>([^<]+)<\/h1>/i) || html.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch) {
        let cleanTitle = titleMatch[1].replace(/CSES - /i, '').trim();
        return {
          title: cleanTitle,
          difficulty: 'CSES',
          platformTags: ['CSES Problemset'],
        };
      }
    }
  } catch {
    // Ignore proxy error
  }

  return {
    title: `CSES Problem ${problemId}`,
    difficulty: 'CSES',
    platformTags: ['CSES'],
  };
}
