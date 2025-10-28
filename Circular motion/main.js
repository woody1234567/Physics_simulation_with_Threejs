import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";

let size = 0.5;
let v0 = 10;
let R = 5;
let dt = 0.001;
let t = 0;
let isRunning = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x008080);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(10, 10, 15);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 光源
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);

// 地板
const floorGeometry = new THREE.BoxGeometry(4 * R, 0.05, 4 * R);
const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x0077ff });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.position.y = -size;
scene.add(floor);

// 球
const ballGeometry = new THREE.SphereGeometry(size, 32, 32);
const ballMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
scene.add(ball);

// 軌跡
const trailMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
const trailPoints = [];
const trailGeometry = new THREE.BufferGeometry().setFromPoints(trailPoints);
const trailLine = new THREE.Line(trailGeometry, trailMaterial);
scene.add(trailLine);

// 向量箭頭
const arrowV = new THREE.ArrowHelper(
  new THREE.Vector3(0, 0, -1),
  ball.position,
  2,
  0x00ff00
);
const arrowA = new THREE.ArrowHelper(
  new THREE.Vector3(0, 0, 0),
  ball.position,
  2,
  0x0000ff
);
scene.add(arrowV);
scene.add(arrowA);

let v = new THREE.Vector3(0, 0, -v0);
let pos = new THREE.Vector3(R, size, 0);
ball.position.copy(pos);

// Chart.js 設定
const vtCtx = document.getElementById("vtChart").getContext("2d");
const atCtx = document.getElementById("atChart").getContext("2d");
let vtChart = new Chart(vtCtx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "速度大小 v (m/s)",
        data: [],
        borderColor: "#00ff00",
        borderWidth: 2,
        pointRadius: 0,
      },
    ],
  },
  options: {
    responsive: false,
    scales: {
      x: { title: { text: "時間 (s)", display: true } },
      y: { title: { text: "v (m/s)", display: true } },
    },
  },
});
let atChart = new Chart(atCtx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "向心加速度 a (m/s²)",
        data: [],
        borderColor: "#0000ff",
        borderWidth: 2,
        pointRadius: 0,
      },
    ],
  },
  options: {
    responsive: false,
    scales: {
      x: { title: { text: "時間 (s)", display: true } },
      y: { title: { text: "a (m/s²)", display: true } },
    },
  },
});

const info = document.getElementById("info");

// UI 控制
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const radiusInput = document.getElementById("radiusInput");
const velocityInput = document.getElementById("velocityInput");

startBtn.addEventListener("click", () => {
  R = parseFloat(radiusInput.value);
  v0 = parseFloat(velocityInput.value);
  resetSimulation();
  isRunning = true;
});
pauseBtn.addEventListener("click", () => (isRunning = !isRunning));
resetBtn.addEventListener("click", resetSimulation);

function resetSimulation() {
  pos.set(R, size, 0);
  v.set(0, 0, -v0);
  t = 0;
  trailPoints.length = 0;
  vtChart.data.labels = [];
  vtChart.data.datasets[0].data = [];
  atChart.data.labels = [];
  atChart.data.datasets[0].data = [];
  vtChart.update();
  atChart.update();
  isRunning = false;
}

// 動畫主迴圈
function animate() {
  requestAnimationFrame(animate);

  if (isRunning) {
    const axis = new THREE.Vector3(0, size, 0).sub(pos);
    const a = axis.normalize().multiplyScalar(v.lengthSq() / R);
    v.addScaledVector(a, dt);
    pos.addScaledVector(v, dt);
    t += dt;

    ball.position.copy(pos);
    arrowV.position.copy(pos);
    arrowA.position.copy(pos);
    arrowV.setDirection(v.clone().normalize());
    arrowV.setLength(1.5);
    arrowA.setDirection(a.clone().normalize());
    arrowA.setLength(1.5);

    // 更新軌跡
    trailPoints.push(pos.clone());
    if (trailPoints.length > 2000) trailPoints.shift();
    trailGeometry.setFromPoints(trailPoints);

    // 更新圖表
    vtChart.data.labels.push(t.toFixed(2));
    vtChart.data.datasets[0].data.push(v.length());
    atChart.data.labels.push(t.toFixed(2));
    atChart.data.datasets[0].data.push(a.length());
    if (vtChart.data.labels.length > 300) {
      vtChart.data.labels.shift();
      vtChart.data.datasets[0].data.shift();
      atChart.data.labels.shift();
      atChart.data.datasets[0].data.shift();
    }
    vtChart.update("none");
    atChart.update("none");

    info.innerHTML = `t = ${t.toFixed(2)} s<br>v = ${v
      .length()
      .toFixed(2)} m/s<br>a = ${a.length().toFixed(2)} m/s²`;
  }

  renderer.render(scene, camera);
}

resetSimulation();
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
