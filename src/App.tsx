import React, { useState, useEffect } from 'react';
import { TabType } from './types/crisis';
import { INCIDENT_SCENARIOS } from './data/incidents';
import { HeaderHUD } from './components/HeaderHUD';
import { BottomNavBar } from './components/BottomNavBar';
import { TriageScreen } from './components/TriageScreen';
import { ActionMatrixScreen } from './components/ActionMatrixScreen';
import { ContingencyFallbackScreen } from './components/ContingencyFallbackScreen';
import { CommsDispatchScreen } from './components/CommsDispatchScreen';
import { SystemHealthDashboard } from './components/SystemHealthDashboard';
import { WarRoomCallModal } from './components/WarRoomCallModal';
import { ScenarioSwitcherModal } from './components/ScenarioSwitcherModal';
import { playBeep } from './utils/audio';

export default function App() {
  const [currentScenarioId, setCurrentScenarioId] = useState<string>('INFRA_CASCADE');
  const [currentTab, setCurrentTab] = useState<TabType>('live-triage');
  const [elapsedSeconds, setElapsedSeconds] = useState(42 * 60 + 15); // Starts at T+00:42:15 as shown in screenshots

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = React.useRef<any>(null);

  // Modals
  const [isWarRoomOpen, setIsWarRoomOpen] = useState(false);
  const [isScenarioSwitcherOpen, setIsScenarioSwitcherOpen] = useState(false);

  // Global ticking clock (every second)
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentScenario = INCIDENT_SCENARIOS[currentScenarioId] || INCIDENT_SCENARIOS.INFRA_CASCADE;

  const showToast = (message: string) => {
    clearTimeout(toastTimeoutRef.current);
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  const handleSelectScenario = (id: string) => {
    if (INCIDENT_SCENARIOS[id]) {
      setCurrentScenarioId(id);
    }
  };

  return (
    <div className="bg-[#051424] text-[#d4e4fa] min-h-screen flex flex-col font-sans relative overflow-x-hidden selection:bg-[#ff5451]/30">
      {/* Persistent Mission-Critical Header HUD */}
      <HeaderHUD
        currentScenario={currentScenario}
        currentTab={currentTab}
        elapsedSeconds={elapsedSeconds}
        onOpenWarRoom={() => setIsWarRoomOpen(true)}
        onOpenScenarioSwitcher={() => setIsScenarioSwitcherOpen(true)}
      />

      {/* Main Tactical Viewport */}
      <main className="flex-1 w-full pt-22 pb-24 min-h-[calc(100vh-80px)]">
        {currentTab === 'live-triage' && (
          <TriageScreen
            scenario={currentScenario}
            elapsedSeconds={elapsedSeconds}
            onShowToast={showToast}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 't-0-action-matrix' && (
          <ActionMatrixScreen
            scenario={currentScenario}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'contingency-fallback' && (
          <ContingencyFallbackScreen
            scenario={currentScenario}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'comms-dispatch' && (
          <CommsDispatchScreen
            scenario={currentScenario}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'system-health' && (
          <SystemHealthDashboard
            scenario={currentScenario}
            onShowToast={showToast}
            onNavigateTab={setCurrentTab}
          />
        )}
      </main>

      {/* Tactical Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-22 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded bg-[#1c2b3c] text-[#4cd7f6] font-mono text-[11px] shadow-2xl flex items-center gap-2 border border-[#4cd7f6]/50 animate-fade-in pointer-events-none">
          <span className="material-symbols-outlined text-[16px] text-[#4edea3]">
            check_circle
          </span>
          <span className="font-bold tracking-tight">{toastMessage}</span>
        </div>
      )}

      {/* Tactical Bottom Navigation Dock */}
      <BottomNavBar
        currentTab={currentTab}
        currentScenario={currentScenario}
        onSelectTab={setCurrentTab}
      />

      {/* War Room Voice Bridge Modal */}
      <WarRoomCallModal
        scenario={currentScenario}
        isOpen={isWarRoomOpen}
        onClose={() => setIsWarRoomOpen(false)}
        onShowToast={showToast}
      />

      {/* Scenario Switcher Modal */}
      <ScenarioSwitcherModal
        isOpen={isScenarioSwitcherOpen}
        currentScenarioId={currentScenarioId}
        onSelectScenario={handleSelectScenario}
        onClose={() => setIsScenarioSwitcherOpen(false)}
        onShowToast={showToast}
      />
    </div>
  );
}
