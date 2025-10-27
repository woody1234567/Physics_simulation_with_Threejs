import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

// === 1. 參數設定 ===
const size = 1; // 小球半徑
const v0 = 5; // 初速大小 (m/s)
const h = 15; // 初始高度 (m)
const L = 50; // 地板長度 (m)
const g = 9.8; // 重力加速度 (m/s^2)
let i = 0; // 反彈次數
let dt = 0.01; // 時間步進 (s)
let time = 0; // 累積時間 (s)

// UI 參考
const angleInput = document.getElementById("angle");
const angleVal = document.getElementById("angleVal");
const eInput = document.getElementById("elasticity");
const eVal = document.getElementById("elasticityVal");
const restartBtn = document.getElementById("restart");
const info = document.getElementById("info");

// === 2. 畫面設定 ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x009999);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, h, 40);
camera.lookAt(0, h / 2, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 光源
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// 地板
const floorGeo = new THREE.BoxGeometry(L, 0.2, 10);
const floorMat = new THREE.MeshStandardMaterial({
  color: 0x8888ff,
  metalness: 0.6,
  roughness: 0.3,
});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.position.set(0, -size, 0);
scene.add(floor);

// 小球
const ballGeo = new THREE.SphereGeometry(size, 32, 32);
const ballMat = new THREE.MeshStandardMaterial({
  color: 0xff0000,
  metalness: 0.4,
  roughness: 0.5,
});
const ball = new THREE.Mesh(ballGeo, ballMat);
scene.add(ball);

// 動力學量
let v = new THREE.Vector3();
const a = new THREE.Vector3(0, -g, 0);

// === 軌跡線 (make_trail) ===
const trailPoints = [];
const trailGeometry = new THREE.BufferGeometry();
const trailMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
const trailLine = new THREE.Line(trailGeometry, trailMaterial);
scene.add(trailLine);

// 工具：重置模擬，以目前 UI 設定重新開始
function resetSimulation() {
  i = 0;
  time = 0;
  // UI 值
  const angleDeg = parseFloat(angleInput.value);
  const angleRad = (angleDeg * Math.PI) / 180;
  // 設定初始位置與速度
  ball.position.set(-L / 2, h, 0);
  v.set(v0 * Math.cos(angleRad), v0 * Math.sin(angleRad), 0);
  // 清除軌跡
  trailPoints.length = 0;
  trailGeometry.setFromPoints([]);
  // 更新 UI 顯示
  angleVal.textContent = `${angleDeg}°`;
  eVal.textContent = parseFloat(eInput.value).toFixed(2);
  updateInfo();
}

// === 3. 模擬運動 ===
const clock = new THREE.Clock();

function updateInfo() {
  const speed = v.length();
  info.innerHTML = `t = ${time.toFixed(3)} s<br />x = ${ball.position.x.toFixed(
    3
  )} m<br />y = ${ball.position.y.toFixed(3)} m<br />v = ${speed.toFixed(
    3
  )} m/s`;
}

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getDelta();

  // 物理更新
  v.addScaledVector(a, dt);
  ball.position.addScaledVector(v, dt);
  time += dt;

  // 反彈條件
  if (ball.position.y - floor.position.y <= size && v.y < 0) {
    i += 1;
    console.log(`Bounce ${i}: x = ${ball.position.x.toFixed(2)}`);
    // 彈性係數 (只作用於法向量 y 分量)
    const e = parseFloat(eInput.value);
    // 夾回地板表面，避免數值穿透
    ball.position.y = floor.position.y + size;
    v.y = -e * v.y;
  }

  // 軌跡更新
  trailPoints.push(ball.position.clone());
  if (trailPoints.length > 1000) trailPoints.shift();
  trailGeometry.setFromPoints(trailPoints);

  renderer.render(scene, camera);
  updateInfo();

  // 結束條件
  if (ball.position.x > L / 2) {
    console.log("Simulation finished");
    return;
  }
}

// 綁定 UI 事件
angleInput.addEventListener("input", () => {
  angleVal.textContent = `${parseFloat(angleInput.value)}°`;
});
eInput.addEventListener("input", () => {
  eVal.textContent = parseFloat(eInput.value).toFixed(2);
});
restartBtn.addEventListener("click", () => {
  resetSimulation();
});

// 初始啟動
resetSimulation();
animate();
