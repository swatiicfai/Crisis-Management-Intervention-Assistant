import React, { useState, useEffect, useRef } from 'react';
import { IncidentScenarioData } from '../types/crisis';
import { playBeep, playConfirm, playEmergencyPulse } from '../utils/audio';

interface ActionMatrixScreenProps {
  scenario: IncidentScenarioData;
  onShowToast: (msg: string) => void;
}

export const ActionMatrixScreen: React.FC<ActionMatrixScreenProps> = ({
  scenario,
  onShowToast,
}) => {
  const isBreach = scenario.scenarioType === 'DATA_BREACH';

  // Live countdown timer for Window Depletion
  const [countdownSeconds, setCountdownSeconds] = useState(
    scenario.matrixPlaybook.windowDepletionSeconds
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs: number) => {
    const h = String(Math.floor(secs / 3600)).padStart(2, '0');
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Step 1 subtasks state & confirmation
  const [subtasksStep1, setSubtasksStep1] = useState(
    scenario.matrixPlaybook.steps[0].subtasks
  );
  const [isStep1Confirmed, setIsStep1Confirmed] = useState(false);
  const [isStep2Authorized, setIsStep2Authorized] = useState(false);

  // Emergency Abort Hold-to-Activate mechanism
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<any>(null);
  const [isAborted, setIsAborted] = useState(false);

  const toggleSubtask = (id: string) => {
    setSubtasksStep1((prev) =>
      prev.map((st) => {
        if (st.id === id) {
          const nextState = !st.completed;
          playBeep(nextState ? 950 : 600, 0.04);
          return {
            ...st,
            completed: nextState,
            status: nextState ? 'APPLIED' : 'AWAITING ACK',
          };
        }
        return st;
      })
    );
  };

  const handleConfirmStep1 = () => {
    setIsStep1Confirmed(true);
    playConfirm();
    onShowToast('Step 01 Confirmed: Step 02 Runbook Unlocked');
  };

  const handleAuthorizeStep2 = () => {
    setIsStep2Authorized(true);
    playConfirm();
    onShowToast('Step 02 Runbook Authorized & Dispatched');
  };

  const copyCommand = (cmd: string) => {
    navigator.clipboard?.writeText(cmd);
    playBeep(1200, 0.03);
    onShowToast('CLI payload copied to clipboard');
  };

  const startHoldAbort = () => {
    clearInterval(holdIntervalRef.current);
    holdIntervalRef.current = setInterval(() => {
      setHoldProgress((prev) => {
        if (prev >= 100) {
          clearInterval(holdIntervalRef.current);
          setIsAborted(true);
          playEmergencyPulse();
          onShowToast('GLOBAL EMERGENCY ABORT ENGAGED: All runbooks rolled back');
          return 100;
        }
        playBeep(400 + prev * 5, 0.02, 'triangle');
        return prev + 5;
      });
    }, 100);
  };

  const stopHoldAbort = () => {
    clearInterval(holdIntervalRef.current);
    if (holdProgress < 100) {
      setHoldProgress(0);
    }
  };

  return (
    <div className="flex flex-col w-full px-4 space-y-3.5 pb-12 max-w-4xl mx-auto animate-fade-in select-none">
      {/* 1. Tactical HUD Sub-Bar */}
      <section className="bg-[#1c2b3c] rounded-lg p-3.5 shadow-md border border-[#273647]">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="material-symbols-outlined text-[#4cd7f6] text-[18px] animate-pulse">
              {isBreach ? 'security' : 'radar'}
            </span>
            <span className="font-mono text-[11px] text-[#4cd7f6] tracking-widest uppercase truncate font-bold">
              {scenario.matrixPlaybook.subBarTitle}
            </span>
          </div>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#010f1f] text-[#4edea3] tracking-wider font-bold shrink-0 border border-[#273647]">
            {scenario.matrixPlaybook.defconStatus}
          </span>
        </div>

        <div className="mt-2.5 flex items-baseline justify-between">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] text-[#ab8986] tracking-wider uppercase font-semibold">
              {isBreach ? 'Regulatory Countdown' : 'Window Depletion'}
            </span>
            <span className="font-mono text-[20px] text-[#ff5451] tracking-widest font-bold">
              {formatCountdown(countdownSeconds)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] text-[#e4beba]">TARGET RTO:</span>
            <span className="font-mono text-[11px] text-[#4edea3] font-bold tracking-tight">
              {scenario.matrixPlaybook.targetRto}
            </span>
          </div>
        </div>

        {/* Execution Overview Pipeline */}
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between items-center font-mono text-[10px] text-[#ab8986] uppercase tracking-wider font-semibold">
            <span>{isBreach ? 'Containment Pipeline' : 'Execution Pipeline'}</span>
            <span className="text-[#4cd7f6]">
              {isStep2Authorized
                ? '2/3 Completed (Step 3 Queued)'
                : isStep1Confirmed
                ? '1/3 Confirmed (Step 2 Ready to Authorize)'
                : scenario.matrixPlaybook.executionSummary}
            </span>
          </div>

          <div className="w-full h-2.5 bg-[#010f1f] rounded-full overflow-hidden flex gap-1 p-0.5 border border-[#273647]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isStep1Confirmed ? 'bg-[#4edea3] w-1/3' : 'bg-[#4cd7f6] w-1/3 relative overflow-hidden'
              }`}
            >
              {!isStep1Confirmed && (
                <div className="absolute inset-0 bg-white/30 animate-[pulse_1.5s_infinite]"></div>
              )}
            </div>
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isStep2Authorized
                  ? 'bg-[#4edea3] w-1/3'
                  : isStep1Confirmed
                  ? 'bg-[#4cd7f6] w-1/3 animate-pulse'
                  : 'bg-[#273647] w-1/3'
              }`}
            ></div>
            <div className="h-full bg-[#122131] w-1/3 rounded-full opacity-60"></div>
          </div>

          <div className="flex justify-between font-mono text-[10px] text-[#e4beba] pt-0.5 font-semibold">
            <span className={isStep1Confirmed ? 'text-[#4edea3]' : 'text-[#4cd7f6]'}>
              {scenario.matrixPlaybook.phases[0]}
            </span>
            <span className={isStep1Confirmed ? 'text-[#4cd7f6]' : 'text-[#ab8986]'}>
              {scenario.matrixPlaybook.phases[1]}
            </span>
            <span className="text-[#ab8986]">{scenario.matrixPlaybook.phases[2]}</span>
          </div>
        </div>
      </section>

      {/* 2. Step 1: Active In-Progress */}
      <article className="bg-[#122131] rounded-lg p-3.5 shadow-lg relative overflow-hidden border border-[#273647]">
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 ${
            isStep1Confirmed ? 'bg-[#4edea3]' : 'bg-[#03b5d3]'
          }`}
        ></div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-1.5 py-0.5 rounded bg-[#273647] text-[#4cd7f6] font-mono text-[11px] tracking-wider font-bold">
                {scenario.matrixPlaybook.steps[0].stepNumber}
              </span>
              <span className="font-mono text-[11px] text-[#e4beba]">
                {scenario.matrixPlaybook.steps[0].timeWindow}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider font-bold ${
                  isStep1Confirmed
                    ? 'bg-[#003824] text-[#4edea3] border border-[#4edea3]/40'
                    : 'bg-[#4cd7f6]/15 text-[#4cd7f6]'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isStep1Confirmed ? 'bg-[#4edea3]' : 'bg-[#4cd7f6] animate-ping'
                  }`}
                ></span>
                {isStep1Confirmed ? 'COMPLETED • 100%' : 'IN PROGRESS • 80%'}
              </span>
            </div>
            <h2 className="font-sans text-[15px] font-bold text-[#d4e4fa] mt-1.5 leading-snug">
              {scenario.matrixPlaybook.steps[0].title}
            </h2>
          </div>
        </div>

        {/* Telemetry & Checklist */}
        <div className="mt-3 bg-[#0d1c2d] rounded p-2.5 space-y-1.5 border border-[#1c2b3c]">
          <div className="font-mono text-[10px] text-[#ab8986] uppercase tracking-wider font-semibold">
            Subtask Telemetry Validation (Click to toggle)
          </div>
          {subtasksStep1.map((st) => (
            <div
              key={st.id}
              onClick={() => toggleSubtask(st.id)}
              className={`flex items-center justify-between py-1.5 px-2 rounded cursor-pointer transition-all ${
                st.completed
                  ? 'bg-[#010f1f]/80 hover:bg-[#122131]'
                  : 'bg-[#ff5451]/15 hover:bg-[#ff5451]/25 border border-[#ff5451]/30'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`material-symbols-outlined text-[17px] ${
                    st.completed ? 'text-[#4edea3]' : 'text-[#ff5451] animate-pulse'
                  }`}
                >
                  {st.completed ? 'check_circle' : 'radio_button_checked'}
                </span>
                <span
                  className={`font-sans text-[12px] truncate ${
                    st.completed ? 'text-[#d4e4fa]' : 'text-[#ffb3ad] font-semibold'
                  }`}
                >
                  {st.title}
                </span>
              </div>
              <span
                className={`font-mono text-[10px] shrink-0 font-bold ${
                  st.completed ? 'text-[#4edea3]' : 'text-[#ffb3ad] tracking-wider'
                }`}
              >
                {st.status}
              </span>
            </div>
          ))}
        </div>

        {/* Metadata & Action Trigger */}
        <div className="mt-3 pt-1.5 flex items-center justify-between gap-2 border-t border-[#1c2b3c]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#1c2b3c] flex items-center justify-center text-[#e4beba] font-mono text-[11px] font-bold border border-[#273647]">
              {scenario.matrixPlaybook.steps[0].owner.initials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-mono text-[10px] text-[#ab8986] uppercase tracking-wide">
                Owner
              </span>
              <span className="font-sans text-[12px] text-[#d4e4fa] truncate font-medium">
                {scenario.matrixPlaybook.steps[0].owner.name}
              </span>
            </div>
          </div>
          <button
            onClick={handleConfirmStep1}
            disabled={isStep1Confirmed}
            className={`h-9 px-3 rounded flex items-center gap-1.5 font-mono text-[11px] tracking-wider uppercase active:scale-95 transition-all shrink-0 font-bold ${
              isStep1Confirmed
                ? 'bg-[#00a572] text-[#003824] shadow-[0_0_12px_rgba(78,222,163,0.3)] cursor-default'
                : 'bg-[#4cd7f6] text-[#003640] shadow-[0_0_12px_rgba(76,215,246,0.35)] hover:brightness-110'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">
              {isStep1Confirmed ? 'done_all' : 'verified'}
            </span>
            {isStep1Confirmed ? 'Confirmed' : 'Confirm Execution'}
          </button>
        </div>
      </article>

      {/* 3. Step 2: Blocked or Ready to Authorize */}
      <article className="bg-[#122131] rounded-lg p-3.5 shadow-md relative overflow-hidden border border-[#273647]">
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 ${
            isStep2Authorized ? 'bg-[#4edea3]' : isStep1Confirmed ? 'bg-[#4cd7f6]' : 'bg-[#5b403e]'
          }`}
        ></div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-1.5 py-0.5 rounded bg-[#273647] text-[#e4beba] font-mono text-[11px] tracking-wider font-bold">
                {scenario.matrixPlaybook.steps[1].stepNumber}
              </span>
              <span className="font-mono text-[11px] text-[#ab8986]">
                {scenario.matrixPlaybook.steps[1].timeWindow}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider font-bold ${
                  isStep2Authorized
                    ? 'bg-[#003824] text-[#4edea3]'
                    : isStep1Confirmed
                    ? 'bg-[#4cd7f6]/20 text-[#4cd7f6]'
                    : 'bg-[#93000a]/40 text-[#ffb3ad]'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isStep2Authorized ? 'bg-[#4edea3]' : isStep1Confirmed ? 'bg-[#4cd7f6]' : 'bg-[#ff5451]'
                  }`}
                ></span>
                {isStep2Authorized
                  ? 'AUTHORIZED • EXECUTING'
                  : isStep1Confirmed
                  ? 'READY FOR AUTHORIZATION'
                  : 'BLOCKED / AWAITING STEP 1'}
              </span>
            </div>
            <h2 className="font-sans text-[15px] font-bold text-[#d4e4fa] mt-1.5 leading-snug">
              {scenario.matrixPlaybook.steps[1].title}
            </h2>
          </div>
        </div>

        {/* CLI Payload Preview */}
        {scenario.matrixPlaybook.steps[1].cliPayload && (
          <div className="mt-3 bg-[#010f1f] rounded p-2.5 space-y-1.5 font-mono text-[11px] border border-[#1c2b3c]">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-[#ab8986] uppercase tracking-wider font-semibold">
                CLI Payload Preview
              </span>
              <span className="text-[10px] text-[#4cd7f6] tracking-widest uppercase font-bold">
                {scenario.matrixPlaybook.steps[1].cliPayload.envTag}
              </span>
            </div>
            <div className="p-2 bg-[#051424] rounded text-[#4cd7f6] overflow-x-auto flex items-center justify-between gap-2 border border-[#273647]">
              <code className="text-[11px] whitespace-nowrap font-mono font-bold">
                {scenario.matrixPlaybook.steps[1].cliPayload.command}
              </code>
              <button
                onClick={() => copyCommand(scenario.matrixPlaybook.steps[1].cliPayload!.command)}
                title="Copy Command"
                className="text-[#ab8986] hover:text-[#d4e4fa] active:scale-95 transition-all p-1"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
              </button>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[#ab8986] pt-0.5">
              <span>TIMEOUT: {scenario.matrixPlaybook.steps[1].cliPayload.timeout}</span>
              <span>•</span>
              <span>DRAIN POLICY: {scenario.matrixPlaybook.steps[1].cliPayload.policy}</span>
            </div>
          </div>
        )}

        {/* Metadata & Authorize Button */}
        <div className="mt-3 pt-1.5 flex items-center justify-between gap-2 border-t border-[#1c2b3c]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#1c2b3c] flex items-center justify-center text-[#e4beba] font-mono text-[11px] font-bold border border-[#273647]">
              {scenario.matrixPlaybook.steps[1].owner.initials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-mono text-[10px] text-[#ab8986] uppercase tracking-wide">
                Owner
              </span>
              <span className="font-sans text-[12px] text-[#d4e4fa] truncate font-medium">
                {scenario.matrixPlaybook.steps[1].owner.name}
              </span>
            </div>
          </div>
          <button
            onClick={handleAuthorizeStep2}
            disabled={!isStep1Confirmed || isStep2Authorized}
            className={`h-9 px-3 rounded flex items-center gap-1.5 font-mono text-[11px] tracking-wider uppercase active:scale-95 transition-all shrink-0 font-bold ${
              isStep2Authorized
                ? 'bg-[#00a572] text-[#003824] shadow-[0_0_12px_rgba(78,222,163,0.3)]'
                : isStep1Confirmed
                ? 'bg-[#4cd7f6] text-[#003640] shadow-[0_0_12px_rgba(76,215,246,0.35)] hover:brightness-110'
                : 'bg-[#273647] text-[#ab8986] opacity-60 cursor-not-allowed'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">
              {isStep2Authorized ? 'done_all' : isStep1Confirmed ? 'key' : 'lock'}
            </span>
            {isStep2Authorized ? 'Authorized' : 'Authorize Runbook'}
          </button>
        </div>
      </article>

      {/* 4. Step 3: Queued */}
      <article className="bg-[#0d1c2d] rounded-lg p-3.5 shadow-sm relative overflow-hidden border border-[#1c2b3c]">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2c3a4c]"></div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-1.5 py-0.5 rounded bg-[#1c2b3c] text-[#ab8986] font-mono text-[11px] tracking-wider font-bold">
                {scenario.matrixPlaybook.steps[2].stepNumber}
              </span>
              <span className="font-mono text-[11px] text-[#ab8986]">
                {scenario.matrixPlaybook.steps[2].timeWindow}
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#273647] text-[#4cd7f6] font-mono text-[10px] uppercase tracking-wider font-bold">
                QUEUED
              </span>
            </div>
            <h2 className="font-sans text-[15px] font-bold text-[#e4beba] mt-1.5 leading-snug">
              {scenario.matrixPlaybook.steps[2].title}
            </h2>
          </div>
        </div>

        {scenario.matrixPlaybook.steps[2].verificationGates && (
          <div className="mt-3 bg-[#010f1f]/70 rounded p-2.5 space-y-1.5 border border-[#1c2b3c]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#ab8986] uppercase tracking-wider font-semibold">
                {isBreach ? 'Compliance Gates' : 'Verification Gates'}
              </span>
              <span className="font-mono text-[10px] text-[#ab8986] font-bold">
                {scenario.matrixPlaybook.steps[2].verificationGates.stagingStatus}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <div className="bg-[#122131]/60 p-2 rounded border border-[#273647]/40">
                <span className="font-mono text-[10px] text-[#ab8986] block">
                  {isBreach ? 'DISK SNAPSHOTS' : 'SYNTHETIC PROBE'}
                </span>
                <span className="font-mono text-[11px] text-[#d4e4fa] font-bold">
                  {scenario.matrixPlaybook.steps[2].verificationGates.probe}
                </span>
              </div>
              <div className="bg-[#122131]/60 p-2 rounded border border-[#273647]/40">
                <span className="font-mono text-[10px] text-[#ab8986] block">
                  {isBreach ? 'CHAIN OF CUSTODY' : 'TARGET THRESHOLD'}
                </span>
                <span className="font-mono text-[11px] text-[#4edea3] font-bold">
                  {scenario.matrixPlaybook.steps[2].verificationGates.threshold}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 pt-1.5 flex items-center justify-between gap-2 border-t border-[#1c2b3c]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#1c2b3c] flex items-center justify-center text-[#ab8986] font-mono text-[11px] font-bold border border-[#273647]">
              {scenario.matrixPlaybook.steps[2].owner.initials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-mono text-[10px] text-[#ab8986] uppercase tracking-wide">
                Owner
              </span>
              <span className="font-sans text-[12px] text-[#ab8986] truncate">
                {scenario.matrixPlaybook.steps[2].owner.name}
              </span>
            </div>
          </div>
          <span className="font-mono text-[10px] text-[#ab8986] uppercase tracking-wider px-2 py-1 rounded bg-[#122131] border border-[#273647]">
            Awaiting Step 2
          </span>
        </div>
      </article>

      {/* 5. Live Telemetry Stream Indicator */}
      <section className="bg-[#010f1f] rounded-lg p-3 flex items-center justify-between border border-[#1c2b3c]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-[#4edea3] text-[18px]">sync_alt</span>
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-[10px] text-[#4edea3] uppercase tracking-wider font-bold">
              Event Sync Channel Connected
            </span>
            <span className="font-mono text-[11px] text-[#e4beba] truncate">
              {isBreach
                ? 'Secure Relay: us-east-sec-tunnel-01 (Ping: 3ms)'
                : 'Relay: us-east-core-tunnel-04 (Ping: 4ms)'}
            </span>
          </div>
        </div>
        <span className="font-mono text-[10px] text-[#ab8986] shrink-0 font-bold">100% HEALTH</span>
      </section>

      {/* 6. Emergency Hold-to-Abort Trigger */}
      <div className="pt-2">
        <button
          onMouseDown={startHoldAbort}
          onMouseUp={stopHoldAbort}
          onMouseLeave={stopHoldAbort}
          onTouchStart={startHoldAbort}
          onTouchEnd={stopHoldAbort}
          className={`w-full h-12 rounded flex items-center justify-center gap-2 font-mono text-[12px] tracking-widest uppercase transition-all shadow-[0_0_16px_rgba(147,0,10,0.5)] font-bold relative overflow-hidden active:scale-[0.99] ${
            isAborted
              ? 'bg-[#93000a] text-white'
              : 'bg-[#93000a] hover:bg-[#ff5451]/90 text-[#ffdad7]'
          }`}
        >
          {/* Progress fill overlay */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-[#ff5451] opacity-40 transition-all pointer-events-none"
            style={{ width: `${holdProgress}%` }}
          ></div>
          <span className="material-symbols-outlined text-[19px] relative z-10">
            {isAborted ? 'gpp_bad' : 'fmd_bad'}
          </span>
          <span className="relative z-10">
            {isAborted
              ? 'ACTIONS ROLLED BACK (SAFE STATE)'
              : holdProgress > 0
              ? `HOLDING... ${holdProgress}%`
              : isBreach
              ? 'Global Emergency Abort / Rollback'
              : 'Abort / Rollback All Actions'}
          </span>
        </button>
        <p className="font-mono text-[10px] text-center text-[#ab8986] mt-1.5 tracking-wide">
          HOLD 2.0S TO ENGAGE GLOBAL FAILSAFE AUTOMATION
        </p>
      </div>
    </div>
  );
};
