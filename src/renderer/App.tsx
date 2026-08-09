import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAppStore } from './store/appStore';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Toasts } from './components/Toasts';
import { OnboardingTour } from './components/OnboardingTour';
import { Dashboard } from './pages/Dashboard';
import { RouterPage } from './pages/RouterPage';
import { CaseStudyPage } from './pages/CaseStudyPage';
import { AblationPage } from './pages/AblationPage';
import { ModelsPage } from './pages/ModelsPage';
import { RolesPage } from './pages/RolesPage';
import { TopologiesPage } from './pages/TopologiesPage';
import { ChainBuilderPage } from './pages/ChainBuilderPage';
import { PromptLabPage } from './pages/PromptLabPage';
import { CostPage } from './pages/CostPage';
import { CodexPage } from './pages/CodexPage';
import { SettingsPage } from './pages/SettingsPage';
import { LogsPage } from './pages/LogsPage';
import { HelpPage } from './pages/HelpPage';

const App: React.FC = () => {
  const bootstrap = useAppStore((s) => s.bootstrap);
  const bootstrapped = useAppStore((s) => s.bootstrapped);

  useEffect(() => {
    bootstrap().catch((e) => console.error('Bootstrap failed', e));
  }, [bootstrap]);

  if (!bootstrapped) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="muted">Загрузка MASROUTER…</div>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar />
      <Topbar />
      <main className="app__main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/router" element={<RouterPage />} />
          <Route path="/case-study" element={<CaseStudyPage />} />
          <Route path="/ablation" element={<AblationPage />} />
          <Route path="/models" element={<ModelsPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/topologies" element={<TopologiesPage />} />
          <Route path="/chain" element={<ChainBuilderPage />} />
          <Route path="/prompt-lab" element={<PromptLabPage />} />
          <Route path="/cost" element={<CostPage />} />
          <Route path="/codex" element={<CodexPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/help" element={<HelpPage />} />
        </Routes>
      </main>
      <Toasts />
      <OnboardingTour />
    </div>
  );
};

export default App;
