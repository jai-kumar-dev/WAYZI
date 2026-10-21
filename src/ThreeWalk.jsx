import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const floorLabels = ['Ground floor', 'First floor', 'Second floor', 'Third floor', 'Fourth floor'];
const roomsByBuilding = {
  lab: [
    ['Main entrance / lobby','CSE Lab 01','ECE Lab 01','EEE Lab 01','General Lab 01','General Lab 02',"Boys' washroom","Girls' washroom",'Water cooler','Lift 1','Lift 2','Staircase'],
    ['CSE Programming Lab','CSE Hardware Lab','ECE Electronics Lab','ECE Communication Lab','EEE Circuits Lab','EEE Machines Lab','General Lab 07','General Lab 08','Classroom 101',"Boys' washroom","Girls' washroom",'Water cooler','Lift 1','Lift 2','Staircase'],
    ['Reading room','Quiet study area','CSE Lab 11','CSE Lab 12','ECE Lab 11','EEE Lab 11','Project Lab','Classroom 201',"Boys' washroom","Girls' washroom",'Water cooler','Lift 1','Lift 2','Staircase'],
    ['Advanced Computing Lab','CSE Project Lab','ECE Embedded Systems Lab','ECE Communication Lab','EEE Power Systems Lab','EEE Control Lab','Innovation Lab','Project discussion room','Classroom 301',"Boys' washroom","Girls' washroom",'Water cooler','Lift 1','Lift 2','Staircase'],
  ],
  bvs: [
    ['RECEPTION','BVK12','BVK13','CHEMISTRY LAB','PHYSICS LAB','AUDITORIUM','BOYS WASHROOM','GIRLS WASHROOM'],
    ['BVK21','BVK22','BVK23','BVK24','FACULTY ROOM','TUTORIAL ROOM','WATER COOLER','STORE'],
    ['BVK31','BVK32','BVK33','BVK34','PHYSICS PREP','SEMINAR ROOM','FACULTY ROOM','WASHROOM'],
    ['BVK41','BVK42','BVK43','BVK44','PROJECT ROOM','FACULTY OFFICE','WATER COOLER','WASHROOM'],
    ['BVK51','BVK52','AUDITORIUM CONTROL','DEPARTMENT OFFICE','MEETING ROOM','STORE ROOM','WATER COOLER','WASHROOM'],
  ],
  academic: [
    ['MAIN RECEPTION','FEE DEPARTMENT','ACCOUNTS OFFICE','ADMISSIONS','IDEA ROOM','STUDENT SECTION','WAITING AREA','WASHROOM'],
    ['ROOM 104','ROOM 105','ROOM 106','ROOM 107','ROOM 108','SEMINAR ROOM','WATER COOLER','WASHROOM'],
    ['ROOM 201','ROOM 202','ROOM 203','ROOM 204','ROOM 205','ROOM 206','WATER COOLER','WASHROOM'],
    ['ROOM 301','ROOM 302','ROOM 303','ROOM 304','LECTURE HALL','PROJECT ROOM','WATER COOLER','WASHROOM'],
  ],
};
const paletteByBuilding = {
  lab: { floor: '#cbd8e5', wall: '#f1f5f9', accent: '#1976c9', door: '#174c78', sign: '#0b3e68', trim: '#9eb2c4' },
  bvs: { floor: '#cde2e5', wall: '#edf5f5', accent: '#138399', door: '#216675', sign: '#075563', trim: '#9cbec3' },
  academic: { floor: '#e2d7c9', wall: '#f5eee5', accent: '#b8753e', door: '#805538', sign: '#75421f', trim: '#c6b29d' },
};

function labelTexture(text, background = '#0b3e68', width = 512, height = 128) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const fontSize = text.length > 22 ? 25 : text.length > 15 ? 29 : 34;
  ctx.font = `700 ${fontSize}px Arial, sans-serif`;
  const max = width - 24; let shown = text;
  while (shown.length > 4 && ctx.measureText(shown).width > max) shown = shown.slice(0, -2) + '…';
  ctx.fillText(shown, width / 2, height / 2);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}
