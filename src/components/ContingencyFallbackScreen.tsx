import React, { useState, useEffect, useRef } from 'react';
import { IncidentScenarioData } from '../types/crisis';
import { playBeep, playConfirm, playAlert, playEmergencyPulse } from '../utils/audio';

interface ContingencyFallbackScreenProps {
  scenario: IncidentScenarioData;
  onShowToast: (msg: string) => void;
}

export const ContingencyFallbackScreen: React.FC<ContingencyFallbackScreenProps> = ({
  scenario,
  onShowToast,
}) => {
  const isBreach = scenario.scenarioType === 'DATA_BREACH';

  // Live countdown timer for T-Minus
  const [secondsLeft, setSecondsLeft] = useState(scenario.fallbackPlan.windowTMinusSeconds);
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs: number) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // Override lock button state
  const [isOverrideUnlocked, setIsOverrideUnlocked] = useState(true);

  // Slider Drag Mechanics
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragProgress, setDragProgress] = useState(0); // 0 to 100
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const currentTranslateRef = useRef(0);

  // Confirmation Modal
  const [showModal, setShowModal] = useState(false);
  const [isExecutingFailover, setIsExecutingFailover] = useState(false);
  const [isFailoverComplete, setIsFailoverComplete] = useState(false);

  // Drag Handlers (supports both Mouse and Touch)
  const handlePointerDown = (clientX: number) => {
    setIsDragging(true);
    startXRef.current = clientX;
    playBeep(750, 0.03);
  };

  const handlePointerMove = (clientX: number) => {
    if (!isDragging || !trackRef.current) return;
    const trackWidth = trackRef.current.clientWidth - 56; // thumb width ~48px + padding
    const deltaX = clientX - startXRef.current;
    const clampedX = Math.max(0, Math.min(trackWidth, deltaX));
    currentTranslateRef.current = clampedX;
    const percent = Math.round((clampedX / trackWidth) * 100);
    setDragProgress(percent);

    if (percent % 10 === 0) {
      playBeep(500 + percent * 4, 0.015, 'triangle');
    }

    if (percent >= 92) {
      setIsDragging(false);
      setDragProgress(100);
      playAlert();
      setShowModal(true);
    }
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragProgress < 92) {
      setDragProgress(0);
      currentTranslateRef.current = 0;
    }
  };

  const handleToggleOverride = () => {
    const next = !isOverrideUnlocked;
    setIsOverrideUnlocked(next);
    playBeep(next ? 1100 : 700, 0.05);
    onShowToast(next ? 'Commander Override Token Unlocked' : 'Commander Override Locked');
  };

  const handleCommitFailover = () => {
    setIsExecutingFailover(true);
    playEmergencyPulse();
    setTimeout(() => {
      setIsExecutingFailover(false);
      setIsFailoverComplete(true);
      playConfirm();
      onShowToast(
        isBreach
          ? 'TOTAL BLACKOUT ACTIVE: Global perimeter isolated and vaults sealed'
          : 'PLAN B EXECUTED: Production routing switched to EU-Central-1 Frankfurt'
      );
      setTimeout(() => {
        setShowModal(false);
      }, 1400);
    }, 1500);
  };

  return (
    <div className="flex flex-col w-full px-4 space-y-3.5 pb-12 max-w-4xl mx-auto animate-fade-in select-none">
      {/* 1. DEFCON STATUS STRIP */}
      <div className="flex items-center justify-between bg-[#1c2b3c] rounded-lg p-2.5 px-3 shadow-md border border-[#273647]">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff5451] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff5451]"></span>
          </span>
          <span className="font-mono text-[11px] text-[#ffb3ad] font-bold uppercase tracking-wider">
            {isFailoverComplete
              ? isBreach
                ? 'TOTAL BLACKOUT ACTIVE [ISOLATED]'
                : 'PLAN B ACTIVE: EU-CENTRAL-1 (READ-ONLY)'
              : scenario.fallbackPlan.contingencyActiveTitle}
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span className="text-[#e4beba] uppercase font-semibold">
            {scenario.fallbackPlan.synchOrVaultLabel}
          </span>
          <span className="text-[#4edea3] font-bold tracking-tight">
            {scenario.fallbackPlan.synchOrVaultValue}
          </span>
        </div>
      </div>

      {/* 2. TRIGGER CRITERIA HUD CARD */}
      <div className="relative bg-[#122131] rounded-lg p-3.5 shadow-xl overflow-hidden border border-[#273647]">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ff5451]"></div>
        <div className="flex items-start justify-between gap-2 pl-1">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="px-1.5 py-0.5 rounded bg-[#93000a] text-[#ffb3ad] font-mono text-[10px] tracking-widest uppercase font-bold">
                AUTOMATED TRIPWIRE
              </span>
              <span className="text-[#4cd7f6] font-mono text-[11px] tracking-wider font-semibold">
                {scenario.fallbackPlan.authCode}
              </span>
            </div>
            <span className="font-sans text-[15px] font-bold text-[#d4e4fa] uppercase tracking-tight">
              TRIGGER CRITERIA FOR PLAN B
            </span>
          </div>
          <div className="flex flex-col items-end flex-shrink-0 bg-[#0d1c2d] px-2 py-1 rounded border border-[#1c2b3c]">
            <span className="font-mono text-[10px] text-[#e4beba] uppercase font-semibold">
              WINDOW T-MINUS
            </span>
            <span className="font-mono text-[19px] text-[#ff5451] tracking-wider font-bold">
              {formatCountdown(secondsLeft)}
            </span>
          </div>
        </div>

        <p className="font-sans text-[12px] text-[#e4beba] mt-2 pl-1 leading-relaxed">
          {scenario.fallbackPlan.triggerCriteriaText}
        </p>

        {/* LIVE METRICS DUAL TELEMETRY GAUGE */}
        <div className="grid grid-cols-2 gap-2 mt-3 pl-1">
          {/* Left Metric */}
          <div className="bg-[#010f1f] p-2.5 rounded flex flex-col justify-between border border-[#1c2b3c]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#e4beba] uppercase font-semibold">
                {scenario.fallbackPlan.liveTelemetryGauges.left.label}
              </span>
              <span className="material-symbols-outlined text-[#ff5451] text-[16px]">
                {isBreach ? 'upload' : 'speed'}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-mono text-[19px] text-[#ffb3ad] font-bold">
                {scenario.fallbackPlan.liveTelemetryGauges.left.value}
              </span>
              <span className="font-mono text-[10px] text-[#e4beba]">
                {scenario.fallbackPlan.liveTelemetryGauges.left.unit}
              </span>
            </div>
            <div className="w-full bg-[#1c2b3c] h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#ff5451] h-full rounded-full transition-all duration-500"
                style={{
                  width: `${scenario.fallbackPlan.liveTelemetryGauges.left.percent}%`,
                }}
              ></div>
            </div>
            <div className="flex justify-between font-mono text-[10px] text-[#e4beba] mt-1">
              <span>{scenario.fallbackPlan.liveTelemetryGauges.left.target}</span>
              <span className="text-[#ff5451] font-bold">
                {scenario.fallbackPlan.liveTelemetryGauges.left.change}
              </span>
            </div>
          </div>

          {/* Right Metric */}
          <div className="bg-[#010f1f] p-2.5 rounded flex flex-col justify-between border border-[#1c2b3c]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#e4beba] uppercase font-semibold">
                {scenario.fallbackPlan.liveTelemetryGauges.right.label}
              </span>
              <span className="material-symbols-outlined text-[#ff5451] text-[16px]">
                {isBreach ? 'gpp_bad' : 'warning'}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-mono text-[19px] text-[#ffb3ad] font-bold">
                {scenario.fallbackPlan.liveTelemetryGauges.right.value}
              </span>
              <span className="font-mono text-[10px] text-[#e4beba]">
                {scenario.fallbackPlan.liveTelemetryGauges.right.unit}
              </span>
            </div>
            <div className="w-full bg-[#1c2b3c] h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#ff5451] h-full rounded-full transition-all duration-500"
                style={{
                  width: `${scenario.fallbackPlan.liveTelemetryGauges.right.percent}%`,
                }}
              ></div>
            </div>
            <div className="flex justify-between font-mono text-[10px] text-[#e4beba] mt-1">
              <span>{scenario.fallbackPlan.liveTelemetryGauges.right.target}</span>
              <span className="text-[#ff5451] uppercase font-bold">
                {scenario.fallbackPlan.liveTelemetryGauges.right.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PLAN ARCHITECTURE & STRATEGY */}
      <div className="bg-[#122131] rounded-lg p-3.5 shadow-xl flex flex-col space-y-3 border border-[#273647]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#4cd7f6] text-[19px]">
              {isBreach ? 'security' : 'alt_route'}
            </span>
            <span className="font-mono text-[12px] uppercase tracking-wider text-[#d4e4fa] font-bold">
              {scenario.fallbackPlan.targetPlanName}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-[#273647] text-[#4cd7f6] font-mono text-[11px] font-bold uppercase tracking-wider border border-[#4cd7f6]/30">
            {scenario.fallbackPlan.targetRegion}
          </span>
        </div>

        {/* Strategy summary */}
        <div className="bg-[#0d1c2d] p-2.5 rounded border border-[#1c2b3c]">
          <div className="flex items-center gap-1.5 text-[#ff5451]">
            <span className="material-symbols-outlined text-[17px]">
              {isBreach ? 'lock' : 'arrows_outward'}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wide font-bold">
              {scenario.fallbackPlan.strategyTitle}
            </span>
          </div>
          <p className="font-sans text-[12px] text-[#d4e4fa] mt-1 leading-relaxed">
            {scenario.fallbackPlan.strategyDescription}
          </p>
        </div>

        {/* Operational impact metrics grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#010f1f] p-2.5 rounded border border-[#1c2b3c]">
            <span className="font-mono text-[10px] text-[#e4beba] uppercase block font-semibold">
              RPO TARGET
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-mono text-[18px] text-[#4edea3] font-bold">
                {scenario.fallbackPlan.rpoTarget}
              </span>
              <span className="font-mono text-[11px] text-[#e4beba]">sec</span>
            </div>
            <span className="font-sans text-[11px] text-[#4edea3] leading-none mt-1 block">
              {isBreach ? 'Zero data loss target' : 'Maximum data divergence'}
            </span>
          </div>
          <div className="bg-[#010f1f] p-2.5 rounded border border-[#1c2b3c]">
            <span className="font-mono text-[10px] text-[#e4beba] uppercase block font-semibold">
              RTO ESTIMATED
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-mono text-[18px] text-[#4cd7f6] font-bold">
                {scenario.fallbackPlan.rtoEstimated}
              </span>
              <span className="font-mono text-[11px] text-[#e4beba]">min</span>
            </div>
            <span className="font-sans text-[11px] text-[#4cd7f6] leading-none mt-1 block">
              {isBreach ? 'Isolation sequence' : 'Traffic switchover cycle'}
            </span>
          </div>
        </div>

        {/* Trade-off Audit Log */}
        <div className="bg-[#010f1f] rounded p-2.5 space-y-2 border border-[#1c2b3c]">
          <span className="font-mono text-[10px] text-[#e4beba] uppercase tracking-wider block font-bold">
            {isBreach ? 'SECURITY ACTIONS & IMPACTS' : 'SYSTEM TRADE-OFFS & IMPACTS'}
          </span>
          {scenario.fallbackPlan.tradeOffs.map((to, i) => (
            <div key={i} className="flex items-start gap-2 pt-0.5">
              <span className="material-symbols-outlined text-[#ff5451] text-[17px] flex-shrink-0 mt-0.5">
                {to.icon}
              </span>
              <div className="flex flex-col">
                <span className="font-sans text-[13px] text-[#d4e4fa] font-semibold leading-snug">
                  {to.title}
                </span>
                <span className="font-sans text-[11px] text-[#e4beba] leading-relaxed">
                  {to.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. READINESS TELEMETRY CHECKLIST */}
      <div className="bg-[#122131] rounded-lg p-3.5 shadow-xl flex flex-col space-y-2 border border-[#273647]">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#4edea3] text-[19px]">
              {isBreach ? 'admin_panel_settings' : 'fact_check'}
            </span>
            <span className="font-mono text-[12px] uppercase tracking-wider text-[#d4e4fa] font-bold">
              {isBreach ? 'ISOLATION READINESS CHECK' : 'FAILOVER READINESS CHECK'}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-[#00a572] text-[#003824] font-mono text-[10px] font-bold uppercase tracking-wider">
            3/3 PRIMED
          </span>
        </div>

        {scenario.fallbackPlan.readinessChecklist.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2 bg-[#0d1c2d] rounded border border-[#1c2b3c]"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center justify-center w-6 h-6 rounded bg-[#00a572]/20 text-[#4edea3] flex-shrink-0">
                <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
              </div>
              <div className="flex flex-col truncate">
                <span className="font-sans text-[12px] text-[#d4e4fa] font-semibold truncate">
                  {item.title}
                </span>
                <span className="font-mono text-[10px] text-[#e4beba]">{item.subtitle}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              {item.status && (
                <span className="font-mono text-[11px] text-[#4edea3] font-bold tracking-tight">
                  {item.status}
                </span>
              )}
              <span className="px-1.5 py-0.5 rounded bg-[#00a572] text-[#003824] font-mono text-[9px] uppercase font-bold">
                {item.badgeText}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 5. DUAL SAFETY INTERLOCK TOGGLE */}
      <div className="bg-[#1c2b3c] rounded-lg p-2.5 px-3 flex items-center justify-between shadow-md border border-[#273647]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-[#ff5451] text-[19px]">
            {isBreach ? 'fingerprint' : 'lock_clock'}
          </span>
          <div className="flex flex-col truncate">
            <span className="font-mono text-[10px] text-[#d4e4fa] uppercase font-bold truncate">
              {scenario.fallbackPlan.secondaryOverrideLabel}
            </span>
            <span className="font-mono text-[11px] text-[#e4beba]">
              Requires Incident Commander Token
            </span>
          </div>
        </div>
        <button
          onClick={handleToggleOverride}
          className={`h-8 px-3 rounded font-mono text-[11px] uppercase tracking-wider font-bold transition-all flex items-center gap-1 active:scale-95 border ${
            isOverrideUnlocked
              ? 'bg-[#010f1f] text-[#4cd7f6] border-[#4cd7f6]/40 hover:bg-[#122131]'
              : 'bg-[#93000a] text-[#ffb3ad] border-[#ff5451] hover:bg-[#93000a]/80'
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">
            {isOverrideUnlocked ? 'key' : 'lock'}
          </span>
          <span>{isOverrideUnlocked ? 'UNLOCKED' : 'LOCKED'}</span>
        </button>
      </div>

      {/* 6. TACTICAL SWIPE SLIDER TRIGGER ZONE */}
      <div className="relative bg-[#010f1f] rounded-lg p-3.5 shadow-2xl overflow-hidden mt-1 border border-[#ff5451]/50">
        {/* Hazard stripe accent bar */}
        <div className="w-full h-1.5 mb-3 bg-gradient-to-r from-[#ff5451] via-[#ffb4ab] to-[#ff5451] rounded-full opacity-80 animate-pulse"></div>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#ff5451] text-[19px] animate-pulse">
              crisis_alert
            </span>
            <span className="font-sans text-[14px] text-[#ffb3ad] uppercase font-bold tracking-wide">
              {scenario.fallbackPlan.sliderTitle}
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#ffb4ab] uppercase tracking-widest font-bold">
            {isBreach ? 'BIOMETRIC GATE' : 'DUAL-CONFIRMATION'}
          </span>
        </div>

        {/* TACTICAL SWIPE SLIDER CONTAINER */}
        <div
          ref={trackRef}
          onMouseMove={(e) => handlePointerMove(e.clientX)}
          onMouseUp={handlePointerUp}
          onTouchMove={(e) => handlePointerMove(e.touches[0].clientX)}
          onTouchEnd={handlePointerUp}
          className="relative w-full h-14 bg-[#122131] rounded flex items-center px-1 overflow-hidden select-none touch-none border border-[#273647]"
        >
          {/* Progress fill */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-[#ff5451]/30 pointer-events-none transition-all duration-75"
            style={{ width: `${dragProgress}%` }}
          ></div>

          {/* Centered Instruction Label */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-150"
            style={{ opacity: Math.max(0, 1 - dragProgress / 70) }}
          >
            <span className="font-mono text-[11px] text-[#e4beba] uppercase tracking-widest font-bold flex items-center gap-1">
              <span>{scenario.fallbackPlan.sliderLabel}</span>
              <span className="material-symbols-outlined text-[16px] text-[#ff5451] animate-pulse">
                chevron_right
              </span>
            </span>
          </div>

          {/* Sliding Thumb Button */}
          <div
            onMouseDown={(e) => handlePointerDown(e.clientX)}
            onTouchStart={(e) => handlePointerDown(e.touches[0].clientX)}
            style={{
              transform: `translateX(${
                trackRef.current
                  ? ((trackRef.current.clientWidth - 56) * dragProgress) / 100
                  : 0
              }px)`,
            }}
            className="relative z-10 w-12 h-12 rounded bg-[#ff5451] text-[#68000a] flex items-center justify-center cursor-grab active:cursor-grabbing shadow-[0_0_14px_rgba(255,84,81,0.6)] transition-transform duration-75 border border-[#ffb3ad]"
          >
            <span className="material-symbols-outlined text-[24px] font-bold">double_arrow</span>
          </div>
        </div>

        {/* Trigger Notice Footer */}
        <div className="flex items-center justify-between mt-2 font-mono text-[11px]">
          <span className="text-[#e4beba] flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#ffb3ad]"></span>
            {isBreach ? 'EXECUTION LATENCY < 100ms' : 'EXECUTION LATENCY < 400ms'}
          </span>
          <span className="text-[#ff5451] font-bold">
            {isBreach ? 'BLACKOUT READY' : 'PLAN B READY'}
          </span>
        </div>
      </div>

      {/* 7. CONFIRMATION MODAL OVERLAY */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010f1f]/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#0d1c2d] rounded-lg p-5 shadow-2xl flex flex-col space-y-3.5 border border-[#ff5451]">
            <div className="flex items-center gap-2 text-[#ff5451]">
              <span className="material-symbols-outlined text-[26px]">
                {isBreach ? 'gpp_maybe' : 'warning'}
              </span>
              <span className="font-sans text-[16px] uppercase font-bold tracking-tight text-[#ffdad7]">
                {scenario.fallbackPlan.modalTitle}
              </span>
            </div>

            <p className="font-sans text-[13px] text-[#d4e4fa] leading-relaxed">
              {scenario.fallbackPlan.modalDescription}
            </p>

            <div className="bg-[#010f1f] p-2.5 rounded font-mono text-[11px] text-[#e4beba] space-y-1.5 border border-[#1c2b3c]">
              {scenario.fallbackPlan.modalItems.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>• {item.label}</span>
                  <span className={`font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  setShowModal(false);
                  setDragProgress(0);
                  playBeep(700, 0.05);
                }}
                disabled={isExecutingFailover}
                className="h-11 rounded bg-[#122131] hover:bg-[#1c2b3c] text-[#d4e4fa] font-mono text-[11px] uppercase tracking-wider font-bold transition-all border border-[#273647]"
              >
                ABORT
              </button>
              <button
                onClick={handleCommitFailover}
                disabled={isExecutingFailover}
                className="h-11 rounded bg-[#ff5451] hover:bg-[#ffb3ad] text-[#68000a] font-mono text-[11px] uppercase tracking-wider font-bold shadow-[0_0_12px_rgba(255,84,81,0.5)] transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span
                  className={`material-symbols-outlined text-[17px] ${
                    isExecutingFailover ? 'animate-spin' : ''
                  }`}
                >
                  {isExecutingFailover ? 'refresh' : 'bolt'}
                </span>
                <span>{isExecutingFailover ? 'EXECUTING...' : 'EXECUTE'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
