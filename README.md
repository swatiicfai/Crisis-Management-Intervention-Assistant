# Crisis Command & Triage HUD

A high-stakes, mission-critical operational interface engineered for Site Reliability Engineers (SREs), Incident Commanders, and tactical first responders. Built with high-density aerospace HUD ergonomics, real-time live telemetry tracking, dual-confirmation fallback switches, and automated stakeholder crisis communications.

---

## 🛡️ Agentic Threat Model & Countermeasures (The 5 Threat Zones)

| Threat Zone | Identified Attack Vector / Risk | Defensive Countermeasure & Mitigation Standard |
| :--- | :--- | :--- |
| **1. Input Surfaces** | Malicious injection in incident descriptions, sitrep logs, or prompt tampering via `/api/gemini/*` endpoints | Strict server-side schema bounds (`slice(0, 150)`), sanitization, defensive destructuring, and explicit prompt isolation. |
| **2. Planning & Reasoning** | Prompt injection attempting to alter crisis directives or spoof containment authorization | Fixed system instructions isolating plain user input as untrusted operational data; fallback heuristic verification. |
| **3. Tool Execution** | Unauthorized execution of destructive infrastructure failover commands | Dual-confirmation interlock with interactive physical slide threshold (>90%) and token requirement prior to triggering Plan B / Blackout. |
| **4. Memory & State** | Cross-tenant data leakage or unauthenticated state persistence | Client-side memory boundary isolation; strict owner-bound Firestore security rules with zero insecure defaults (`allow: if true`). |
| **5. Inter-System Communication**| Gemini API key leakage or external provider token interception | API key strictly sequestered server-side via Google Cloud Secret Manager (`GEMINI_API_KEY`); never leaked into frontend bundles. Resilient fallback ladder (`gemini-3.6-flash` -> `gemini-3.1-flash-lite` -> `gemini-flash-latest` -> `gemini-3.7-flash`). |

---

## 🚀 Key Tactical Features

- **Heads-Up Display (HUD) Header:** Persistent DEFCON status, live ticking incident timer ($T+00:42:15$), tactical audio mute toggle, direct War Room audio bridge quick call, and hexagonal scenario selector.
- **Screen 1: Live Triage (`live-triage`):**
  - SEV-1 Critical / SEV-0 Defcon 1 Crisis Banner
  - 1-Hour Threat Horizon / 72-Hour Disclosure Deadline with financial liability metrics
  - Root Cause Hypothesis with 94%+ confidence telemetry and animated SVG sparklines
  - Immediate Priority Focus progress bar with target network nodes
  - Critical Command Actions (Acknowledge, Force Majeure, Escalate T3)
  - Live War Room Dispatch Stream with log injection and AI Copilot assessment
- **Screen 2: T+0 Action Matrix (`t-0-action-matrix`):**
  - T+0 to T+2H Immediate Action Playbook with Window Depletion countdown
  - 3-Phase Execution Pipeline (Ingress, Cache, Restore / Secrets, Isolate, Forensics)
  - Interactive Step 1 validation checklist with "Confirm Execution"
  - Interactive Step 2 CLI Payload preview (`cluster-admin flush --force --shard-all`) with copy tools and Runbook Authorization
  - Step 3 Verification Gates and compliance thresholds
  - 2.0-Second Hold-to-Abort Emergency Failsafe button
- **Screen 3: Contingency Fallback / Plan B (`contingency-fallback`):**
  - Automated Tripwire HUD Card with T-Minus countdown
  - Live Dual Telemetry Gauges (Redis P99 lag & Global Error Rate or Exfiltration Velocity)
  - Contingency Target Plan B: Nuclear Read-Only Static Mode (Frankfurt EU-Central-1) or Zero-Trust Total Network Blackout
  - Operational impact metrics (RPO < 90s, RTO 12m)
  - 3/3 Primed Readiness Checklist
  - Secondary Command Override token toggle
  - **Tactical Red Swipe Slider:** Fluid touch and mouse drag mechanics with real-time translation and threshold trigger
  - Dual-Confirmation Modal with Abort and Execute state confirmation