function box(scene, size, pos, color, opts = {}) {
  const material = new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? 0.78, metalness: opts.metalness ?? 0, transparent: opts.transparent ?? false, opacity: opts.opacity ?? 1 });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...pos); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); return mesh;
}
function sign(scene, text, pos, rotY, bg, width = 1.4, height = 0.28) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: labelTexture(text, bg), side: THREE.DoubleSide }));
  mesh.position.set(...pos); mesh.rotation.y = rotY; scene.add(mesh); return mesh;
}
function addRoomDoor(scene, name, side, z, palette, index) {
  const wallX = side * 3.35; const doorX = side * 3.24;
  // Wall bay with a deliberate opening; labels are attached to the same door bay, never shifted by decoration.
  box(scene, [0.22, 3.15, 1.2], [wallX, 1.53, z - 1.65], palette.wall);
  box(scene, [0.22, 3.15, 1.2], [wallX, 1.53, z + 1.65], palette.wall);
  box(scene, [0.22, 0.48, 2.1], [wallX, 2.91, z], palette.wall);
  box(scene, [0.10, 2.35, 1.72], [doorX, 1.17, z], palette.door, { roughness: 0.5 });
  // Slim aluminium frame and transom.
  box(scene, [0.10, 2.45, 0.09], [doorX + side * 0.06, 1.2, z - 0.91], '#d5e0e8', { metalness: 0.45, roughness: 0.35 });
  box(scene, [0.10, 2.45, 0.09], [doorX + side * 0.06, 1.2, z + 0.91], '#d5e0e8', { metalness: 0.45, roughness: 0.35 });
  box(scene, [0.10, 0.12, 1.9], [doorX + side * 0.06, 2.42, z], '#d5e0e8', { metalness: 0.45, roughness: 0.35 });
  box(scene, [0.035, 0.12, 0.045], [doorX - side * 0.06, 1.05, z + 0.55], '#e4edf4', { metalness: 0.8, roughness: 0.25 });
  box(scene, [0.04, 0.42, 1.0], [doorX - side * 0.06, 1.82, z - 0.08], '#8fc9e3', { metalness: 0.12, roughness: 0.22 });
  box(scene, [0.05, 0.035, 1.05], [doorX - side * 0.07, 2.05, z - 0.08], '#e1eaf0', { metalness: 0.25, roughness: 0.35 });
  // Room number/name sign sits directly above its corresponding door.
  sign(scene, name, [side * 3.23, 2.62, z], side === -1 ? Math.PI / 2 : -Math.PI / 2, palette.sign, 1.62, 0.31);
  // A small, consistent glimpse of the room interior behind the doorway.
  box(scene, [1.8, 0.08, 1.8], [side * 4.35, 0.02, z], '#dfe8ef');
  box(scene, [0.08, 0.62, 1.05], [side * 4.72, 0.78, z - 0.25], '#b8cad7');
  box(scene, [0.72, 0.07, 0.42], [side * 4.25, 0.63, z - 0.45], '#8b9eac');
  // Small room marker near the floor helps locate the correct door.
  const marker = new THREE.Mesh(new THREE.CircleGeometry(0.07, 16), new THREE.MeshBasicMaterial({ color: index % 2 ? '#19a66a' : '#e6a23c' }));
  marker.rotation.x = -Math.PI / 2; marker.position.set(side * 2.9, 0.025, z); scene.add(marker);
}

