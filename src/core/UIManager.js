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
    this.massFolder = null; // New: Folder for individual mass controls
    this.massControllers = []; // New: Array to store individual mass controllers

    // Separate charts state
    this.velocityChart = null;
    this.momentumChart = null;
    this.energyChart = null;

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
        .name("الجاذبية (m/s²)")
        .onChange((value) => {
          params.gravity = value;
          this.onReset();
        });

    this.controllers.restitution = simFolder
        .add(params, "restitution", 0.00, 1.0, 0.01)
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
          // Ensure masses array is correctly sized and filled with default if new balls are added
          while (params.masses.length < value) {
            params.masses.push(10); // Default mass for new balls
          }
          params.masses.length = value; // Trim if ballCount decreased
          this.onReset();
          // Update max for liftedBallCount
          this.controllers.liftedBallCount.max(value);
          if (params.liftedBallCount > value) {
            params.liftedBallCount = value;
            this.controllers.liftedBallCount.setValue(value);
          }
          this.controllers.liftedBallCount.updateDisplay();
          this._createIndividualMassControls(params); // Recreate mass controls
        });

    this.controllers.ballRadius = simFolder
        .add(params, "ballRadius", 0.2, 0.8, 0.01)
        .name("نصف قطر الكرة (m)")
        .onChange((value) => {
          params.ballRadius = value;
          this.onReset();
        });

    this.controllers.initialLaunchAngle = simFolder
        .add(params, "initialLaunchAngle", -120, 0, 0.01)
        .name("زاوية الإطلاق الابتدائية")
        .onChange((value) => {
          params.initialLaunchAngle = value;
        });

    this.controllers.liftedBallCount = simFolder
        .add(params, "liftedBallCount", 1, params.ballCount, 1) // Set max dynamically
        .name("عدد الكرات المرفوعة")
        .onChange((value) => {
          params.liftedBallCount = value;
        });

    // New button to apply the chosen angle
    simFolder.add({ applyAngle: () => this.onApplyInitialMotion() }, 'applyAngle').name('تطبيق الزاوية والإطلاق');

    simFolder.open(); // Open simulation parameters by default

    // New: Create individual mass controls
    this._createIndividualMassControls(params);

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

  // New method to create/update individual mass controls
  _createIndividualMassControls(params) {
    // Clear existing mass controllers and folder
    if (this.massFolder) {
      this.gui.removeFolder(this.massFolder);
    }
    this.massControllers = [];

    this.massFolder = this.gui.addFolder("كتل الكرات الفردية (kg)");
    this.massFolder.open();

    for (let i = 0; i < params.ballCount; i++) {
      // Create a proxy object for each ball's mass to bind with lil-gui
      // This is necessary because lil-gui binds to properties of an object, not directly to array elements.
      const ballMassProxy = {
        mass: params.masses[i] !== undefined ? params.masses[i] : 10, // Use existing mass or default
      };

      // Update the actual masses array with the proxy's initial value if it was undefined
      // This ensures params.masses is consistent with what the controller is displaying
      params.masses[i] = ballMassProxy.mass;

      const controller = this.massFolder
          .add(ballMassProxy, "mass", 0.5, 20, 0.1)
          .name(`الكرة ${i + 1}`)
          .onChange((value) => {
            params.masses[i] = value; // Update the actual masses array
            this.onReset();
          });
      this.massControllers.push(controller);
    }
  }

  setControllerValues(values) {
    // Update general controllers
    Object.entries(values).forEach(([key, value]) => {
      if (this.controllers[key]) {
        this.controllers[key].setValue(value);
        this.controllers[key].updateDisplay();
      }
    });

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

    // Handle ballCount changes and recreate mass controls
    if ('ballCount' in values) {
      // Ensure params.masses is correctly sized and populated based on the new ballCount
      // This is crucial before _createIndividualMassControls uses it.
      while (params.masses.length < values.ballCount) {
        params.masses.push(10); // Default mass for new balls
      }
      params.masses.length = values.ballCount; // Trim if ballCount decreased
      // Now, copy the masses from 'values' (defaults) into the main 'params.masses'
      for (let i = 0; i < values.ballCount; i++) {
        params.masses[i] = values.masses[i] !== undefined ? values.masses[i] : 10;
      }

      // Recreate mass controls, binding them to the main 'params' object
      this._createIndividualMassControls(params);

      // Update liftedBallCount max and value
      this.controllers.liftedBallCount.max(values.ballCount);
      if (values.liftedBallCount > values.ballCount) {
        values.liftedBallCount = values.ballCount;
        this.controllers.liftedBallCount.setValue(values.ballCount);
      }
      this.controllers.liftedBallCount.updateDisplay();
    } else if ('masses' in values && this.massControllers.length > 0) {
      // If ballCount is NOT changing, but masses are (e.g., if we had a separate "reset masses" button)
      // Then update the existing individual mass controllers
      values.masses.forEach((mass, index) => {
        if (this.massControllers[index]) {
          // Update the proxy object's value and then the controller
          this.massControllers[index].object.mass = mass;
          this.massControllers[index].setValue(mass);
          this.massControllers[index].updateDisplay();
        }
      });
    }


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
    this.panel.style.maxHeight = "90vh"; // Safety bound if screen is small
    this.panel.style.overflowY = "auto"; // Scrollable if needed

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

    // --- Helper to create individual small charts ---
    const createMiniChartWrap = (titleText) => {
      const wrap = document.createElement("div");
      wrap.style.position = "relative";
      wrap.style.height = "50px"; // Smaller height for individual charts (changed from 65px)
      wrap.style.marginTop = "8px";
      wrap.style.borderRadius = "8px";
      wrap.style.overflow = "hidden";
      wrap.style.background = "rgba(15, 23, 42, 0.55)";

      const label = document.createElement("div");
      label.textContent = titleText;
      label.style.position = "absolute";
      label.style.top = "4px";
      label.style.right = "8px"; // RTL alignment
      label.style.fontSize = "10px";
      label.style.color = "#94a3b8";
      label.style.zIndex = "10";
      label.style.pointerEvents = "none";
      wrap.appendChild(label);

      const canvas = document.createElement("canvas");
      wrap.appendChild(canvas);
      this.panel.appendChild(wrap);
      return canvas;
    };

    // Create 3 independent canvases
    this.velocityCanvas = createMiniChartWrap("السرعة (m/s)");
    this.momentumCanvas = createMiniChartWrap("الزخم (kg·m/s)");
    this.energyCanvas = createMiniChartWrap("الطاقة الكلية (J)");

    this._initCharts(); // Initialize the 3 charts

    // Bar chart for individual ball activity
    const ballChartLabel = document.createElement("div");
    ballChartLabel.textContent = "نشاط الكرات";
    ballChartLabel.style.fontSize = "11px";
    ballChartLabel.style.color = "#94a3b8";
    ballChartLabel.style.margin = "10px 0 4px";
    this.panel.appendChild(ballChartLabel);

    const ballChartWrap = document.createElement("div");
    ballChartWrap.style.position = "relative";
    ballChartWrap.style.height = "50px"; // Smaller height for ball activity chart (changed from 70px)
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

  _initCharts() {
    const labels = Array.from({ length: this.historyLength }, (_, i) => i);

    // Generic function to create individual line charts
    const createLineChart = (canvas, dataArray, borderColor, bgColor) => {
      return new Chart(canvas, {
        type: "line",
        data: {
          labels,
          datasets: [{
            data: [...dataArray],
            borderColor: borderColor,
            backgroundColor: bgColor,
            borderWidth: 1.5,
            pointRadius: 0,
            fill: true,
            tension: 0.35,
          }],
        },
        options: {
          animation: false,
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: { top: 20 } // Space for the absolute title
          },
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
            x: { display: false },
            y: {
              display: true,
              grid: { color: "rgba(148,163,184,0.08)" },
              ticks: {
                color: "#475569",
                font: { size: 9 },
                maxTicksLimit: 3, // Keep the Y-axis clean
              },
            },
          },
        },
      });
    };

    this.velocityChart = createLineChart(this.velocityCanvas, this.velocityHistory, "#38bdf8", "rgba(56,189,248,0.12)");
    this.momentumChart = createLineChart(this.momentumCanvas, this.momentumHistory, "#34d399", "rgba(52,211,153,0.08)");
    this.energyChart = createLineChart(this.energyCanvas, this.energyHistory, "#f472b6", "rgba(244,114,182,0.08)");
  }

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
            label: "|السرعة| (m/s)",
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
    const ballAngles = state.ballAngles ?? [];

    this._push(this.velocityHistory, velocity);
    this._push(this.momentumHistory, momentum);
    // Round totalEnergy to 2 decimal places before pushing to history
    this._push(this.energyHistory, parseFloat(totalEnergy.toFixed(2)));

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

    let metricRows = [
      { label: "السرعة (m/s)", value: velocity.toFixed(3), color: "#38bdf8" },
      { label: "الزخم (kg·m/s)", value: momentum.toFixed(3), color: "#34d399" },
      { label: "الطاقة الحركية (J)", value: kineticEnergy.toFixed(3), color: "#60a5fa" },
      { label: "طاقة الوضع (J)", value: potentialEnergy.toFixed(3), color: "#fbbf24" },
      // Changed to toFixed(2) for total energy
      { label: "الطاقة الكلية (J)", value: totalEnergy.toFixed(2), color: "#f472b6" },
      {
        label: "الطاقة المفقودة",
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

    ballAngles.forEach((angle, index) => {
      metricRows.push({
        label: `زاوية الكرة ${index + 1}`,
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

    this._updateCharts(); // Call the separated charts update
  }

  _push(arr, value) {
    arr.push(value);
    if (arr.length > this.historyLength) arr.shift();
  }

  _updateCharts() {
    if (this.velocityChart) {
      this.velocityChart.data.datasets[0].data = [...this.velocityHistory];
      this.velocityChart.update("none");
    }
    if (this.momentumChart) {
      this.momentumChart.data.datasets[0].data = [...this.momentumHistory];
      this.momentumChart.update("none");
    }
    if (this.energyChart) {
      this.energyChart.data.datasets[0].data = [...this.energyHistory];
      this.energyChart.update("none");
    }
  }
}