- **Screen 4: Comms Dispatch (`comms-dispatch`):**
  - Real-time Stakeholder Dispatch Hub with 30m auto-cadence tracking
  - Privileged Tone Presets: Technical (SEC/Legal), Defusal/Calm (Client Advisory), Regulatory (Support/MFA)
  - Live editable dispatch composer with Broadcast animation
  - AI Dispatch Assistant powered by resilient Gemini API
  - Pre-primed tailored scripts for Executive Board, Public Status Page (`status.company.com`), and Frontline CS Support macros
  - Live interactive Stakeholder Ack Telemetry (VP Engineering, General Counsel, Head of Support, CISO)
- **Screen 5: System Health Dashboard (`system-health` via D3):**
  - Real-time **CPU Utilization Area Chart** rendered with D3 scales, gradient area fill, 85% critical ceiling marker, and 8-core CPU breakdown meters.
  - Real-time **Network Bandwidth Ingress vs Egress Chart** rendered with D3 curves (`#4edea3` ingress, `#acedff` egress), edge saturation limits, and packet loss indicators.
  - Real-time **Latency Spectrum Trend Chart** tracking P50 (median), P90, and P99 percentiles with SLA target threshold (<200ms) and spike anomaly detection.
  - Interactive **16-Node Cluster Matrix** with status health indicators (Nominal, Warning, Critical, Isolated) and instance drill-down telemetry drawer (CPU, Memory Alloc, TCP conns).
  - Telemetry controls: Pause/Resume live 1.5s stream, Simulate Load / Stress Test injection toggle with audio alarms.
- **Tactical Audio Synthesizer (Web Audio API):**
  - Authentic low-latency synthesized beeps, DEFCON alert sirens, confirmation chords, and drag-friction ticks without external asset dependencies.
- **War Room Audio Bridge Modal:**
  - Interactive multi-party voice conference simulation with active speaker indicator and live spectrum equalizer.

---

## 🔒 Security Configuration & Firestore Rules

To enforce strict user data isolation and prevent unauthorized cross-user access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🔑 Secret Management Setup (Google Cloud Secret Manager)

Do not hardcode credentials in code or repository files. Use Google Cloud Secret Manager to provide runtime secrets securely:

```bash
# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 🚢 Google Cloud Run Deployment

Deploy the containerized full-stack application directly to Google Cloud Run:

```bash
# 1. Build and deploy service to Cloud Run
gcloud run deploy crisis-command-hud \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest

