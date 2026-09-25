export type IncidentScenarioType = 
  | 'INFRA_CASCADE' 
  | 'DATA_BREACH' 
  | 'ZERO_TRUST_BLACKOUT'
  | 'CUSTOM';

export type TabType = 'live-triage' | 't-0-action-matrix' | 'contingency-fallback' | 'comms-dispatch' | 'system-health';

export interface TelemetryMetric {
  label: string;
  value: string | number;
  unit?: string;
  change?: string;
  status: 'nominal' | 'warning' | 'breached' | 'anomaly';
  targetLabel?: string;
  progressPercent: number;
}

export interface ActionStepItem {
  id: string;
  stepNumber: string;
  timeWindow: string;
  title: string;
  status: 'completed' | 'in_progress' | 'blocked' | 'queued';
  progressPercent: number;
  owner: {
    name: string;
    initials: string;
    role: string;
  };
  subtasks: {
    id: string;
    title: string;
    status: 'APPLIED' | 'SIGKILL (0)' | 'AWAITING ACK' | 'SUCCESS' | 'PENDING';
    completed: boolean;
  }[];
  cliPayload?: {
    command: string;
    envTag: string;
    timeout: string;
    policy: string;
  };
  verificationGates?: {
    probe: string;
    threshold: string;
    stagingStatus: string;
  };
}

export interface StakeholderAck {
  id: string;
  name: string;
  role: string;
  initials: string;
  quote: string;
  time: string;
  acknowledged: boolean;
}

export interface WarRoomDispatchItem {
  id: string;
  timestamp: string;
  message: string;
  level: 'CRIT' | 'SYNC' | 'WARN' | 'SECURE' | 'EXFIL';
}

export interface IncidentScenarioData {
  id: string;
  code: string;
  scenarioType: IncidentScenarioType;
  defconLevel: 'SEV-1 DEFCON 2' | 'SEV-0 DEFCON 1' | 'SEV-1 BREACH';
  incidentCommandTag: string;
  screenTitle: {
    triage: string;
    matrix: string;
    fallback: string;
    comms: string;
  };
  title: string;
  commandLead: string;
  commandLockStatus: string;
  threatHorizon: {
    badge: string;
    timeRemaining: string;
    headline: string;
    liabilityLabel: string;
    liabilityValue: string;
  };
  rootCause: {
    confidence: number;
    hypothesis: string;
    metrics: TelemetryMetric[];
  };
  immediatePriority: {
    badge: string;
    taskIndex: string;
    taskTitle: string;
    progress: number;
    targets: { label: string; icon: string }[];
  };
  matrixPlaybook: {
    subBarTitle: string;
    defconStatus: string;
    windowDepletionSeconds: number;
    targetRto: string;
    executionSummary: string;
    phases: [string, string, string];
    steps: ActionStepItem[];
  };
  fallbackPlan: {
    contingencyActiveTitle: string;
    synchOrVaultLabel: string;
    synchOrVaultValue: string;
    authCode: string;
    windowTMinusSeconds: number;
    triggerCriteriaText: string;
    liveTelemetryGauges: {
      left: { label: string; value: string; unit: string; target: string; change: string; percent: number };
      right: { label: string; value: string; unit: string; target: string; status: string; percent: number };
    };
    targetPlanName: string;
    targetRegion: string;
    strategyTitle: string;
    strategyDescription: string;
    rpoTarget: string;
    rtoEstimated: string;
    tradeOffs: { icon: string; title: string; desc: string }[];
    readinessChecklist: {
      id: string;
      title: string;
      subtitle: string;
      status: string;
      badgeText: string;
      icon: string;
    }[];
    secondaryOverrideLabel: string;
    sliderTitle: string;
    sliderLabel: string;
    modalTitle: string;
    modalDescription: string;
    modalItems: { label: string; value: string; color: string }[];
  };
  commsDispatch: {
    hudTitle: string;
    cadenceText: string;
    lastBroadcast: string;
    nextCadence: string;
    cadencePercent: number;
    tonePresets: {
      [key in 'tech' | 'defusal' | 'reg']: {
        label: string;
        composerDraft: string;
      };
    };
    audienceScripts: {
      executive: {
        badge: string;
        subject: string;
        body: string;
        channel: string;
        actionLabel: string;
      };
      public: {
        badge: string;
        body: string;
        actionLabel: string;
      };
      support: {
        badge: string;
        title: string;
        body: string;
        slackChannel: string;
        pinnedBy: string;
        actionLabel: string;
      };
    };
    stakeholders: StakeholderAck[];
  };
  dispatchLogs: WarRoomDispatchItem[];
}
