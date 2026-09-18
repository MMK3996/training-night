// ===================================================================
// Review Session Component ("Anki Mode")
// Interactive flashcard review interface with keyboard shortcuts:
// - Space / Enter: Reveal answer / notes
// - 1 / F: "Didn't Know It" (Fail)
// - 2 / Enter / G: "Knew It" (Pass)
// ===================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  getProblemById,
  getAcademicTopicById,
  updateProblem,
  updateAcademicTopic,
  addReviewLog,
} from '../lib/db';
import { calculateSM2Binary } from '../lib/sm2';
import type { ProblemItem, CourseTopicItem } from '../types';

export const ReviewSession: React.FC = () => {
  const reviewSessionActive = useAppStore((state) => state.reviewSessionActive);
  const reviewItemIds = useAppStore((state) => state.reviewItemIds);
  const currentReviewIndex = useAppStore((state) => state.currentReviewIndex);
  const advanceReview = useAppStore((state) => state.advanceReview);
  const endReviewSession = useAppStore((state) => state.endReviewSession);

  const [currentItem, setCurrentItem] = useState<{
    type: 'cp_problem' | 'academic_topic';
    data: ProblemItem | CourseTopicItem;
  } | null>(null);

  const [isRevealed, setIsRevealed] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentId = reviewItemIds[currentReviewIndex];

  // Fetch current review item
  useEffect(() => {
    if (!reviewSessionActive || !currentId) {
      setCurrentItem(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setIsRevealed(false);

    (async () => {
      const problem = await getProblemById(currentId);
      if (!isMounted) return;
      if (problem) {
        setCurrentItem({ type: 'cp_problem', data: problem });
        setLoading(false);
        return;
      }

      const topic = await getAcademicTopicById(currentId);
      if (!isMounted) return;
      if (topic) {
        setCurrentItem({ type: 'academic_topic', data: topic });
        setLoading(false);
        return;
      }

      // If item not found, skip to next
      setLoading(false);
      advanceReview();
    })();

    return () => {
      isMounted = false;
    };
  }, [reviewSessionActive, currentId]);

  // Review answer handler
  const handleReview = useCallback(
    async (result: 'knew' | 'forgot') => {
      if (!currentItem) return;

      const now = new Date().toISOString();
      const oldSRS = currentItem.data.srs;
      const newSRS = calculateSM2Binary(oldSRS, result);

      if (currentItem.type === 'cp_problem') {
        await updateProblem(currentItem.data.id, { srs: newSRS });
      } else {
        await updateAcademicTopic(currentItem.data.id, { srs: newSRS });
      }

      // Record Review Log
      await addReviewLog({
        itemId: currentItem.data.id,
        itemType: currentItem.type,
        rating: result === 'knew' ? 4 : 1,
        binaryResult: result,
        reviewedAt: now,
        intervalBefore: oldSRS.interval,
        intervalAfter: newSRS.interval,
        easinessFactorBefore: oldSRS.easinessFactor,
        easinessFactorAfter: newSRS.easinessFactor,
      });

      advanceReview();
    },
    [currentItem, advanceReview]
  );

  // Keyboard shortcut listener
  useEffect(() => {
    if (!reviewSessionActive || !currentItem) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space' || e.code === 'KeyR') {
        e.preventDefault();
        setIsRevealed((prev) => !prev);
      } else if (e.key === '1' || e.code === 'KeyF') {
        e.preventDefault();
        handleReview('forgot');
      } else if (e.key === '2' || e.code === 'Enter' || e.code === 'KeyG') {
        e.preventDefault();
        if (!isRevealed) {
          setIsRevealed(true);
        } else {
          handleReview('knew');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reviewSessionActive, currentItem, isRevealed, handleReview]);

  if (!reviewSessionActive) return null;

  const totalItems = reviewItemIds.length;
  const progressPercent = Math.round(((currentReviewIndex + 1) / totalItems) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col max-h-[92vh]">
        {/* Progress Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-2.5 py-1 bg-amber-950 text-amber-300 rounded-full border border-amber-800">
              Card {currentReviewIndex + 1} of {totalItems}
            </span>
            <div className="w-32 sm:w-48 bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <button
            onClick={endReviewSession}
            className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1 bg-slate-800 rounded-lg"
          >
            End Review ✕
          </button>
        </div>

        {/* Card Content */}
        {loading || !currentItem ? (
          <div className="py-20 text-center text-slate-400 text-sm animate-pulse">
            Loading flashcard...
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between space-y-6 overflow-y-auto pr-1">
            {/* Front of Card */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {currentItem.type === 'cp_problem' ? 'CP Problem' : 'University Topic'}
                </span>

                {currentItem.type === 'cp_problem' ? (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    {(currentItem.data as ProblemItem).platform}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {(currentItem.data as CourseTopicItem).courseId}
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-extrabold text-slate-100">
                {currentItem.type === 'cp_problem'
                  ? (currentItem.data as ProblemItem).title
                  : (currentItem.data as CourseTopicItem).topicName}
              </h2>

              {currentItem.type === 'academic_topic' &&
                (currentItem.data as CourseTopicItem).subtopicName && (
                  <p className="text-sm text-slate-400">
                    Subtopic: {(currentItem.data as CourseTopicItem).subtopicName}
                  </p>
                )}

              {currentItem.type === 'cp_problem' && (currentItem.data as ProblemItem).url && (
                <a
                  href={(currentItem.data as ProblemItem).url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline font-mono"
                >
                  Open Problem Link 🔗
                </a>
              )}
            </div>

            {/* Answer / Solution Notes Reveal Area */}
            <div className="min-h-[120px] flex flex-col justify-center">
              {!isRevealed ? (
                <button
                  onClick={() => setIsRevealed(true)}
                  className="w-full py-4 bg-slate-950 border border-dashed border-slate-700 hover:border-slate-500 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-semibold transition-all"
                >
                  Click or Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs font-mono">Space</kbd> to Reveal Notes / Solution
                </button>
              ) : (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 animate-fadeIn">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    💡 Solution Notes & Hints:
                  </span>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap font-mono leading-relaxed">
                    {currentItem.data.notes || 'No specific notes recorded for this item.'}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Action Controls */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              {isRevealed ? (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleReview('forgot')}
                    className="py-3.5 bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-200 rounded-xl font-bold text-sm shadow-lg flex flex-col items-center justify-center transition-all"
                  >
                    <span>❌ Didn't Know It</span>
                    <span className="text-[10px] font-mono text-rose-400 font-normal">
                      Press [1] or [F] (Interval Reset to 1d)
                    </span>
                  </button>

                  <button
                    onClick={() => handleReview('knew')}
                    className="py-3.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-200 rounded-xl font-bold text-sm shadow-lg flex flex-col items-center justify-center transition-all"
                  >
                    <span>✅ Knew It!</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-normal">
                      Press [2] or [Enter] (Advance SRS)
                    </span>
                  </button>
                </div>
              ) : (
                <div className="text-center text-xs text-slate-500">
                  Reveal notes to trigger SRS rating response buttons
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
