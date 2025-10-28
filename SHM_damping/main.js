import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";

let m = 4;
let R = 5;
let k = 1;
let b = 0.3;
const size = 1;
let t = 0;
let dt = 0.02;
let isRunning = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x008080);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 5, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 光源與物件
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

const floor = new THREE.Mesh(
  new THREE.BoxGeometry(20, 0.2, 5),
  new THREE.MeshPhongMaterial({ color: 0x004488 })
);
floor.position.set(0, -size / 2, 0);
scene.add(floor);

const wall = new THREE.Mesh(
  new THREE.BoxGeometry(0.2, 4, 5),
  new THREE.MeshPhongMaterial({ color: 0x888888 })
);
wall.position.set(-10, 0, 0);
scene.add(wall);

const block = new THREE.Mesh(
  new THREE.BoxGeometry(size, size, size),
  new THREE.MeshPhongMaterial({ color: 0xffaa00 })
);
scene.add(block);

const spring = new THREE.Mesh(
  new THREE.CylinderGeometry(0.1, 0.1, 10, 16, 1, true),
  new THREE.MeshPhongMaterial({ color: 0xffff00, wireframe: true })
);
spring.rotation.z = Math.PI / 2;
scene.add(spring);

let v = 0,
  a = 0,
  x = R;
block.position.x = x;
updateSpring();

// 圖表
const xtChart = new Chart(
  document.getElementById("xtChart"),
  makeChartConfig("x(t)", "#2196f3")
);
const vtChart = new Chart(
  document.getElementById("vtChart"),
  makeChartConfig("v(t)", "#4caf50")
);
const atChart = new Chart(
  document.getElementById("atChart"),
  makeChartConfig("a(t)", "#e91e63")
);
const data = { time: [], x: [], v: [], a: [] };

function makeChartConfig(label, color) {
  return {
    type: "line",
    data: {
      datasets: [
        { label, data: [], borderColor: color, pointRadius: 0, borderWidth: 2 },
      ],
    },
    options: {
      animation: false,
      scales: {
        x: { type: "linear", min: 0, title: { display: true, text: "t(s)" } },
        y: { title: { display: true, text: label } },
      },
      plugins: { legend: { display: true } },
    },
  };
}

function updateSpring() {
  spring.position.set((block.position.x - 10) / 2, 0, 0);
  spring.scale.set(1, (block.position.x + 10) / 10, 1);
}

function resetSimulation() {
  t = 0;
  v = 0;
  x = R;
  block.position.x = x;
  updateSpring();
  data.time = [];
  data.x = [];
  data.v = [];
  data.a = [];
  updateCharts();
  document.getElementById("info").innerHTML = "Ready.";
}

function updateCharts() {
  xtChart.data.datasets[0].data = data.time.map((t, i) => ({
    x: t,
    y: data.x[i],
  }));
  vtChart.data.datasets[0].data = data.time.map((t, i) => ({
    x: t,
    y: data.v[i],
  }));
  atChart.data.datasets[0].data = data.time.map((t, i) => ({
    x: t,
    y: data.a[i],
  }));
  xtChart.update("none");
  vtChart.update("none");
  atChart.update("none");
}

function step() {
  const F = -k * x - b * v;
  a = F / m;
  v += a * dt;
  x += v * dt;
  block.position.x = x;
  updateSpring();
  t += dt;

  data.time.push(t);
  data.x.push(x);
  data.v.push(v);
  data.a.push(a);
  //   if (data.time.length > 1000) {
  //     data.time.shift();
  //     data.x.shift();
  //     data.v.shift();
  //     data.a.shift();
  //   }

  document.getElementById("info").innerHTML = `t=${t.toFixed(
    2
  )} s<br>x=${x.toFixed(2)} m<br>v=${v.toFixed(2)} m/s<br>a=${a.toFixed(
    2
  )} m/s²`;
  updateCharts();
}

function animate() {
  requestAnimationFrame(animate);
  if (isRunning) step();
  renderer.render(scene, camera);
}

animate();
resetSimulation();

// 事件
document.getElementById("startBtn").addEventListener("click", () => {
  const mVal = parseFloat(document.getElementById("massInput").value);
  const rVal = parseFloat(document.getElementById("ampInput").value);
  const kVal = parseFloat(document.getElementById("kInput").value);
  const bVal = parseFloat(document.getElementById("bInput").value);
  if (isFinite(mVal) && isFinite(rVal) && isFinite(kVal) && isFinite(bVal)) {
    m = mVal;
    R = rVal;
    k = kVal;
    b = bVal;
    resetSimulation();
    isRunning = true;
  }
});

document.getElementById("pauseBtn").addEventListener("click", () => {
  isRunning = !isRunning;
  document.getElementById("pauseBtn").textContent = isRunning
    ? "Pause"
    : "Resume";
});

document.getElementById("restartBtn").addEventListener("click", () => {
  resetSimulation();
  isRunning = true;
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
