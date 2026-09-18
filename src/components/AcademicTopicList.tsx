// ===================================================================
// Academic Course Topic List Component
// Priority Queue Dashboard view powered by priorityScheduler.ts
// Features Quick Mastery Adjuster (1-5 stars) and SRS review triggers.
// ===================================================================

import React from 'react';
import { useLiveQuery } from '../hooks/useLiveQuery';
import { db, updateAcademicTopic, deleteAcademicTopic } from '../lib/db';
import { sortAcademicTopicsByPriority } from '../lib/priorityScheduler';
import { useAppStore } from '../store/useAppStore';

export const AcademicTopicList: React.FC = () => {
  const topics = useLiveQuery(() => db.academicTopics.toArray(), []);
  const { academicFilters, startReviewSession } = useAppStore((state) => ({
    academicFilters: state.academicFilters,
    startReviewSession: state.startReviewSession,
  }));

  if (!topics) {
    return <div className="text-slate-400 text-sm py-8 text-center">Loading course topics...</div>;
  }

  const today = new Date().toISOString().split('T')[0];

  // Apply filters
  const filteredTopics = topics.filter((topic) => {
    if (academicFilters.dueOnly && topic.srs.dueDate > today) {
      return false;
    }

    if (academicFilters.searchQuery.trim()) {
      const q = academicFilters.searchQuery.toLowerCase();
      const matchCourse = topic.courseName.toLowerCase().includes(q) || topic.courseId.toLowerCase().includes(q);
      const matchTopic = topic.topicName.toLowerCase().includes(q);
      const matchSubtopic = topic.subtopicName?.toLowerCase().includes(q) ?? false;
      const matchNotes = topic.notes.toLowerCase().includes(q);

      if (!matchCourse && !matchTopic && !matchSubtopic && !matchNotes) {
        return false;
      }
    }

    return true;
  });

  // Sort by priority scheduler
  const sortedQueue = sortAcademicTopicsByPriority(filteredTopics, today);

  const handleUpdateMastery = async (id: string, newMastery: number) => {
    await updateAcademicTopic(id, { currentMastery: newMastery });
  };

  const dueCount = sortedQueue.filter((item) => item.isDue).length;

  return (
    <div className="space-y-4">
      {/* Queue Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          University Priority Queue ({sortedQueue.length} topics)
        </span>

        {dueCount > 0 && (
          <button
            onClick={() =>
              startReviewSession(sortedQueue.filter((i) => i.isDue).map((i) => i.topic.id))
            }
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow-md shadow-amber-900/30"
          >
            🔥 Study {dueCount} Due Today
          </button>
        )}
      </div>

      {sortedQueue.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-sm">
          No academic course topics found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {sortedQueue.map(({ topic, breakdown, isDue }, index) => {
            const daysUntilExam = breakdown.daysUntilExam;

            return (
              <div
                key={topic.id}
                className={`bg-slate-900 border rounded-xl p-4 transition-all hover:border-slate-700 ${
                  isDue
                    ? 'border-amber-500/40 bg-slate-900/90 shadow-md shadow-amber-950/20'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Priority Rank & Score */}
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-950 text-cyan-300 rounded border border-cyan-800/80">
                        Rank #{index + 1} • P: {breakdown.score}
                      </span>

                      {/* Course Badge */}
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-slate-800 text-slate-300 rounded border border-slate-700">
                        {topic.courseId || 'COURSE'}
                      </span>

                      {/* Overdue Badge */}
                      {isDue && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-950 text-amber-300 rounded border border-amber-800/80 animate-pulse">
                          DUE TODAY
                        </span>
                      )}

                      {/* Exam Urgency Badge */}
                      {daysUntilExam !== null && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-950 text-rose-300 rounded border border-rose-800/80">
                          ⚡ EXAM IN {daysUntilExam} DAYS
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-100 mt-1">
                      {topic.courseName}: <span className="text-cyan-400">{topic.topicName}</span>
                    </h3>

                    {topic.subtopicName && (
                      <p className="text-xs text-slate-400 font-medium">
                        Subtopic: {topic.subtopicName}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startReviewSession([topic.id])}
                      className="px-3 py-1 bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-semibold rounded"
                    >
                      Study
                    </button>
                    <button
                      onClick={() => deleteAcademicTopic(topic.id)}
                      className="text-slate-500 hover:text-red-400 text-xs px-1.5 py-1"
                      title="Delete Topic"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Quick Mastery Adjuster (1-5 Star Ratings) */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                      Current Mastery:
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleUpdateMastery(topic.id, star)}
                          title={`Set mastery to ${star}/5`}
                          className={`text-sm transition-transform hover:scale-125 ${
                            star <= topic.currentMastery ? 'text-amber-400' : 'text-slate-700'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>Weight: {topic.courseWeight}×</span>
                    <span>Interval: {topic.srs.interval}d</span>
                    <span>Due: {topic.srs.dueDate}</span>
                  </div>
                </div>

                {topic.notes && (
                  <div className="mt-2 text-xs bg-slate-950/80 border border-slate-800/60 p-2 rounded text-slate-300 font-mono text-[11px]">
                    📝 {topic.notes}
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
