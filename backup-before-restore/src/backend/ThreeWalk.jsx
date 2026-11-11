import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const floorLabels = ['Ground floor', 'First floor', 'Second floor', 'Third floor', 'Fourth floor'];
const roomsByBuilding = {
  lab: [
    ['CSE LAB G-01','CSE LAB G-02','ECE LAB G-03','EEE LAB G-04','BOYS WASHROOM','GIRLS WASHROOM','WATER COOLER','PROJECT LAB'],
    ['PROGRAMMING LAB','HARDWARE LAB','ECE LAB 101','EEE LAB 102','CLASS 103','CLASS 104','FACULTY ROOM','STORE'],
    ['READING ROOM','QUIET STUDY','PROJECT LAB','CSE LAB 201','ECE LAB 202','EEE LAB 203','WATER COOLER','WASHROOM'],
    ['ADVANCED COMPUTING','CSE PROJECT LAB','EMBEDDED LAB','EEE CONTROL LAB','INNOVATION LAB','CLASS 301','FACULTY ROOM','STORE'],
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
const palettes = {
  lab: { floor:'#cbd9e7', wall:'#e8eef4', accent:'#2478bb', door:'#285b82', sign:'#0d416d' },
  bvs: { floor:'#c7e0e5', wall:'#e3f0f2', accent:'#147d92', door:'#286b79', sign:'#075b6b' },
  academic: { floor:'#e7d9c7', wall:'#f4eadc', accent:'#b8753e', door:'#835b3d', sign:'#7a431f' },
};
function makeLabel(text, bg='#164b76', width=512, height=128) {
  const canvas=document.createElement('canvas'); canvas.width=width; canvas.height=height;
  const ctx=canvas.getContext('2d'); ctx.fillStyle=bg; ctx.fillRect(0,0,width,height);
  ctx.fillStyle='#fff'; ctx.font='bold 32px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
  const safe=text.length>27?text.slice(0,26)+'…':text; ctx.fillText(safe,width/2,height/2);
  const tex=new THREE.CanvasTexture(canvas); tex.colorSpace=THREE.SRGBColorSpace; return tex;
}
function makeSurfaceTexture(kind='wall') {
  const canvas=document.createElement('canvas'); canvas.width=512; canvas.height=512;
  const ctx=canvas.getContext('2d');
  if(kind==='floor') {
    ctx.fillStyle='#d4dce4'; ctx.fillRect(0,0,512,512);
    const tile=128;
    for(let y=0;y<512;y+=tile) for(let x=0;x<512;x+=tile) {
      const shade=218+Math.round(Math.random()*12); ctx.fillStyle=`rgb(${shade-7},${shade},${shade+5})`; ctx.fillRect(x+2,y+2,tile-4,tile-4);
      ctx.strokeStyle='#b9c6d1'; ctx.lineWidth=3; ctx.strokeRect(x+2,y+2,tile-4,tile-4);
      ctx.strokeStyle='rgba(255,255,255,.45)'; ctx.lineWidth=1; ctx.beginPath();ctx.moveTo(x+8,y+8);ctx.lineTo(x+tile-8,y+8);ctx.stroke();
    }
  } else if(kind==='ceiling') {
    ctx.fillStyle='#f4f6f8';ctx.fillRect(0,0,512,512);
    for(let y=0;y<512;y+=128) for(let x=0;x<512;x+=128) {ctx.fillStyle='#f9fafb';ctx.fillRect(x+3,y+3,122,122);ctx.strokeStyle='#dbe2e8';ctx.lineWidth=3;ctx.strokeRect(x+2,y+2,124,124);}
  } else {
    ctx.fillStyle='#e9edf1';ctx.fillRect(0,0,512,512);
    for(let i=0;i<1500;i++){const a=Math.random()*.035;ctx.fillStyle=`rgba(100,120,140,${a})`;ctx.fillRect(Math.random()*512,Math.random()*512,1+Math.random()*3,1+Math.random()*2);}
  }
  const tex=new THREE.CanvasTexture(canvas); tex.wrapS=tex.wrapT=THREE.RepeatWrapping; tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=4; return tex;
}
function addBox(scene,size,pos,color,opts={}) {
  const material=new THREE.MeshStandardMaterial({color,roughness:opts.roughness??.82,metalness:opts.metalness??0,map:opts.map||null,transparent:opts.transparent||false,opacity:opts.opacity??1});
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),material);
  mesh.position.set(...pos); mesh.castShadow=true; mesh.receiveShadow=true; scene.add(mesh); return mesh;
}
function addGlowStrip(scene,size,pos,color,intensity=.7) {
  const strip=addBox(scene,size,pos,color,{roughness:.25});
  const light=new THREE.PointLight(color,intensity,7); light.position.set(pos[0],pos[1]-.12,pos[2]); scene.add(light); return strip;
}
function addWallPoster(scene,side,z,title,subtitle='CAMPUS FACILITIES') {
  const x=side*2.96, rot=side===-1?Math.PI/2:-Math.PI/2;
  addBox(scene,[.035,.86,1.05],[x,1.98,z],'#ffffff',{roughness:.8});
  const canvas=document.createElement('canvas');canvas.width=384;canvas.height=320;const c=canvas.getContext('2d');
  c.fillStyle='#f8fbff';c.fillRect(0,0,384,320);c.fillStyle='#145b91';c.fillRect(0,0,384,70);c.fillStyle='#fff';c.font='bold 28px Arial';c.fillText(title.slice(0,22),18,44);
  c.fillStyle='#567087';c.font='bold 17px Arial';c.fillText(subtitle,18,108);c.fillStyle='#d8e6f1';c.fillRect(18,132,348,7);c.fillRect(18,158,250,7);c.fillRect(18,184,300,7);c.fillStyle='#1b80c9';c.fillRect(18,226,108,50);c.fillStyle='#fff';c.font='bold 17px Arial';c.fillText('INFO',45,257);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
  const poster=new THREE.Mesh(new THREE.PlaneGeometry(.94,.78),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));poster.position.set(side*2.925,1.98,z);poster.rotation.y=rot;scene.add(poster);
}
function addSign(scene,text,pos,rotationY,bg,width=1.55,height=.36) {
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:makeLabel(text,bg),side:THREE.DoubleSide}));
  mesh.position.set(...pos); mesh.rotation.y=rotationY; scene.add(mesh); return mesh;
}

