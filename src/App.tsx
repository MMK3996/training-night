// ===================================================================
// Main Application Component
// ===================================================================

import { useAppStore } from './store/useAppStore';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ProblemFilterBar } from './components/ProblemFilterBar';
import { ProblemList } from './components/ProblemList';
import { AcademicFilterBar } from './components/AcademicFilterBar';
import { AcademicTopicList } from './components/AcademicTopicList';
import { SettingsView } from './components/SettingsView';
import { AddProblemModal } from './components/AddProblemModal';
import { AddTopicModal } from './components/AddTopicModal';
import { ReviewSession } from './components/ReviewSession';

export function App() {
  const { activeTab, resolvedTheme } = useAppStore((state) => ({
    activeTab: state.activeTab,
    resolvedTheme: state.resolvedTheme,
  }));

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-950 text-slate-100'}`}>
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 pt-6 pb-24 sm:pb-12">
        {activeTab === 'dashboard' && <DashboardView />}

        {activeTab === 'problems' && (
          <div>
            <ProblemFilterBar />
            <ProblemList />
          </div>
        )}

        {activeTab === 'university' && (
          <div>
            <AcademicFilterBar />
            <AcademicTopicList />
          </div>
        )}

        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Global Modals */}
      <AddProblemModal />
      <AddTopicModal />
      <ReviewSession />
    </div>
  );
}

export default App;
