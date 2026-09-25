import React, { useState } from 'react';
import { IncidentScenarioData } from '../types/crisis';
import { playBeep, playConfirm, playAlert } from '../utils/audio';

interface CommsDispatchScreenProps {
  scenario: IncidentScenarioData;
  onShowToast: (msg: string) => void;
}

export const CommsDispatchScreen: React.FC<CommsDispatchScreenProps> = ({
  scenario,
  onShowToast,
}) => {
  const isBreach = scenario.scenarioType === 'DATA_BREACH';

  // Active tone selector
  const [activeTone, setActiveTone] = useState<'tech' | 'defusal' | 'reg'>('tech');
  const [composerText, setComposerText] = useState(
    scenario.commsDispatch.tonePresets.tech.composerDraft
  );

  // Broadcasting states
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isPublishingStatus, setIsPublishingStatus] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Copied indicator helpers
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  // Stakeholder acknowledgments state
  const [stakeholders, setStakeholders] = useState(scenario.commsDispatch.stakeholders);

  const handleToneChange = (tone: 'tech' | 'defusal' | 'reg') => {
    setActiveTone(tone);
    setComposerText(scenario.commsDispatch.tonePresets[tone].composerDraft);
    playBeep(850, 0.03);
    onShowToast(`Loaded ${scenario.commsDispatch.tonePresets[tone].label} Preset`);
  };

  const copyToClipboard = (text: string, snippetId: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedSnippetId(snippetId);
    playBeep(1100, 0.03);
    onShowToast('Text copied to clipboard');
    setTimeout(() => {
      setCopiedSnippetId(null);
    }, 2000);
  };

  const handleBroadcast = () => {
    setIsBroadcasting(true);
    playBeep(900, 0.05);
    setTimeout(() => {
      setIsBroadcasting(false);
      playConfirm();
      onShowToast(
        isBreach
          ? 'Secured stakeholder broadcast dispatched (Encrypted E2E)'
          : 'Omni-channel broadcast dispatched to all active subscribers'
      );
    }, 1200);
  };

  const handlePushStatus = () => {
    setIsPublishingStatus(true);
    playBeep(900, 0.04);
    setTimeout(() => {
      setIsPublishingStatus(false);
      playConfirm();
      onShowToast('Public status page updated: status.company.com');
    }, 1100);
  };

  const handlePinSlack = (channel: string) => {
    playConfirm();
    onShowToast(`Defusal macro pinned in ${channel}`);
  };

  const handleSendChannel = (channel: string) => {
    playConfirm();
    onShowToast(`Dispatched alert to ${channel}`);
  };

  const handleAiDraftBroadcast = async () => {
    setIsAiGenerating(true);
    playBeep(800, 0.04);
    try {
      const res = await fetch('/api/gemini/generate-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tone: scenario.commsDispatch.tonePresets[activeTone].label,
          audience: 'Cross-functional Executive, Client & Support Stakeholders',
          incidentContext: `${scenario.title}. Current threat: ${scenario.threatHorizon.headline}`,
        }),
      });
      const data = await res.json();
      if (data?.text) {
        setComposerText(data.text);
        playConfirm();
        onShowToast(`AI drafted tailored dispatch via ${data.model || 'Gemini'}`);
      } else {
        throw new Error('No text generated');
      }
    } catch {
      setComposerText(
        `[SEV-1 SITREP UPDATE] Active containment protocols verified. Infrastructure failover stabilized at nominal threshold. Ongoing telemetry monitored. Next sync in 15 minutes.`
      );
      onShowToast('Generated sitrep using local resilience template');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const toggleStakeholderAck = (id: string) => {
    setStakeholders((prev) =>
      prev.map((sh) => {
        if (sh.id === id) {
          const next = !sh.acknowledged;
          playBeep(next ? 1000 : 600, 0.04);
          onShowToast(next ? `Pinged & confirmed ${sh.name}` : `Unset ACK for ${sh.name}`);
          return { ...sh, acknowledged: next };
        }
        return sh;
      })
    );
  };

  return (
    <div className="flex flex-col w-full px-4 space-y-3.5 pb-12 max-w-4xl mx-auto animate-fade-in select-none">
      {/* 1. Dispatch Command HUD Strip */}
      <div className="bg-[#0d1c2d] rounded-lg p-3.5 shadow-md border border-[#1c2b3c]">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="flex h-2 w-2 relative flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4cd7f6] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4cd7f6]"></span>
            </span>
            <span className="font-mono text-[10px] text-[#4cd7f6] uppercase tracking-widest truncate font-bold">
              {scenario.commsDispatch.hudTitle}
            </span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-[#1c2b3c] text-[#4edea3] font-mono text-[10px] shrink-0 font-bold border border-[#273647]">
            {scenario.commsDispatch.cadenceText}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between text-[#e4beba] font-mono text-[11px] pt-0.5">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-[#4edea3]">
              {isBreach ? 'security' : 'check_circle'}
            </span>
            {scenario.commsDispatch.lastBroadcast}
          </span>
          <span className="flex items-center gap-1 text-[#ffb3ad]">
            <span className="material-symbols-outlined text-[14px] text-[#ff5451]">timer</span>
            {scenario.commsDispatch.nextCadence}
          </span>
        </div>

        {/* Cadence Bar */}
        <div className="w-full bg-[#273647] h-1.5 rounded-full overflow-hidden mt-2.5">
          <div
            className="bg-gradient-to-r from-[#4edea3] via-[#4cd7f6] to-[#ff5451] h-full rounded-full transition-all duration-700"
            style={{ width: `${scenario.commsDispatch.cadencePercent}%` }}
          ></div>
        </div>
      </div>

      {/* 2. Quick Tone Switcher & Dispatch Composer */}
      <div className="bg-[#122131] rounded-lg p-3.5 shadow-md space-y-2.5 border border-[#273647]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[17px] text-[#4cd7f6]">
              {isBreach ? 'gavel' : 'tune'}
            </span>
            <span className="font-mono text-[11px] text-[#d4e4fa] uppercase tracking-wider font-bold">
              {isBreach ? 'Privileged Tone Presets' : 'Tone Presets & Quick Broadcast'}
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#4cd7f6] font-bold">
            {isBreach ? 'SECURED' : 'READY'}
          </span>
        </div>

        {/* Tone preset selector buttons */}
        <div className="grid grid-cols-3 gap-1.5">
          {(['tech', 'defusal', 'reg'] as const).map((toneKey) => {
            const isSelected = activeTone === toneKey;
            return (
              <button
                key={toneKey}
                onClick={() => handleToneChange(toneKey)}
                className={`py-1.5 px-2 rounded font-mono text-[10px] text-center uppercase transition-all font-bold active:scale-95 border ${
                  isSelected
                    ? 'bg-[#1c2b3c] text-[#4cd7f6] border-[#4cd7f6] shadow-sm'
                    : 'bg-[#010f1f] text-[#e4beba] border-[#273647] hover:bg-[#122131]'
                }`}
              >
                {scenario.commsDispatch.tonePresets[toneKey].label}
              </button>
            );
          })}
        </div>

        {/* Dispatch composer body */}
        <div className="bg-[#010f1f] rounded p-2.5 border border-[#1c2b3c]">
          <div className="flex items-center justify-between text-[#e4beba] font-mono text-[10px] pb-1">
            <span className="uppercase font-semibold">
              {isBreach
                ? 'Active Breach Draft [Attorney-Client Privileged]'
                : 'Active Dispatch Draft [Channel Override]'}
            </span>
            <span className="font-mono text-[10px] text-[#4edea3] font-bold">
              {isBreach ? 'ENCRYPTED END-TO-END' : 'SYNCED WITH INCIDENT METRICS'}
            </span>
          </div>
          <textarea
            value={composerText}
            onChange={(e) => setComposerText(e.target.value)}
            rows={3}
            className="w-full bg-transparent font-mono text-[12px] text-[#d4e4fa] leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-[#4cd7f6] rounded p-1"
          />
        </div>

        {/* Broadcast action cluster & AI Draft */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleBroadcast}
            disabled={isBroadcasting}
            className="flex-1 h-10 px-3 rounded bg-[#03b5d3] hover:brightness-110 active:scale-98 text-[#00424e] font-mono text-[11px] uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <span
              className={`material-symbols-outlined text-[17px] ${
                isBroadcasting ? 'animate-spin' : ''
              }`}
            >
              {isBroadcasting
                ? 'sync'
                : isBreach
                ? 'verified_user'
                : 'cell_tower'}
            </span>
            <span>
              {isBroadcasting
                ? 'Relaying Feeds...'
                : isBreach
                ? 'Broadcast Secured Comms'
                : 'Broadcast to Active Channels'}
            </span>
          </button>

          {/* Copy composer text */}
          <button
            onClick={() => copyToClipboard(composerText, 'composer')}
            title="Copy Draft"
            className="h-10 w-10 flex items-center justify-center rounded bg-[#1c2b3c] text-[#d4e4fa] hover:text-[#4cd7f6] hover:bg-[#273647] transition-all border border-[#273647] active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">
              {copiedSnippetId === 'composer' ? 'done' : 'content_copy'}
            </span>
          </button>

          {/* AI Re-draft button */}
          <button
            onClick={handleAiDraftBroadcast}
            disabled={isAiGenerating}
            title="Ask Gemini Copilot to draft broadcast"
            className="h-10 px-2.5 rounded bg-[#122131] text-[#4cd7f6] hover:bg-[#1c2b3c] font-mono text-[10px] uppercase font-bold border border-[#4cd7f6]/40 flex items-center gap-1 active:scale-95 transition-all"
          >
            <span
              className={`material-symbols-outlined text-[16px] ${
                isAiGenerating ? 'animate-spin' : ''
              }`}
            >
              {isAiGenerating ? 'sync' : 'auto_awesome'}
            </span>
            <span className="hidden sm:inline">AI Draft</span>
          </button>
        </div>
      </div>

      {/* 3. Tailored Audience Scripts Stack */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] text-[#e4beba] uppercase tracking-widest font-semibold">
            {isBreach ? 'Pre-Primed Breach Scripts' : 'Tailored Audience Scripts'}
          </span>
          <span className="font-mono text-[10px] text-[#4edea3] uppercase font-bold">
            3 Channels Primed
          </span>
        </div>

        {/* Audience 1: Executive Leadership & Board */}
        <div className="bg-[#0d1c2d] rounded-lg p-3.5 shadow-md space-y-2 relative overflow-hidden border border-[#1c2b3c]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ff5451]"></div>
          <div className="flex items-center justify-between pl-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#ff5451] text-[17px]">
                {isBreach ? 'gavel' : 'corporate_fare'}
              </span>
              <span className="font-sans text-[13px] text-[#d4e4fa] font-bold uppercase tracking-wide">
                Executive Leadership &amp; Board
              </span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-[#93000a] text-[#ffb3ad] font-mono text-[9px] font-bold">
              {scenario.commsDispatch.audienceScripts.executive.badge}
            </span>
          </div>

          <div className="bg-[#010f1f] rounded p-2.5 pl-3 border border-[#1c2b3c]">
            <div className="text-[#4cd7f6] font-mono text-[11px] font-bold truncate mb-1">
              {scenario.commsDispatch.audienceScripts.executive.subject}
            </div>
            <div className="font-sans text-[12px] text-[#d4e4fa] leading-relaxed">
              {scenario.commsDispatch.audienceScripts.executive.body}
            </div>
          </div>

          {/* Action Cluster */}
          <div className="grid grid-cols-3 gap-1.5 pt-0.5">
            <button
              onClick={() =>
                copyToClipboard(
                  scenario.commsDispatch.audienceScripts.executive.body,
                  'exec-script'
                )
              }
              className="h-9 px-2 rounded bg-[#122131] hover:bg-[#1c2b3c] text-[#d4e4fa] font-mono text-[10px] uppercase font-bold flex items-center justify-center gap-1 transition-all border border-[#273647] active:scale-95"
            >
              <span className="material-symbols-outlined text-[15px]">
                {copiedSnippetId === 'exec-script' ? 'done' : 'content_copy'}
              </span>
              <span>{copiedSnippetId === 'exec-script' ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={() =>
                handleSendChannel(scenario.commsDispatch.audienceScripts.executive.channel)
              }
              className="h-9 px-2 rounded bg-[#122131] hover:bg-[#1c2b3c] text-[#4cd7f6] font-mono text-[10px] uppercase font-bold flex items-center justify-center gap-1 transition-all border border-[#273647] active:scale-95"
            >
              <span className="material-symbols-outlined text-[15px]">send</span>
              <span className="truncate">
                {scenario.commsDispatch.audienceScripts.executive.channel}
              </span>
            </button>
            <button
              onClick={() =>
                handleSendChannel(scenario.commsDispatch.audienceScripts.executive.actionLabel)
              }
              className="h-9 px-2 rounded bg-[#ff5451] hover:bg-[#ffb3ad] text-[#68000a] font-mono text-[10px] uppercase font-bold flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[15px]">
                {isBreach ? 'description' : 'sms'}
              </span>
              <span>{scenario.commsDispatch.audienceScripts.executive.actionLabel}</span>
            </button>
          </div>
        </div>

        {/* Audience 2: Public Status & Client Facing */}
        <div className="bg-[#0d1c2d] rounded-lg p-3.5 shadow-md space-y-2 relative overflow-hidden border border-[#1c2b3c]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#4cd7f6]"></div>
          <div className="flex items-center justify-between pl-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#4cd7f6] text-[17px]">public</span>
              <span className="font-sans text-[13px] text-[#d4e4fa] font-bold uppercase tracking-wide">
                {isBreach ? 'Public & Client Notification' : 'Public Status & Client Facing'}
              </span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-[#122131] text-[#4cd7f6] font-mono text-[10px] font-bold border border-[#4cd7f6]/30">
              {scenario.commsDispatch.audienceScripts.public.badge}
            </span>
          </div>

          <div className="bg-[#010f1f] rounded p-2.5 pl-3 border border-[#1c2b3c]">
            <div className="font-sans text-[12px] text-[#d4e4fa] leading-relaxed">
              {scenario.commsDispatch.audienceScripts.public.body}
            </div>
          </div>

          {/* Action Cluster */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              onClick={handlePushStatus}
              disabled={isPublishingStatus}
              className="h-9 px-2 rounded bg-[#03b5d3] text-[#00424e] font-mono text-[10px] uppercase font-bold flex items-center justify-center gap-1 shadow-sm hover:brightness-110 active:scale-95 transition-all"
            >
              <span
                className={`material-symbols-outlined text-[15px] ${
                  isPublishingStatus ? 'animate-spin' : ''
                }`}
              >
                {isPublishingStatus ? 'sync' : 'cloud_upload'}
              </span>
              <span className="truncate">
                {isPublishingStatus ? 'Publishing...' : scenario.commsDispatch.audienceScripts.public.actionLabel}
              </span>
            </button>
            <button
              onClick={() =>
                copyToClipboard(
                  scenario.commsDispatch.audienceScripts.public.body,
                  'public-script'
                )
              }
              className="h-9 px-2 rounded bg-[#122131] hover:bg-[#1c2b3c] text-[#d4e4fa] font-mono text-[10px] uppercase font-bold flex items-center justify-center gap-1 transition-all border border-[#273647] active:scale-95"
            >
              <span className="material-symbols-outlined text-[15px]">
                {copiedSnippetId === 'public-script' ? 'done' : 'content_copy'}
              </span>
              <span>{copiedSnippetId === 'public-script' ? 'Copied' : 'Copy Text'}</span>
            </button>
          </div>
        </div>

        {/* Audience 3: Frontline Support & PR / CS All-Hands */}
        <div className="bg-[#0d1c2d] rounded-lg p-3.5 shadow-md space-y-2 relative overflow-hidden border border-[#1c2b3c]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#4edea3]"></div>
          <div className="flex items-center justify-between pl-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#4edea3] text-[17px]">
                support_agent
              </span>
              <span className="font-sans text-[13px] text-[#d4e4fa] font-bold uppercase tracking-wide">
                {isBreach ? 'Frontline Support & PR' : 'Frontline CS & All-Hands'}
              </span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-[#122131] text-[#4edea3] font-mono text-[9px] font-bold border border-[#4edea3]/30">
              {scenario.commsDispatch.audienceScripts.support.badge}
            </span>
          </div>

          <div className="bg-[#010f1f] rounded p-2.5 pl-3 space-y-1.5 border border-[#1c2b3c]">
            <div className="text-[#e4beba] font-mono text-[10px] uppercase tracking-wide font-semibold">
              {scenario.commsDispatch.audienceScripts.support.title}
            </div>
            <div className="font-sans text-[12px] text-[#d4e4fa] leading-relaxed">
              {scenario.commsDispatch.audienceScripts.support.body}
            </div>
            <div className="bg-[#1c2b3c] rounded p-1.5 px-2 flex items-center justify-between text-[#e4beba] font-mono text-[10px] border border-[#273647]">
              <span className="text-[#4edea3] font-bold">
                {scenario.commsDispatch.audienceScripts.support.slackChannel}
              </span>
              <span>{scenario.commsDispatch.audienceScripts.support.pinnedBy}</span>
            </div>
          </div>

          {/* Action Cluster */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              onClick={() =>
                copyToClipboard(
                  scenario.commsDispatch.audienceScripts.support.body,
                  'support-script'
                )
              }
              className="h-9 px-2 rounded bg-[#122131] hover:bg-[#1c2b3c] text-[#d4e4fa] font-mono text-[10px] uppercase font-bold flex items-center justify-center gap-1 transition-all border border-[#273647] active:scale-95"
            >
              <span className="material-symbols-outlined text-[15px]">
                {copiedSnippetId === 'support-script' ? 'done' : 'content_copy'}
              </span>
              <span>{copiedSnippetId === 'support-script' ? 'Copied' : 'Copy CS Macro'}</span>
            </button>
            <button
              onClick={() =>
                handlePinSlack(
                  scenario.commsDispatch.audienceScripts.support.slackChannel
                )
              }
              className="h-9 px-2 rounded bg-[#1c2b3c] hover:bg-[#273647] text-[#4edea3] font-mono text-[10px] uppercase font-bold flex items-center justify-center gap-1 transition-all border border-[#4edea3]/30 active:scale-95"
            >
              <span className="material-symbols-outlined text-[15px]">push_pin</span>
              <span className="truncate">
                {scenario.commsDispatch.audienceScripts.support.actionLabel}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Live Stakeholder Feed & Acknowledgments */}
      <div className="bg-[#0d1c2d] rounded-lg p-3.5 shadow-md space-y-2 border border-[#1c2b3c]">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[17px] text-[#4edea3]">
              {isBreach ? 'verified' : 'check_box'}
            </span>
            <span className="font-mono text-[11px] text-[#d4e4fa] uppercase tracking-wider font-bold">
              Stakeholder Ack Telemetry
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#4edea3] font-bold">
            {stakeholders.filter((s) => s.acknowledged).length} / {stakeholders.length} ACKNOWLEDGED
          </span>
        </div>

        <div className="space-y-1.5">
          {stakeholders.map((sh, idx) => (
            <div
              key={sh.id}
              onClick={() => toggleStakeholderAck(sh.id)}
              className="flex items-center justify-between p-2.5 bg-[#010f1f] hover:bg-[#122131] rounded border border-[#1c2b3c] cursor-pointer transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-full font-mono text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${
                    idx === 0
                      ? 'bg-[#03b5d3] text-[#00424e]'
                      : idx === 1
                      ? 'bg-[#1c2b3c] text-[#d4e4fa]'
                      : 'bg-[#00a572] text-[#003824]'
                  }`}
                >
                  {sh.initials}
                </div>
                <div className="min-w-0 flex flex-col">
                  <span className="font-mono text-[11px] text-[#d4e4fa] truncate font-bold">
                    {sh.name} • {sh.role}
                  </span>
                  <span className="font-sans text-[11px] text-[#e4beba] truncate">
                    {sh.quote}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end flex-shrink-0 ml-2">
                <span
                  className={`font-mono text-[10px] uppercase flex items-center gap-0.5 font-bold ${
                    sh.acknowledged ? 'text-[#4edea3]' : 'text-[#ff5451]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">
                    {sh.acknowledged ? 'done_all' : 'pending'}
                  </span>
                  {sh.acknowledged ? 'ACK' : 'PENDING'}
                </span>
                <span className="font-mono text-[10px] text-[#ab8986]">{sh.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
