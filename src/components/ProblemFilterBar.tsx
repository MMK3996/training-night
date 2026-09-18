// ===================================================================
// Problem Filter & Search Bar Component
// Filters by Platform, Search query, Tags, Due Status, and Difficulty
// ===================================================================

import React from 'react';
import { useAppStore } from '../store/useAppStore';
import type { CPPlatform } from '../types';

export const ProblemFilterBar: React.FC = () => {
  const { problemFilters, setProblemFilters, resetProblemFilters, openModal } = useAppStore((state) => ({
    problemFilters: state.problemFilters,
    setProblemFilters: state.setProblemFilters,
    resetProblemFilters: state.resetProblemFilters,
    openModal: state.openModal,
  }));

  const platforms: CPPlatform[] = ['codeforces', 'atcoder', 'cses', 'usaco', 'custom'];

  const togglePlatform = (p: CPPlatform) => {
    const current = problemFilters.platforms;
    const next = current.includes(p)
      ? current.filter((item) => item !== p)
      : [...current, p];
    setProblemFilters({ platforms: next });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 text-slate-100 shadow-md space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search problems by title, tag, notes..."
            value={problemFilters.searchQuery}
            onChange={(e) => setProblemFilters({ searchQuery: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          {problemFilters.searchQuery && (
            <button
              onClick={() => setProblemFilters({ searchQuery: '' })}
              className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* Due Only Toggle & Add Problem Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setProblemFilters({ dueOnly: !problemFilters.dueOnly })}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
              problemFilters.dueOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            🔥 Due Only
          </button>

          <button
            onClick={() => openModal('addProblem')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md shadow-emerald-900/40 flex items-center gap-1.5"
          >
            <span>+</span> Add Problem
          </button>
        </div>
      </div>

      {/* Platform Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Platforms:
          </span>
          {platforms.map((p) => {
            const active = problemFilters.platforms.includes(p);
            return (
              <button
                key={p}
                onClick={() => togglePlatform(p)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize border transition-all ${
                  active
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {(problemFilters.platforms.length > 0 ||
          problemFilters.dueOnly ||
          problemFilters.searchQuery) && (
          <button
            onClick={resetProblemFilters}
            className="text-xs text-slate-400 hover:text-amber-400 underline"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
};