function FirstPersonScene({ buildingId, floor, destination, arrivalMode, onSceneReady, onSceneApi }) {
  const hostRef = useRef(null);
  const rooms = (roomsByBuilding[buildingId] || roomsByBuilding.lab)[Math.min(floor, (roomsByBuilding[buildingId] || roomsByBuilding.lab).length - 1)];
  useEffect(() => {
    const host = hostRef.current; if (!host) return;
    let renderer, scene, camera, raf, observer; let dragging = false, lastX = 0, lastY = 0, yaw = 0, pitch = 0, poseTarget = null;
    const keys = new Set(); let disposed = false;
    try {
      const palette = paletteByBuilding[buildingId] || paletteByBuilding.lab;
      const buildingRooms = roomsByBuilding[buildingId] || roomsByBuilding.lab;
      const names = buildingRooms[Math.min(floor, buildingRooms.length - 1)];
      const targetIndex = Math.max(0, names.findIndex(n => n.toLowerCase() === String(destination || '').toLowerCase()));
      const startAtStairs = String(arrivalMode || '').toLowerCase().includes('stair');
      scene = new THREE.Scene(); scene.background = new THREE.Color('#dce7ef'); scene.fog = new THREE.Fog('#dce7ef', 34, 66);
      camera = new THREE.PerspectiveCamera(70, host.clientWidth / Math.max(1, host.clientHeight), 0.08, 100);
      camera.position.set(startAtStairs ? 2.15 : 2.15, 1.68, startAtStairs ? -7.2 : -10.6);
      yaw = Math.PI; // Camera looks along +Z when yaw is PI in Three.js.
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setSize(host.clientWidth, host.clientHeight);
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
      host.innerHTML = ''; host.appendChild(renderer.domElement); renderer.domElement.tabIndex = 0;
      scene.add(new THREE.HemisphereLight('#f6fbff', '#657786', 1.45));
      scene.add(new THREE.AmbientLight('#ffffff', 0.42));
      const keyLight = new THREE.DirectionalLight('#fff8eb', 2.0); keyLight.position.set(-4, 9, 7); keyLight.castShadow = true; keyLight.shadow.mapSize.set(1024, 1024); scene.add(keyLight);
      // A coherent, single corridor footprint: floor, walls, ceiling and every door share one coordinate system.
      const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(7.0, 34), new THREE.MeshStandardMaterial({ color: palette.floor, roughness: 0.52, metalness: 0.025 }));
      floorMesh.rotation.x = -Math.PI / 2; floorMesh.position.set(0, -0.08, -1.5); floorMesh.receiveShadow = true; scene.add(floorMesh);
      const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(7.0, 34), new THREE.MeshStandardMaterial({ color: '#f7f9fb', roughness: 0.95, side: THREE.DoubleSide }));
      ceiling.rotation.x = Math.PI / 2; ceiling.position.set(0, 3.35, -1.5); scene.add(ceiling);
      // Reserve exact openings in the side walls before building the room doors.
      const roomSlots = [];
      const regularRooms = names.filter(n => !/^(lift 1|lift 2|staircase|water cooler|.*washroom)$/i.test(n));
      const zSlots = [11.5, 7.0, 2.5, -2.0, -6.5, -11.0];
      regularRooms.forEach((name, i) => roomSlots.push({ name, side: i % 2 === 0 ? -1 : 1, z: zSlots[Math.floor(i / 2) % zSlots.length], index: names.indexOf(name), special: false }));
      const services = names.filter(n => /^(water cooler|.*washroom)$/i.test(n));
      services.forEach((name, i) => roomSlots.push({ name, side: i % 2 === 0 ? 1 : -1, z: -14.7 + i * 1.15, index: names.indexOf(name), special: true }));
      for (const side of [-1, 1]) {
        const openings = roomSlots.filter(r => r.side === side).map(r => r.z).sort((a, b) => b - a);
        let previous = 15.5;
        openings.forEach(z => {
          const top = z + 1.05, bottom = z - 1.05;
          if (previous > top) box(scene, [0.22, 3.3, previous - top], [side * 3.48, 1.55, (previous + top) / 2], palette.wall);
          previous = bottom;
        });
        if (previous > -18.5) box(scene, [0.22, 3.3, previous + 18.5], [side * 3.48, 1.55, (previous - 18.5) / 2], palette.wall);
        box(scene, [0.12, 0.13, 34], [side * 3.34, 0.08, -1.5], palette.accent);
        box(scene, [0.045, 0.08, 33.8], [side * 3.32, 0.38, -1.5], palette.trim);
      }
      // Floor tile grid is aligned to the corridor, not random decorative panels.
      for (let z = 14.5; z >= -17.5; z -= 2) box(scene, [6.88, 0.012, 0.018], [0, -0.035, z], '#aebdca', { roughness: 0.95 });
      for (let x = -3; x <= 3; x += 1.0) box(scene, [0.018, 0.012, 33.5], [x, -0.035, -1.5], '#bac7d1', { roughness: 0.95 });
      // Classroom bays: each room name is placed above the door actually belonging to that room.
      // Room slots are deterministic on every floor; no decoration is allowed to move the door/name pair.
      // roomSlots above are shared by wall openings, door geometry and route targeting.
      roomSlots.forEach(r => addRoomDoor(scene, r.name, r.side, r.z, palette, r.index));
      // Lift 1 and staircase have separate, obvious arrival bays; their labels are fixed to the matching bays.
      const liftZ = -10.6, stairZ = -7.2;
      box(scene, [0.2, 2.85, 1.95], [3.55, 1.4, liftZ], '#9aabba', { metalness: 0.2, roughness: 0.42 });
      box(scene, [0.08, 2.45, 0.82], [3.42, 1.2, liftZ - 0.42], '#c4d4df', { metalness: 0.35, roughness: 0.3 });
      box(scene, [0.08, 2.45, 0.82], [3.42, 1.2, liftZ + 0.42], '#b4c7d5', { metalness: 0.35, roughness: 0.3 });
      box(scene, [0.06, 2.5, 0.045], [3.36, 1.2, liftZ], '#edf7ff', { metalness: 0.5, roughness: 0.2 });
      sign(scene, `LIFT 1 · FLOOR ${floor + 1}`, [3.31, 2.55, liftZ], -Math.PI / 2, '#075985', 1.65, 0.32);
      box(scene, [0.2, 2.85, 1.65], [3.55, 1.4, -15.7], '#9aabba', { metalness: 0.2, roughness: 0.42 });
      box(scene, [0.08, 2.45, 0.68], [3.42, 1.2, -16.05], '#c4d4df', { metalness: 0.35, roughness: 0.3 });
      box(scene, [0.08, 2.45, 0.68], [3.42, 1.2, -15.35], '#b4c7d5', { metalness: 0.35, roughness: 0.3 });
      sign(scene, `LIFT 2 · FLOOR ${floor + 1}`, [3.31, 2.55, -15.7], -Math.PI / 2, '#075985', 1.65, 0.32);
      box(scene, [1.6, 0.16, 2.4], [2.45, 0.02, stairZ], '#d9e3eb');
      for (let i = 0; i < 8; i++) box(scene, [1.2, 0.12, 0.28], [2.35, 0.14 + i * 0.18, stairZ - 0.72 + i * 0.23], '#8f9fac');
      box(scene, [0.06, 1.55, 2.0], [1.7, 0.95, stairZ], '#718697', { metalness: 0.35, roughness: 0.35 });
      sign(scene, 'STAIRCASE ↑', [3.12, 2.55, stairZ], -Math.PI / 2, '#365314', 1.5, 0.32);
      // Overhead directional sign and clear lobby landmarks.
      box(scene, [2.5, 0.42, 0.12], [0, 2.85, -8.8], palette.sign);
      sign(scene, 'LAB BLOCK · MAIN CORRIDOR', [0, 2.85, -8.72], 0, palette.sign, 2.32, 0.3);
      // Ceiling panels and LED strips are placed in the ceiling plane and don't overlap room signage.
      for (let z = 12; z >= -16; z -= 4) {
        box(scene, [1.18, 0.045, 0.72], [0, 3.25, z], '#fff7de', { roughness: 0.24 });
        const light = new THREE.PointLight('#fff2d0', 0.52, 6); light.position.set(0, 2.92, z); scene.add(light);
        box(scene, [6.7, 0.025, 0.025], [0, 3.16, z - 1.5], '#d7e0e8');
      }
      // Small, tidy waiting benches and planters live only in the lobby corners, away from doors and route.
      for (const z of [5.2, -4.5]) {
        box(scene, [1.05, 0.12, 0.38], [-2.2, 0.5, z], '#657b8e', { roughness: 0.48 });
        box(scene, [1.05, 0.08, 0.38], [-2.2, 0.82, z], '#879baa', { roughness: 0.42 });
        for (const x of [-2.6, -1.8]) box(scene, [0.06, 0.45, 0.06], [x, 0.24, z], '#42596c', { metalness: 0.3 });
      }
      for (const [x, z] of [[-2.55, 9.2], [-2.55, -15.8]]) {
        box(scene, [0.48, 0.34, 0.48], [x, 0.12, z], '#9b7955');
        for (let i = 0; i < 5; i++) { const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.6, 5), new THREE.MeshStandardMaterial({ color: i % 2 ? '#4e9462' : '#2f7047', roughness: 0.82 })); leaf.position.set(x + Math.sin(i * 2.1) * 0.17, 0.58, z + Math.cos(i * 2.1) * 0.16); scene.add(leaf); }
      }
      // Build the route from the selected arrival bay to the exact room door coordinate.
      const targetRoom = names[targetIndex] || names[0];
      let target;
      if (/^lift 1$/i.test(targetRoom)) target = new THREE.Vector3(2.72, 0.05, liftZ);
      else if (/^staircase$/i.test(targetRoom)) target = new THREE.Vector3(2.35, 0.05, stairZ);
      else if (/^lift 2$/i.test(targetRoom)) target = new THREE.Vector3(2.6, 0.05, -15.7);
      else {
        const slot = roomSlots.find(r => r.name.toLowerCase() === targetRoom.toLowerCase());
        target = slot ? new THREE.Vector3(slot.side * 2.85, 0.05, slot.z) : new THREE.Vector3(0, 0.05, 10.5);
      }
      const start = new THREE.Vector3(2.15, 0.05, startAtStairs ? stairZ : liftZ);
      const routePoints = [start, new THREE.Vector3(0, 0.05, start.z)];
      if (Math.abs(target.z - start.z) > 0.35) routePoints.push(new THREE.Vector3(0, 0.05, target.z));
      if (Math.abs(target.x) > 0.35) routePoints.push(new THREE.Vector3(target.x, 0.05, target.z));
      const routeCurve = new THREE.CatmullRomCurve3(routePoints, false, 'centripetal', 0.05);
      const routeLine = new THREE.Mesh(new THREE.TubeGeometry(routeCurve, 100, 0.065, 8, false), new THREE.MeshStandardMaterial({ color: '#087cff', emissive: '#0758ca', emissiveIntensity: 0.34, roughness: 0.28 })); scene.add(routeLine);
      // Arrowheads use tangent orientation in the floor plane; the cone's tip points along the path, not upward/backward.
      const arrowGeometry = new THREE.ConeGeometry(0.16, 0.42, 4);
      const arrowMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff' });
      for (let i = 0; i < 13; i++) {
        const t = 0.06 + i * 0.069; const pt = routeCurve.getPoint(Math.min(0.96, t)); const tangent = routeCurve.getTangent(Math.min(0.96, t)).normalize();
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial); arrow.position.set(pt.x, 0.13, pt.z);
        // Cone default axis is +Y; rotate its tip to the tangent vector in XZ.
        arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(tangent.x, 0, tangent.z).normalize()); scene.add(arrow);
      }
      const destinationHalo = new THREE.Mesh(new THREE.RingGeometry(0.25, 0.36, 32), new THREE.MeshBasicMaterial({ color: '#16a56a', side: THREE.DoubleSide }));
      destinationHalo.rotation.x = -Math.PI / 2; destinationHalo.position.set(target.x, 0.12, target.z); scene.add(destinationHalo);
      const pin = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.48, 6), new THREE.MeshStandardMaterial({ color: '#16a56a', emissive: '#087c4c', emissiveIntensity: 0.35 })); pin.position.set(target.x, 0.42, target.z); scene.add(pin);
      // Smooth step navigation samples the same curve used for the visible arrows and ribbon.
      const applyLook = () => { camera.rotation.order = 'YXZ'; camera.rotation.y = yaw; camera.rotation.x = pitch; };
      const setPose = (n, total = 6) => {
        const t = THREE.MathUtils.clamp(total <= 1 ? 1 : n / (total - 1), 0, 1);
        const point = routeCurve.getPoint(t); const ahead = routeCurve.getPoint(Math.min(1, t + 0.025));
        poseTarget = { position: new THREE.Vector3(point.x, 1.68, point.z), yaw: Math.atan2(ahead.x - point.x, -(ahead.z - point.z)), pitch: 0 };
      };
      const onPointerDown = e => { dragging = true; lastX = e.clientX; lastY = e.clientY; renderer.domElement.setPointerCapture?.(e.pointerId); };
      const onPointerMove = e => { if (!dragging) return; yaw -= (e.clientX - lastX) * 0.004; pitch -= (e.clientY - lastY) * 0.003; lastX = e.clientX; lastY = e.clientY; pitch = THREE.MathUtils.clamp(pitch, -0.8, 0.8); poseTarget = null; };
      const onPointerUp = () => { dragging = false; };
      const onKeyDown = e => { if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(e.key.toLowerCase())) { keys.add(e.key.toLowerCase()); e.preventDefault(); poseTarget = null; } };
      const onKeyUp = e => keys.delete(e.key.toLowerCase());
      renderer.domElement.addEventListener('pointerdown', onPointerDown); window.addEventListener('pointermove', onPointerMove); window.addEventListener('pointerup', onPointerUp); window.addEventListener('keydown', onKeyDown); window.addEventListener('keyup', onKeyUp);
      const resize = () => { if (!host.clientWidth || !host.clientHeight) return; camera.aspect = host.clientWidth / host.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(host.clientWidth, host.clientHeight); };
      observer = new ResizeObserver(resize); observer.observe(host);
      const api = { camera, setPose, moveForward: amount => { const dir = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, yaw, 0)); camera.position.addScaledVector(dir, amount || 2.8); } };
      onSceneApi?.(api); setPose(0, 6);
      let last = performance.now();
      const render = now => {
        if (disposed) return; raf = requestAnimationFrame(render); const dt = Math.min(0.05, (now - last) / 1000); last = now;
        if (poseTarget) {
          camera.position.lerp(poseTarget.position, 1 - Math.exp(-dt * 5));
          const d = Math.atan2(Math.sin(poseTarget.yaw - yaw), Math.cos(poseTarget.yaw - yaw)); yaw += d * (1 - Math.exp(-dt * 5)); pitch += (poseTarget.pitch - pitch) * (1 - Math.exp(-dt * 5));
          if (camera.position.distanceTo(poseTarget.position) < 0.02 && Math.abs(d) < 0.008) { camera.position.copy(poseTarget.position); yaw = poseTarget.yaw; pitch = poseTarget.pitch; poseTarget = null; }
        }
        const forward = keys.has('w') || keys.has('arrowup'), back = keys.has('s') || keys.has('arrowdown'), left = keys.has('a') || keys.has('arrowleft'), right = keys.has('d') || keys.has('arrowright');
        const dir = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, yaw, 0)); const side = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, yaw, 0)); const speed = 3.0 * dt;
        if (forward) camera.position.addScaledVector(dir, speed); if (back) camera.position.addScaledVector(dir, -speed); if (left) camera.position.addScaledVector(side, -speed); if (right) camera.position.addScaledVector(side, speed);
        camera.position.x = THREE.MathUtils.clamp(camera.position.x, -5.6, 5.6); camera.position.z = THREE.MathUtils.clamp(camera.position.z, -17.0, 14.5); camera.position.y = 1.68;
        applyLook(); renderer.render(scene, camera);
      };
      raf = requestAnimationFrame(render); onSceneReady(true);
      return () => {
        disposed = true; cancelAnimationFrame(raf); observer?.disconnect();
        renderer.domElement.removeEventListener('pointerdown', onPointerDown); window.removeEventListener('pointermove', onPointerMove); window.removeEventListener('pointerup', onPointerUp); window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp);
        scene.traverse(o => { o.geometry?.dispose?.(); if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(m => { m.map?.dispose?.(); m.dispose?.(); }); } }); renderer.dispose(); if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
      };
    } catch (err) { console.error('3D indoor scene failed:', err); onSceneReady(false); }
  }, [buildingId, floor, destination, arrivalMode, onSceneReady]);
  return <div className="three-scene-host first-person-host" ref={hostRef} aria-label="3D indoor campus navigation view">
    <div className="three-scene-vignette"/><div className="three-scene-hint"><b>3D INDOOR NAVIGATION</b><span>{buildingId === 'lab' ? `Start beside ${arrivalMode === 'staircase' ? 'the staircase' : 'Lift 1'} · follow the blue route · drag to look` : 'Drag to look · W/A/S/D or arrow keys to move'}</span></div>
    <div className="three-scene-compass"><span className="compass-n">N</span><span className="compass-arrow">▲</span></div>
    <div className="first-person-reticle">＋</div><div className="three-scene-bottom-label"><span>● LIVE 3D VIEW</span><b>{String(destination || 'DESTINATION').toUpperCase()}</b></div>
  </div>;
}

