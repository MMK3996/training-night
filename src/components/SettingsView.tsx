// ===================================================================
// Settings & Data Backup Management View Component
// ===================================================================

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getSettings, updateSettings } from '../lib/db';
import { downloadBackup, importFromFile } from '../services/backupService';
import type { UserSettings } from '../types';

export const SettingsView: React.FC = () => {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);

  const [settings, setSettingsData] = useState<UserSettings | null>(null);
  const [importStatus, setImportStatus] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setSettingsData(s);
    })();
  }, []);

  const handleThemeChange = async (newTheme: 'dark' | 'light' | 'system') => {
    setTheme(newTheme);
    await updateSettings({ theme: newTheme });
    if (settings) {
      setSettingsData({ ...settings, theme: newTheme });
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus('Validating and importing JSON backup...');

    try {
      const res = await importFromFile(file, 'replace');
      if (res.success) {
        setImportStatus(
          `✅ Successfully imported ${res.problemsImported} problems, ${res.topicsImported} topics!`
        );
      } else {
        setImportStatus(`❌ Import failed: ${res.errors.join(', ')}`);
      }
    } catch (err) {
      setImportStatus(`❌ Import error: ${String(err)}`);
    } finally {
      setIsImporting(false);
    }
  };

  if (!settings) {
    return <div className="text-slate-400 text-sm py-8 text-center">Loading settings...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-slate-100">
      {/* Theme Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-3">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
          🎨 Interface Appearance
        </h3>
        <div className="flex items-center gap-3 pt-1">
          {(['dark', 'light', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleThemeChange(t)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold capitalize border transition-all ${
                theme === t
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {t} Mode
            </button>
          ))}
        </div>
      </div>

      {/* SRS Defaults */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-3">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
          ⚙️ SRS Engine Parameters
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
          <div>
            <span className="block font-semibold text-slate-300 mb-1">
              Initial Easiness Factor (EF)
            </span>
            <input
              type="number"
              disabled
              value={settings.sm2Defaults.initialEF}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-400"
            />
          </div>

          <div>
            <span className="block font-semibold text-slate-300 mb-1">Minimum EF Floor</span>
            <input
              type="number"
              disabled
              value={settings.sm2Defaults.minEF}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Data Backup & Export / Import */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
          💾 Data Backup & Restore
        </h3>
        <p className="text-xs text-slate-400">
          All data is stored locally in IndexedDB inside your browser. Export backups regularly to ensure 100% data safety.
        </p>

        {importStatus && (
          <div className="p-3 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono">
            {importStatus}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {/* Export */}
          <button
            onClick={downloadBackup}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-md flex items-center justify-center gap-2"
          >
            <span>📥</span> Export Full Backup (JSON)
          </button>

          {/* Import */}
          <label className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg border border-slate-700 cursor-pointer flex items-center justify-center gap-2 text-center">
            <span>📤</span> Restore Backup (JSON)
            <input
              type="file"
              accept=".json"
              disabled={isImporting}
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
