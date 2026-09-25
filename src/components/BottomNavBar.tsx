import React from 'react';
import { TabType, IncidentScenarioData } from '../types/crisis';
import { playBeep } from '../utils/audio';

interface BottomNavBarProps {
  currentTab: TabType;
  currentScenario: IncidentScenarioData;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  currentScenario,
  onSelectTab,
}) => {
  const isBreach = currentScenario.scenarioType === 'DATA_BREACH';

  const tabs: {
    id: TabType;
    label: string;
    icon: string;
    badge?: { count: number | string; colorClass: string };
  }[] = [
    {
      id: 'live-triage',
      label: 'Triage',
      icon: isBreach ? 'security' : 'emergency',
      badge: { count: 14, colorClass: 'bg-[#ff5451] text-[#68000a]' },
    },
    {
      id: 'system-health',
      label: 'Health',
      icon: 'vital_signs',
      badge: { count: 'D3', colorClass: 'bg-[#003824] text-[#4edea3] border border-[#4edea3]/40' },
    },
    {
      id: 't-0-action-matrix',
      label: isBreach ? 'Playbook' : 'Matrix',
      icon: isBreach ? 'gavel' : 'view_kanban',
    },
    {
      id: 'contingency-fallback',
      label: isBreach ? 'Blackout' : 'Fallback',
      icon: 'shield',
      badge: { count: 2, colorClass: 'bg-[#273647] text-[#4cd7f6]' },
    },
    {
      id: 'comms-dispatch',
      label: 'Comms',
      icon: 'cell_tower',
      badge: { count: 5, colorClass: 'bg-[#93000a] text-[#ffb3ad]' },
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-[#010f1f]/95 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.6)] border-t border-[#273647]/50">
      <div className="grid grid-cols-5 items-center h-16 px-1 max-w-5xl mx-auto">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                playBeep(isActive ? 1050 : 800, 0.04);
                onSelectTab(tab.id);
              }}
              className={`flex flex-col items-center justify-center h-12 rounded transition-all relative ${
                isActive
                  ? 'text-[#4cd7f6] bg-[#1c2b3c] shadow-[inset_0_0_10px_rgba(76,215,246,0.2)] font-bold'
                  : 'text-[#e4beba] hover:text-[#d4e4fa] hover:bg-[#122131]/40'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] leading-none">
                {tab.icon}
              </span>
              <span className="font-mono text-[9px] tracking-wider uppercase mt-0.5 leading-none truncate max-w-full px-0.5">
                {tab.label}
              </span>
              {tab.badge && (
                <span
                  className={`absolute top-1 right-1.5 px-1 py-0.2 rounded-full font-mono text-[9px] leading-tight font-bold ${tab.badge.colorClass}`}
                >
                  {tab.badge.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
