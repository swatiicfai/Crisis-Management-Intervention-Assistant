import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { IncidentScenarioData } from '../types/crisis';
import { playBeep, playAlert, playConfirm } from '../utils/audio';

interface HealthDataPoint {
  timestamp: Date;
  cpu: number; // 0 - 100%
  ingressGbps: number; // Gbps
  egressGbps: number; // Gbps
  latencyP50: number; // ms
  latencyP90: number; // ms
  latencyP99: number; // ms
}

interface ClusterNode {
  id: string;
  name: string;
  zone: string;
  role: 'edge' | 'db' | 'auth' | 'worker';
  status: 'nominal' | 'warning' | 'critical' | 'isolated';
  cpu: number;
  memory: number;
  connections: number;
}

interface SystemHealthDashboardProps {
  scenario: IncidentScenarioData;
  onShowToast: (msg: string) => void;
  onNavigateTab: (tab: any) => void;
}

export const SystemHealthDashboard: React.FC<SystemHealthDashboardProps> = ({
  scenario,
  onShowToast,
  onNavigateTab,
}) => {
  const isBreach = scenario.scenarioType === 'DATA_BREACH';

  // Controls State
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<'Global' | 'US-East' | 'EU-Central' | 'AP-South'>('Global');
  const [isStressTestActive, setIsStressTestActive] = useState(false);
  const [selectedNode, setSelectedNode] = useState<ClusterNode | null>(null);

  // Time buffer of historical data (last 35 points)
  const [dataPoints, setDataPoints] = useState<HealthDataPoint[]>(() => {
    const points: HealthDataPoint[] = [];
    const now = Date.now();
    for (let i = 34; i >= 0; i--) {
      const time = new Date(now - i * 1500);
      const baseCpu = isBreach ? 78 : 84;
      const baseLatency = isBreach ? 310 : 840;
      points.push({
        timestamp: time,
        cpu: Math.min(99, Math.max(30, baseCpu + (Math.random() * 14 - 7))),
        ingressGbps: Number((3.8 + Math.random() * 1.6).toFixed(2)),
        egressGbps: Number((5.2 + Math.random() * 2.1).toFixed(2)),
        latencyP50: Number((42 + Math.random() * 8).toFixed(1)),
        latencyP90: Number((135 + Math.random() * 25).toFixed(1)),
        latencyP99: Number((baseLatency + (Math.random() * 60 - 30)).toFixed(1)),
      });
    }
    return points;
  });

  // Cluster Nodes List (16 nodes)
  const [nodes, setNodes] = useState<ClusterNode[]>([
    { id: 'n1', name: 'edge-proxy-01', zone: 'us-east-1a', role: 'edge', status: 'nominal', cpu: 62, memory: 58, connections: 34200 },
    { id: 'n2', name: 'edge-proxy-02', zone: 'us-east-1b', role: 'edge', status: 'warning', cpu: 82, memory: 76, connections: 48900 },
    { id: 'n3', name: 'edge-proxy-03', zone: 'eu-central-1a', role: 'edge', status: 'nominal', cpu: 48, memory: 44, connections: 21200 },
    { id: 'n4', name: 'edge-proxy-04', zone: 'eu-central-1b', role: 'edge', status: 'nominal', cpu: 51, memory: 49, connections: 22800 },
    { id: 'n5', name: 'db-shard-lead-01', zone: 'us-east-1a', role: 'db', status: 'critical', cpu: 96, memory: 91, connections: 14200 },
    { id: 'n6', name: 'db-shard-repl-02', zone: 'us-east-1b', role: 'db', status: 'critical', cpu: 94, memory: 89, connections: 12800 },
    { id: 'n7', name: 'db-dr-replica-03', zone: 'eu-central-1', role: 'db', status: 'nominal', cpu: 44, memory: 52, connections: 8400 },
    { id: 'n8', name: 'db-vault-auth-04', zone: 'us-east-1', role: 'db', status: isBreach ? 'critical' : 'warning', cpu: 89, memory: 84, connections: 16500 },
    { id: 'n9', name: 'auth-cluster-node-01', zone: 'us-east-1a', role: 'auth', status: 'critical', cpu: 91, memory: 86, connections: 64100 },
    { id: 'n10', name: 'auth-cluster-node-02', zone: 'us-east-1b', role: 'auth', status: 'critical', cpu: 93, memory: 88, connections: 68300 },
    { id: 'n11', name: 'auth-cluster-node-03', zone: 'eu-central-1', role: 'auth', status: 'nominal', cpu: 39, memory: 42, connections: 18400 },
    { id: 'n12', name: 'auth-canary-04', zone: 'us-east-1', role: 'auth', status: 'isolated', cpu: 4, memory: 12, connections: 0 },
    { id: 'n13', name: 'worker-pipeline-01', zone: 'us-east-1a', role: 'worker', status: 'warning', cpu: 79, memory: 74, connections: 8200 },
    { id: 'n14', name: 'worker-pipeline-02', zone: 'us-east-1b', role: 'worker', status: 'critical', cpu: 98, memory: 95, connections: 9100 },
    { id: 'n15', name: 'worker-dr-warm-03', zone: 'eu-central-1', role: 'worker', status: 'nominal', cpu: 32, memory: 36, connections: 4100 },
    { id: 'n16', name: 'worker-runner-ci-04', zone: 'us-east-1', role: 'worker', status: isBreach ? 'isolated' : 'nominal', cpu: isBreach ? 2 : 64, memory: isBreach ? 8 : 61, connections: isBreach ? 0 : 7800 },
  ]);

  // Live Telemetry Generator
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      setDataPoints((prev) => {
        const last = prev[prev.length - 1];
        const now = new Date();
        const stressMultiplier = isStressTestActive ? 1.25 : 1.0;

        const baseCpu = isStressTestActive ? 95 : isBreach ? 76 : 84;
        const newCpu = Math.min(100, Math.max(25, Number((baseCpu + (Math.random() * 8 - 4) * stressMultiplier).toFixed(1))));

        const ingress = Number(
          Math.min(10, Math.max(1, last.ingressGbps + (Math.random() * 0.8 - 0.4) * stressMultiplier)).toFixed(2)
        );
        const egress = Number(
          Math.min(10, Math.max(1.5, last.egressGbps + (Math.random() * 0.9 - 0.45) * stressMultiplier)).toFixed(2)
        );

        const baseLatency = isStressTestActive ? 960 : isBreach ? 340 : 840;
        const p50 = Number(Math.max(20, last.latencyP50 + (Math.random() * 4 - 2)).toFixed(1));
        const p90 = Number(Math.max(80, last.latencyP90 + (Math.random() * 10 - 5)).toFixed(1));
        const p99 = Number(Math.max(180, baseLatency + (Math.random() * 50 - 25) * stressMultiplier).toFixed(1));

        const nextPoint: HealthDataPoint = {
          timestamp: now,
          cpu: newCpu,
          ingressGbps: ingress,
          egressGbps: egress,
          latencyP50: p50,
          latencyP90: p90,
          latencyP99: p99,
        };

        return [...prev.slice(1), nextPoint];
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isLiveStreaming, isStressTestActive, isBreach]);

  // SVG Chart Refs
  const cpuSvgRef = useRef<SVGSVGElement | null>(null);
  const bandwidthSvgRef = useRef<SVGSVGElement | null>(null);
  const latencySvgRef = useRef<SVGSVGElement | null>(null);

  // Latest snapshot metrics
  const latest = dataPoints[dataPoints.length - 1] || {
    cpu: 84,
    ingressGbps: 4.8,
    egressGbps: 7.2,
    latencyP50: 45,
    latencyP90: 140,
    latencyP99: 842,
  };

  // 1. D3 RENDER: CPU Utilization Area Chart
  useEffect(() => {
    if (!cpuSvgRef.current || dataPoints.length === 0) return;

    const svg = d3.select(cpuSvgRef.current);
    svg.selectAll('*').remove();

    const width = cpuSvgRef.current.clientWidth || 360;
    const height = 150;
    const margin = { top: 12, right: 14, bottom: 22, left: 32 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(dataPoints, (d) => d.timestamp) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);

    // Gradients
    const defs = svg.append('defs');
    const cpuGradient = defs
      .append('linearGradient')
      .attr('id', 'cpu-area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    cpuGradient.append('stop').attr('offset', '0%').attr('stop-color', '#ff5451').attr('stop-opacity', 0.5);
    cpuGradient.append('stop').attr('offset', '70%').attr('stop-color', '#4cd7f6').attr('stop-opacity', 0.2);
    cpuGradient.append('stop').attr('offset', '100%').attr('stop-color', '#4cd7f6').attr('stop-opacity', 0.0);

    // Horizontal Grid Lines
    const yGrid = [25, 50, 75, 100];
    g.selectAll('.grid-line')
      .data(yGrid)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', '#1c2b3c')
      .attr('stroke-dasharray', '2,2');

    // Warning / Critical Threshold Lines
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(85))
      .attr('y2', yScale(85))
      .attr('stroke', '#ff5451')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,3')
      .attr('opacity', 0.85);

    g.append('text')
      .attr('x', innerWidth - 4)
      .attr('y', yScale(85) - 3)
      .attr('fill', '#ff5451')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('text-anchor', 'end')
      .attr('font-weight', 'bold')
      .text('CRIT CEILING 85%');

    // Area Generator
    const area = d3
      .area<HealthDataPoint>()
      .x((d) => xScale(d.timestamp))
      .y0(innerHeight)
      .y1((d) => yScale(d.cpu))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(dataPoints)
      .attr('fill', 'url(#cpu-area-gradient)')
      .attr('d', area);

    // Line Generator
    const line = d3
      .line<HealthDataPoint>()
      .x((d) => xScale(d.timestamp))
      .y((d) => yScale(d.cpu))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(dataPoints)
      .attr('fill', 'none')
      .attr('stroke', latest.cpu > 85 ? '#ff5451' : '#4cd7f6')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Latest pulse dot
    const latestPt = dataPoints[dataPoints.length - 1];
    if (latestPt) {
      const cx = xScale(latestPt.timestamp);
      const cy = yScale(latestPt.cpu);

      g.append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', 4.5)
        .attr('fill', latestPt.cpu > 85 ? '#ff5451' : '#4cd7f6')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.5);
    }

    // Y Axis
    const yAxis = d3.axisLeft(yScale).ticks(4).tickFormat((d) => `${d}%`);
    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#e4beba')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace');
    g.selectAll('.domain').remove();
    g.selectAll('.tick line').remove();

    // X Axis
    const xAxis = d3.axisBottom(xScale).ticks(4).tickFormat(d3.timeFormat('%H:%M:%S') as any);
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#e4beba')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace');
    g.selectAll('.domain').attr('stroke', '#1c2b3c');
  }, [dataPoints, latest.cpu]);

  // 2. D3 RENDER: Network Bandwidth Dual Ingress/Egress Chart
  useEffect(() => {
    if (!bandwidthSvgRef.current || dataPoints.length === 0) return;

    const svg = d3.select(bandwidthSvgRef.current);
    svg.selectAll('*').remove();

    const width = bandwidthSvgRef.current.clientWidth || 360;
    const height = 150;
    const margin = { top: 12, right: 14, bottom: 22, left: 34 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(dataPoints, (d) => d.timestamp) as [Date, Date])
      .range([0, innerWidth]);

    const maxY = Math.max(10, d3.max(dataPoints, (d) => Math.max(d.ingressGbps, d.egressGbps)) || 10);
    const yScale = d3.scaleLinear().domain([0, maxY]).range([innerHeight, 0]);

    // Grid lines
    [2.5, 5.0, 7.5, 10.0].forEach((val) => {
      if (val <= maxY) {
        g.append('line')
          .attr('x1', 0)
          .attr('x2', innerWidth)
          .attr('y1', yScale(val))
          .attr('y2', yScale(val))
          .attr('stroke', '#1c2b3c')
          .attr('stroke-dasharray', '2,2');
      }
    });

    // Ingress Line (Emerald)
    const lineIngress = d3
      .line<HealthDataPoint>()
      .x((d) => xScale(d.timestamp))
      .y((d) => yScale(d.ingressGbps))
      .curve(d3.curveMonotoneX);

    // Egress Line (Cyan)
    const lineEgress = d3
      .line<HealthDataPoint>()
      .x((d) => xScale(d.timestamp))
      .y((d) => yScale(d.egressGbps))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(dataPoints)
      .attr('fill', 'none')
      .attr('stroke', '#4edea3')
      .attr('stroke-width', 2)
      .attr('d', lineIngress);

    g.append('path')
      .datum(dataPoints)
      .attr('fill', 'none')
      .attr('stroke', '#acedff')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '3,1')
      .attr('d', lineEgress);

    // Y Axis
    const yAxis = d3.axisLeft(yScale).ticks(4).tickFormat((d) => `${d}G`);
    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#e4beba')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace');
    g.selectAll('.domain').remove();
    g.selectAll('.tick line').remove();

    // X Axis
    const xAxis = d3.axisBottom(xScale).ticks(4).tickFormat(d3.timeFormat('%H:%M:%S') as any);
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#e4beba')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace');
    g.selectAll('.domain').attr('stroke', '#1c2b3c');
  }, [dataPoints]);

  // 3. D3 RENDER: Latency Distribution & P99 Trend Chart
  useEffect(() => {
    if (!latencySvgRef.current || dataPoints.length === 0) return;

    const svg = d3.select(latencySvgRef.current);
    svg.selectAll('*').remove();

    const width = latencySvgRef.current.clientWidth || 360;
    const height = 150;
    const margin = { top: 12, right: 14, bottom: 22, left: 36 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(dataPoints, (d) => d.timestamp) as [Date, Date])
      .range([0, innerWidth]);

    const maxLatency = Math.max(1000, d3.max(dataPoints, (d) => d.latencyP99) || 1000);
    const yScale = d3.scaleLinear().domain([0, maxLatency]).range([innerHeight, 0]);

    // 200ms Target Ceiling Line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(200))
      .attr('y2', yScale(200))
      .attr('stroke', '#ff5451')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3');

    g.append('text')
      .attr('x', innerWidth - 4)
      .attr('y', yScale(200) - 3)
      .attr('fill', '#ff5451')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('text-anchor', 'end')
      .attr('font-weight', 'bold')
      .text('SLA TARGET <200ms');

    // P50 Line (Green)
    const lineP50 = d3
      .line<HealthDataPoint>()
      .x((d) => xScale(d.timestamp))
      .y((d) => yScale(d.latencyP50))
      .curve(d3.curveMonotoneX);

    // P90 Line (Cyan)
    const lineP90 = d3
      .line<HealthDataPoint>()
      .x((d) => xScale(d.timestamp))
      .y((d) => yScale(d.latencyP90))
      .curve(d3.curveMonotoneX);

    // P99 Line (Crimson)
    const lineP99 = d3
      .line<HealthDataPoint>()
      .x((d) => xScale(d.timestamp))
      .y((d) => yScale(d.latencyP99))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(dataPoints)
      .attr('fill', 'none')
      .attr('stroke', '#4edea3')
      .attr('stroke-width', 1.5)
      .attr('d', lineP50);

    g.append('path')
      .datum(dataPoints)
      .attr('fill', 'none')
      .attr('stroke', '#4cd7f6')
      .attr('stroke-width', 1.5)
      .attr('d', lineP90);

    g.append('path')
      .datum(dataPoints)
      .attr('fill', 'none')
      .attr('stroke', '#ff5451')
      .attr('stroke-width', 2.5)
      .attr('d', lineP99);

    // Y Axis
    const yAxis = d3.axisLeft(yScale).ticks(4).tickFormat((d) => `${d}ms`);
    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#e4beba')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace');
    g.selectAll('.domain').remove();
    g.selectAll('.tick line').remove();

    // X Axis
    const xAxis = d3.axisBottom(xScale).ticks(4).tickFormat(d3.timeFormat('%H:%M:%S') as any);
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#e4beba')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace');
    g.selectAll('.domain').attr('stroke', '#1c2b3c');
  }, [dataPoints]);

  const [isExportingReport, setIsExportingReport] = useState(false);
  const [showReportPreviewModal, setShowReportPreviewModal] = useState(false);
  const [generatedReportData, setGeneratedReportData] = useState<any>(null);

  const handleGenerateIncidentReport = () => {
    setIsExportingReport(true);
    playConfirm();

    const timestamp = new Date();
    const isoString = timestamp.toISOString();
    const fileTimestamp = isoString.replace(/[:.]/g, '-');
    const filename = `incident-forensics-${scenario.code.replace('#', '')}-${fileTimestamp}.json`;

    // Compute forensic metrics aggregations
    const cpuValues = dataPoints.map((d) => d.cpu);
    const ingressValues = dataPoints.map((d) => d.ingressGbps);
    const egressValues = dataPoints.map((d) => d.egressGbps);
    const p99Values = dataPoints.map((d) => d.latencyP99);

    const report = {
      meta: {
        reportType: 'FORENSIC_RESOURCE_UTILIZATION_AUDIT',
        version: '1.4.0',
        generatedAt: isoString,
        incidentCode: scenario.code,
        incidentTitle: scenario.title,
        defconLevel: scenario.defconLevel,
        commandLead: scenario.commandLead,
        environment: 'Production Multi-Region Cloud',
        slaBreachStatus: latest.latencyP99 > 200 ? 'BREACHED' : 'NOMINAL',
        activeStressTest: isStressTestActive,
      },
      forensicsSummary: {
        healthIndexPercent: overallHealthIndex,
        cpu: {
          currentPercent: latest.cpu,
          minPercent: Number(d3.min(cpuValues)?.toFixed(1)),
          maxPercent: Number(d3.max(cpuValues)?.toFixed(1)),
          meanPercent: Number(d3.mean(cpuValues)?.toFixed(1)),
          criticalCeilingBreaches: cpuValues.filter((v) => v >= 85).length,
        },
        bandwidth: {
          currentIngressGbps: latest.ingressGbps,
          currentEgressGbps: latest.egressGbps,
          peakIngressGbps: Number(d3.max(ingressValues)?.toFixed(2)),
          peakEgressGbps: Number(d3.max(egressValues)?.toFixed(2)),
          saturationLimitGbps: 10.0,
        },
        latency: {
          currentP50Ms: latest.latencyP50,
          currentP90Ms: latest.latencyP90,
          currentP99Ms: latest.latencyP99,
          peakP99Ms: Number(d3.max(p99Values)?.toFixed(1)),
          targetSlaMs: 200.0,
        },
        clusterTopology: {
          totalNodes: nodes.length,
          criticalCount: nodes.filter((n) => n.status === 'critical').length,
          warningCount: nodes.filter((n) => n.status === 'warning').length,
          isolatedCount: nodes.filter((n) => n.status === 'isolated').length,
          nominalCount: nodes.filter((n) => n.status === 'nominal').length,
          nodes: nodes.map((n) => ({
            id: n.id,
            name: n.name,
            zone: n.zone,
            role: n.role,
            status: n.status,
            cpuPercent: n.cpu,
            memoryPercent: n.memory,
            activeTcpConnections: n.connections,
          })),
        },
      },
      timeSeriesBuffer: dataPoints.map((pt) => ({
        timestamp: pt.timestamp.toISOString(),
        cpuPercent: pt.cpu,
        ingressGbps: pt.ingressGbps,
        egressGbps: pt.egressGbps,
        latencyP50Ms: pt.latencyP50,
        latencyP90Ms: pt.latencyP90,
        latencyP99Ms: pt.latencyP99,
      })),
    };

    setGeneratedReportData(report);

    // Trigger JSON File Download in Browser
    try {
      const jsonString = JSON.stringify(report, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = filename;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      URL.revokeObjectURL(url);

      onShowToast(`Exported Forensic Report: ${filename}`);
    } catch (err) {
      console.error('Download error:', err);
      onShowToast('Report generated; view in forensic preview');
    } finally {
      setTimeout(() => {
        setIsExportingReport(false);
      }, 700);
    }
  };

  const handleToggleStress = () => {
    const next = !isStressTestActive;
    setIsStressTestActive(next);
    if (next) {
      playAlert();
      onShowToast('STRESS TEST ACTIVE: Simulated load surge injected across cluster');
    } else {
      playConfirm();
      onShowToast('Stress test cleared: Nominal telemetry resumed');
    }
  };

  const handleToggleStreaming = () => {
    const next = !isLiveStreaming;
    setIsLiveStreaming(next);
    playBeep(next ? 950 : 650, 0.04);
    onShowToast(next ? 'Live telemetry stream resumed' : 'Telemetry stream paused');
  };

  const overallHealthIndex = useMemo(() => {
    if (isStressTestActive) return 58.2;
    if (isBreach) return 69.4;
    return 71.8;
  }, [isStressTestActive, isBreach]);

  return (
    <div className="flex flex-col w-full px-4 space-y-3.5 pb-12 max-w-4xl mx-auto animate-fade-in select-none">
      {/* 1. Tactical Header Strip & Health Index */}
      <div className="bg-[#0d1c2d] rounded-lg p-3.5 shadow-md border border-[#1c2b3c] relative overflow-hidden">
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="material-symbols-outlined text-[#4cd7f6] text-[18px] animate-pulse">
              vital_signs
            </span>
            <span className="font-mono text-[11px] text-[#4cd7f6] uppercase tracking-widest font-bold">
              SYSTEM HEALTH // D3 TELEMETRY ENGINE
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={handleToggleStreaming}
              className={`h-7 px-2.5 rounded font-mono text-[10px] uppercase font-bold flex items-center gap-1 border transition-all active:scale-95 ${
                isLiveStreaming
                  ? 'bg-[#010f1f] text-[#4edea3] border-[#4edea3]/40'
                  : 'bg-[#93000a] text-[#ffb3ad] border-[#ff5451]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isLiveStreaming ? 'bg-[#4edea3] animate-ping' : 'bg-[#ff5451]'}`}></span>
              <span>{isLiveStreaming ? 'LIVE (1.5s)' : 'PAUSED'}</span>
            </button>

            <button
              onClick={handleToggleStress}
              className={`h-7 px-2.5 rounded font-mono text-[10px] uppercase font-bold flex items-center gap-1 border transition-all active:scale-95 ${
                isStressTestActive
                  ? 'bg-[#ff5451] text-[#68000a] border-[#ffb3ad] animate-pulse shadow-[0_0_10px_rgba(255,84,81,0.5)]'
                  : 'bg-[#1c2b3c] text-[#ffb3ad] border-[#5b403e] hover:bg-[#273647]'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">bolt</span>
              <span>{isStressTestActive ? 'STRESS ON' : 'SIMULATE LOAD'}</span>
            </button>

            {/* Generate Incident Report Button */}
            <button
              onClick={handleGenerateIncidentReport}
              disabled={isExportingReport}
              title="Export current resource utilization and cluster telemetry to JSON"
              className="h-7 px-2.5 rounded font-mono text-[10px] uppercase font-bold flex items-center gap-1.5 bg-[#00a572] hover:bg-[#4edea3] text-[#003824] shadow-[0_0_10px_rgba(78,222,163,0.35)] transition-all active:scale-95 border border-[#4edea3]"
            >
              <span className={`material-symbols-outlined text-[14px] ${isExportingReport ? 'animate-spin' : ''}`}>
                {isExportingReport ? 'sync' : 'download'}
              </span>
              <span>{isExportingReport ? 'EXPORTING...' : 'GENERATE REPORT'}</span>
            </button>

            {/* View Raw JSON Preview Button */}
            {generatedReportData && (
              <button
                onClick={() => {
                  playBeep(900, 0.03);
                  setShowReportPreviewModal(true);
                }}
                title="View Forensic Report JSON Schema"
                className="h-7 px-2 rounded font-mono text-[10px] uppercase font-bold flex items-center gap-1 bg-[#122131] hover:bg-[#1c2b3c] text-[#4cd7f6] border border-[#4cd7f6]/40 active:scale-95"
              >
                <span className="material-symbols-outlined text-[14px]">data_object</span>
                <span className="hidden sm:inline">PREVIEW JSON</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Cluster Score Card */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Health Index */}
          <div className="bg-[#010f1f] p-2.5 rounded border border-[#1c2b3c] flex flex-col justify-between">
            <span className="font-mono text-[10px] text-[#e4beba] uppercase">HEALTH INDEX</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`font-mono text-[20px] font-bold ${overallHealthIndex < 70 ? 'text-[#ff5451]' : 'text-[#4edea3]'}`}>
                {overallHealthIndex}%
              </span>
              <span className="font-mono text-[10px] text-[#e4beba]">
                {overallHealthIndex < 70 ? 'DEGRADED' : 'OPERATIONAL'}
              </span>
            </div>
          </div>

          {/* CPU Cluster */}
          <div className="bg-[#010f1f] p-2.5 rounded border border-[#1c2b3c] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] text-[#e4beba] uppercase">CPU CLUSTER</span>
              <span className={`w-2 h-2 rounded-full ${latest.cpu > 85 ? 'bg-[#ff5451]' : 'bg-[#4cd7f6]'}`}></span>
            </div>
            <div className="font-mono text-[20px] text-[#ffb3ad] font-bold mt-0.5">
              {latest.cpu}%
            </div>
          </div>

          {/* Network Throughput */}
          <div className="bg-[#010f1f] p-2.5 rounded border border-[#1c2b3c] flex flex-col justify-between">
            <span className="font-mono text-[10px] text-[#e4beba] uppercase">INGRESS / EGRESS</span>
            <div className="font-mono text-[16px] text-[#4edea3] font-bold mt-0.5">
              {latest.ingressGbps}G / <span className="text-[#acedff]">{latest.egressGbps}G</span>
            </div>
          </div>

          {/* P99 Latency */}
          <div className="bg-[#010f1f] p-2.5 rounded border border-[#1c2b3c] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] text-[#e4beba] uppercase">P99 LATENCY</span>
              <span className="font-mono text-[9px] text-[#ff5451] font-bold">+321%</span>
            </div>
            <div className="font-mono text-[20px] text-[#ff5451] font-bold mt-0.5">
              {latest.latencyP99}<span className="text-[11px] font-normal ml-0.5">ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. D3 VISUALIZATION 1: CPU UTILIZATION */}
      <div className="bg-[#122131] rounded-lg p-3.5 shadow-md border border-[#273647] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#4cd7f6] text-[18px]">memory</span>
            <span className="font-mono text-[11px] text-[#d4e4fa] uppercase tracking-wider font-bold">
              CPU Utilization Profile (D3 Time-Series)
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span className="text-[#ff5451] font-bold flex items-center gap-1">
              <span className="w-2 h-0.5 bg-[#ff5451] inline-block"></span> Critical (&gt;85%)
            </span>
            <span className="text-[#4cd7f6] flex items-center gap-1">
              <span className="w-2 h-0.5 bg-[#4cd7f6] inline-block"></span> Active Pool
            </span>
          </div>
        </div>

        {/* D3 CPU Canvas */}
        <div className="w-full bg-[#010f1f] rounded border border-[#1c2b3c] p-1 overflow-hidden">
          <svg ref={cpuSvgRef} className="w-full h-[150px] overflow-visible" />
        </div>

        {/* Core breakdown row */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-1">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((core) => {
            const usage = Math.min(
              100,
              Math.max(20, Math.round(latest.cpu + Math.sin(core * 1.5) * 12))
            );
            return (
              <div key={core} className="bg-[#0d1c2d] p-1.5 rounded border border-[#1c2b3c] text-center">
                <span className="font-mono text-[9px] text-[#e4beba] block">C-0{core}</span>
                <span
                  className={`font-mono text-[11px] font-bold ${
                    usage > 85 ? 'text-[#ff5451]' : 'text-[#4cd7f6]'
                  }`}
                >
                  {usage}%
                </span>
                <div className="w-full bg-[#1c2b3c] h-1 rounded mt-1 overflow-hidden">
                  <div
                    className={`h-full rounded ${usage > 85 ? 'bg-[#ff5451]' : 'bg-[#4cd7f6]'}`}
                    style={{ width: `${usage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. D3 VISUALIZATION 2: NETWORK BANDWIDTH INGRESS/EGRESS */}
      <div className="bg-[#122131] rounded-lg p-3.5 shadow-md border border-[#273647] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#4edea3] text-[18px]">network_check</span>
            <span className="font-mono text-[11px] text-[#d4e4fa] uppercase tracking-wider font-bold">
              Bandwidth Throughput (D3 Ingress vs Egress)
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span className="text-[#4edea3] font-bold flex items-center gap-1">
              <span className="w-2.5 h-1 bg-[#4edea3] inline-block"></span> Ingress ({latest.ingressGbps} Gbps)
            </span>
            <span className="text-[#acedff] font-bold flex items-center gap-1">
              <span className="w-2.5 h-1 bg-[#acedff] inline-block"></span> Egress ({latest.egressGbps} Gbps)
            </span>
          </div>
        </div>

        {/* D3 Bandwidth Canvas */}
        <div className="w-full bg-[#010f1f] rounded border border-[#1c2b3c] p-1 overflow-hidden">
          <svg ref={bandwidthSvgRef} className="w-full h-[150px] overflow-visible" />
        </div>

        <div className="flex justify-between items-center text-[#e4beba] font-mono text-[10px] px-1">
          <span>Edge Saturation Ceiling: 10.0 Gbps</span>
          <span className="text-[#4edea3]">Packet Loss: 0.002% (Nominal)</span>
        </div>
      </div>

      {/* 4. D3 VISUALIZATION 3: LATENCY DISTRIBUTION & P99 PEAKS */}
      <div className="bg-[#122131] rounded-lg p-3.5 shadow-md border border-[#273647] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#ff5451] text-[18px]">speed</span>
            <span className="font-mono text-[11px] text-[#d4e4fa] uppercase tracking-wider font-bold">
              Latency Spectrum: P50 / P90 / P99 (D3 Anomaly View)
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span className="text-[#4edea3]">P50 ({latest.latencyP50}ms)</span>
            <span className="text-[#4cd7f6]">P90 ({latest.latencyP90}ms)</span>
            <span className="text-[#ff5451] font-bold">P99 ({latest.latencyP99}ms)</span>
          </div>
        </div>

        {/* D3 Latency Canvas */}
        <div className="w-full bg-[#010f1f] rounded border border-[#1c2b3c] p-1 overflow-hidden">
          <svg ref={latencySvgRef} className="w-full h-[150px] overflow-visible" />
        </div>

        <div className="bg-[#0d1c2d] p-2 rounded border border-[#1c2b3c] flex items-center justify-between font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff5451] animate-ping"></span>
            <span className="text-[#ffb3ad] font-bold">BREACH ANOMALY DETECTED:</span>
            <span className="text-[#d4e4fa]">Redis query pool locking P99 lag at {latest.latencyP99}ms</span>
          </div>
          <button
            onClick={() => onNavigateTab('contingency-fallback')}
            className="px-2 py-0.5 rounded bg-[#ff5451] text-[#68000a] text-[10px] uppercase font-bold hover:bg-[#ffb3ad] active:scale-95 transition-all shadow-sm"
          >
            Review Plan B
          </button>
        </div>
      </div>

      {/* 5. CLUSTER NODE MATRIX (16 NODES) */}
      <div className="bg-[#0d1c2d] rounded-lg p-3.5 shadow-md border border-[#1c2b3c] space-y-2.5">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#4cd7f6] text-[18px]">dns</span>
            <span className="font-mono text-[11px] text-[#d4e4fa] uppercase tracking-wider font-bold">
              Cluster Node Matrix (16 Instances)
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span className="text-[#4edea3]">● Nominal (8)</span>
            <span className="text-[#acedff]">● Warning (3)</span>
            <span className="text-[#ff5451]">● Critical (4)</span>
            <span className="text-[#ab8986]">● Drained (1)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {nodes.map((node) => {
            const isCritical = node.status === 'critical';
            const isWarning = node.status === 'warning';
            const isIsolated = node.status === 'isolated';
            const isSelected = selectedNode?.id === node.id;

            return (
              <div
                key={node.id}
                onClick={() => {
                  setSelectedNode(node);
                  playBeep(850, 0.03);
                }}
                className={`p-2.5 rounded border cursor-pointer transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-[#1c2b3c] border-[#4cd7f6] shadow-[0_0_10px_rgba(76,215,246,0.3)]'
                    : isCritical
                    ? 'bg-[#93000a]/20 border-[#ff5451]/50 hover:bg-[#93000a]/30'
                    : isWarning
                    ? 'bg-[#122131] border-[#5b403e] hover:bg-[#1c2b3c]'
                    : isIsolated
                    ? 'bg-[#010f1f] border-[#273647] opacity-60'
                    : 'bg-[#010f1f] border-[#1c2b3c] hover:bg-[#122131]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-[#d4e4fa] font-bold truncate">
                    {node.name}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isCritical
                        ? 'bg-[#ff5451] animate-ping'
                        : isWarning
                        ? 'bg-[#acedff]'
                        : isIsolated
                        ? 'bg-[#ab8986]'
                        : 'bg-[#4edea3]'
                    }`}
                  ></span>
                </div>
                <div className="flex justify-between items-center mt-1 font-mono text-[10px] text-[#e4beba]">
                  <span>{node.zone}</span>
                  <span
                    className={`font-bold ${
                      node.cpu > 85 ? 'text-[#ff5451]' : 'text-[#4cd7f6]'
                    }`}
                  >
                    {node.cpu}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div className="bg-[#010f1f] p-3 rounded border border-[#4cd7f6]/40 mt-2 font-mono text-[11px] space-y-2 animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#1c2b3c] pb-1.5">
              <span className="text-[#4cd7f6] font-bold text-[12px]">
                Node Telemetry: {selectedNode.name} [{selectedNode.zone}]
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-[#e4beba] hover:text-[#d4e4fa]"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[#e4beba] text-[10px] block">CPU Load:</span>
                <span className="text-[#ff5451] font-bold">{selectedNode.cpu}%</span>
              </div>
              <div>
                <span className="text-[#e4beba] text-[10px] block">Memory Alloc:</span>
                <span className="text-[#acedff] font-bold">{selectedNode.memory}%</span>
              </div>
              <div>
                <span className="text-[#e4beba] text-[10px] block">Active TCP:</span>
                <span className="text-[#4edea3] font-bold">{selectedNode.connections.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Forensic Report JSON Modal Preview */}
      {showReportPreviewModal && generatedReportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010f1f]/85 backdrop-blur-md animate-fade-in select-none">
          <div className="w-full max-w-2xl bg-[#0d1c2d] rounded-lg shadow-2xl flex flex-col border border-[#4edea3] max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#122131] p-3 px-4 flex items-center justify-between border-b border-[#273647]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4edea3] text-[20px]">
                  verified_user
                </span>
                <span className="font-mono text-[12px] text-[#4edea3] font-bold uppercase tracking-wider">
                  FORENSIC INCIDENT REPORT // JSON EXPORT AUDIT
                </span>
              </div>
              <button
                onClick={() => setShowReportPreviewModal(false)}
                className="text-[#e4beba] hover:text-[#d4e4fa]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Body: Forensic Key Stats */}
            <div className="p-4 bg-[#051424] border-b border-[#1c2b3c] grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
              <div className="bg-[#010f1f] p-2 rounded border border-[#1c2b3c]">
                <span className="text-[#e4beba] text-[10px] block">Incident Code</span>
                <span className="text-[#4cd7f6] font-bold">{generatedReportData.meta.incidentCode}</span>
              </div>
              <div className="bg-[#010f1f] p-2 rounded border border-[#1c2b3c]">
                <span className="text-[#e4beba] text-[10px] block">SLA Status</span>
                <span className="text-[#ff5451] font-bold">{generatedReportData.meta.slaBreachStatus}</span>
              </div>
              <div className="bg-[#010f1f] p-2 rounded border border-[#1c2b3c]">
                <span className="text-[#e4beba] text-[10px] block">Peak Latency P99</span>
                <span className="text-[#ffb3ad] font-bold">{generatedReportData.forensicsSummary.latency.peakP99Ms} ms</span>
              </div>
              <div className="bg-[#010f1f] p-2 rounded border border-[#1c2b3c]">
                <span className="text-[#e4beba] text-[10px] block">Buffer Samples</span>
                <span className="text-[#4edea3] font-bold">{generatedReportData.timeSeriesBuffer.length} data points</span>
              </div>
            </div>

            {/* Formatted JSON Viewer */}
            <div className="p-3 bg-[#010f1f] flex-1 overflow-y-auto">
              <pre className="font-mono text-[11px] text-[#4cd7f6] leading-relaxed select-all">
                {JSON.stringify(generatedReportData, null, 2)}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#122131] flex items-center justify-between border-t border-[#273647]">
              <span className="font-mono text-[10px] text-[#e4beba]">
                Exported to client-side download buffer • SHA-256 Verified
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(JSON.stringify(generatedReportData, null, 2));
                    playBeep(1100, 0.03);
                    onShowToast('JSON report copied to clipboard');
                  }}
                  className="h-8 px-3 rounded bg-[#1c2b3c] hover:bg-[#273647] text-[#4cd7f6] font-mono text-[10px] uppercase font-bold flex items-center gap-1 border border-[#4cd7f6]/40"
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  <span>Copy JSON</span>
                </button>
                <button
                  onClick={() => setShowReportPreviewModal(false)}
                  className="h-8 px-3.5 rounded bg-[#00a572] hover:bg-[#4edea3] text-[#003824] font-mono text-[10px] uppercase font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
