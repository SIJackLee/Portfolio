import { PlanetDomain } from "@/components/space/types";

export const planets: PlanetDomain[] = [
  {
    id: "simulation",
    label: "Simulation",
    stackLabel: "Simulation",
    color: "#7C4DFF",
    summary: "Model-based simulation and digital twin validation.",
    orbitIndex: 0,
    gravityDefaultNodeId: "validation",
    gravityNodes: [
      {
        id: "digital-twin",
        label: "Digital Twin",
        color: "#5AC8FF",
        summary: "Mirror system behavior with model-to-runtime parity checks.",
        projects: [
          {
            title: "Plant Dynamics Shadow Model",
            description: "Built a twin model to compare simulated and measured states.",
            tags: ["MATLAB", "System ID"],
            url: "#",
            status: "study",
          },
        ],
      },
      {
        id: "thermal-drift",
        label: "Thermal Drift",
        color: "#FFB74D",
        summary: "Quantify drift under ambient and load-induced heat changes.",
        projects: [
          {
            title: "Thermal Drift Sandbox",
            description: "Validated sensor drift behavior before hardware fabrication.",
            tags: ["MATLAB", "Digital Twin"],
            url: "#",
            status: "study",
          },
        ],
      },
      {
        id: "sensor-noise",
        label: "Sensor Noise",
        color: "#FF61D2",
        summary: "Model noise injection, filtering response, and signal confidence.",
        projects: [
          {
            title: "Noise Envelope Calibration",
            description: "Calibrated noise envelopes against measured bench datasets.",
            tags: ["Signal Processing", "Calibration"],
            url: "#",
            status: "project",
          },
        ],
      },
      {
        id: "actuator-response",
        label: "Actuator Response",
        color: "#2EE7A6",
        summary: "Analyze settling time and overshoot for closed-loop control.",
        projects: [
          {
            title: "Actuator Step-Response Bench",
            description: "Mapped control gains to response quality over load profiles.",
            tags: ["Control", "PID"],
            url: "#",
            status: "project",
          },
        ],
      },
      {
        id: "validation",
        label: "Validation",
        color: "#4D8DFF",
        summary: "Validate simulation outputs against measured and expected behavior.",
        projects: [
          {
            title: "Cross-Domain Validation Matrix",
            description: "Linked model checks to test cases and release confidence gates.",
            tags: ["Verification", "Test Matrix"],
            url: "#",
            status: "project",
          },
        ],
      },
    ],
    projects: [
      {
        title: "Thermal Drift Sandbox",
        description: "Validated sensor drift behavior before hardware fabrication.",
        tags: ["MATLAB", "Digital Twin"],
        url: "#",
        status: "study",
      },
    ],
  },
  {
    id: "circuit",
    label: "Hardware",
    stackLabel: "Hardware",
    color: "#00E5FF",
    summary: "Signal integrity, low-noise power and sensor interface design.",
    orbitIndex: 1,
    projects: [
      {
        title: "Low-Power Sensor Board",
        description: "Optimized battery profile and stable analog front-end.",
        tags: ["PCB", "Power"],
        url: "#",
        status: "project",
      },
    ],
  },
  {
    id: "protocol",
    label: "Circuit",
    stackLabel: "Circuit",
    color: "#00C853",
    summary: "MQTT/HTTP/Modbus protocol architecture and gateway strategy.",
    orbitIndex: 2,
    projects: [
      {
        title: "Hybrid Gateway Protocol Layer",
        description: "Unified telemetry contracts across mixed field devices.",
        tags: ["MQTT", "Modbus"],
        url: "#",
        status: "project",
      },
    ],
  },
  {
    id: "server",
    label: "Network",
    stackLabel: "Network",
    color: "#FF9100",
    summary: "Event-driven services for ingestion, control and operations.",
    orbitIndex: 3,
    projects: [
      {
        title: "Device Command Orchestrator",
        description: "Built resilient command queue with retry and audit trails.",
        tags: ["Node.js", "Queue"],
        url: "#",
        status: "project",
      },
    ],
  },
  {
    id: "db",
    label: "Cloud",
    stackLabel: "Cloud",
    color: "#2979FF",
    summary: "Time-series and operational schema for fast observability queries.",
    orbitIndex: 4,
    projects: [
      {
        title: "Telemetry Storage Strategy",
        description: "Separated hot-path metrics from transactional data.",
        tags: ["PostgreSQL", "Timeseries"],
        url: "#",
        status: "study",
      },
    ],
  },
  {
    id: "web",
    label: "Data",
    stackLabel: "Data",
    color: "#FF4081",
    summary: "Real-time dashboard UX for operations and incident response.",
    orbitIndex: 5,
    projects: [
      {
        title: "Ops Command Dashboard",
        description: "Designed control panel for alerts, maps and device actions.",
        tags: ["Next.js", "Realtime UI"],
        url: "#",
        status: "project",
      },
    ],
  },
  {
    id: "data-engineering",
    label: "Web",
    stackLabel: "Web",
    color: "#FFD600",
    summary: "Ingestion, transformation and warehouse-ready pipelines.",
    orbitIndex: 6,
    projects: [
      {
        title: "Streaming ETL Backbone",
        description: "Automated cleansing and enrichment for sensor streams.",
        tags: ["ETL", "Kafka"],
        url: "#",
        status: "project",
      },
    ],
  },
  {
    id: "ai",
    label: "AI",
    stackLabel: "AI",
    color: "#FF1744",
    summary: "Anomaly detection and prediction integrated into operations.",
    orbitIndex: 7,
    projects: [
      {
        title: "Predictive Maintenance Model",
        description: "Integrated model inference into live monitoring loop.",
        tags: ["ML", "Anomaly Detection"],
        url: "#",
        status: "project",
      },
    ],
  },
];
