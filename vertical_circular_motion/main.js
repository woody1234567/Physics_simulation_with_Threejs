import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";

const size = 0.5;
let R = 5;
let g = 9.8;
let k = 1;
let v0 = k * Math.sqrt(g * R);
const dt = 0.01;
let t = 0;
let i = 0;
let running = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 球與中心、繩子
const ballGeometry = new THREE.SphereGeometry(size, 32, 32);
const ballMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.position.set(0, R, 0);
scene.add(ball);

const center = new THREE.CylinderGeometry(0.05 * size, 0.05 * size, 0.5, 16);
const centerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const centerMesh = new THREE.Mesh(center, centerMat);
scene.add(centerMesh);

// 將繩子的基礎幾何高度設為 1，之後用 scale 依距離調整
const ropeGeom = new THREE.CylinderGeometry(0.05, 0.05, 1, 16);
const ropeMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const rope = new THREE.Mesh(ropeGeom, ropeMat);
scene.add(rope);

// 光源
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// 箭頭
const arrowV = new THREE.ArrowHelper(
  new THREE.Vector3(),
  ball.position,
  1,
  0x00ff00
);
const arrowA = new THREE.ArrowHelper(
  new THREE.Vector3(),
  ball.position,
  1,
  0x0000ff
);
scene.add(arrowV);
scene.add(arrowA);

// 向量變數
let velocity = new THREE.Vector3(-v0, 0, 0);
let acceleration = new THREE.Vector3();

// ====== Chart.js 設定 ======
const vtCtx = document.getElementById("vtChart").getContext("2d");
const atCtx = document.getElementById("atChart").getContext("2d");
let vtChart, atChart;
let times = [],
  vData = [],
  atData = [],
  anData = [];

function initCharts() {
  if (vtChart) vtChart.destroy();
  if (atChart) atChart.destroy();

  vtChart = new Chart(vtCtx, {
    type: "line",
    data: {
      datasets: [
        {
          label: "v (m/s)",
          borderColor: "#00ff00",
          data: [],
          borderWidth: 2,
          pointRadius: 0,
        },
      ],
    },
    options: { scales: { x: { type: "linear" } }, animation: false },
  });

  atChart = new Chart(atCtx, {
    type: "line",
    data: {
      datasets: [
        {
          label: "aₜ (m/s²)",
          borderColor: "#ff0000",
          data: [],
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: "aₙ (m/s²)",
          borderColor: "#0000ff",
          data: [],
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    },
    options: { scales: { x: { type: "linear" } }, animation: false },
  });
}

// ====== 計算函式 ======
function findAn(v, pos) {
  const an = pos
    .clone()
    .normalize()
    .multiplyScalar(-v.lengthSq() / R);
  return an;
}

function findAt(pos) {
  const x = pos.x;
  const y = pos.y;
  const r = Math.sqrt(x ** 2 + y ** 2);
  const sinTheta = Math.abs(x) / r;
  const cosTheta = Math.abs(y) / r;
  const absAt = g * sinTheta;
  const aty = -absAt * sinTheta;
  let atx;
  if ((x <= 0 && y <= 0) || (x >= 0 && y >= 0)) atx = absAt * cosTheta;
  else atx = -absAt * cosTheta;
  return new THREE.Vector3(atx, aty, 0);
}

// ====== 重設 ======
function resetSim() {
  // 從 UI 讀入最新參數
  if (typeof kInput !== "undefined" && kInput) {
    const kv = parseFloat(kInput.value);
    if (!isNaN(kv) && kv > 0) k = kv;
  }
  if (typeof rInput !== "undefined" && rInput) {
    const rv = parseFloat(rInput.value);
    if (!isNaN(rv) && rv > 0) R = rv;
  }
  if (typeof gInput !== "undefined" && gInput) {
    const gv = parseFloat(gInput.value);
    if (!isNaN(gv) && gv > 0) g = gv;
  }
  t = 0;
  i = 0;
  running = false;
  v0 = k * Math.sqrt(g * R);
  velocity.set(-v0, 0, 0);
  ball.position.set(0, R, 0);
  times = [];
  vData = [];
  atData = [];
  anData = [];
  initCharts();
}

// ====== 動畫 ======
function animate() {
  requestAnimationFrame(animate);

  if (running && i < 5) {
    const xp = ball.position.x;
    const an = findAn(velocity, ball.position);
    const at = findAt(ball.position);
    acceleration.copy(an).add(at);
    velocity.addScaledVector(acceleration, dt);
    ball.position.addScaledVector(velocity, dt);
    const xc = ball.position.x;
    // rope.position.set(0, ball.position.y / 2, 0);
    // rope.scale.y = ball.position.length() / R;
    // rope.lookAt(ball.position);

    const dir = ball.position.clone().normalize();
    const dist = ball.position.length(); // 中心(0,0,0) 到球的距離
    rope.position.copy(ball.position).multiplyScalar(0.5); // 中點
    rope.scale.y = dist; // 幾何基礎高度 1，直接縮放到 dist
    rope.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0), // cylinder 的本地 Y 軸
      dir // 指向球的方向
    );

    if (xp > 0 && xc < 0) i++;

    arrowV.position.copy(ball.position);
    arrowA.position.copy(ball.position);
    arrowV.setDirection(velocity.clone().normalize());
    arrowA.setDirection(acceleration.clone().normalize());
    arrowV.setLength(velocity.length() * 0.1);
    arrowA.setLength(acceleration.length() * 0.05);

    times.push(t);
    vData.push({ x: t, y: velocity.length() });
    atData.push({ x: t, y: findAt(ball.position).length() });
    anData.push({ x: t, y: findAn(velocity, ball.position).length() });

    if (vtChart && atChart) {
      vtChart.data.datasets[0].data = vData;
      atChart.data.datasets[0].data = atData;
      atChart.data.datasets[1].data = anData;
      vtChart.update("none");
      atChart.update("none");
    }

    t += dt;
  }

  renderer.render(scene, camera);
}

animate();
initCharts();

// ====== 事件綁定 ======
const kInput = document.getElementById("kInput");
const rInput = document.getElementById("rInput");
const gInput = document.getElementById("gInput");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");

startBtn.addEventListener("click", () => {
  resetSim();
  running = true;
});
pauseBtn.addEventListener("click", () => {
  running = !running;
  pauseBtn.textContent = running ? "Pause" : "Resume";
});
resetBtn.addEventListener("click", resetSim);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
