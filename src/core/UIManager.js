import { GUI } from "lil-gui";

export class UIManager {
  constructor(onReset, onPauseToggle, onResetDefaults) {
    this.gui = new GUI();
    this.onReset = onReset;
    this.onPauseToggle = onPauseToggle;
    this.onResetDefaults = onResetDefaults;
    this.panel = null;
    this.toggleButton = null;
    this.pauseButton = null;
    this.resetButton = null;
    this.visible = true;
    this.graphValues = Array.from({ length: 40 }, () => 0);
    this.controllers = {};
  }

  createControls(params) {
    this.controllers.gravity = this.gui
      .add(params, "gravity", 1, 20, 0.01)
      .onChange((value) => {
        params.gravity = value;
        this.onReset();
      });

    this.controllers.restitution = this.gui
      .add(params, "restitution", 0.1, 1.0, 0.01)
      .onChange((value) => {
        params.restitution = value;
        this.onReset();
      });

    this.controllers.ballCount = this.gui
      .add(params, "ballCount", 2, 8, 1)
      .onChange((value) => {
        params.ballCount = value;
        this.onReset();
      });

    this.controllers.ballRadius = this.gui
      .add(params, "ballRadius", 0.2, 0.8, 0.01)
      .onChange((value) => {
        params.ballRadius = value;
        this.onReset();
      });

    this.controllers.mass = this.gui
      .add(params, "mass", 0.5, 5, 0.1)
      .onChange((value) => {
        params.mass = value;
        this.onReset();
      });

    this.controllers.initialLaunchAngle = this.gui
      .add(params, "initialLaunchAngle", -1.2, 0, 0.01)
      .onChange((value) => {
        params.initialLaunchAngle = value;
        this.onReset();
      });

    this.controllers.liftedBallCount = this.gui
      .add(params, "liftedBallCount", 1, 4, 1)
      .onChange((value) => {
        params.liftedBallCount = value;
        this.onReset();
      });

    this.gui.add(params, "reset");

    this.createStatusPanel();
  }

  setControllerValues(values) {
    Object.entries(values).forEach(([key, value]) => {
      if (this.controllers[key]) {
        this.controllers[key].setValue(value);
      }
    });
  }

  createStatusPanel() {
    this.panelWrapper = document.createElement("div");
    this.panelWrapper.style.position = "fixed";
    this.panelWrapper.style.left = "16px";
    this.panelWrapper.style.top = "16px";
    this.panelWrapper.style.zIndex = "1000";
    this.panelWrapper.style.display = "flex";
    this.panelWrapper.style.flexDirection = "column";
    this.panelWrapper.style.gap = "8px";

    this.panel = document.createElement("div");
    this.panel.style.width = "300px";
    this.panel.style.padding = "12px 14px";
    this.panel.style.borderRadius = "14px";
    this.panel.style.background = "rgba(10, 18, 32, 0.9)";
    this.panel.style.color = "#e2e8f0";
    this.panel.style.fontFamily = "Arial, sans-serif";
    this.panel.style.fontSize = "13px";
    this.panel.style.lineHeight = "1.45";
    this.panel.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.28)";
    this.panel.style.backdropFilter = "blur(10px)";
    this.panel.style.border = "1px solid rgba(148, 163, 184, 0.28)";

    const titleRow = document.createElement("div");
    titleRow.style.display = "flex";
    titleRow.style.justifyContent = "space-between";
    titleRow.style.alignItems = "center";
    titleRow.style.marginBottom = "8px";

    const title = document.createElement("div");
    title.textContent = "Physics Status";
    title.style.fontWeight = "700";
    titleRow.appendChild(title);

    this.panel.appendChild(titleRow);

    this.statusContent = document.createElement("div");
    this.panel.appendChild(this.statusContent);

    this.graphCanvas = document.createElement("canvas");
    this.graphCanvas.width = 270;
    this.graphCanvas.height = 90;
    this.graphCanvas.style.width = "100%";
    this.graphCanvas.style.marginTop = "8px";
    this.graphCanvas.style.borderRadius = "8px";
    this.graphCanvas.style.background = "rgba(15, 23, 42, 0.55)";
    this.panel.appendChild(this.graphCanvas);

    document.body.appendChild(this.panelWrapper);

    const buttonRow = document.createElement("div");
    buttonRow.style.display = "flex";
    buttonRow.style.gap = "8px";
    buttonRow.style.flexWrap = "wrap";

    this.toggleButton = document.createElement("button");
    this.toggleButton.textContent = "Hide Status";
    this.toggleButton.style.padding = "8px 10px";
    this.toggleButton.style.borderRadius = "999px";
    this.toggleButton.style.border = "none";
    this.toggleButton.style.background = "#38bdf8";
    this.toggleButton.style.color = "white";
    this.toggleButton.style.cursor = "pointer";
    this.toggleButton.addEventListener("click", () => this.togglePanel());

