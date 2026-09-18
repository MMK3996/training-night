// ===================================================================
// Add Academic Course Topic Modal Component
// Inputs: Course ID, Course Name, Topic, Subtopic, Initial Mastery (1-5),
// Course Weight, Exam Date, Notes.
// ===================================================================

import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { addAcademicTopic } from '../lib/db';

export const AddTopicModal: React.FC = () => {
  const { activeModal, closeModal } = useAppStore((state) => ({
    activeModal: state.activeModal,
    closeModal: state.closeModal,
  }));

  const [courseId, setCourseId] = useState('');
  const [courseName, setCourseName] = useState('');
  const [topicName, setTopicName] = useState('');
  const [subtopicName, setSubtopicName] = useState('');
  const [initialMastery, setInitialMastery] = useState(2);
  const [courseWeight, setCourseWeight] = useState(1.0);
  const [examDate, setExamDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (activeModal !== 'addTopic') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim() || !topicName.trim()) {
      setError('Course Name and Topic Name are required.');
      return;
    }

    try {
      await addAcademicTopic({
        courseId: courseId.trim() || courseName.trim().toUpperCase().slice(0, 6),
        courseName: courseName.trim(),
        topicName: topicName.trim(),
        subtopicName: subtopicName.trim() || undefined,
        initialMastery,
        currentMastery: initialMastery,
        courseWeight,
        examDate: examDate ? examDate : null,
        notes: notes.trim(),
      });
      closeModal();
      // Reset
      setCourseId('');
      setCourseName('');
      setTopicName('');
      setSubtopicName('');
      setInitialMastery(2);
      setCourseWeight(1.0);
      setExamDate('');
      setNotes('');
    } catch {
      setError('Failed to add academic topic to database.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <h2 className="text-xl font-bold text-cyan-400">Add Academic Course Topic</h2>
          <button
            onClick={closeModal}
            className="text-slate-400 hover:text-slate-200 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/40 border border-red-500/50 rounded text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Course Code & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Course Code
              </label>
              <input
                type="text"
                placeholder="e.g. CS-301"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Course Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Operating Systems"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Topic & Subtopic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Topic Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Virtual Memory"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Subtopic (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Page Replacement Algorithms"
                value={subtopicName}
                onChange={(e) => setSubtopicName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Initial Mastery (1-5 Star Rating) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Initial Self-Assessed Mastery Level (1 to 5)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  type="button"
                  key={level}
                  onClick={() => setInitialMastery(level)}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm border transition-all ${
                    initialMastery === level
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-md shadow-cyan-950/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {'★'.repeat(level)}
                  <span className="block text-[10px] font-normal mt-0.5">Lvl {level}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Course Weight & Exam Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Course Priority Weight
              </label>
              <select
                value={courseWeight}
                onChange={(e) => setCourseWeight(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value={1.0}>1.0× (Standard Course)</option>
                <option value={1.5}>1.5× (Core Major Subject)</option>
                <option value={2.0}>2.0× (High Priority Exam Subject)</option>
                <option value={3.0}>3.0× (Critical Final Project / Exam)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Upcoming Exam Date (Optional)
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Key Formulae / Notes / Summary
            </label>
            <textarea
              rows={3}
              placeholder="Important definitions, formulae, key takeaways..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-cyan-900/30"
            >
              Save Course Topic
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
