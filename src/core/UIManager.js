import { GUI } from "lil-gui";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

export class UIManager {
  constructor(onReset, onPauseToggle, onResetDefaults, dragController, resetCamera, onApplyInitialMotion, audioManager) {
    this.gui = new GUI();
    this.onReset = onReset;
    this.onPauseToggle = onPauseToggle;
    this.onResetDefaults = onResetDefaults;
    this.dragController = dragController;
    this.resetCamera = resetCamera;
    this.onApplyInitialMotion = onApplyInitialMotion;
    this.audioManager = audioManager; // Store AudioManager instance
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

    // per-ball "who's moving" bar chart state
    this.ballChart = null;
    this._ballChartCount = 0;
    this.ballMoveThreshold = 0.02; // m/s — below this a ball counts as "at rest" for highlighting
  }

  createControls(params) {
    // Initialize soundEnabled for the GUI params
    params.soundEnabled = this.audioManager ? this.audioManager.isEnabled() : true;

    // Simulation Parameters Folder
    const simFolder = this.gui.addFolder("إعدادات المحاكاة");

    this.controllers.gravity = simFolder
        .add(params, "gravity", 1, 20, 0.01)
        .name("الجاذبية")
        .onChange((value) => {
          params.gravity = value;
          this.onReset();
        });

    this.controllers.restitution = simFolder
        .add(params, "restitution", 0.1, 1.0, 0.01)
        .name("معامل الارتداد")
        .onChange((value) => {
          params.restitution = value;
          if (!params.infiniteMotion) {
            this._previousRestitution = value;
          }
          this.onReset();
        });

    this.controllers.infiniteMotion = simFolder
        .add(params, "infiniteMotion")
        .name("حركة لا نهائية (بدون تخميد)")
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
          "1 كرة": 1,
          "2 كرة": 2,
          "3 كرات": 3,
          "4 كرات": 4,
          "5 كرات": 5,
          "6 كرات": 6,
          "7 كرات": 7,
          "8 كرات": 8,
        })
        .name("عدد الكرات")
        .onChange((value) => {
          params.ballCount = value;
          this.onReset();
          // Update max for liftedBallCount
          this.controllers.liftedBallCount.max(value);
          if (params.liftedBallCount > value) {
            params.liftedBallCount = value;
            this.controllers.liftedBallCount.setValue(value);
          }
          this.controllers.liftedBallCount.updateDisplay();
        });

    this.controllers.ballRadius = simFolder
        .add(params, "ballRadius", 0.2, 0.8, 0.01)
        .name("نصف قطر الكرة")
        .onChange((value) => {
          params.ballRadius = value;
          this.onReset();
        });

    this.controllers.mass = simFolder
        .add(params, "mass", 0.5, 20, 0.1)
        .name("الكتلة")
        .onChange((value) => {
          params.mass = value;
          this.onReset();
        });

    this.controllers.initialLaunchAngle = simFolder
        .add(params, "initialLaunchAngle", -120, 0, 0.01)
        .name("زاوية الإطلاق الابتدائية")
        .onChange((value) => {
          params.initialLaunchAngle = value;
          // No onReset here, as we want to apply it explicitly
        });

    this.controllers.liftedBallCount = simFolder
        .add(params, "liftedBallCount", 1, params.ballCount, 1) // Set max dynamically
        .name("عدد الكرات المرفوعة")
        .onChange((value) => {
          params.liftedBallCount = value;
          // No onReset here, as we want to apply it explicitly
        });

    // New button to apply the chosen angle
    simFolder.add({ applyAngle: () => this.onApplyInitialMotion() }, 'applyAngle').name('تطبيق الزاوية والإطلاق');

    simFolder.open(); // Open simulation parameters by default

    // Display Options Folder
    const displayFolder = this.gui.addFolder("خيارات العرض");
    this.controllers.dragEnabled = displayFolder
        .add(params, "dragEnabled")
        .name("تفعيل سحب الكرة")
        .onChange((value) => {
          this.dragController.setEnabled(value);
        });

    // Sound toggle checkbox
    if (this.audioManager) {
      this.controllers.soundEnabled = displayFolder
        .add(params, "soundEnabled")
        .name("تفعيل الصوت")
        .onChange((value) => {
          this.audioManager.toggleMute();
        });
    }
    displayFolder.add({ resetCamera: () => this.resetCamera() }, 'resetCamera').name('إعادة ضبط الكاميرا');


    displayFolder.open(); // Open display options by default

    this.gui.add(params, "reset").name("إعادة تشغيل المحاكاة");

    this.createStatusPanel();

    if (params.infiniteMotion) {
      this.controllers.restitution.disable();
    }
    this.dragController.setEnabled(params.dragEnabled);
  }

  setControllerValues(values) {
    // Bulk restore: sync every controller's DISPLAYED value only. We
    // deliberately do NOT let each controller fire its own onChange here.
    // Each onChange also triggers a full physics reset, so calling all of
    // them back-to-back used to mean up to ~7 redundant resets per click,
    // and — worse — a real bug: `restitution`'s onChange ran before
    // `infiniteMotion`'s (object key order), so if Infinite Motion had
    // been left on, restitution's handler didn't know infiniteMotion was
    // about to turn off and skipped refreshing `_previousRestitution`.
    // infiniteMotion's handler then immediately overwrote the correctly
    // reset restitution value with that stale cached number — restitution
    // silently failed to reset whenever Infinite Motion had been toggled
    // on. The caller already does one authoritative params.reset() right
    // after this call, so no controller needs to trigger physics here.
    Object.entries(values).forEach(([key, value]) => {
      if (this.controllers[key]) {
        this.controllers[key].setValue(value);
        this.controllers[key].updateDisplay();
      }
    });

    // Keep restitution's "what to restore when infinite motion turns
    // off" baseline in sync with the values actually being restored,
    // instead of whatever was cached from before this reset.
    if ('restitution' in values) {
      this._previousRestitution = values.restitution;
    }

    if ('infiniteMotion' in values) {
      if (values.infiniteMotion) {
        this.controllers.restitution?.disable();
      } else {
        this.controllers.restitution?.enable();
      }
    }

    if ('dragEnabled' in values) {
      this.dragController.setEnabled(values.dragEnabled);
    }

    // After setting ballCount, update liftedBallCount's max
    if ('ballCount' in values && this.controllers.liftedBallCount) {
      this.controllers.liftedBallCount.max(values.ballCount);
      if (params.liftedBallCount > values.ballCount) {
        params.liftedBallCount = values.ballCount;
        this.controllers.liftedBallCount.setValue(values.ballCount);
      }
      this.controllers.liftedBallCount.updateDisplay();
    }

    // Update soundEnabled checkbox if audioManager exists
    if ('soundEnabled' in values && this.controllers.soundEnabled && this.audioManager) {
      this.audioManager.enabled = values.soundEnabled;
      this.controllers.soundEnabled.setValue(values.soundEnabled);
    }
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
    title.textContent = "حالة الفيزياء";
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

    // small label + canvas for the per-ball activity chart, so you
    // can see at a glance which ball(s) are actually swinging right now.
    const ballChartLabel = document.createElement("div");
    ballChartLabel.textContent = "نشاط الكرات";
    ballChartLabel.style.fontSize = "11px";
    ballChartLabel.style.color = "#94a3b8";
    ballChartLabel.style.margin = "10px 0 4px";
    this.panel.appendChild(ballChartLabel);

    const ballChartWrap = document.createElement("div");
    ballChartWrap.style.position = "relative";
    ballChartWrap.style.height = "70px";
    ballChartWrap.style.borderRadius = "8px";
    ballChartWrap.style.overflow = "hidden";
    ballChartWrap.style.background = "rgba(15, 23, 42, 0.55)";

    this.ballActivityCanvas = document.createElement("canvas");
    ballChartWrap.appendChild(this.ballActivityCanvas);
    this.panel.appendChild(ballChartWrap);

    document.body.appendChild(this.panelWrapper);

    const buttonRow = document.createElement("div");
    buttonRow.style.display = "flex";
    buttonRow.style.gap = "8px";
    buttonRow.style.flexWrap = "wrap";

    this.toggleButton = document.createElement("button");
    this.toggleButton.textContent = "إخفاء الحالة";
    this.toggleButton.style.padding = "8px 10px";
    this.toggleButton.style.borderRadius = "999px";
    this.toggleButton.style.border = "none";
    this.toggleButton.style.background = "#38bdf8";
    this.toggleButton.style.color = "white";
    this.toggleButton.style.cursor = "pointer";
    this.toggleButton.addEventListener("click", () => this.togglePanel());

    this.pauseButton = document.createElement("button");
    this.pauseButton.textContent = "إيقاف مؤقت";
    this.pauseButton.style.padding = "8px 10px";
    this.pauseButton.style.borderRadius = "999px";
    this.pauseButton.style.border = "none";
    this.pauseButton.style.background = "#f59e0b";
    this.pauseButton.style.color = "white";
    this.pauseButton.style.cursor = "pointer";
    this.pauseButton.addEventListener("click", () => this.onPauseToggle?.());

    this.resetButton = document.createElement("button");
    this.resetButton.textContent = "إعادة ضبط القيم";
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
            label: "السرعة",
            data: [...this.velocityHistory],
            borderColor: "#38bdf8",
            backgroundColor: "rgba(56,189,248,0.12)",
            borderWidth: 1.5,
            pointRadius: 0,
            fill: true,
            tension: 0.35,
          },
          {
            label: "الزخم",
            data: [...this.momentumHistory],
            borderColor: "#34d399",
            backgroundColor: "rgba(52,211,153,0.08)",
            borderWidth: 1.5,
            pointRadius: 0,
            fill: true,
            tension: 0.35,
          },
          {
            label: "الطاقة الكلية",
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

  // bar chart with one bar per ball. Rebuilt whenever ball count
  // changes (since Chart.js can't cleanly resize a dataset's category
  // axis in place).
  _initBallChart(count) {
    if (this.ballChart) {
      this.ballChart.destroy();
    }
    const labels = Array.from({ length: count }, (_, i) => `كرة ${i + 1}`);

    this.ballChart = new Chart(this.ballActivityCanvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "|السرعة| (م/ث)",
            data: Array(count).fill(0),
            backgroundColor: Array(count).fill("#334155"),
            borderRadius: 4,
          },
        ],
      },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(10,18,32,0.9)",
            titleColor: "#94a3b8",
            bodyColor: "#e2e8f0",
            borderColor: "rgba(148,163,184,0.2)",
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            ticks: { color: "#64748b", font: { size: 9 } },
            grid: { display: false },
          },
          y: { display: false, beginAtZero: true },
        },
      },
    });
    this._ballChartCount = count;
  }

  togglePanel() {
    this.visible = !this.visible;
    this.panel.style.display = this.visible ? "block" : "none";
    this.toggleButton.textContent = this.visible
        ? "إخفاء الحالة"
        : "إظهار الحالة";
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
    const ballVelocities = state.ballVelocities ?? [];
    const ballAngles = state.ballAngles ?? []; // per-ball angles, if PhysicsEngine.getStatus() provides them

    this._push(this.velocityHistory, velocity);
    this._push(this.momentumHistory, momentum);
    this._push(this.energyHistory, totalEnergy);

    // keep the per-ball chart in sync (rebuild only if ball count
    // changed) and color each bar based on whether that ball is actually
    // moving right now.
    if (ballVelocities.length) {
      if (!this.ballChart || this._ballChartCount !== ballVelocities.length) {
        this._initBallChart(ballVelocities.length);
      }
      const ds = this.ballChart.data.datasets[0];
      ds.data = ballVelocities.map((v) => Math.abs(v));
      ds.backgroundColor = ballVelocities.map((v) =>
          Math.abs(v) > this.ballMoveThreshold ? "#38bdf8" : "#334155",
      );
      this.ballChart.update("none");
    }

    const movingBalls = ballVelocities
        .map((v, i) => (Math.abs(v) > this.ballMoveThreshold ? i + 1 : null))
        .filter((n) => n !== null);

    // Only real, dynamically-computed physics quantities here — config
    // values (gravity, restitution, ball count, etc.) are already visible
    // and editable in the GUI sliders above, so showing them again here
    // added nothing.
    let metricRows = [
      { label: "السرعة (م/ث)", value: velocity.toFixed(3), color: "#38bdf8" },
      { label: "الزخم (كجم·م/ث)", value: momentum.toFixed(3), color: "#34d399" },
      { label: "الطاقة الحركية (ج)", value: kineticEnergy.toFixed(3), color: "#60a5fa" },
      { label: "طاقة الوضع (ج)", value: potentialEnergy.toFixed(3), color: "#fbbf24" },
      { label: "الطاقة الكلية (ج)", value: totalEnergy.toFixed(3), color: "#f472b6" },
      {
        label: "الطاقة المفقودة (هذا الإطار)",
        value: energyTransfer.toFixed(4),
        color: "#fb7185",
      },
      { label: "التصادمات", value: collisions, color: "#f59e0b" },
      {
        label: "الكرات المتحركة",
        value: movingBalls.length ? movingBalls.join(", ") : "—",
        color: "#38bdf8",
      },
    ];

    // Add individual ball angles
    ballAngles.forEach((angle, index) => {
      metricRows.push({
        label: `زاوية الكرة ${index + 1} (درجة)`,
        value: (angle * (180 / Math.PI)).toFixed(3),
        color: "#f9a8d4",
      });
    });

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