function FirstPersonScene({buildingId,floor,destination,step,onSceneReady,onSceneApi}) {
  const viewRooms=(roomsByBuilding[buildingId]||roomsByBuilding.lab)[Math.min(floor,(roomsByBuilding[buildingId]||roomsByBuilding.lab).length-1)];
  const viewDestinationIndex=Math.max(0,viewRooms.findIndex(n=>n.toLowerCase()===String(destination||'').toLowerCase()));
  const viewTargetSide=viewDestinationIndex>=4?'right':'left';
  const hostRef=useRef(null); const apiRef=useRef(null);
  useEffect(()=>{
    const host=hostRef.current; if(!host) return;
    let renderer,scene,camera,raf,observer,dragging=false,lastX=0,lastY=0,yaw=0,pitch=0,poseTarget=null;
    const keys=new Set();
    try {
      const palette=palettes[buildingId]||palettes.lab;
      const buildingRooms=(roomsByBuilding[buildingId]||roomsByBuilding.lab);
      const names=buildingRooms[Math.min(floor,buildingRooms.length-1)];
      scene=new THREE.Scene(); scene.background=new THREE.Color('#d7e1e8'); scene.fog=new THREE.Fog('#d7e1e8',38,76);
      camera=new THREE.PerspectiveCamera(78,host.clientWidth/Math.max(1,host.clientHeight),.08,100);
      camera.position.set(0,1.68,12.5);
      renderer=new THREE.WebGLRenderer({antialias:true,alpha:false}); renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)); renderer.setSize(host.clientWidth,host.clientHeight); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05; renderer.setClearColor('#dce8f2',1);
      host.innerHTML=''; host.appendChild(renderer.domElement); renderer.domElement.tabIndex=0;
      scene.add(new THREE.HemisphereLight('#f8fbff','#667585',1.65));
      scene.add(new THREE.AmbientLight('#ffffff',.28));
      const ceilingLight=new THREE.DirectionalLight('#fffaf1',2.15); ceilingLight.position.set(-5,9,9); ceilingLight.castShadow=true; ceilingLight.shadow.mapSize.set(1536,1536); ceilingLight.shadow.camera.left=-10;ceilingLight.shadow.camera.right=10;ceilingLight.shadow.camera.top=12;ceilingLight.shadow.camera.bottom=-12;scene.add(ceilingLight);
      const ambient=new THREE.PointLight('#d9eeff',.65,36); ambient.position.set(0,2.8,-2); scene.add(ambient);
      // A first-person corridor scene: the camera is inside the building, not orbiting around a model.
      const floorTex=makeSurfaceTexture('floor');floorTex.repeat.set(2.2,9);
      const floorMesh=new THREE.Mesh(new THREE.BoxGeometry(7.1,.2,36),new THREE.MeshStandardMaterial({color:palette.floor,map:floorTex,roughness:.68,metalness:.015}));floorMesh.position.set(0,-.14,-2);floorMesh.receiveShadow=true;scene.add(floorMesh);
      // Polished skirting, a central navigation lane, and realistic tile joints.
      addBox(scene,[.09,.08,35],[-3.02,.015,-2],palette.accent); addBox(scene,[.09,.08,35],[3.02,.015,-2],palette.accent);
      // Keep the real floor visible; avoid a broad pale strip that reads like a raised platform.
      for(let z=14;z>=-20;z-=1.5){ addBox(scene,[6.65,.012,.018],[0,-.025,z],'#aebdca'); }
      // Blue route ribbon and animated chevrons read like a navigation overlay, not floor decoration.
      addBox(scene,[.13,.022,34],[0,.002,-2],'#1677ff',{roughness:.28,metalness:.12});
      const routeChevrons=[];
      for(let z=12;z>=-17;z-=2.4){ const c=new THREE.Mesh(new THREE.ConeGeometry(.16,.42,3),new THREE.MeshBasicMaterial({color:'#ffffff'})); c.rotation.x=-Math.PI/2; c.position.set(0,.035,z); scene.add(c); routeChevrons.push(c); }
      // Subtle grout lines are already present in the floor texture; avoid doubled grid seams.
      // Long side walls are broken into piers around doors, so doors and room labels remain visible.
      for(const side of [-1,1]) {
        const x=side*3.08;
        // Solid wall piers sit between doors; each doorway is an actual visible opening in the wall line.
        addBox(scene,[.2,3.25,1.0],[x,1.58,13.7],palette.wall);
        addBox(scene,[.2,3.25,1.0],[x,1.58,-18.0],palette.wall);
        // Tall glazed panels at the corridor ends give the scene depth and daylight.
        addBox(scene,[.06,1.25,1.65],[x,2.18,11.85],'#9ecfe8',{roughness:.22,metalness:.12});
        addBox(scene,[.06,1.25,1.65],[x,2.18,-16.1],'#9ecfe8',{roughness:.22,metalness:.12});
        for(let i=0;i<8;i++) {
          const z=10.8-i*4.0;
          addBox(scene,[.2,3.25,1.0],[x,1.58,z-2.7],palette.wall); const roomIndex=side===-1?i%4:(i%4)+4; const roomName=names[roomIndex]||`ROOM ${i+1}`;
          // A lit room glimpse behind each doorway makes this feel like a real building, not a flat corridor.
          addBox(scene,[1.35,.08,1.65],[side*2.18,.04,z],'#d6e0e8');
          addBox(scene,[.08,1.45,1.55],[side*2.48,.82,z-1.28],'#e7eef4');
          addBox(scene,[.72,.08,.45],[side*2.18,.62,z-.55],'#b8c9d6');
          addBox(scene,[.68,.65,.07],[side*2.18,1.0,z-.55],'#d5e1e9');
          // Door frame, contrasting door, handle and sign make each room legible while walking past.
          addBox(scene,[.13,2.35,.12],[x-side*.1,1.16,z-.9],'#c7d1db');
          addBox(scene,[.13,2.35,.12],[x-side*.1,1.16,z+.9],'#c7d1db');
          addBox(scene,[.13,.14,1.92],[x-side*.1,2.36,z],'#c7d1db');
          addBox(scene,[.07,2.14,1.36],[x-side*.17,1.08,z],palette.door);
          addBox(scene,[.035,.12,.045],[x-side*.22,1.0,z+.46],'#d8e0e8',{metalness:.82,roughness:.24});
          addBox(scene,[.04,.035,.05],[x-side*.22,1.0,z+.46],'#aab6c2',{metalness:.8,roughness:.25});
          // A narrow transom/window on each door adds a more realistic corridor rhythm.
          addBox(scene,[.045,.38,.48],[x-side*.22,1.72,z-.08],'#8fc6df',{metalness:.12,roughness:.22,transparent:true,opacity:.88});
          addBox(scene,[.05,.035,.52],[x-side*.22,1.92,z-.08],'#d8e0e8',{metalness:.18,roughness:.35});
          const signMat=new THREE.Mesh(new THREE.PlaneGeometry(1.12,.29),new THREE.MeshBasicMaterial({map:makeLabel(roomName,palette.sign),side:THREE.DoubleSide}));
          signMat.position.set(side*2.91,2.43,z); signMat.rotation.y=side===-1?Math.PI/2:-Math.PI/2; scene.add(signMat);
          // Small ceiling lights repeat along the corridor.
          addBox(scene,[.82,.045,.18],[0,3.12,z],'#fff8df',{roughness:.3});
          const glow=new THREE.PointLight('#fff0c9',.45,5); glow.position.set(0,2.9,z); scene.add(glow);
        }
      }
      // Ceiling is split into panels and leaves a bright central strip, giving the camera a real interior perspective.
      const ceilingTex=makeSurfaceTexture('ceiling');ceilingTex.repeat.set(2,8);
      addBox(scene,[6.4,.16,34],[0,3.35,-2],'#ffffff',{map:ceilingTex,roughness:.92});
      for(let z=14;z>=-18;z-=2) { addBox(scene,[6.25,.045,.045],[0,3.18,z-1],'#d5dde5'); }
      // Recessed LED panels with soft pools of light on the floor.
      for(let z=12;z>=-17;z-=4) {
        addBox(scene,[1.18,.035,.88],[0,3.245,z],'#ffffff',{roughness:.2});
        addBox(scene,[1.02,.012,.72],[0,3.222,z],'#fff7dc',{roughness:.18});
        const led=new THREE.PointLight('#fff4d7',.72,8);led.position.set(0,2.95,z);scene.add(led);
      }
      // Architectural details: skirting, wall protection rails, wall-mounted notices, safety equipment and benches.
      for(const side of [-1,1]) {
        addBox(scene,[.045,.09,31],[side*2.965,.31,-2],'#c3ced8',{roughness:.6});
        addBox(scene,[.045,.055,31],[side*2.96,1.04,-2],'#d4dde5',{roughness:.5,metalness:.12});
        addWallPoster(scene,side,5.0,side===-1?'CAMPUS DIRECTORY':'LAB SAFETY');
        addWallPoster(scene,side,-7.0,side===-1?'WAYFINDING':'EMERGENCY INFO');
        // Wall mounted emergency marker and fire extinguisher cabinet.
        addBox(scene,[.045,.38,.52],[side*2.96,2.62,-11.2],'#dff6e9',{roughness:.45});
        addSign(scene,'EXIT',[side*2.92,2.62,-11.18],side===-1?Math.PI/2:-Math.PI/2,'#087443',.48,.2);
        addBox(scene,[.18,.55,.22],[side*2.78,.62,-11.8],'#c63838',{roughness:.4});
        addBox(scene,[.2,.08,.24],[side*2.78,.94,-11.8],'#e8e9e9',{metalness:.4});
      }
      // Waiting benches and a discreet indoor planter add scale and human context without blocking the route.
      for(const z of [7,-5]) {
        addBox(scene,[1.12,.12,.42],[-2.05,.52,z],'#7b8997',{roughness:.45});
        addBox(scene,[1.12,.08,.42],[-2.05,.88,z],'#9aa7b3',{roughness:.4});
        for(const x of [-2.48,-1.62]) addBox(scene,[.07,.48,.07],[x,.25,z],'#536779',{metalness:.35});
      }
      addBox(scene,[.48,.42,.48],[2.08,.18,3.3],'#d2d9de');
      const planter=addBox(scene,[.42,.32,.42],[2.08,.55,3.3],'#9a7957',{roughness:.8});
      for(let i=0;i<7;i++){const leaf=new THREE.Mesh(new THREE.ConeGeometry(.12,.72,5),new THREE.MeshStandardMaterial({color:i%2?'#47885a':'#2e7046',roughness:.8}));leaf.position.set(2.08+Math.sin(i*2.4)*.18,.95+(i%3)*.06,3.3+Math.cos(i*2.4)*.18);leaf.rotation.z=Math.sin(i)*.25;scene.add(leaf);}
      // End lobby: lifts and stairs are to the right, never in the corridor centre.
      addBox(scene,[.16,3.05,.18],[-1.45,1.5,-17.7],palette.accent); addBox(scene,[.16,3.05,.18],[1.45,1.5,-17.7],palette.accent); addBox(scene,[3.05,.16,.18],[0,3.0,-17.7],palette.accent);
      addSign(scene,`${buildingId.toUpperCase()} · FLOOR ${floor+1}`,[0,2.68,-17.48],0,palette.sign,2.5,.38);
      addBox(scene,[1.05,2.55,.2],[4.0,1.27,-15.7],'#9eabb8'); addBox(scene,[1.05,2.55,.2],[5.2,1.27,-15.7],'#9eabb8');
      addSign(scene,'LIFT 1',[4.0,2.68,-15.55],0,'#075985',1.0,.3); addSign(scene,'LIFT 2',[5.2,2.68,-15.55],0,'#075985',1.0,.3);
      for(let i=0;i<9;i++) addBox(scene,[1.5,.12,.42],[6.2,.08+i*.15,-17.4+i*.38],'#aab6c1');
      addSign(scene,'STAIRS ↑',[6.0,2.2,-15.4],0,'#365314',1.25,.32);
      // A destination marker floats at the chosen room's corridor-side door; route pips guide forward.
      const destIndex=Math.max(0,names.findIndex(n=>n.toLowerCase()===String(destination||'').toLowerCase()));
      const destSide=destIndex>=4?1:-1; const destZ=10.8-(destIndex%4)*4;
      const destinationHalo=new THREE.Mesh(new THREE.TorusGeometry(.38,.045,8,32),new THREE.MeshBasicMaterial({color:'#1677ff'}));destinationHalo.position.set(destSide*2.62,2.2,destZ);destinationHalo.rotation.x=Math.PI/2;scene.add(destinationHalo);
      const arrow=new THREE.Mesh(new THREE.ConeGeometry(.22,.54,5),new THREE.MeshStandardMaterial({color:'#1677ff',emissive:'#0755c9',emissiveIntensity:.65,roughness:.3})); arrow.rotation.z=Math.PI; arrow.position.set(destSide*2.62,2.82,destZ); scene.add(arrow);
      // Destination-specific route: follow the corridor, then turn into the correct room-side approach.
      const routePath=[new THREE.Vector3(0,.045,12.2),new THREE.Vector3(0,.045,destZ+2.2),new THREE.Vector3(destSide*.78,.045,destZ+1.0),new THREE.Vector3(destSide*1.9,.045,destZ)];
      const routeCurve=new THREE.CatmullRomCurve3(routePath);
      const routeGlow=new THREE.Mesh(new THREE.TubeGeometry(routeCurve,72,.13,8,false),new THREE.MeshBasicMaterial({color:'#4aa6ff',transparent:true,opacity:.24,depthWrite:false}));scene.add(routeGlow);
      const routeTube=new THREE.Mesh(new THREE.TubeGeometry(routeCurve,72,.055,10,false),new THREE.MeshStandardMaterial({color:'#087cff',emissive:'#0056d8',emissiveIntensity:.55,roughness:.28,metalness:.08})); scene.add(routeTube);
      const routeDots=[]; for(let i=0;i<=18;i++){const pt=routeCurve.getPoint(i/18);const dot=new THREE.Mesh(new THREE.SphereGeometry(.055,10,8),new THREE.MeshBasicMaterial({color:'#ffffff'}));dot.position.copy(pt);dot.position.y=.09;scene.add(dot);routeDots.push(dot);}
      // Set an initial forward-looking view.
      const applyLook=()=>{camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch;}; applyLook();
      const onPointerDown=e=>{poseTarget=null;dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture?.(e.pointerId);};
      const onPointerMove=e=>{if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;yaw-=dx*.0042;pitch-=dy*.0032;pitch=Math.max(-1.05,Math.min(1.05,pitch));applyLook();};
      const onPointerUp=()=>{dragging=false;};
      const onKeyDown=e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(e.key)){poseTarget=null;e.preventDefault();keys.add(e.key.toLowerCase());}};
      const onKeyUp=e=>keys.delete(e.key.toLowerCase());
      renderer.domElement.addEventListener('pointerdown',onPointerDown); window.addEventListener('pointermove',onPointerMove); window.addEventListener('pointerup',onPointerUp); window.addEventListener('keydown',onKeyDown); window.addEventListener('keyup',onKeyUp);
      const moveForward=(amount=2.8)=>{const dir=new THREE.Vector3(0,0,-1).applyEuler(new THREE.Euler(0,yaw,0));camera.position.addScaledVector(dir,amount);camera.position.x=THREE.MathUtils.clamp(camera.position.x,-2.25,2.25);camera.position.z=THREE.MathUtils.clamp(camera.position.z,-16.4,13.2);camera.position.y=THREE.MathUtils.clamp(camera.position.y,1.3,2.05);};
      const setPose=(n,total=6)=>{
        const t=THREE.MathUtils.clamp(total<=1?1:n/(total-1),0,1);
        const point=routeCurve.getPoint(t); const ahead=routeCurve.getPoint(Math.min(1,t+.035));
        poseTarget={position:new THREE.Vector3(point.x,1.68,point.z),yaw:Math.atan2(ahead.x-point.x,-(ahead.z-point.z)),pitch:0};
      };
      apiRef.current={camera,moveForward,setPose}; setPose(0,6); onSceneApi?.(apiRef.current);
      const resize=()=>{if(!host.clientWidth||!host.clientHeight)return;camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);};
      observer=new ResizeObserver(resize);observer.observe(host);
      let last=performance.now(); const render=now=>{raf=requestAnimationFrame(render);const dt=Math.min(.05,(now-last)/1000);last=now;const speed=4.1*dt;routeChevrons.forEach((c,i)=>{c.position.z=12-(((now/1000*2.2+i*2.4)%29));c.material.color.setHSL(.58,.95,.68);});arrow.position.y=2.82+Math.sin(now/360)*.12;destinationHalo.scale.setScalar(1+Math.sin(now/420)*.08);destinationHalo.material.opacity=.82+Math.sin(now/360)*.16;if(poseTarget){camera.position.lerp(poseTarget.position,1-Math.exp(-dt*4.8));const angleDelta=Math.atan2(Math.sin(poseTarget.yaw-yaw),Math.cos(poseTarget.yaw-yaw));yaw+=angleDelta*(1-Math.exp(-dt*4.8));pitch+= (poseTarget.pitch-pitch)*(1-Math.exp(-dt*4.8));if(camera.position.distanceTo(poseTarget.position)<.025&&Math.abs(angleDelta)<.008){camera.position.copy(poseTarget.position);yaw=poseTarget.yaw;pitch=poseTarget.pitch;poseTarget=null;}}const forward=keys.has('w')||keys.has('arrowup');const back=keys.has('s')||keys.has('arrowdown');const left=keys.has('a')||keys.has('arrowleft');const right=keys.has('d')||keys.has('arrowright');const dir=new THREE.Vector3(0,0,-1).applyEuler(new THREE.Euler(0,yaw,0));const side=new THREE.Vector3(1,0,0).applyEuler(new THREE.Euler(0,yaw,0));if(forward)camera.position.addScaledVector(dir,speed);if(back)camera.position.addScaledVector(dir,-speed);if(left)camera.position.addScaledVector(side,-speed);if(right)camera.position.addScaledVector(side,speed);camera.position.x=THREE.MathUtils.clamp(camera.position.x,-2.35,2.35);camera.position.z=THREE.MathUtils.clamp(camera.position.z,-16.5,13.2);camera.position.y=1.68;applyLook();renderer.render(scene,camera);};
      raf=requestAnimationFrame(render);onSceneReady(true);
      return ()=>{cancelAnimationFrame(raf);observer?.disconnect();renderer.domElement.removeEventListener('pointerdown',onPointerDown);window.removeEventListener('pointermove',onPointerMove);window.removeEventListener('pointerup',onPointerUp);window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);renderer.dispose();scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{if(m.map)m.map.dispose();m.dispose();});}});if(renderer.domElement.parentNode===host)host.removeChild(renderer.domElement);};
    } catch(e){console.error('First-person interior failed:',e);onSceneReady(false);}
  },[buildingId,floor,destination,onSceneReady]);
  return <div className="three-scene-host first-person-host" ref={hostRef} aria-label="Immersive 3D indoor campus navigation view"><div className="three-scene-vignette"/><div className="three-scene-hint"><b>3D INDOOR NAVIGATION</b><span>Drag to look · W/A/S/D or arrow keys to move</span></div><div className="three-scene-compass"><span className="compass-n">N</span><span className="compass-arrow">▲</span></div><div className="three-mini-map"><small>ROUTE PREVIEW</small><svg viewBox="0 0 120 88" role="img" aria-label="Schematic indoor route"><rect x="4" y="4" width="112" height="80" rx="7" fill="#f7fbff" stroke="#c7d8e8"/><path d="M18 15 V73 M102 15 V73 M18 29 H102 M18 59 H102" stroke="#d8e4ef" strokeWidth="7" fill="none"/><path d={viewTargetSide==='left'?'M60 72 V34 H38 V22':'M60 72 V34 H82 V22'} stroke="#1677ff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/><circle cx="60" cy="72" r="5" fill="#19a66a" stroke="white" strokeWidth="2"/><path d={viewTargetSide==='left'?'M38 16 L44 22 L38 28 L32 22 Z':'M82 16 L88 22 L82 28 L76 22 Z'} fill="#1677ff" stroke="white" strokeWidth="1.5"/></svg><span>Destination-aware route · illustrative layout</span></div><div className="first-person-reticle">＋</div><div className="three-scene-bottom-label"><span>● LIVE 3D VIEW</span><b>{String(destination||'DESTINATION').toUpperCase()}</b></div></div>;
}

