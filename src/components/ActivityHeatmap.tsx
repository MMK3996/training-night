// ===================================================================
// Activity Heatmap Component
// GitHub-style daily study review activity grid for past 28 days.
// ===================================================================

import React from 'react';
import type { ReviewLog } from '../types';

interface ActivityHeatmapProps {
  reviewLogs: ReviewLog[];
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ reviewLogs }) => {
  // Aggregate review counts per day for past 28 days
  const days: Array<{ dateStr: string; count: number }> = [];
  const today = new Date();

  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const count = reviewLogs.filter((log) => log.reviewedAt.startsWith(dateStr)).length;
    days.push({ dateStr, count });
  }

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-slate-950 border-slate-800';
    if (count <= 2) return 'bg-emerald-950 text-emerald-400 border-emerald-800';
    if (count <= 5) return 'bg-emerald-800 text-emerald-200 border-emerald-700';
    return 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-950/50';
  };

  const totalReviewsPast28Days = days.reduce((acc, d) => acc + d.count, 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <span>🔥 Study Activity (Past 28 Days)</span>
        </h3>
        <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/60">
          {totalReviewsPast28Days} Reviews Completed
        </span>
      </div>

      {/* Grid of 28 squares (4 weeks x 7 days) */}
      <div className="grid grid-cols-7 gap-2 pt-2">
        {days.map((d) => (
          <div
            key={d.dateStr}
            title={`${d.dateStr}: ${d.count} reviews`}
            className={`h-9 rounded-lg border flex flex-col items-center justify-center text-[10px] font-bold transition-transform hover:scale-105 cursor-pointer ${getHeatmapColor(
              d.count
            )}`}
          >
            <span>{d.count > 0 ? d.count : ''}</span>
            <span className="text-[8px] font-normal opacity-60">
              {d.dateStr.slice(8)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
