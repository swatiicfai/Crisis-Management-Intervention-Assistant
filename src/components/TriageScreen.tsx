import React, { useState } from 'react';
import { IncidentScenarioData } from '../types/crisis';
import { playBeep, playConfirm, playAlert } from '../utils/audio';

interface TriageScreenProps {
  scenario: IncidentScenarioData;
  elapsedSeconds: number;
  onShowToast: (msg: string) => void;
  onNavigateTab: (tab: any) => void;
}

export const TriageScreen: React.FC<TriageScreenProps> = ({
  scenario,
  elapsedSeconds,
  onShowToast,
  onNavigateTab,
}) => {
  const isBreach = scenario.scenarioType === 'DATA_BREACH';

  // Interactive Action States
  const [isRiskAcknowledged, setIsRiskAcknowledged] = useState(false);
  const [isForceMajeureDeclared, setIsForceMajeureDeclared] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);
  const [dispatchLogs, setDispatchLogs] = useState(scenario.dispatchLogs);
  const [newLogInput, setNewLogInput] = useState('');
  const [isAiDiagnosing, setIsAiDiagnosing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);

  const formatTimer = (totalSecs: number) => {
    const hours = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSecs % 60).padStart(2, '0');
    return `T+${hours}:${mins}:${secs}`;
  };

  const handleAcknowledge = () => {
    setIsRiskAcknowledged(!isRiskAcknowledged);
    if (!isRiskAcknowledged) {
      playConfirm();
      onShowToast('Critical risk acknowledgment logged to audit ledger');
    } else {
      playBeep(700, 0.05);
      onShowToast('Acknowledgment revoked');
    }
  };

  const handleForceMajeure = () => {
    const confirmed = window.confirm(
      isBreach
        ? 'AFFIRM ISOLATION: Sever cross-region replication links for all primary DB shards?'
        : 'AFFIRM DECLARATION: Emit Force Majeure regulatory flag across all upstream consumer gateways?'
    );
    if (confirmed) {
      setIsForceMajeureDeclared(true);
      playAlert();
      onShowToast(isBreach ? 'CRITICAL: DB Shards Isolated' : 'FORCE MAJEURE ACTIVATED');
    }
  };

  const handleEscalate = () => {
    setIsEscalated(true);
    playAlert();
    onShowToast(isBreach ? 'Legal & Cyber Counsel Engaged' : 'Tier-3 Executive Incident Bridge Paged');
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogInput.trim()) return;

    const newLog = {
      id: `custom-${Date.now()}`,
      timestamp: new Date().toISOString().substring(11, 19),
      message: newLogInput.trim(),
      level: 'SYNC' as const,
    };
    setDispatchLogs([newLog, ...dispatchLogs]);
    setNewLogInput('');
    playBeep(1100, 0.04);
    onShowToast('Log injected into dispatch feed');
  };

  const handleRunAiDiagnostic = async () => {
    setIsAiDiagnosing(true);
    playBeep(900, 0.06);
    try {
      const res = await fetch('/api/gemini/analyze-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentName: scenario.title,
          symptoms: scenario.rootCause.metrics.map((m) => `${m.label}: ${m.value}${m.unit || ''}`),
        }),
      });
      const data = await res.json();
      if (data?.data) {
        setAiAnalysisResult(
          `Copilot Hypothesis: ${data.data.rootCauseHypothesis} (${data.data.confidence}% confidence). Recommended priority: ${data.data.recommendedActions?.[0] || 'Execute traffic drain'}`
        );
        playConfirm();
        onShowToast('AI Incident Assessment generated');
      }
    } catch {
      setAiAnalysisResult('Diagnostic complete: Resource pool exhaustion verified. Proceed to Step 1 traffic drain.');
      onShowToast('Diagnostic completed with cached telemetry');
    } finally {
      setIsAiDiagnosing(false);
    }
  };

  return (
    <div className="flex flex-col w-full px-4 space-y-3 pb-8 max-w-4xl mx-auto animate-fade-in select-none">
      {/* 1. Crisis Banner Header Module */}
      <div className="bg-[#0d1c2d] rounded-lg p-3.5 shadow-md relative overflow-hidden border border-[#1c2b3c]">
        <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-[#ff5451]/10 blur-2xl pointer-events-none"></div>
        <div className="flex items-center justify-between gap-1 mb-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#93000a] text-[#ffb3ad] font-mono text-[10px] tracking-wider uppercase font-bold shadow-[0_0_8px_rgba(255,84,81,0.35)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffb3ad] animate-ping"></span>
              {scenario.defconLevel === 'SEV-0 DEFCON 1' ? 'SEV-0 DEFCON 1' : 'SEV-1 CRITICAL'}
            </span>
            <span className="font-mono text-[12px] text-[#4cd7f6] bg-[#1c2b3c] px-2 py-0.5 rounded tracking-wide font-semibold">
              {scenario.code}
            </span>
          </div>
          <div className="flex items-center gap-1 bg-[#122131] px-2 py-0.5 rounded border border-[#273647]/50">
            <span className="material-symbols-outlined text-[14px] text-[#e4beba]">schedule</span>
            <span className="font-mono text-[12px] text-[#d4e4fa] font-semibold">
              {formatTimer(elapsedSeconds)}
            </span>
          </div>
        </div>

        <h1 className="font-sans text-[17px] font-bold text-[#d4e4fa] uppercase tracking-tight line-clamp-2 mt-1 leading-snug">
          {scenario.title}
        </h1>

        <div className="mt-2.5 pt-1 flex items-center justify-between gap-2 bg-[#010f1f]/60 px-2.5 py-1.5 rounded border border-[#273647]/40">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[#4cd7f6] text-[16px]">
              {isBreach ? 'security' : 'military_tech'}
            </span>
            <span className="font-mono text-[11px] text-[#e4beba] uppercase tracking-wider truncate">
              {isBreach ? 'VECTOR:' : 'CMD:'}
            </span>
            <span className="font-mono text-[11px] text-[#d4e4fa] font-semibold truncate">
              {scenario.commandLead}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#4edea3]"></span>
            <span className="font-mono text-[10px] text-[#4edea3] uppercase tracking-widest font-bold">
              {scenario.commandLockStatus}
            </span>
          </div>
        </div>
      </div>

      {/* 2. 1-Hour Threat Horizon / 72-Hour Disclosure Countdown */}
      <div className="bg-[#93000a]/25 rounded-lg p-3.5 relative overflow-hidden shadow-[0_0_16px_rgba(255,84,81,0.2)] border-l-4 border-[#ff5451]">
        <div className="flex items-start gap-2.5 pl-0.5">
          <div className="p-1.5 bg-[#93000a] text-[#ffb3ad] rounded flex-shrink-0 mt-0.5 shadow-sm">
            <span className="material-symbols-outlined text-[19px]">
              {isBreach ? 'timer' : 'warning'}
            </span>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <span className="font-mono text-[10px] text-[#ffb3ad] tracking-widest uppercase font-bold">
                {scenario.threatHorizon.badge}
              </span>
              <span className="font-mono text-[11px] text-[#ffb3ad] bg-[#ff5451]/20 px-1.5 py-0.5 rounded font-bold border border-[#ff5451]/30">
                {scenario.threatHorizon.timeRemaining}
              </span>
            </div>
            <p className="font-sans text-[13px] text-[#d4e4fa] font-semibold mt-1 leading-snug">
              {scenario.threatHorizon.headline}
            </p>
            <div className="mt-2 flex items-center justify-between gap-1 bg-[#010f1f]/80 px-2.5 py-1.5 rounded border border-[#273647]/50">
              <span className="font-mono text-[10px] text-[#e4beba] uppercase">
                {scenario.threatHorizon.liabilityLabel}
              </span>
              <span className="font-mono text-[13px] text-[#ffb3ad] font-bold tracking-tight">
                {scenario.threatHorizon.liabilityValue}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Root Cause Hypothesis & Telemetry Grid */}
      <div className="bg-[#0d1c2d] rounded-lg p-3.5 space-y-3 shadow-sm border border-[#1c2b3c]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#4cd7f6] text-[18px]">
              {isBreach ? 'database' : 'biotech'}
            </span>
            <span className="font-mono text-[11px] text-[#d4e4fa] uppercase tracking-wider font-bold">
              {isBreach ? 'Compromised Database Vaults' : 'Root Cause Hypothesis'}
            </span>
          </div>
          <span
            className={`font-mono text-[11px] px-1.5 py-0.5 rounded font-semibold ${
              isBreach
                ? 'text-[#ffb3ad] bg-[#93000a]/40 border border-[#ff5451]/30'
                : 'text-[#4cd7f6] bg-[#1c2b3c]'
            }`}
          >
            {isBreach ? '3 TABLES EXFILTRATED' : `${scenario.rootCause.confidence}% CONFIDENCE`}
          </span>
        </div>

        {isBreach ? (
          <div className="bg-[#010f1f] p-2.5 rounded space-y-1.5 border border-[#1c2b3c]">
            <div className="flex items-center justify-between bg-[#122131] p-1.5 px-2 rounded">
              <span className="font-mono text-[12px] text-[#ffb3ad] font-bold">users_pii</span>
              <span className="font-mono text-[10px] text-[#e4beba]">1.4M Records Copied</span>
            </div>
            <div className="flex items-center justify-between bg-[#122131] p-1.5 px-2 rounded">
              <span className="font-mono text-[12px] text-[#ffb3ad] font-bold">oauth_tokens</span>
              <span className="font-mono text-[10px] text-[#e4beba]">Master Keys Compromised</span>
            </div>
            <div className="flex items-center justify-between bg-[#122131] p-1.5 px-2 rounded">
              <span className="font-mono text-[12px] text-[#ffb3ad] font-bold">billing_vault</span>
              <span className="font-mono text-[10px] text-[#e4beba]">Encrypted Payment Hashes</span>
            </div>
          </div>
        ) : (
          <div className="bg-[#010f1f] p-2.5 rounded border border-[#1c2b3c]">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[#ff5451] text-[18px] mt-0.5 flex-shrink-0">
                lock_reset
              </span>
              <div className="min-w-0">
                <span className="font-mono text-[10px] text-[#e4beba] uppercase tracking-wider block">
                  Identified Trigger Pattern
                </span>
                <p className="font-sans text-[13px] text-[#d4e4fa] font-semibold tracking-tight leading-snug">
                  {scenario.rootCause.hypothesis}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Diagnostic Telemetry Cards */}
        <div className="grid grid-cols-3 gap-2">
          {scenario.rootCause.metrics.map((m, idx) => (
            <div
              key={idx}
              onClick={() => {
                playBeep(900, 0.03);
                onNavigateTab('system-health');
                onShowToast(`Opened D3 System Health Monitor for ${m.label}`);
              }}
              title="Click to view detailed D3 real-time telemetry"
              className="bg-[#122131] hover:bg-[#1c2b3c] p-2.5 rounded flex flex-col justify-between relative overflow-hidden border border-[#1c2b3c] hover:border-[#4cd7f6]/50 cursor-pointer active:scale-95 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#e4beba] group-hover:text-[#4cd7f6] uppercase truncate transition-colors">
                    {m.label} ↗
                  </span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      m.status === 'breached' ? 'bg-[#ff5451]' : 'bg-[#4cd7f6]'
                    }`}
                  ></span>
                </div>
                <div className="font-mono text-[18px] text-[#ffb3ad] mt-0.5 font-bold">
                  {m.value}
                  {m.unit && <span className="font-mono text-[10px] ml-0.5">{m.unit}</span>}
                </div>
                <div className="font-mono text-[10px] text-[#ff5451] truncate font-semibold">
                  {m.change}
                </div>
              </div>

              {/* Sparkline or Meter */}
              {idx === 1 ? (
                <div className="w-full bg-[#273647] h-2 rounded mt-2 overflow-hidden">
                  <div
                    className="bg-[#4cd7f6] h-full rounded transition-all duration-700"
                    style={{ width: `${m.progressPercent}%` }}
                  ></div>
                </div>
              ) : (
                <svg className="w-full h-5 mt-1 text-[#ff5451]" fill="none" viewBox="0 0 100 24">
                  <path
                    d={
                      idx === 0
                        ? 'M0 20 L20 18 L40 19 L60 12 L75 16 L88 4 L100 2'
                        : 'M0 22 L25 20 L50 21 L65 14 L80 18 L100 6'
                    }
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Immediate Priority Focus: T+0 Milestone */}
      <div className="bg-[#1c2b3c] rounded-lg p-3.5 shadow-md relative overflow-hidden border border-[#273647]">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#4cd7f6] text-[18px] animate-pulse">
              {isBreach ? 'shield_lock' : 'bolt'}
            </span>
            <span className="font-mono text-[11px] text-[#4cd7f6] uppercase tracking-widest font-bold">
              {scenario.immediatePriority.badge}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-[#010f1f] font-mono text-[11px] text-[#4cd7f6] font-bold border border-[#273647]">
            {scenario.immediatePriority.taskIndex}
          </span>
        </div>

        <div className="space-y-2 mt-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="font-mono text-[10px] text-[#e4beba] uppercase tracking-wider block">
                ACTIVE RUNBOOK NODE
              </span>
              <p className="font-sans text-[13px] text-[#d4e4fa] font-semibold leading-snug">
                {scenario.immediatePriority.taskTitle}
              </p>
            </div>
            <span className="font-mono text-[18px] text-[#4cd7f6] font-bold flex-shrink-0">
              {scenario.immediatePriority.progress}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#010f1f] h-3 rounded overflow-hidden flex gap-0.5 p-0.5 border border-[#273647]">
            <div
              className="h-full bg-[#4cd7f6] rounded-sm transition-all duration-700"
              style={{ width: `${scenario.immediatePriority.progress}%` }}
            ></div>
            <div className="h-full bg-[#273647] rounded-sm flex-1"></div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[#e4beba] pt-1">
            {scenario.immediatePriority.targets.map((t, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 bg-[#0d1c2d] px-2 py-1 rounded border border-[#1c2b3c]"
              >
                <span className="material-symbols-outlined text-[#4edea3] text-[14px]">
                  {t.icon}
                </span>
                <span className="font-mono text-[10px] uppercase truncate">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Operational Fast Action Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between px-0.5">
          <span className="font-mono text-[10px] text-[#e4beba] uppercase tracking-wider">
            CRITICAL COMMAND ACTIONS
          </span>
          <span className="font-mono text-[10px] text-[#ab8986] uppercase tracking-wider">
            FAIL-SAFE GUARDS ENGAGED
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {/* Action 1: Acknowledge */}
          <button
            onClick={handleAcknowledge}
            className={`h-12 rounded flex flex-col items-center justify-center transition-all px-1 text-center border active:scale-95 ${
              isRiskAcknowledged
                ? 'bg-[#00a572] text-[#003824] border-[#4edea3] shadow-[0_0_10px_rgba(78,222,163,0.3)]'
                : 'bg-[#122131] hover:bg-[#1c2b3c] text-[#d4e4fa] border-[#273647]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isRiskAcknowledged ? 'check_circle' : 'fact_check'}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider mt-0.5 truncate w-full font-bold">
              {isRiskAcknowledged ? 'Acknowledged' : 'Acknowledge'}
            </span>
          </button>

          {/* Action 2: Force Majeure / Isolate Shards */}
          <button
            onClick={handleForceMajeure}
            className={`h-12 rounded flex flex-col items-center justify-center transition-all px-1 text-center border active:scale-95 ${
              isForceMajeureDeclared
                ? 'bg-[#93000a] text-[#ffb3ad] border-[#ff5451] shadow-[0_0_10px_rgba(255,84,81,0.4)]'
                : 'bg-[#1c2b3c] hover:bg-[#2c3a4c] text-[#ffb3ad] border-[#5b403e]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isBreach ? 'dns' : 'gavel'}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider mt-0.5 truncate w-full font-bold">
              {isForceMajeureDeclared
                ? isBreach
                  ? 'Shards Isolated'
                  : 'Declared'
                : isBreach
                ? 'Isolate DB Shards'
                : 'Force Majeure'}
            </span>
          </button>

          {/* Action 3: Escalate T3 / Legal */}
          <button
            onClick={handleEscalate}
            className={`h-12 rounded flex flex-col items-center justify-center transition-all shadow-[0_0_12px_rgba(255,84,81,0.45)] px-1 text-center border active:scale-95 ${
              isEscalated
                ? 'bg-[#273647] text-[#ffb3ad] border-[#ff5451]'
                : 'bg-[#ff5451] hover:bg-[#ffb3ad] text-[#68000a] border-[#ff5451]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isBreach ? 'gavel' : 'eject'}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider mt-0.5 truncate w-full font-bold">
              {isEscalated
                ? isBreach
                  ? 'Legal Engaged'
                  : 'Exec Paged'
                : isBreach
                ? 'Engage Legal'
                : 'Escalate T3'}
            </span>
          </button>
        </div>
      </div>

      {/* 6. AI Assessment Callout (if activated) */}
      {aiAnalysisResult && (
        <div className="bg-[#00311f] border border-[#4edea3]/40 rounded-lg p-3 text-[#4edea3] font-mono text-[12px] flex items-start gap-2 animate-fade-in shadow-lg">
          <span className="material-symbols-outlined text-[18px] text-[#4edea3] flex-shrink-0 mt-0.5">
            smart_toy
          </span>
          <div className="flex-1">
            <span className="font-bold uppercase tracking-wider block text-[10px] text-[#6ffbbe]">
              Incident AI Copilot SitRep
            </span>
            <p className="mt-1 leading-relaxed text-[#d4e4fa]">{aiAnalysisResult}</p>
          </div>
          <button
            onClick={() => setAiAnalysisResult(null)}
            className="text-[#e4beba] hover:text-white"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* 7. Live War Room Dispatch Stream */}
      <div className="bg-[#0d1c2d] rounded-lg p-3.5 space-y-2.5 shadow-sm border border-[#1c2b3c]">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#4edea3] text-[16px]">stream</span>
            <span className="font-mono text-[11px] text-[#d4e4fa] uppercase tracking-wider font-bold">
              War Room Dispatch Stream
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunAiDiagnostic}
              disabled={isAiDiagnosing}
              title="Run Gemini Root Cause Diagnostic"
              className="px-2 py-0.5 rounded bg-[#1c2b3c] hover:bg-[#273647] text-[#4cd7f6] font-mono text-[10px] uppercase font-bold flex items-center gap-1 border border-[#4cd7f6]/30 active:scale-95 transition-all"
            >
              <span className={`material-symbols-outlined text-[13px] ${isAiDiagnosing ? 'animate-spin' : ''}`}>
                {isAiDiagnosing ? 'sync' : 'psychology'}
              </span>
              <span>{isAiDiagnosing ? 'Analyzing...' : 'AI Copilot'}</span>
            </button>
            <span className="font-mono text-[11px] text-[#4edea3] font-bold">LIVE FEED</span>
          </div>
        </div>

        <div className="space-y-1 font-mono text-[11px] max-h-48 overflow-y-auto pr-1">
          {dispatchLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start justify-between py-1 bg-[#010f1f]/50 px-2 rounded border border-[#1c2b3c]/60"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-[#4cd7f6] font-bold">[{log.timestamp}]</span>
                <span className="text-[#d4e4fa] truncate">{log.message}</span>
              </div>
              <span
                className={`font-bold flex-shrink-0 ml-2 text-[10px] px-1 py-0.2 rounded ${
                  log.level === 'CRIT' || log.level === 'EXFIL'
                    ? 'text-[#ffb3ad] bg-[#93000a]/60'
                    : log.level === 'SYNC' || log.level === 'SECURE'
                    ? 'text-[#4edea3] bg-[#003824]/60'
                    : 'text-[#ffdad7] bg-[#5b403e]/60'
                }`}
              >
                {log.level}
              </span>
            </div>
          ))}
        </div>

        {/* Injection form */}
        <form onSubmit={handleAddLog} className="flex gap-1.5 pt-1">
          <input
            type="text"
            value={newLogInput}
            onChange={(e) => setNewLogInput(e.target.value)}
            placeholder="Inject sitrep log into dispatch..."
            className="flex-1 h-8 bg-[#010f1f] rounded px-2.5 font-mono text-[11px] text-[#d4e4fa] placeholder-[#ab8986]/60 border border-[#273647] focus:outline-none focus:border-[#4cd7f6]"
          />
          <button
            type="submit"
            className="h-8 px-3 rounded bg-[#122131] hover:bg-[#1c2b3c] text-[#4cd7f6] font-mono text-[10px] uppercase font-bold border border-[#4cd7f6]/40 active:scale-95"
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
};
