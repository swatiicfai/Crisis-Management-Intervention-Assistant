import React from 'react';
import { IncidentScenarioData, TabType } from '../types/crisis';
import { isAudioMuted, toggleAudioMute, playBeep } from '../utils/audio';

interface HeaderHUDProps {
  currentScenario: IncidentScenarioData;
  currentTab: TabType;
  elapsedSeconds: number;
  onOpenWarRoom: () => void;
  onOpenScenarioSwitcher: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  currentScenario,
  currentTab,
  elapsedSeconds,
  onOpenWarRoom,
  onOpenScenarioSwitcher,
}) => {
  const [muted, setMuted] = React.useState(isAudioMuted());

  const handleMuteToggle = () => {
    const newState = toggleAudioMute();
    setMuted(newState);
  };

  const formatTimer = (totalSecs: number) => {
    const hours = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSecs % 60).padStart(2, '0');
    return `T+${hours}:${mins}:${secs}`;
  };

  const getScreenTitle = () => {
    switch (currentTab) {
      case 'live-triage':
        return currentScenario.screenTitle.triage;
      case 't-0-action-matrix':
        return currentScenario.screenTitle.matrix;
      case 'contingency-fallback':
        return currentScenario.screenTitle.fallback;
      case 'comms-dispatch':
        return currentScenario.screenTitle.comms;
      case 'system-health':
        return 'System Health';
      default:
        return 'Crisis HUD';
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#010f1f]/90 backdrop-blur-xl pt-safe shadow-[0_4px_20px_rgba(0,0,0,0.5)] border-b border-[#273647]/50">
      <div className="h-20 px-4 flex items-center justify-between gap-2 max-w-5xl mx-auto">
        {/* Left Side: Defcon & Ticking Timer */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center p-1 bg-[#93000a]/30 rounded flex-shrink-0">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff5451] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff5451]"></span>
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-1.5 py-0.5 rounded bg-[#93000a] text-[#ffb3ad] font-mono text-[10px] tracking-widest uppercase font-bold">
                {currentScenario.defconLevel}
              </span>
              <span className="font-mono text-[12px] text-[#4cd7f6] tracking-wider font-semibold">
                {formatTimer(elapsedSeconds)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 truncate mt-0.5">
              <span className="font-mono text-[10px] text-[#4edea3] uppercase tracking-wider font-bold truncate">
                {currentScenario.incidentCommandTag}
              </span>
              <span className="text-[#ab8986] text-[12px]">•</span>
              <span className="font-sans text-[13px] font-bold text-[#d4e4fa] uppercase tracking-tight truncate">
                {getScreenTitle()}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Tactical Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Mute Button */}
          <button
            onClick={handleMuteToggle}
            aria-label="Toggle Audio HUD"
            title={muted ? 'Unmute Audio HUD' : 'Mute Audio HUD'}
            className="w-10 h-10 flex items-center justify-center rounded bg-[#122131] text-[#e4beba] hover:text-[#ffb3ad] hover:bg-[#1c2b3c] active:scale-95 transition-all border border-[#273647]/60"
          >
            <span className="material-symbols-outlined text-[19px]">
              {muted ? 'volume_off' : 'volume_up'}
            </span>
          </button>

          {/* War Room Bridge Quick Call */}
          <button
            onClick={() => {
              playBeep(980, 0.08);
              onOpenWarRoom();
            }}
            aria-label="War Room Quick Call"
            title="Open War Room Audio Bridge"
            className="w-10 h-10 flex items-center justify-center rounded bg-[#ff5451] text-[#68000a] hover:bg-[#ffb3ad] active:scale-95 transition-all shadow-[0_0_12px_rgba(255,84,81,0.45)] relative group"
          >
            <span className="material-symbols-outlined text-[19px] font-bold">call</span>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
          </button>

          {/* Hexagonal Tactical Emblem Scenario Switcher */}
          <button
            onClick={() => {
              playBeep(650, 0.06);
              onOpenScenarioSwitcher();
            }}
            aria-label="Switch Incident Scenario"
            title="Switch Incident Scenario & DEFCON Level"
            className="w-10 h-10 flex items-center justify-center rounded bg-[#122131] hover:bg-[#1c2b3c] active:scale-95 transition-all border border-[#4cd7f6]/40 shadow-[0_0_10px_rgba(76,215,246,0.2)] p-1 group"
          >
            <svg
              viewBox="0 0 100 100"
              className="w-7 h-7 transition-transform group-hover:rotate-45"
            >
              <polygon
                points="50,5 92,27 92,73 50,95 8,73 8,27"
                fill="#051424"
                stroke="#ff5451"
                strokeWidth="7"
                strokeDasharray="95,0"
              />
              <circle cx="50" cy="50" r="24" fill="none" stroke="#4cd7f6" strokeWidth="5" />
              <circle cx="50" cy="50" r="7" fill="#ffffff" />
              <line x1="22" y1="50" x2="78" y2="50" stroke="#ff5451" strokeWidth="6" strokeLinecap="round" />
              <line x1="50" y1="22" x2="50" y2="78" stroke="#ff5451" strokeWidth="6" strokeLinecap="round" />
              <circle cx="50" cy="18" r="3.5" fill="#ff5451" />
              <circle cx="50" cy="82" r="3.5" fill="#ff5451" />
              <circle cx="18" cy="50" r="3.5" fill="#4cd7f6" />
              <circle cx="82" cy="50" r="3.5" fill="#4cd7f6" />
            </svg>
          </button>

          {/* Profile Avatar */}
          <img
            alt="Incident Commander Profile"
            className="w-8 h-8 rounded-full object-cover ml-0.5 ring-1 ring-[#4cd7f6]/40 hover:ring-[#ff5451] transition-all"
            src="https://lh3.googleusercontent.com/aida/AEtjO1XrUKHiDExMsiuJvkj_Y8ZfahlkHOXG0NY6L2nefwBJfxKDMSFA17TR2p2-WDoDO43eVpMqpj0HgSLjRmstxs9GaJeRvQAgaPiVDXnvnd0x5ZWXSZSlgpMer_p9qvRTWq9gVQya2IMSZa1UhMJHW_79eQ7wS173S27cA22RFapudaLDf06jmrgYPVaKvJ9rJTCTZ2lLeX70bHw3i6qgNA5yuuEIIY5LVO-NeJIwbxpMj3pV3fyZUcc4_V8"
          />
        </div>
      </div>
    </header>
  );
};
