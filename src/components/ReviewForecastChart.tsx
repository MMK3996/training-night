// ===================================================================
// Review Forecast Chart Component
// Pure SVG bar chart displaying due items projected over the next 7 days.
// ===================================================================

import React from 'react';
import type { ProblemItem, CourseTopicItem } from '../types';

interface ReviewForecastChartProps {
  problems: ProblemItem[];
  topics: CourseTopicItem[];
}

export const ReviewForecastChart: React.FC<ReviewForecastChartProps> = ({ problems, topics }) => {
  const days: Array<{ label: string; dateStr: string; count: number }> = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const label = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });

    // Count problems and topics due on dateStr
    const pCount = problems.filter((p) => p.srs.dueDate === dateStr).length;
    const tCount = topics.filter((t) => t.srs.dueDate === dateStr).length;

    days.push({ label, dateStr, count: pCount + tCount });
  }

  const maxCount = Math.max(...days.map((d) => d.count), 5);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-md">
      <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
        <span>📊 7-Day Review Forecast</span>
      </h3>

      <div className="flex items-end justify-between gap-2 h-40 pt-6 px-2 border-b border-slate-800">
        {days.map((day) => {
          const heightPercent = Math.round((day.count / maxCount) * 100);

          return (
            <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <span className="text-[10px] font-bold text-slate-400">{day.count}</span>
              <div
                className={`w-full max-w-[36px] rounded-t-md transition-all duration-500 ${
                  day.label === 'Today'
                    ? 'bg-amber-500 shadow-lg shadow-amber-950/50'
                    : 'bg-emerald-600/80 hover:bg-emerald-500'
                }`}
                style={{ height: `${Math.max(8, heightPercent)}%` }}
              />
              <span className="text-[11px] font-medium text-slate-400 mt-1">{day.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
