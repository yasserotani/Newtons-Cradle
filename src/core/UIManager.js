import { GUI } from "lil-gui";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

export class UIManager {
  constructor(onReset, onPauseToggle, onResetDefaults, dragController, resetCamera, onApplyInitialMotion) { // Added onApplyInitialMotion
    this.gui = new GUI();
    this.onReset = onReset;
    this.onPauseToggle = onPauseToggle;
    this.onResetDefaults = onResetDefaults;
    this.dragController = dragController;
    this.resetCamera = resetCamera;
    this.onApplyInitialMotion = onApplyInitialMotion; // Store the new callback
    this.panel = null;
    this.toggleButton = null;
    this.pauseButton = null;
    this.resetButton = null;
    this.visible = true;
    this.controllers = {};
    this.chart = null;
    this.historyLength = 60;
    this.velocityHistory = Array(this.historyLength).fill(0);
    this.momentumHistory = Array(this.historyLength).fill(0);
    this.energyHistory = Array(this.historyLength).fill(0);
    this._previousRestitution = 1.0;
  }

  createControls(params) {
    // Simulation Parameters Folder
    const simFolder = this.gui.addFolder("Simulation Parameters");

    this.controllers.gravity = simFolder
        .add(params, "gravity", 1, 20, 0.01)
        .onChange((value) => {
          params.gravity = value;
          this.onReset();
        });

    this.controllers.restitution = simFolder
        .add(params, "restitution", 0.1, 1.0, 0.01)
        .onChange((value) => {
          params.restitution = value;
          if (!params.infiniteMotion) {
            this._previousRestitution = value;
          }
          this.onReset();
        });

    this.controllers.infiniteMotion = simFolder
        .add(params, "infiniteMotion")
        .name("Infinite Motion (No Damping)")
        .onChange((value) => {
          if (value) {
            this._previousRestitution = params.restitution;
            params.restitution = 1.0;
            this.controllers.restitution.setValue(1.0);
            this.controllers.restitution.disable();
          } else {
            params.restitution = this._previousRestitution;
            this.controllers.restitution.setValue(this._previousRestitution);
            this.controllers.restitution.enable();
          }
          this.onReset();
        });

    this.controllers.ballCount = simFolder
        .add(params, "ballCount", {
          "1   balls": 1,
          "2 balls": 2,
          "3 balls": 3,
          "4 balls": 4,
          "5 balls": 5,
          "6 balls": 6,
          "7 balls": 7,
          "8 balls": 8,
        })
        .onChange((value) => {
          params.ballCount = value;
          this.onReset();
        });

    this.controllers.ballRadius = simFolder
        .add(params, "ballRadius", 0.2, 0.8, 0.01)
        .onChange((value) => {
          params.ballRadius = value;
          this.onReset();
        });

    this.controllers.mass = simFolder
        .add(params, "mass", 0.5, 5, 0.1)
        .onChange((value) => {
          params.mass = value;
          this.onReset();
        });

    this.controllers.initialLaunchAngle = simFolder
        .add(params, "initialLaunchAngle", -3, 0, 0.01)
        .onChange((value) => {
          params.initialLaunchAngle = value;
          // No onReset here, as we want to apply it explicitly
        });

    this.controllers.liftedBallCount = simFolder
        .add(params, "liftedBallCount", 1, 4, 1)
        .onChange((value) => {
          params.liftedBallCount = value;
          // No onReset here, as we want to apply it explicitly
        });

    // New button to apply the chosen angle
    simFolder.add({ applyAngle: () => this.onApplyInitialMotion() }, 'applyAngle').name('Apply Angle ');


    simFolder.open(); // Open simulation parameters by default

    // Display Options Folder
    const displayFolder = this.gui.addFolder("Display Options");
    this.controllers.dragEnabled = displayFolder
        .add(params, "dragEnabled")
        .name("Enable Ball Drag")
        .onChange((value) => {
          this.dragController.setEnabled(value);
        });

    displayFolder.add({ resetCamera: () => this.resetCamera() }, 'resetCamera').name('Reset Camera View');

    displayFolder.open(); // Open display options by default

    this.gui.add(params, "reset").name("Reset Simulation"); // Rename default reset button

    this.createStatusPanel();

    if (params.infiniteMotion) {
      this.controllers.restitution.disable();
    }
    this.dragController.setEnabled(params.dragEnabled);
  }

