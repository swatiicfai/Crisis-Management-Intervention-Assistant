import React, { useState, useEffect } from 'react';
import { IncidentScenarioData } from '../types/crisis';
import { playBeep, playConfirm, playAlert } from '../utils/audio';

interface WarRoomCallModalProps {
  scenario: IncidentScenarioData;
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const WarRoomCallModal: React.FC<WarRoomCallModalProps> = ({
  scenario,
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState('Capt. R. Vance (Lead)');
  const [callDuration, setCallDuration] = useState(42 * 60 + 15);
  const [simulatedChatter, setSimulatedChatter] = useState<string[]>([
    'Capt. Vance: Standby on DNS propagation, edge proxy draining.',
    'Elena M.: DB West shard isolation confirmed at 14:20 UTC.',
    'David C.: 8-K draft queued with outside counsel.',
  ]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Simulate alternating speaker
  useEffect(() => {
    if (!isOpen) return;
    const speakers = [
      'Capt. R. Vance (Lead)',
      'Elena Morales (VP Eng)',
      'Sarah T. (DBA On-Call)',
      'David Chen (General Counsel)',
    ];
    const speakerInterval = setInterval(() => {
      const next = speakers[Math.floor(Math.random() * speakers.length)];
      setActiveSpeaker(next);
      playBeep(450, 0.02, 'triangle');
    }, 4500);
    return () => clearInterval(speakerInterval);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatCallTime = (secs: number) => {
    const mins = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${mins}:${s}`;
  };

  const handleMicToggle = () => {
    const next = !isMicMuted;
    setIsMicMuted(next);
    playBeep(next ? 500 : 900, 0.04);
    onShowToast(next ? 'Microphone Muted' : 'Microphone Transmitting Live');
  };

  const handleBroadcastSitrep = () => {
    playAlert();
    setSimulatedChatter((prev) => [
      `[OPERATOR SITREP]: Priority failover countdown armed. All channels acknowledge.`,
      ...prev,
    ]);
    onShowToast('Transmitted voice priority sitrep across bridge');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010f1f]/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-md bg-[#0d1c2d] rounded-lg shadow-2xl flex flex-col border border-[#ff5451] overflow-hidden">
        {/* Header */}
        <div className="bg-[#122131] p-3 px-4 flex items-center justify-between border-b border-[#273647]">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff5451] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff5451]"></span>
            </span>
            <span className="font-mono text-[12px] text-[#ffb3ad] font-bold uppercase tracking-wider">
              TACTICAL WAR ROOM AUDIO BRIDGE
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#4cd7f6] font-bold bg-[#010f1f] px-2 py-0.5 rounded border border-[#273647]">
            {formatCallTime(callDuration)}
          </span>
        </div>

        {/* Visual Equalizer / Soundwave */}
        <div className="p-4 bg-[#051424] flex flex-col items-center justify-center space-y-2 border-b border-[#1c2b3c]">
          <div className="flex items-center gap-1.5 h-10">
            {[40, 75, 90, 60, 100, 80, 50, 95, 70, 45, 85, 65].map((h, i) => (
              <div
                key={i}
                className="w-1.5 bg-[#ff5451] rounded-full animate-pulse transition-all"
                style={{
                  height: `${h}%`,
                  animationDuration: `${0.4 + (i % 4) * 0.2}s`,
                }}
              ></div>
            ))}
          </div>
          <div className="flex items-center gap-1 text-[#4edea3] font-mono text-[11px] font-bold">
            <span className="material-symbols-outlined text-[15px] animate-pulse">mic</span>
            <span>TRANSMITTING: {activeSpeaker}</span>
          </div>
        </div>

        {/* Bridge Participants Roster */}
        <div className="p-3.5 space-y-2 bg-[#0d1c2d] max-h-48 overflow-y-auto">
          <div className="font-mono text-[10px] text-[#e4beba] uppercase tracking-wider font-semibold">
            Bridge Participants (5 Connected)
          </div>
          <div className="space-y-1">
            {[
              { name: 'Capt. R. Vance', role: 'Incident Commander', active: activeSpeaker.includes('Vance') },
              { name: 'Elena Morales', role: 'VP Engineering', active: activeSpeaker.includes('Elena') },
              { name: 'Sarah T.', role: 'DBA On-Call', active: activeSpeaker.includes('Sarah') },
              { name: 'David Chen', role: 'General Counsel', active: activeSpeaker.includes('David') },
              { name: 'You (Console Operator)', role: 'SRE Lead', active: !isMicMuted },
            ].map((p, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-2 rounded text-[11px] font-mono ${
                  p.active
                    ? 'bg-[#1c2b3c] text-[#d4e4fa] border border-[#4cd7f6]/40'
                    : 'bg-[#010f1f] text-[#ab8986] border border-[#1c2b3c]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      p.active ? 'bg-[#4edea3] animate-ping' : 'bg-[#ab8986]'
                    }`}
                  ></span>
                  <span className="font-bold truncate">{p.name}</span>
                  <span className="text-[10px] text-[#e4beba] hidden sm:inline">({p.role})</span>
                </div>
                <span className="text-[10px] font-bold text-[#4cd7f6]">
                  {p.active ? 'TALKING' : 'ONLINE'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Live chatter logs */}
        <div className="p-3 bg-[#010f1f] border-t border-[#1c2b3c] space-y-1">
          <div className="font-mono text-[10px] text-[#e4beba] uppercase tracking-wider">
            Audio Bridge Dispatch Log
          </div>
          <div className="font-mono text-[10px] text-[#d4e4fa] space-y-1 max-h-20 overflow-y-auto">
            {simulatedChatter.map((c, i) => (
              <div key={i} className="truncate text-[#e4beba]">
                • {c}
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-3 bg-[#122131] flex items-center justify-between gap-2 border-t border-[#273647]">
          <button
            onClick={handleMicToggle}
            className={`h-10 px-3 rounded font-mono text-[11px] uppercase font-bold flex items-center gap-1.5 transition-all active:scale-95 border ${
              isMicMuted
                ? 'bg-[#93000a] text-[#ffb3ad] border-[#ff5451]'
                : 'bg-[#1c2b3c] text-[#4edea3] border-[#4edea3]/40'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">
              {isMicMuted ? 'mic_off' : 'mic'}
            </span>
            <span>{isMicMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          <button
            onClick={handleBroadcastSitrep}
            className="h-10 px-3 rounded bg-[#03b5d3] hover:brightness-110 text-[#00424e] font-mono text-[11px] uppercase font-bold flex items-center gap-1 active:scale-95 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[17px]">campaign</span>
            <span>Push SitRep</span>
          </button>

          <button
            onClick={() => {
              playBeep(600, 0.04);
              onClose();
            }}
            className="h-10 px-3.5 rounded bg-[#93000a] hover:bg-[#ff5451] text-[#ffdad7] font-mono text-[11px] uppercase font-bold flex items-center gap-1 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[17px]">call_end</span>
            <span>Disconnect</span>
          </button>
        </div>
      </div>
    </div>
  );
};