# 2. Apply mandatory campaign verification label
gcloud run services update crisis-command-hud \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=asia-southeast1
```

---

## 🧪 Functional Walkthrough & Test Guide

1. **Header HUD & Audio:**
   - Verify the Defcon badge shows `SEV-1 DEFCON 2`.
   - Observe the live timer `T+00:42:15` incrementing each second.
   - Click the Speaker icon to mute/unmute audio. Notice tactile audio feedback.
   - Click the Phone icon in the top right to open the **War Room Voice Bridge**. Observe the animated equalizer, speaker indicators, and press **Push SitRep**. Click **Disconnect** to close.
   - Click the **Hexagonal Emblem** icon to open the **Incident Scenario Selector**. Select **Unauthorized Exfiltration (#BRCH-8820)** to switch the entire application to the SEV-0 DEFCON 1 cyber breach mode. Switch back to **Infrastructure Cascade**.

2. **Triage Screen (`Triage` tab):**
   - Review the 1-Hour Threat Horizon with financial liability ($180,000 / HR PENALTY).
   - Review the Latency (840ms), Blast Radius (74%), and Error Rate (18.4%) cards with animated SVG sparklines.
   - Click **Acknowledge**: button turns emerald green, displays `Acknowledged`, and plays confirmation chime.
   - Click **Force Majeure**: confirmation dialog appears; on accept, button transitions to `Declared`.
   - Click **Escalate T3**: triggers red Defcon alert and notifies Tier-3 incident commander.
   - Click **AI Copilot** in the War Room Dispatch Stream: triggers Gemini root-cause assessment with model fallback ladder.
   - Type an operational update in the input and click **Post**: sits immediately at the top of the live dispatch log.

3. **Matrix Screen (`Matrix` tab):**
   - Observe the ticking countdown under **Window Depletion** ($01:17:39$).
   - Click the checklist items in Step 01 to toggle their validation state.
   - Click **Confirm Execution**: Step 01 turns green, and Step 02 immediately unlocks from blocked to `READY FOR AUTHORIZATION`.
   - In Step 02, click the copy icon on `cluster-admin flush --force --shard-all`: copies command with toast notification.
   - Click **Authorize Runbook**: Step 02 executes and changes to `Authorized`.
   - Scroll to the bottom and press & hold **Abort / Rollback All Actions** for 2 seconds: progress bar fills up with ascending audio tones, triggering global emergency abort.

4. **Fallback Screen (`Fallback` tab):**
   - Review the Automated Tripwire card and breached dual gauges.
   - Click **UNLOCKED** on the Secondary Command Override to toggle between Unlocked and Locked.
   - Drag the red thumb on **SLIDE TO INITIATE PLAN B FAILOVER** from left to right (mouse or touch).
   - Once dragged past 92%, the **CONFIRM FAILOVER** modal opens automatically.
   - Click **ABORT** to dismiss, or click **EXECUTE** to trigger failover switchover with spinner and live state update.

5. **Comms Screen (`Comms` tab):**
   - Click between the tone presets: **Technical**, **Defusal / Calm**, and **Regulatory**. Observe the draft text update instantly.
   - Click **Broadcast to Active Channels**: triggers simulated relay and feedback toast.
   - Click **AI Draft**: Gemini drafts a fresh crisis broadcast based on the active scenario.
   - In the **Tailored Audience Scripts**, click **Copy**, **#exec-alerts**, and **SMS Blast** to test stakeholder multi-channel dissemination.
   - Click **Push to Status Page**: shows publishing spinner, then changes to `Published`.
   - Under **Stakeholder Ack Telemetry**, click any stakeholder (e.g., David Chen) to toggle acknowledgment state.

6. **System Health Dashboard (`Health` tab):**
   - Click the **Health** tab in the bottom navigation dock (or click any telemetry card on the Triage screen).
   - Verify the **CPU Utilization Area Chart** rendered with D3: observe real-time points shifting every 1.5 seconds, linear gradient fill, and the 85% critical threshold line.
   - Inspect the **8-Core breakdown meters** underneath the CPU chart (C-00 to C-07).
   - Verify the **Bandwidth Throughput Chart** rendered with D3: observe dual Ingress (`#4edea3`) and Egress (`#acedff`) curves updating dynamically.
   - Verify the **Latency Spectrum Chart** rendered with D3: observe the multi-percentile curves (P50, P90, P99) and the 200ms SLA target ceiling.
   - Click **SIMULATE LOAD**: notice the red pulse, audio alert, and immediate spike across CPU (95%+), Bandwidth (~9.5 Gbps), and Latency (~960ms). Click again to return to nominal.
   - Click **LIVE (1.5s)**: toggles to `PAUSED` and freezes chart updates. Click again to resume.
   - In the **Cluster Node Matrix (16 instances)**, click any node (e.g. `db-shard-lead-01` or `edge-proxy-02`) to expand the instance telemetry drawer with real-time CPU, Memory, and Active TCP connection stats. Click the close button on the drawer.
   - Click **GENERATE REPORT**: automatically compiles current telemetry, aggregate min/max/mean metrics, cluster topology, and time-series points, downloading an audit file named `incident-forensics-<CODE>-<TIMESTAMP>.json` directly to your machine.
   - Click **PREVIEW JSON**: launches the full-screen forensic viewer modal to inspect the raw structured JSON schema, review the audit summary cards, or copy the entire payload to the clipboard.
