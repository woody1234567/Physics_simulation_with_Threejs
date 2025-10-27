import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";

// === 1. 參數設定 ===
const size = 1;
let h = 15;
let g = 9.8;
let t = 0;
const dt = 0.01;
let isFalling = false; // 等待使用者點擊 Start 後才開始

// === 2. 建立場景 ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x008080);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 15, 50);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 地板
const floorGeometry = new THREE.BoxGeometry(40, 0.01, 40);
const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x0000ff });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.position.set(0, 0, 0);
scene.add(floor);

// 球
const ballGeometry = new THREE.SphereGeometry(size, 32, 32);
const ballMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.position.set(0, h, 0);
scene.add(ball);

// 光源
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 25, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// === 3. 模擬運動 ===
const velocity = new THREE.Vector3(0, 0, 0);
const acceleration = new THREE.Vector3(0, -g, 0);
const floorY = 0;

const info = document.getElementById("info");

// 取得 UI 元素
const heightInput = document.getElementById("heightInput");
const gravityInput = document.getElementById("gravityInput");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

function validateAndReadInputs() {
  const hVal = parseFloat(heightInput?.value ?? "");
  const gVal = parseFloat(gravityInput?.value ?? "");
  if (!isFinite(hVal) || hVal <= 0) {
    alert("請輸入正確的高度 h (> 0)");
    return null;
  }
  if (!isFinite(gVal) || gVal <= 0) {
    alert("請輸入正確的重力加速度 g (> 0)");
    return null;
  }
  return { h: hVal, g: gVal };
}

function resetSimulation(newH, newG) {
  h = newH;
  g = newG;
  t = 0;
  isFalling = false;
  velocity.set(0, 0, 0);
  acceleration.set(0, -g, 0);
  ball.position.set(0, h, 0);
  info.innerHTML = `t = ${t.toFixed(3)} s<br>y = ${ball.position.y.toFixed(
    3
  )} m <br> v = ${velocity.y.toFixed(3)} m/s`;
}

function startSimulation() {
  isFalling = true;
}

function animate() {
  requestAnimationFrame(animate);

  if (isFalling) {
    velocity.addScaledVector(acceleration, dt);
    ball.position.addScaledVector(velocity, dt);
    t += dt;

    // 碰撞檢查
    if (ball.position.y - floorY <= size + 0.005) {
      ball.position.y = size + 0.005;
      isFalling = false;
    }

    info.innerHTML = `t = ${t.toFixed(3)} s<br>y = ${ball.position.y.toFixed(
      3
    )} m <br> v = ${velocity.y.toFixed(3)} m/s`;
  }

  renderer.render(scene, camera);
}

// 綁定事件
if (startBtn && restartBtn && heightInput && gravityInput) {
  startBtn.addEventListener("click", () => {
    const vals = validateAndReadInputs();
    if (!vals) return;
    resetSimulation(vals.h, vals.g);
    startSimulation();
  });

  restartBtn.addEventListener("click", () => {
    const vals = validateAndReadInputs();
    if (!vals) return;
    resetSimulation(vals.h, vals.g);
    startSimulation();
  });
}

// 初始化畫面（不自動下落，等待 Start）
resetSimulation(h, g);
animate();

// 視窗縮放自適應
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
