// ===================================================================
// Phase 3 Unit & Integration Tests
// Tests: URL Parser, Codeforces/AtCoder/CSES/USACO Fetchers, Metadata Resolver
// ===================================================================

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { parseProblemURL } from '../services/urlParser';
import { fetchCSESMetadata } from '../services/fetchers/csesFetcher';
import { fetchUSACOMetadata } from '../services/fetchers/usacoFetcher';
import { resolveProblemMetadata } from '../services/metadataResolver';

describe('URL Parser (parseProblemURL)', () => {
  it('parses Codeforces contest URL', () => {
    const url = 'https://codeforces.com/contest/158/problem/A';
    const parsed = parseProblemURL(url);
    expect(parsed.isValid).toBe(true);
    expect(parsed.platform).toBe('codeforces');
    expect(parsed.contestId).toBe('158');
    expect(parsed.index).toBe('A');
    expect(parsed.problemId).toBe('158A');
  });

  it('parses Codeforces problemset URL', () => {
    const url = 'https://codeforces.com/problemset/problem/158/B';
    const parsed = parseProblemURL(url);
    expect(parsed.isValid).toBe(true);
    expect(parsed.platform).toBe('codeforces');
    expect(parsed.contestId).toBe('158');
    expect(parsed.index).toBe('B');
    expect(parsed.problemId).toBe('158B');
  });

  it('parses Codeforces gym URL', () => {
    const url = 'https://codeforces.com/gym/102951/problem/A';
    const parsed = parseProblemURL(url);
    expect(parsed.isValid).toBe(true);
    expect(parsed.platform).toBe('codeforces');
    expect(parsed.problemId).toBe('gym-102951A');
  });

  it('parses AtCoder task URL', () => {
    const url = 'https://atcoder.jp/contests/abc240/tasks/abc240_c';
    const parsed = parseProblemURL(url);
    expect(parsed.isValid).toBe(true);
    expect(parsed.platform).toBe('atcoder');
    expect(parsed.contestId).toBe('abc240');
    expect(parsed.problemId).toBe('abc240_c');
  });

  it('parses CSES task URL', () => {
    const url = 'https://cses.fi/problemset/task/1068';
    const parsed = parseProblemURL(url);
    expect(parsed.isValid).toBe(true);
    expect(parsed.platform).toBe('cses');
    expect(parsed.problemId).toBe('1068');
  });

  it('parses USACO problem URL', () => {
    const url = 'http://usaco.org/index.php?page=viewproblem2&cpid=1060';
    const parsed = parseProblemURL(url);
    expect(parsed.isValid).toBe(true);
    expect(parsed.platform).toBe('usaco');
    expect(parsed.problemId).toBe('usaco-1060');
    expect(parsed.contestId).toBe('1060');
  });

  it('falls back to custom platform for non-standard URL', () => {
    const url = 'https://leetcode.com/problems/two-sum/';
    const parsed = parseProblemURL(url);
    expect(parsed.isValid).toBe(true);
    expect(parsed.platform).toBe('custom');
  });

  it('returns invalid for empty string', () => {
    const parsed = parseProblemURL('');
    expect(parsed.isValid).toBe(false);
  });
});

describe('Static Catalog Fetchers', () => {
  it('resolves CSES static catalog entry', async () => {
    const data = await fetchCSESMetadata('1068');
    expect(data).not.toBeNull();
    expect(data!.title).toBe('Weird Algorithm');
    expect(data!.platformTags).toContain('Introductory Problems');
  });

  it('resolves USACO static catalog entry', async () => {
    const data = await fetchUSACOMetadata('1060');
    expect(data).not.toBeNull();
    expect(data!.title).toBe('Do You Know Your ABCs?');
    expect(data!.difficulty).toBe('Bronze');
  });
});

describe('Metadata Resolver Pipeline', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves Codeforces problem with mocked API response', async () => {
    const mockCFResponse = {
      status: 'OK',
      result: {
        problems: [
          { contestId: 158, index: 'A', name: 'Next Round', rating: 800, tags: ['implementation'] },
        ],
      },
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockCFResponse,
      })
    );

    const res = await resolveProblemMetadata('https://codeforces.com/contest/158/problem/A');
    expect(res.isValid).toBe(true);
    expect(res.platform).toBe('codeforces');
    expect(res.problemId).toBe('158A');
    expect(res.title).toBe('Next Round');
    expect(res.difficulty).toBe(800);
    expect(res.platformTags).toEqual(['implementation']);
  });

  it('resolves AtCoder problem with mocked API response', async () => {
    const mockAtCoderProblems = [
      { id: 'abc240_c', contest_id: 'abc240', title: 'Jumping Takahashi', name: 'Jumping Takahashi' },
    ];
    const mockAtCoderModels = {
      abc240_c: { difficulty: 250 },
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('problems.json')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockAtCoderProblems,
          });
        }
        if (url.includes('problem-models.json')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockAtCoderModels,
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      })
    );

    const res = await resolveProblemMetadata('https://atcoder.jp/contests/abc240/tasks/abc240_c');
    expect(res.isValid).toBe(true);
    expect(res.platform).toBe('atcoder');
    expect(res.title).toBe('Jumping Takahashi');
    expect(res.difficulty).toBe(250);
  });

  it('resolves CSES problem directly via static lookup without fetching', async () => {
    const res = await resolveProblemMetadata('https://cses.fi/problemset/task/1640');
    expect(res.isValid).toBe(true);
    expect(res.platform).toBe('cses');
    expect(res.title).toBe('Sum of Two Values');
    expect(res.platformTags).toContain('Sorting and Searching');
  });

  it('handles invalid URLs gracefully', async () => {
    const res = await resolveProblemMetadata('');
    expect(res.isValid).toBe(false);
    expect(res.title).toBe('Invalid URL');
  });
});
