// ===================================================================
// Problem List & Card Display Component
// Renders filtered problem items with platform badges, SRS metrics,
// and action buttons.
// ===================================================================

import React from 'react';
import { useLiveQuery } from '../hooks/useLiveQuery';
import { db, deleteProblem } from '../lib/db';
import { useAppStore } from '../store/useAppStore';
import type { CPPlatform } from '../types';

export const ProblemList: React.FC = () => {
  const problems = useLiveQuery(() => db.problems.toArray(), []);
  const problemFilters = useAppStore((state) => state.problemFilters);
  const startReviewSession = useAppStore((state) => state.startReviewSession);

  if (!problems) {
    return <div className="text-slate-400 text-sm py-8 text-center">Loading problems...</div>;
  }

  const today = new Date().toISOString().split('T')[0];

  // Apply filters
  const filteredProblems = problems.filter((p) => {
    // 1. Platform filter
    if (
      problemFilters.platforms.length > 0 &&
      !problemFilters.platforms.includes(p.platform)
    ) {
      return false;
    }

    // 2. Due only filter
    if (problemFilters.dueOnly && p.srs.dueDate > today) {
      return false;
    }

    // 3. Search Query
    if (problemFilters.searchQuery.trim()) {
      const q = problemFilters.searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchId = p.problemId.toLowerCase().includes(q);
      const matchCategory = p.category.toLowerCase().includes(q);
      const matchNotes = p.notes.toLowerCase().includes(q);
      const matchTags =
        p.userTags.some((t) => t.toLowerCase().includes(q)) ||
        p.platformTags.some((t) => t.toLowerCase().includes(q));

      if (!matchTitle && !matchId && !matchCategory && !matchNotes && !matchTags) {
        return false;
      }
    }

    return true;
  });

  const getPlatformBadgeColor = (platform: CPPlatform) => {
    switch (platform) {
      case 'codeforces':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'atcoder':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'cses':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'usaco':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const handleStartReviewAllDue = () => {
    const dueIds = filteredProblems
      .filter((p) => p.srs.dueDate <= today)
      .map((p) => p.id);
    if (dueIds.length > 0) {
      startReviewSession(dueIds);
    }
  };

  const dueCount = filteredProblems.filter((p) => p.srs.dueDate <= today).length;

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Showing {filteredProblems.length} of {problems.length} problems
        </span>

        {dueCount > 0 && (
          <button
            onClick={handleStartReviewAllDue}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow-md shadow-amber-900/30 flex items-center gap-1.5"
          >
            🔥 Review {dueCount} Due Now
          </button>
        )}
      </div>

      {filteredProblems.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-sm">
          No problems found matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredProblems.map((p) => {
            const isDue = p.srs.dueDate <= today;
            return (
              <div
                key={p.id}
                className={`bg-slate-900 border rounded-xl p-4 transition-all hover:border-slate-700 ${
                  isDue
                    ? 'border-amber-500/40 bg-slate-900/90 shadow-md shadow-amber-950/20'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${getPlatformBadgeColor(
                          p.platform
                        )}`}
                      >
                        {p.platform}
                      </span>

                      {p.difficulty && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-300 rounded border border-slate-700">
                          Diff: {p.difficulty}
                        </span>
                      )}

                      {isDue && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-950 text-amber-300 rounded border border-amber-800/80 animate-pulse">
                          DUE NOW
                        </span>
                      )}

                      {p.srs.isLeech && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-red-950 text-red-300 rounded border border-red-800/80">
                          LEECH ⚠️
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-100 hover:text-emerald-400">
                      <a
                        href={p.url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5"
                      >
                        {p.title}
                        <span className="text-xs text-slate-500 font-normal">🔗</span>
                      </a>
                    </h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startReviewSession([p.id])}
                      className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded"
                    >
                      Review
                    </button>
                    <button
                      onClick={() => deleteProblem(p.id)}
                      className="text-slate-500 hover:text-red-400 text-xs px-1.5 py-1"
                      title="Delete Problem"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Tags & SRS status */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/50">
                  <div className="flex flex-wrap items-center gap-1">
                    {p.userTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 bg-slate-950 text-slate-300 text-[10px] rounded border border-slate-800"
                      >
                        #{tag}
                      </span>
                    ))}
                    {p.platformTags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 bg-slate-950/60 text-slate-400 text-[10px] rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>Interval: {p.srs.interval}d</span>
                    <span>EF: {p.srs.easinessFactor}</span>
                    <span>Due: {p.srs.dueDate}</span>
                  </div>
                </div>

                {p.notes && (
                  <div className="mt-2 text-xs bg-slate-950/80 border border-slate-800/60 p-2 rounded text-slate-300 font-mono text-[11px]">
                    💡 {p.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