export default function ThreeWalk({building,floor,destination,routeResult,onBackToPlan}) {
  const [step,setStep]=useState(0); const [ready,setReady]=useState(false); const sceneRef=useRef(null);
  const rooms=(roomsByBuilding[building.id]||roomsByBuilding.lab)[Math.min(floor,(roomsByBuilding[building.id]||roomsByBuilding.lab).length-1)];
  const room=destination||rooms[0];
  const targetRoomIndex=Math.max(0,rooms.findIndex(n=>n.toLowerCase()===String(room).toLowerCase()));
  const targetSide=targetRoomIndex>=4?'right':'left';
  const steps=routeResult?.steps?.length?routeResult.steps.map(s=>s.label):[`Start in ${building.name}`, 'Walk down the central corridor', 'Pass the room signs and follow the orange markers', `Turn toward ${room}`, `Reach the door marked ${room}`, `Arrive at ${room}`];
  const current=Math.min(step,steps.length-1);
  useEffect(()=>{setStep(0);},[building.id,floor,room]);
  const walkForward=()=>{setStep(s=>{const next=Math.min(steps.length-1,s+1);requestAnimationFrame(()=>sceneRef.current?.setPose?.(next,steps.length));return next;});};
  return <section className="three-walk-view"><div className="three-walk-head"><div><span className="three-live-dot"/> IMMERSIVE INDOOR NAVIGATION <small> · 3D corridor view</small></div><span>{building.name} / {floorLabels[floor]||floorLabels[0]}</span></div>
    <FirstPersonScene buildingId={building.id} floor={floor} destination={room} step={step} onSceneReady={setReady} onSceneApi={api=>{sceneRef.current=api;}}/>
    <div className="three-walk-info"><div className="three-destination"><small>DESTINATION</small><strong>{room}</strong><span>{building.name} · {floorLabels[floor]||floorLabels[0]} · hypothetical interior</span></div><div className="three-step-copy"><small>STEP {current+1} OF {steps.length}</small><strong>{steps[current]}</strong><div className="three-progress"><i style={{width:`${((current+1)/steps.length)*100}%`}}/></div></div></div>
    <div className="three-walk-actions"><button className="three-secondary" onClick={()=>setStep(s=>{const next=Math.max(0,s-1);requestAnimationFrame(()=>sceneRef.current?.setPose?.(next,steps.length));return next;})} disabled={step===0}>← Previous point</button><button onClick={walkForward}>Walk forward →</button><button className="three-secondary" onClick={()=>{setStep(0);sceneRef.current?.setPose?.(0,steps.length);}}>Restart walk</button><button className="three-secondary" onClick={onBackToPlan}>Floor plan</button></div>
    {!ready&&<p className="three-fallback-note">3D scene could not initialize. Check WebGL and the Three.js dependency.</p>}<p className="three-disclaimer">Destination-aware 3D indoor simulation inspired by map-style navigation. The route turns toward the selected room and the walkthrough steps move along it. Room positions and corridor geometry remain illustrative, not surveyed GTBIT interiors or Google Street View imagery.</p>
  </section>;
}
