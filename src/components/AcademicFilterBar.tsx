// ===================================================================
// Academic Topic Filter & Search Bar Component
// Search, Due Only toggle, Course filter, and Add Topic button
// ===================================================================

import React from 'react';
import { useAppStore } from '../store/useAppStore';

export const AcademicFilterBar: React.FC = () => {
  const academicFilters = useAppStore((state) => state.academicFilters);
  const setAcademicFilters = useAppStore((state) => state.setAcademicFilters);
  const resetAcademicFilters = useAppStore((state) => state.resetAcademicFilters);
  const openModal = useAppStore((state) => state.openModal);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 text-slate-100 shadow-md space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search academic topics, courses, notes..."
            value={academicFilters.searchQuery}
            onChange={(e) => setAcademicFilters({ searchQuery: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          {academicFilters.searchQuery && (
            <button
              onClick={() => setAcademicFilters({ searchQuery: '' })}
              className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAcademicFilters({ dueOnly: !academicFilters.dueOnly })}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
              academicFilters.dueOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            ⚡ Due Only
          </button>

          <button
            onClick={() => openModal('addTopic')}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-md shadow-cyan-900/40 flex items-center gap-1.5"
          >
            <span>+</span> Add Course Topic
          </button>
        </div>
      </div>

      {(academicFilters.dueOnly || academicFilters.searchQuery) && (
        <div className="flex justify-end pt-1 border-t border-slate-800/60">
          <button
            onClick={resetAcademicFilters}
            className="text-xs text-slate-400 hover:text-amber-400 underline"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
