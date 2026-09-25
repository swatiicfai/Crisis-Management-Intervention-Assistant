import React, { useState } from 'react';
import { IncidentScenarioData } from '../types/crisis';
import { playBeep, playConfirm, playAlert } from '../utils/audio';

interface ScenarioSwitcherModalProps {
  isOpen: boolean;
  currentScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  onCustomScenarioGenerated?: (newScenario: IncidentScenarioData) => void;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const ScenarioSwitcherModal: React.FC<ScenarioSwitcherModalProps> = ({
  isOpen,
  currentScenarioId,
  onSelectScenario,
  onClose,
  onShowToast,
}) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'INFRA_CASCADE',
      code: '#CRX-9402',
      defcon: 'SEV-1 DEFCON 2',
      title: 'Production Data Pipeline Cascade & Auth Lockout',
      type: 'Core Cloud Infrastructure Failure',
      risk: '$180,000 / HR PENALTY',
    },
    {
      id: 'DATA_BREACH',
      code: '#BRCH-8820',
      defcon: 'SEV-0 DEFCON 1',
      title: 'Unauthorized Exfiltration of Customer PII Vault & OAuth Master Keys',
      type: 'Zero-Trust Cyber Breach',
      risk: '1.8 GB / MIN EXFILTRATION',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010f1f]/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-md bg-[#0d1c2d] rounded-lg shadow-2xl flex flex-col border border-[#4cd7f6]/60 overflow-hidden">
        {/* Header */}
        <div className="bg-[#122131] p-3.5 px-4 flex items-center justify-between border-b border-[#273647]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">
              hub
            </span>
            <span className="font-mono text-[12px] text-[#d4e4fa] font-bold uppercase tracking-wider">
              INCIDENT SCENARIO SELECTOR
            </span>
          </div>
          <button
            onClick={() => {
              playBeep(600, 0.03);
              onClose();
            }}
            className="text-[#e4beba] hover:text-[#d4e4fa]"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="font-mono text-[10px] text-[#e4beba] uppercase tracking-wider font-semibold">
            Active Tactical Simulation Presets
          </div>

          <div className="space-y-2">
            {scenarios.map((sc) => {
              const isSelected = sc.id === currentScenarioId;
              return (
                <div
                  key={sc.id}
                  onClick={() => {
                    onSelectScenario(sc.id);
                    playConfirm();
                    onShowToast(`Switched to ${sc.code} (${sc.defcon})`);
                    onClose();
                  }}
                  className={`p-3 rounded border cursor-pointer transition-all active:scale-[0.99] ${
                    isSelected
                      ? 'bg-[#1c2b3c] border-[#4cd7f6] shadow-[0_0_12px_rgba(76,215,246,0.25)]'
                      : 'bg-[#010f1f] border-[#273647] hover:bg-[#122131]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-1.5 py-0.5 rounded bg-[#93000a] text-[#ffb3ad] font-mono text-[9px] font-bold tracking-wider uppercase">
                      {sc.defcon}
                    </span>
                    <span className="font-mono text-[11px] text-[#4cd7f6] font-bold">{sc.code}</span>
                  </div>
                  <h4 className="font-sans text-[13px] font-bold text-[#d4e4fa] mt-1.5 leading-snug">
                    {sc.title}
                  </h4>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#1c2b3c] font-mono text-[10px]">
                    <span className="text-[#e4beba]">{sc.type}</span>
                    <span className="text-[#ff5451] font-bold">{sc.risk}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Info */}
          <div className="bg-[#010f1f] rounded p-2.5 border border-[#1c2b3c] font-mono text-[11px] text-[#e4beba] space-y-1">
            <div className="text-[#4edea3] font-bold">✓ Dual Operational Workflows Supported</div>
            <div>• Scenario 1 reflects SEV-1 DEFCON 2 DB/Redis Cascade Playbook</div>
            <div>• Scenario 2 reflects SEV-0 DEFCON 1 Cyber Breach &amp; Blackout</div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#122131] flex justify-end border-t border-[#273647]">
          <button
            onClick={() => {
              playBeep(600, 0.03);
              onClose();
            }}
            className="h-9 px-4 rounded bg-[#010f1f] hover:bg-[#1c2b3c] text-[#d4e4fa] font-mono text-[11px] uppercase font-bold border border-[#273647]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
