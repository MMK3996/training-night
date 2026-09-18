// ===================================================================
// Add Problem Modal Component
// Supports URL pasting with automatic metadata fetching & preview,
// custom tags input, category selector, and notes.
// ===================================================================

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { resolveProblemMetadata } from '../services/metadataResolver';
import { addProblem } from '../lib/db';
import type { CPPlatform } from '../types';

export const AddProblemModal: React.FC = () => {
  const activeModal = useAppStore((state) => state.activeModal);
  const closeModal = useAppStore((state) => state.closeModal);

  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<CPPlatform>('custom');
  const [problemId, setProblemId] = useState('');
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<number | string>(0);
  const [platformTags, setPlatformTags] = useState<string[]>([]);
  const [userTags, setUserTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [category, setCategory] = useState('General');
  const [notes, setNotes] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');

  if (activeModal !== 'addProblem') return null;

  // Auto-resolve URL on paste or change
  useEffect(() => {
    if (!url.trim()) return;

    const timer = setTimeout(async () => {
      setIsFetching(true);
      setError('');
      try {
        const resolved = await resolveProblemMetadata(url);
        if (resolved.isValid) {
          setPlatform(resolved.platform);
          setProblemId(resolved.problemId);
          setTitle(resolved.title);
          setDifficulty(resolved.difficulty);
          setPlatformTags(resolved.platformTags);
        } else {
          setError('Invalid or unrecognized problem URL.');
        }
      } catch {
        setError('Failed to fetch metadata.');
      } finally {
        setIsFetching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [url]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !userTags.includes(trimmed)) {
      setUserTags([...userTags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setUserTags(userTags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    try {
      await addProblem({
        url: url.trim(),
        platform,
        problemId: problemId.trim() || 'custom',
        title: title.trim(),
        difficulty,
        platformTags,
        userTags,
        category: category.trim() || 'General',
        notes: notes.trim(),
      });
      closeModal();
      // Reset form
      setUrl('');
      setTitle('');
      setUserTags([]);
      setNotes('');
    } catch {
      setError('Failed to save problem to database.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <h2 className="text-xl font-bold text-emerald-400">Add Competitive Programming Problem</h2>
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
          {/* Problem URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Problem URL
            </label>
            <div className="relative">
              <input
                type="url"
                placeholder="Paste URL (Codeforces, AtCoder, CSES, USACO...)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              {isFetching && (
                <span className="absolute right-3 top-2.5 text-xs text-emerald-400 animate-pulse">
                  Fetching...
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              placeholder="Problem Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Platform & Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as CPPlatform)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="codeforces">Codeforces</option>
                <option value="atcoder">AtCoder</option>
                <option value="cses">CSES</option>
                <option value="usaco">USACO</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Difficulty / Rating
              </label>
              <input
                type="text"
                placeholder="e.g. 1400 or Gold"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Platform Tags (Auto-fetched) */}
          {platformTags.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Platform Tags (Auto)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {platformTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs rounded-full border border-slate-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* User Custom Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Custom Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add tag (e.g. weak-on-dp, mock)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {userTags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-emerald-950 text-emerald-300 text-xs rounded-full border border-emerald-800/60 flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-emerald-100 font-bold ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Category / Folder
            </label>
            <input
              type="text"
              placeholder="e.g. Practice, Contest, ICPC Warmup"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Solution Notes / Hints
            </label>
            <textarea
              rows={3}
              placeholder="Key observations, solution hints, logic pitfalls..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-emerald-900/30"
            >
              Save Problem
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
