import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";

let v0 = 30;
let theta = (30 * Math.PI) / 180;
let g = 9.8;
const dt = 0.02;
let t = 0;
let isRunning = false;

const size = 1;
const L = 100;
let ball, scene, camera, renderer;
let velocity, acceleration;
let ytChart, xtChart;
let times = [],
  heights = [],
  distances = [];

init();
animate();

// === 初始化 ===
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x008080);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 20, 80);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 30, 20);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x404040));

  // 地板
  const floorGeo = new THREE.BoxGeometry(L, 0.01, 10);
  const floorMat = new THREE.MeshPhongMaterial({ color: 0x0000ff });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(0, -size, 0);
  scene.add(floor);

  // 球
  const ballGeo = new THREE.SphereGeometry(size, 32, 32);
  const ballMat = new THREE.MeshPhongMaterial({ color: 0xff0000 });
  ball = new THREE.Mesh(ballGeo, ballMat);
  ball.position.set(-L / 2, 0, 0);
  scene.add(ball);

  velocity = new THREE.Vector3(v0 * Math.cos(theta), v0 * Math.sin(theta), 0);
  acceleration = new THREE.Vector3(0, -g, 0);

  ensureCharts();
  updateInfo();

  // === 綁定事件 ===
  document.getElementById("startBtn").onclick = () => (isRunning = true);
  document.getElementById("pauseBtn").onclick = () => (isRunning = !isRunning);
  document.getElementById("resetBtn").onclick = () => resetSimulation();

  window.addEventListener("resize", onWindowResize);
}

// === 重設 ===
function resetSimulation() {
  const v0Input = parseFloat(document.getElementById("v0Input").value);
  const thetaInput = parseFloat(document.getElementById("thetaInput").value);
  const gInput = parseFloat(document.getElementById("gInput").value);
  if (!isFinite(v0Input) || v0Input <= 0) return alert("請輸入正確的初速");
  if (!isFinite(thetaInput)) return alert("請輸入正確的仰角");
  if (!isFinite(gInput) || gInput <= 0) return alert("請輸入正確的重力加速度");

  v0 = v0Input;
  theta = (thetaInput * Math.PI) / 180;
  g = gInput;

  t = 0;
  isRunning = false;

  ball.position.set(-L / 2, 0, 0);
  velocity.set(v0 * Math.cos(theta), v0 * Math.sin(theta), 0);
  acceleration.set(0, -g, 0);

  times = [0];
  heights = [0];
  distances = [0];
  ensureCharts(true);
  updateInfo();
}

// === 動畫迴圈 ===
function animate() {
  requestAnimationFrame(animate);

  if (isRunning) {
    velocity.addScaledVector(acceleration, dt);
    ball.position.addScaledVector(velocity, dt);
    t += dt;

    if (ball.position.y <= -size) {
      ball.position.y = -size;
      isRunning = false;
    }

    times.push(t);
    heights.push(Math.max(0, ball.position.y));
    distances.push(ball.position.x + L / 2);
    updateCharts();
    updateInfo();
  }

  renderer.render(scene, camera);
}

function updateInfo() {
  document.getElementById("info").innerHTML = `t = ${t.toFixed(2)} s<br>x = ${(
    ball.position.x +
    L / 2
  ).toFixed(2)} m<br>y = ${ball.position.y.toFixed(2)} m`;
}

// === Chart.js ===
function ensureCharts(reset = false) {
  const yctx = document.getElementById("ytChart").getContext("2d");
  const xctx = document.getElementById("xtChart").getContext("2d");

  const dataY = {
    label: "y(t)",
    data: [],
    borderColor: "#ff4081",
    borderWidth: 2,
  };
  const dataX = {
    label: "x(t)",
    data: [],
    borderColor: "#03a9f4",
    borderWidth: 2,
  };

  if (reset || !ytChart) {
    ytChart = new Chart(yctx, {
      type: "line",
      data: { datasets: [dataY] },
      options: {
        animation: false,
        scales: {
          x: { type: "linear", title: { display: true, text: "t (s)" } },
          y: { title: { display: true, text: "y (m)" }, min: 0 },
        },
      },
    });
  }
  if (reset || !xtChart) {
    xtChart = new Chart(xctx, {
      type: "line",
      data: { datasets: [dataX] },
      options: {
        animation: false,
        scales: {
          x: { type: "linear", title: { display: true, text: "t (s)" } },
          y: { title: { display: true, text: "x (m)" } },
        },
      },
    });
  }
}

function updateCharts() {
  if (!ytChart || !xtChart) return;
  ytChart.data.datasets[0].data = times.map((t, i) => ({
    x: t,
    y: heights[i],
  }));
  xtChart.data.datasets[0].data = times.map((t, i) => ({
    x: t,
    y: distances[i],
  }));
  ytChart.update("none");
  xtChart.update("none");
}

// === 螢幕縮放 ===
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