    this.pauseButton = document.createElement("button");
    this.pauseButton.textContent = "Pause";
    this.pauseButton.style.padding = "8px 10px";
    this.pauseButton.style.borderRadius = "999px";
    this.pauseButton.style.border = "none";
    this.pauseButton.style.background = "#f59e0b";
    this.pauseButton.style.color = "white";
    this.pauseButton.style.cursor = "pointer";
    this.pauseButton.addEventListener("click", () => this.onPauseToggle?.());

    this.resetButton = document.createElement("button");
    this.resetButton.textContent = "Reset Values";
    this.resetButton.style.padding = "8px 10px";
    this.resetButton.style.borderRadius = "999px";
    this.resetButton.style.border = "none";
    this.resetButton.style.background = "#ef4444";
    this.resetButton.style.color = "white";
    this.resetButton.style.cursor = "pointer";
    this.resetButton.addEventListener("click", () => this.onResetDefaults?.());

    buttonRow.appendChild(this.toggleButton);
    buttonRow.appendChild(this.pauseButton);
    buttonRow.appendChild(this.resetButton);
    this.panelWrapper.appendChild(buttonRow);
    this.panelWrapper.appendChild(this.panel);
  }

  togglePanel() {
    this.visible = !this.visible;
    this.panel.style.display = this.visible ? "block" : "none";
    this.toggleButton.textContent = this.visible
      ? "Hide Status"
      : "Show Status";
  }

  updateStatus(state) {
    if (!this.statusContent) return;
    this.graphValues.push(state.velocity);
    if (this.graphValues.length > 40) this.graphValues.shift();

    const metricRows = [
      { label: "Velocity", value: state.velocity.toFixed(3), color: "#38bdf8" },
      { label: "Momentum", value: state.momentum.toFixed(3), color: "#34d399" },
      { label: "Collisions", value: state.collisions, color: "#f59e0b" },
      {
        label: "Energy Transfer",
        value: state.energyTransfer.toFixed(3),
        color: "#f472b6",
      },
      { label: "Active Ball", value: state.activeBall, color: "#a78bfa" },
      { label: "Damping", value: state.damping.toFixed(3), color: "#f87171" },
      {
        label: "Gravity",
        value: state.gravity?.toFixed(2) ?? "-",
        color: "#22d3ee",
      },
      {
        label: "Restitution",
        value: state.restitution?.toFixed(2) ?? "-",
        color: "#fb923c",
      },
      { label: "Ball Count", value: state.ballCount ?? "-", color: "#c084fc" },
      {
        label: "Ball Radius",
        value: state.ballRadius?.toFixed(2) ?? "-",
        color: "#fde68a",
      },
      { label: "Mass", value: state.mass?.toFixed(2) ?? "-", color: "#86efac" },
      {
        label: "Launch Angle",
        value: state.initialLaunchAngle?.toFixed(2) ?? "-",
        color: "#93c5fd",
      },
      {
        label: "Lifted Balls",
        value: state.liftedBallCount ?? "-",
        color: "#fda4af",
      },
      {
        label: "Avg Angle",
        value: state.averageAngle?.toFixed(3) ?? "-",
        color: "#f9a8d4",
      },
      {
        label: "Avg Omega",
        value: state.averageAngularVelocity?.toFixed(3) ?? "-",
        color: "#a7f3d0",
      },
      {
        label: "Contact Dist",
        value: state.contactDistance?.toFixed(3) ?? "-",
        color: "#fde68a",
      },
    ];

    this.statusContent.innerHTML = metricRows
      .map(
        (row) => `
          <div style="display:flex; justify-content:space-between; margin:4px 0; gap:10px;">
            <span>${row.label}</span>
            <span style="color:${row.color}; font-weight:700;">${row.value}</span>
          </div>
        `,
      )
      .join("");

    this.drawGraph();
  }

  drawGraph() {
    if (!this.graphCanvas) return;
    const ctx = this.graphCanvas.getContext("2d");
    if (!ctx) return;

    const width = this.graphCanvas.width;
    const height = this.graphCanvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
    ctx.lineWidth = 1;
    ctx.fillStyle = "rgba(148, 163, 184, 0.12)";
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 4; i += 1) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.beginPath();
    this.graphValues.forEach((value, index) => {
      const x = (index / (this.graphValues.length - 1)) * width;
      const y =
        height - (value / Math.max(1, Math.max(...this.graphValues))) * height;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "11px Arial";
    ctx.fillText("Velocity trend", 8, 14);
  }
}