  setControllerValues(values) {
    Object.entries(values).forEach(([key, value]) => {
      if (this.controllers[key]) {
        this.controllers[key].setValue(value);
        // Do not call _callOnChange for initialLaunchAngle and liftedBallCount
        // as they should not trigger a full reset on value change.
        if (key !== 'initialLaunchAngle' && key !== 'liftedBallCount') {
          this.controllers[key]._callOnChange(value);
        }

        if (key === 'infiniteMotion') {
          if (value) {
            this.controllers.restitution.disable();
          } else {
            this.controllers.restitution.enable();
          }
        }
        if (key === 'dragEnabled') {
          this.dragController.setEnabled(value);
        }
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

    const chartWrap = document.createElement("div");
    chartWrap.style.position = "relative";
    chartWrap.style.height = "110px";
    chartWrap.style.marginTop = "10px";
    chartWrap.style.borderRadius = "8px";
    chartWrap.style.overflow = "hidden";
    chartWrap.style.background = "rgba(15, 23, 42, 0.55)";

    this.graphCanvas = document.createElement("canvas");
    chartWrap.appendChild(this.graphCanvas);
    this.panel.appendChild(chartWrap);

    this._initChart();

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

  _initChart() {
    const labels = Array.from({ length: this.historyLength }, (_, i) => i);

    this.chart = new Chart(this.graphCanvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Velocity",
            data: [...this.velocityHistory],
            borderColor: "#38bdf8",
            backgroundColor: "rgba(56,189,248,0.12)",
            borderWidth: 1.5,
            pointRadius: 0,
            fill: true,
            tension: 0.35,
          },
          {
            label: "Momentum",
            data: [...this.momentumHistory],
            borderColor: "#34d399",
            backgroundColor: "rgba(52,211,153,0.08)",
            borderWidth: 1.5,
            pointRadius: 0,
            fill: true,
            tension: 0.35,
          },
          {
            label: "Total Energy",
            data: [...this.energyHistory],
            borderColor: "#f472b6",
            backgroundColor: "rgba(244,114,182,0.08)",
            borderWidth: 1.5,
            pointRadius: 0,
            fill: true,
            tension: 0.35,
          },
        ],
      },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: {
              color: "#94a3b8",
              boxWidth: 10,
              font: { size: 10 },
              padding: 8,
            },
          },
          tooltip: {
            backgroundColor: "rgba(10,18,32,0.9)",
            titleColor: "#94a3b8",
            bodyColor: "#e2e8f0",
            borderColor: "rgba(148,163,184,0.2)",
            borderWidth: 1,
          },
        },
        scales: {
          x: { display: false },
          y: {
            display: true,
            grid: { color: "rgba(148,163,184,0.08)" },
            ticks: {
              color: "#475569",
              font: { size: 10 },
              maxTicksLimit: 4,
            },
          },
        },
      },
    });
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

    const velocity = state.velocity ?? 0;
    const momentum = state.momentum ?? 0;
    const kineticEnergy = state.kineticEnergy ?? 0;
    const potentialEnergy = state.potentialEnergy ?? 0;
    const totalEnergy = state.totalEnergy ?? 0;
    const energyTransfer = state.energyTransfer ?? 0;
    const collisions = state.collisions ?? 0;

    this._push(this.velocityHistory, velocity);
    this._push(this.momentumHistory, momentum);
    this._push(this.energyHistory, totalEnergy);

    // Only real, dynamically-computed physics quantities here — config
    // values (gravity, restitution, ball count, etc.) are already visible
    // and editable in the GUI sliders above, so showing them again here
    // added nothing.
    const metricRows = [
      { label: "Velocity (m/s)", value: velocity.toFixed(3), color: "#38bdf8" },
      { label: "Momentum (kg·m/s)", value: momentum.toFixed(3), color: "#34d399" },
      { label: "Kinetic Energy (J)", value: kineticEnergy.toFixed(3), color: "#60a5fa" },
      { label: "Potential Energy (J)", value: potentialEnergy.toFixed(3), color: "#fbbf24" },
      { label: "Total Energy (J)", value: totalEnergy.toFixed(3), color: "#f472b6" },
      {
        label: "Energy Lost (this frame)",
        value: energyTransfer.toFixed(4),
        color: "#fb7185",
      },
      { label: "Collisions", value: collisions, color: "#f59e0b" },
      {
        label: "Avg Angle (rad)",
        value: state.averageAngle?.toFixed(3) ?? "-",
        color: "#f9a8d4",
      },
      {
        label: "Avg Angular Velocity (rad/s)",
        value: state.averageAngularVelocity?.toFixed(3) ?? "-",
        color: "#a7f3d0",
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

    this._updateChart();
  }

  _push(arr, value) {
    arr.push(value);
    if (arr.length > this.historyLength) arr.shift();
  }

  _updateChart() {
    if (!this.chart) return;
    this.chart.data.datasets[0].data = [...this.velocityHistory];
    this.chart.data.datasets[1].data = [...this.momentumHistory];
    this.chart.data.datasets[2].data = [...this.energyHistory];
    this.chart.update("none");
  }
}