export default function ThreeWalk({ building, floor, destination, routeResult, onBackToPlan }) {
  const [step, setStep] = useState(0); const [ready, setReady] = useState(false); const sceneRef = useRef(null);
  const rooms = (roomsByBuilding[building.id] || roomsByBuilding.lab)[Math.min(floor, (roomsByBuilding[building.id] || roomsByBuilding.lab).length - 1)];
  const room = destination || rooms[0];
  const routeLabels = (routeResult?.steps || []).map(s => String(s.label || s.instruction || s));
  const routeUsesStairs = (routeResult?.steps || []).some(s => /stair/i.test(`${s.via || ''} ${s.instruction || ''} ${s.label || ''}`));
  const arrivalMode = routeUsesStairs ? 'staircase' : 'lift';
  const index = Math.max(0, rooms.findIndex(n => n.toLowerCase() === String(room).toLowerCase()));
  const side = index % 2 === 0 ? 'left' : 'right';
  const steps = routeLabels.length ? routeLabels : [
    `Start at ${arrivalMode === 'staircase' ? 'the staircase landing' : 'Lift 1'}`,
    'Move into the main corridor',
    'Follow the blue line straight ahead',
    `Turn ${side} at the room bay`,
    `Continue to the door marked ${room}`,
    `Arrive at ${room}`,
  ];
  const current = Math.min(step, steps.length - 1);
  useEffect(() => { setStep(0); }, [building.id, floor, room]);
  const moveStep = delta => setStep(s => { const next = Math.max(0, Math.min(steps.length - 1, s + delta)); requestAnimationFrame(() => sceneRef.current?.setPose?.(next, steps.length)); return next; });
  return <section className="three-walk-view">
    <div className="three-walk-head"><div><span className="three-live-dot"/> IMMERSIVE INDOOR NAVIGATION <small> · rebuilt corridor model</small></div><span>{building.name} / {floorLabels[floor] || floorLabels[0]}</span></div>
    <FirstPersonScene buildingId={building.id} floor={floor} destination={room} arrivalMode={arrivalMode} onSceneReady={setReady} onSceneApi={api => { sceneRef.current = api; }}/>
    <div className="three-walk-info"><div className="three-destination"><small>DESTINATION</small><strong>{room}</strong><span>{building.name} · {floorLabels[floor] || floorLabels[0]} · illustrative 3D layout</span></div><div className="three-step-copy"><small>STEP {current + 1} OF {steps.length}</small><strong>{steps[current]}</strong><div className="three-progress"><i style={{ width: `${((current + 1) / steps.length) * 100}%` }}/></div></div></div>
    <div className="three-walk-actions"><button className="three-secondary" onClick={() => moveStep(-1)} disabled={step === 0}>← Previous point</button><button onClick={() => moveStep(1)} disabled={step >= steps.length - 1}>Next instruction →</button><button className="three-secondary" onClick={() => { setStep(0); sceneRef.current?.setPose?.(0, steps.length); }}>Restart walk</button><button className="three-secondary" onClick={onBackToPlan}>Floor plan</button></div>
    {!ready && <p className="three-fallback-note">3D scene could not initialize. Check WebGL and the Three.js dependency.</p>}
    <p className="three-disclaimer">The Lab Block interior has been rebuilt as a clean, consistent illustrative corridor with door labels attached to their matching room bays. Confirm room positions and vertical-access locations against the real building before using this as real-world wayfinding.</p>
  </section>;
}
