// ===================================================================
// Main Visual Dashboard View Component
// Overview cards, Due Banners, Review Forecast, and Activity Heatmap.
// ===================================================================

import React from 'react';
import { useLiveQuery } from '../hooks/useLiveQuery';
import { db } from '../lib/db';
import { useAppStore } from '../store/useAppStore';
import { ReviewForecastChart } from './ReviewForecastChart';
import { ActivityHeatmap } from './ActivityHeatmap';

export const DashboardView: React.FC = () => {
  const problems = useLiveQuery(() => db.problems.toArray(), []);
  const topics = useLiveQuery(() => db.academicTopics.toArray(), []);
  const reviewLogs = useLiveQuery(() => db.reviewLogs.toArray(), []);

  const startReviewSession = useAppStore((state) => state.startReviewSession);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const openModal = useAppStore((state) => state.openModal);

  if (!problems || !topics || !reviewLogs) {
    return <div className="text-slate-400 text-sm py-12 text-center">Loading dashboard...</div>;
  }

  const today = new Date().toISOString().split('T')[0];

  const dueProblems = problems.filter((p) => p.srs.dueDate <= today);
  const dueTopics = topics.filter((t) => t.srs.dueDate <= today);
  const totalDue = dueProblems.length + dueTopics.length;

  const leechesCount =
    problems.filter((p) => p.srs.isLeech).length +
    topics.filter((t) => t.srs.isLeech).length;

  const handleStartDueReview = () => {
    const ids = [...dueProblems.map((p) => p.id), ...dueTopics.map((t) => t.id)];
    if (ids.length > 0) {
      startReviewSession(ids);
    }
  };

  return (
    <div className="space-y-6">
      {/* Due Banner */}
      {totalDue > 0 ? (
        <div className="bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-slate-900 border border-amber-500/50 rounded-2xl p-6 shadow-xl text-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              ⚡ Action Required
            </span>
            <h2 className="text-2xl font-black text-amber-100">
              {totalDue} Items Ready for Review Today!
            </h2>
            <p className="text-xs text-amber-300/80">
              {dueProblems.length} CP Problems • {dueTopics.length} University Course Topics
            </p>
          </div>

          <button
            onClick={handleStartDueReview}
            className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-950/50 transition-all transform hover:scale-105"
          >
            Start Daily Review Session 🔥
          </button>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-center text-slate-300 space-y-2">
          <h2 className="text-xl font-bold text-emerald-400">🎉 All Caught Up for Today!</h2>
          <p className="text-xs text-slate-400">
            No items currently due. Add new competitive programming problems or course topics to keep building your retention queue.
          </p>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('problems')}
          className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-xl p-4 cursor-pointer transition-all space-y-1"
        >
          <span className="text-xs font-semibold text-slate-400 uppercase">CP Problems</span>
          <div className="text-2xl font-black text-blue-400">{problems.length}</div>
          <span className="text-[11px] text-slate-500 block">Codeforces, AtCoder, CSES</span>
        </div>

        <div
          onClick={() => setActiveTab('university')}
          className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 cursor-pointer transition-all space-y-1"
        >
          <span className="text-xs font-semibold text-slate-400 uppercase">Course Topics</span>
          <div className="text-2xl font-black text-cyan-400">{topics.length}</div>
          <span className="text-[11px] text-slate-500 block">Academics Priority Queue</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Due</span>
          <div className="text-2xl font-black text-amber-400">{totalDue}</div>
          <span className="text-[11px] text-amber-500/80 block">Requires Review Today</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase">Leech Items</span>
          <div className="text-2xl font-black text-rose-400">{leechesCount}</div>
          <span className="text-[11px] text-slate-500 block">≥4 Consecutive Failures</span>
        </div>
      </div>

      {/* Quick Add Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => openModal('addProblem')}
          className="flex-1 min-w-[200px] py-3 px-4 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-emerald-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          <span>+</span> Add CP Problem URL
        </button>

        <button
          onClick={() => openModal('addTopic')}
          className="flex-1 min-w-[200px] py-3 px-4 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-cyan-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          <span>+</span> Add University Topic
        </button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReviewForecastChart problems={problems} topics={topics} />
        <ActivityHeatmap reviewLogs={reviewLogs} />
      </div>
    </div>
  );
};
