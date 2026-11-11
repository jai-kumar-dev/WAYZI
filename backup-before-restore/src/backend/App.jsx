import { useEffect, useMemo, useRef, useState } from "react";
import { Accessibility, ArrowLeft, ArrowRight, Building2, CheckCircle2, ChevronDown, DoorOpen, Footprints, Layers, MapPin, Navigation, Search, ShieldCheck, TriangleAlert, X, Droplets, BookOpen, FlaskConical, Users, Utensils, Trees, Route, LayoutDashboard } from "lucide-react";
import "./App.css";
import ThreeWalk from "./ThreeWalk.jsx";
import LocationCheckpoints from "./LocationCheckpoints.jsx";
import RouteSurvey from "./RouteSurvey.jsx";
import AccessibleJourney from "./AccessibleJourney.jsx";
import SmartEtaPanel from "./SmartEtaPanel.jsx";
import { calculateCampusRoute, getDemoBlockedLinkIds } from "./navigation.js";

const buildings = [
  { id: "bvs", name: "BVS Block", short: "BVS", x: 150, y: 270, w: 170, h: 205, floors: 5, color: "glass", desc: "Chemistry and Physics labs · auditorium · BVK classrooms · illustrative directory" },
  { id: "academic", name: "Academic Block", short: "ACADEMIC", x: 570, y: 270, w: 190, h: 220, floors: 4, color: "stone", desc: "First gate: administration · second gate: lecture rooms · illustrative directory" },
  { id: "lab", name: "Lab Block", short: "LAB", x: 190, y: 75, w: 540, h: 115, floors: 4, color: "lab", desc: "Four-floor prototype assumption · confirm actual count" },
];
const labRooms = {
  0: ["Main entrance / lobby", "CSE Lab 01", "ECE Lab 01", "EEE Lab 01", "General Lab 01", "General Lab 02", "Boys' washroom", "Girls' washroom", "Water cooler", "Lift 1", "Lift 2", "Staircase"],
  1: ["CSE Programming Lab", "CSE Hardware Lab", "ECE Electronics Lab", "ECE Communication Lab", "EEE Circuits Lab", "EEE Machines Lab", "General Lab 07", "General Lab 08", "Classroom 101", "Boys' washroom", "Girls' washroom", "Water cooler", "Lift 1", "Lift 2", "Staircase"],
  2: ["Reading room", "Quiet study area", "CSE Lab 11", "CSE Lab 12", "ECE Lab 11", "EEE Lab 11", "Project Lab", "Classroom 201", "Boys' washroom", "Girls' washroom", "Water cooler", "Lift 1", "Lift 2", "Staircase"],
  3: ["Advanced Computing Lab", "CSE Project Lab", "ECE Embedded Systems Lab", "ECE Communication Lab", "EEE Power Systems Lab", "EEE Control Lab", "Innovation Lab", "Project discussion room", "Classroom 301", "Boys' washroom", "Girls' washroom", "Water cooler", "Lift 1", "Lift 2", "Staircase"],
};
const floorNames = ["Ground floor", "First floor", "Second floor", "Third floor", "Fourth floor"];
const extraBuildingRooms = {
  // Illustrative directory based on the user's room-name and facility guidance.
  // Exact room positions and floor assignments still need campus verification.
  bvs: [
    "Main entrance / lobby", "Chemistry Lab", "Physics Lab", "Auditorium",
    "BVK12", "BVK13", "BVK14", "BVK15", "BVK16", "BVK17",
    "BVK18", "BVK19", "Boys' washroom", "Girls' washroom",
    "Water cooler", "Lift 1", "Lift 2", "Staircase"
  ],
  academic: [
    "Admin Block · First Gate", "Reception", "Fee Department", "Accounts Office",
    "Admissions Office", "Student Administration", "IDEA Room", "Faculty Admin Office",
    "Boys' washroom", "Girls' washroom", "Water cooler", "Lift 1", "Lift 2", "Staircase",
    "Lecture Block · Second Gate", "Room 104", "Room 202", "Room 204",
    "Lecture Room 105", "Lecture Room 203", "Lecture Room 205", "Seminar Room"
  ]
};
const buildingFloorRooms = {
  bvs: {
    0: ["Main Entrance Lobby", "Reception", "BVK12", "BVK13", "Chemistry Lab", "Physics Lab", "Auditorium", "Boys’ Washroom", "Girls’ Washroom", "Water Cooler", "Lift 1", "Lift 2", "Main Staircase"],
    1: ["BVK21", "BVK22", "BVK23", "BVK24", "Faculty Room", "Tutorial Room", "Boys’ Washroom", "Girls’ Washroom", "Water Cooler", "Lift 1", "Lift 2", "Main Staircase"],
    2: ["BVK31", "BVK32", "BVK33", "BVK34", "Physics Lab Prep", "Chemistry Store", "Seminar Room", "Boys’ Washroom", "Girls’ Washroom", "Water Cooler", "Lift 1", "Lift 2", "Main Staircase"],
    3: ["BVK41", "BVK42", "BVK43", "BVK44", "Project Room", "Faculty Offices", "Boys’ Washroom", "Girls’ Washroom", "Water Cooler", "Lift 1", "Lift 2", "Main Staircase"],
    4: ["BVK51", "BVK52", "Auditorium Control", "Department Office", "Meeting Room", "Store Room", "Boys’ Washroom", "Girls’ Washroom", "Water Cooler", "Lift 1", "Lift 2", "Main Staircase"]
  },
  academic: {
    0: ["Admin Entrance / Lobby", "Reception", "Fee Department", "Accounts Office", "Admissions", "Student Section", "IDEA Room", "Document Help Desk", "Boys’ Washroom", "Girls’ Washroom", "Water Cooler", "Lift 1", "Lift 2", "Main Staircase"],
    1: ["Room 104", "Room 105", "Room 106", "Room 107", "Room 108", "Tutorial Room 109", "Faculty Room", "Seminar Room", "Boys’ Washroom", "Girls’ Washroom", "Water Cooler", "Lift 1", "Lift 2", "Main Staircase"],
    2: ["Room 201", "Room 202", "Room 203", "Room 204", "Room 205", "Room 206", "Faculty Room", "Discussion Room", "Boys’ Washroom", "Girls’ Washroom", "Water Cooler", "Lift 1", "Lift 2", "Main Staircase"],
    3: ["Room 301", "Room 302", "Room 303", "Room 304", "Room 305", "Lecture Hall", "Project Room", "Staff Room", "Boys’ Washroom", "Girls’ Washroom", "Water Cooler", "Lift 1", "Lift 2", "Main Staircase"]
  }
};
const roomsForBuildingFloor = (id, floor) => id === "lab" ? (labRooms[floor] || labRooms[0]) : (buildingFloorRooms[id]?.[floor] || buildingFloorRooms[id]?.[0] || extraBuildingRooms[id] || extraBuildingRooms.bvs);
const roomIcon = (name) => /washroom/i.test(name) ? Users : /water cooler/i.test(name) ? Droplets : /lift/i.test(name) ? Layers : /stair/i.test(name) ? Footprints : /reading|study/i.test(name) ? BookOpen : /lab/i.test(name) ? FlaskConical : /entrance|lobby/i.test(name) ? DoorOpen : /canteen/i.test(name) ? Utensils : Building2;

function CampusDiagram({ selected, onSelect, routeActive, routeResult, startPoint = "Main Gate", destination = "" }) {
  const [zoom, setZoom] = useState(1);
  const [navigationRunning, setNavigationRunning] = useState(false);
  const [navigationMode, setNavigationMode] = useState("gps");
  const [routeProgress, setRouteProgress] = useState(0);
  const [navigationMessage, setNavigationMessage] = useState("");
  const routePathRef = useRef(null);
  const gpsWatchRef = useRef(null);
  const lastGpsRef = useRef(null);
  const walkedMetersRef = useRef(0);
  const stopGps = () => {
    if (gpsWatchRef.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(gpsWatchRef.current);
    gpsWatchRef.current = null;
    lastGpsRef.current = null;
  };
  useEffect(() => {
    stopGps(); setNavigationRunning(false); setRouteProgress(0); setNavigationMessage(""); walkedMetersRef.current = 0;
    return () => stopGps();
  }, [routeResult, startPoint, destination]);
  function startGpsNavigation() {
    stopGps(); walkedMetersRef.current = 0; lastGpsRef.current = null; setRouteProgress(0); setNavigationMode("gps");
    if (!navigator.geolocation) { setNavigationMessage("This browser does not support GPS. Use the simulation button instead."); return; }
    setNavigationRunning(true); setNavigationMessage("Waiting for GPS fix… keep this page open and allow location access.");
    gpsWatchRef.current = navigator.geolocation.watchPosition(position => {
      const current = { lat: position.coords.latitude, lon: position.coords.longitude };
      if (lastGpsRef.current) {
        const rad = Math.PI / 180;
        const dLat = (current.lat - lastGpsRef.current.lat) * rad;
        const dLon = (current.lon - lastGpsRef.current.lon) * rad;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lastGpsRef.current.lat * rad) * Math.cos(current.lat * rad) * Math.sin(dLon / 2) ** 2;
        const delta = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
        // Ignore tiny GPS jitter and implausible jumps.
        if (delta > 1.5 && delta < 40) walkedMetersRef.current += delta;
      }
      lastGpsRef.current = current;
      const accuracy = Math.round(position.coords.accuracy || 0);
      const denominator = Math.max(1, Number(routeResult?.distanceUnits) || 100);
      const progress = Math.min(1, walkedMetersRef.current / denominator);
      setRouteProgress(progress);
      setNavigationMessage(progress >= 1
        ? `Distance-based journey complete · GPS accuracy ±${accuracy} m. Confirm you have reached the destination.`
        : `GPS active · accuracy ±${accuracy} m · moved about ${Math.round(walkedMetersRef.current)} m. Arrow progress is distance-based; it does not detect wrong turns.`);
    }, error => {
      setNavigationRunning(false); stopGps();
      setNavigationMessage(error.code === 1 ? "Location permission was denied. Allow location in browser settings or use simulation." : "GPS signal unavailable. Try outdoors or use simulation.");
    }, { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 });
  }
  useEffect(() => {
    if (!navigationRunning || navigationMode !== "simulate") return undefined;
    const timer = window.setInterval(() => {
      setRouteProgress(current => {
        const next = Math.min(1, current + 0.00625);
        if (next >= 1) {
          window.clearInterval(timer);
          setNavigationRunning(false);
          setNavigationMessage("Destination reached in the demo. This is a simulated journey, not live positioning.");
        }
        return next;
      });
    }, 100);
    return () => window.clearInterval(timer);
  }, [navigationRunning, navigationMode]);
  function startSimulatedNavigation() {
    stopGps(); walkedMetersRef.current = 0; setNavigationMode("simulate"); setRouteProgress(0); setNavigationRunning(true); setNavigationMessage("Demo started · follow the moving arrow and the next-step guidance.");
  }
  function pauseNavigation() { stopGps(); setNavigationRunning(false); setNavigationMessage("Navigation paused."); }
  function speakGuidance(text) {
    if (!("speechSynthesis" in window)) { setNavigationMessage(text); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }
  function getLiveArrowTransform() {
    const path = routePathRef.current;
    if (!path) return null;
    try {
      const length = path.getTotalLength();
      const point = path.getPointAtLength(length * routeProgress);
      const next = path.getPointAtLength(Math.min(length, length * routeProgress + 2));
      const angle = Math.atan2(next.y - point.y, next.x - point.x) * 180 / Math.PI + 90;
      return `translate(${point.x} ${point.y}) rotate(${angle})`;
    } catch { return null; }
  }
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragOrigin = useRef(null);
  const hotspots = [
    { id: "lab", label: "Lab Block", sub: "4 floors · select", x: 47, y: 13, className: "hotspot-lab" },
    { id: "bvs", label: "BVS Block", sub: "5 floors · select", x: 27, y: 51, className: "hotspot-bvs" },
    { id: "academic", label: "Academic Block", sub: "4 floors · select", x: 70, y: 52, className: "hotspot-academic" },
  ];
  const zoomBy = (amount) => setZoom(current => Math.max(1, Math.min(2.5, Number((current + amount).toFixed(2)))));
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };
  function pointerDown(e) {
    if (e.target.closest("button")) return;
    setDragging(true);
    dragOrigin.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function pointerMove(e) {
    if (!dragging || !dragOrigin.current) return;
    setPan({ x: e.clientX - dragOrigin.current.x, y: e.clientY - dragOrigin.current.y });
  }
  function pointerUp() { setDragging(false); dragOrigin.current = null; }
  return <div className={`campus-virtual-map ${dragging ? "is-dragging" : ""}`} aria-label="Interactive GTBIT campus map" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onWheel={e => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); zoomBy(e.deltaY < 0 ? 0.1 : -0.1); } }}>
    <div className="campus-map-world" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
      <img className="campus-reference-image" src="/gtbit-campus-map.png" alt="Illustrative GTBIT campus exterior showing the main gate, fountain, BVS Block, Academic Block, Lab Block, covered connector, central courtyard and canteens" draggable="false" />
      <div className="campus-map-caption"><span className="caption-live-dot"/> GTBIT CAMPUS <span>·</span> EXTERIOR VIEW</div>
      {hotspots.map(point => <button key={point.id} type="button" className={`campus-hotspot ${point.className} ${selected === point.id ? "is-selected" : ""}`} style={{ left: `${point.x}%`, top: `${point.y}%` }} onClick={() => onSelect(point.id)} aria-label={`Select ${point.label}`} aria-pressed={selected === point.id}>
        <span className="hotspot-pulse"/><span className="hotspot-label"><strong>{point.label}</strong><small>{point.sub}</small></span>
      </button>)}
      <button type="button" className="campus-place-marker marker-gate" onClick={() => onSelect("lab")} title="Main Gate — choose a building to explore"><MapPin size={17}/><span>Main Gate</span></button>
      <button type="button" className="campus-place-marker marker-fountain" onClick={() => onSelect("bvs")} title="Fountain, immediately inside the main gate"><Droplets size={16}/><span>Fountain</span></button>
      {routeActive && routeResult && !routeResult.error && (() => {
        // Route coordinates are schematic positions on the approved campus illustration.
        // The canteen route explicitly follows Fountain → BVS → Canteen 1 → Canteen 2.
        const coords = {
          "Main Gate": [720, 895], "Fountain": [720, 775],
          "BVS Block entrance": [355, 690], "Academic Block entrance": [1085, 710],
          "Lab Block entrance": [720, 245], "Lab Block · Lift lobby": [720, 225],
          "Canteen 1": [90, 520], "Canteen 2": [90, 360]
        };
        const destinationNode = Object.keys(coords).find(name => name.toLowerCase() === destination.toLowerCase());
        const targetName = destinationNode || (/bvs/i.test(destination) ? "BVS Block entrance" : /academic/i.test(destination) ? "Academic Block entrance" : /lab block/i.test(destination) ? "Lab Block entrance" : selected === "bvs" ? "BVS Block entrance" : selected === "academic" ? "Academic Block entrance" : "Lab Block entrance");
        const startName = startPoint === "Lab Block · Lift lobby" ? "Lab Block entrance" : (coords[startPoint] ? startPoint : "Main Gate");
        const routeEdges = [
          ["Main Gate", "Fountain", 5], ["Fountain", "BVS Block entrance", 7],
          ["Fountain", "Academic Block entrance", 8], ["Fountain", "Lab Block entrance", 100],
          ["BVS Block entrance", "Canteen 1", 50], ["Canteen 1", "Canteen 2", 70]
        ];
        const graph = new Map(Object.keys(coords).map(name => [name, []]));
        routeEdges.forEach(([a,b,w]) => { graph.get(a).push({to:b,w}); graph.get(b).push({to:a,w}); });
        const dist = new Map([[startName, 0]]), prev = new Map(), todo = new Set(graph.keys());
        while (todo.size) {
          let current = null, best = Infinity;
          todo.forEach(name => { const value = dist.get(name) ?? Infinity; if (value < best) { best = value; current = name; } });
          if (!current || best === Infinity) break;
          todo.delete(current); if (current === targetName) break;
          (graph.get(current) || []).forEach(edge => { if (!todo.has(edge.to)) return; const candidate = best + edge.w; if (candidate < (dist.get(edge.to) ?? Infinity)) { dist.set(edge.to, candidate); prev.set(edge.to, current); } });
        }
        const nodePath = [targetName]; let cursor = targetName;
        while (cursor !== startName && prev.has(cursor)) { cursor = prev.get(cursor); nodePath.unshift(cursor); }
        const points = nodePath[0] === startName && dist.has(targetName) ? nodePath.map(name => coords[name]) : [coords[startName], coords[targetName]];
        const d = points.map((point, i) => `${i === 0 ? "M" : "L"}${point[0]} ${point[1]}`).join(" ");
        return <>
          <svg className="campus-route-overlay" viewBox="0 0 1536 1024" preserveAspectRatio="none" aria-label={`Illustrative route from ${startPoint} to ${destination}`}>
            <defs><filter id="routeGlow"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
            <path d={d} fill="none" stroke="#ffffff" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" opacity=".95"/>
            <path ref={routePathRef} d={d} fill="none" stroke="#1769ff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" filter="url(#routeGlow)"/>
            <path d={d} fill="none" stroke="#b8d2ff" strokeWidth="3" strokeDasharray="7 11" strokeLinecap="round" className="route-line-animated"/>
            <circle cx={points[0][0]} cy={points[0][1]} r="14" fill="#1769ff" stroke="#fff" strokeWidth="5"/>
            <circle cx={points[points.length-1][0]} cy={points[points.length-1][1]} r="14" fill="#16a36a" stroke="#fff" strokeWidth="5"/>
            {(navigationRunning || routeProgress > 0) && getLiveArrowTransform() && <g className="live-route-arrow" transform={getLiveArrowTransform()}><path d="M0 -17 L12 13 L0 7 L-12 13 Z" fill="#ff7a1a" stroke="#fff" strokeWidth="3"/></g>}
          </svg>
          <div className="map-navigation-control">
            <div><span className={`nav-live-indicator ${navigationRunning ? "running" : ""}`}/><span><strong>{navigationRunning ? (navigationMode === "gps" ? "GPS navigation progress" : "Demo navigation") : "Route ready"}</strong><small>{navigationRunning ? (navigationMode === "gps" ? "Arrow advances with distance walked" : "Arrow is moving along the route") : "Choose GPS progress or simulation"}</small></span></div>
            <div className="map-navigation-buttons"><button type="button" onClick={navigationRunning ? pauseNavigation : startGpsNavigation}>{navigationRunning && navigationMode === "gps" ? "Pause GPS" : "Use GPS"}</button><button type="button" className="nav-sim-button" onClick={navigationRunning && navigationMode === "simulate" ? pauseNavigation : startSimulatedNavigation}>{navigationRunning && navigationMode === "simulate" ? "Pause demo" : "Simulate"}</button></div>
          </div>
          <div className="map-route-destination-pill"><MapPin size={14}/><span>{destination}</span></div>
          <div className="map-turn-guidance">
            <div className="map-guidance-top"><span>{routeProgress >= 1 ? "ARRIVED (DEMO)" : navigationRunning ? "FOLLOW THE ROUTE" : "ROUTE PREVIEW"}</span><strong>{Math.round(routeProgress * 100)}%</strong></div>
            <div className="map-guidance-progress"><span style={{width:`${Math.round(routeProgress * 100)}%`}} /></div>
            <strong className="map-guidance-title">{routeProgress >= 1 ? `You should now be at ${destination}` : navigationRunning ? `Continue toward ${nodePath[Math.min(nodePath.length - 1, Math.floor(routeProgress * (nodePath.length - 1)) + 1)] || destination}` : `Ready to navigate to ${destination}`}</strong>
            <small>{nodePath.slice(1).join(" → ")}</small>
            <button type="button" onClick={() => speakGuidance(routeProgress >= 1 ? `You should now be at ${destination}` : `Continue toward ${nodePath[Math.min(nodePath.length - 1, Math.floor(routeProgress * (nodePath.length - 1)) + 1)] || destination}`)}><Navigation size={14}/> Speak guidance</button>
          </div>
          {navigationMessage && <div className="map-navigation-message">{navigationMessage}</div>}
        </>;
      })()}

    </div>
    <div className="map-zoom-controls" aria-label="Map controls">
      <button type="button" onClick={() => zoomBy(0.2)} disabled={zoom >= 2.5} aria-label="Zoom in" title="Zoom in">+</button>
      <span>{Math.round(zoom * 100)}%</span>
      <button type="button" onClick={() => zoomBy(-0.2)} disabled={zoom <= 1} aria-label="Zoom out" title="Zoom out">−</button>
      <button type="button" onClick={resetView} aria-label="Reset map view" title="Reset map view"><Navigation size={14}/></button>
    </div>
    <div className="campus-map-legend"><span><i className="legend-pin blue-pin"/> Click a building to explore</span><span><i className="legend-pin orange-pin"/> Demo route</span><span className="map-scale-note">Drag to pan · Ctrl/⌘ + scroll to zoom · illustrative layout</span></div>
  </div>;
}
function FloorDiagram({ floor, destination, onDestination, routeResult, buildingId = "lab", activeStepId = "", walkingProgress = 0 }) {
  const rooms = roomsForBuildingFloor(buildingId, floor);
  const nodes = rooms.map((name,i)=>({name,x:70+(i%4)*155,y:70+Math.floor(i/4)*105}));
  // Draw only the portion of the calculated route that belongs to this floor.
  // The corridor hub and room positions are schematic, not surveyed geometry.
  const routePoints = (routeResult?.steps || []).flatMap(step => {
    if (step.id === `corridor:${floor}`) return [{ x: 345, y: 195 }];
    const match = step.id.match(/^room:(\d+):(.+)$/);
    if (!match || Number(match[1]) !== floor) return [];
    const room = nodes.find(node => keyForMap(node.name) === match[2]);
    return room ? [{ x: room.x + 63, y: room.y + 28.5 }] : [];
  });
  const pointForStep = (step) => {
    if (step?.id === `corridor:${floor}`) return { x: 345, y: 195 };
    const match = String(step?.id || "").match(/^room:(\d+):(.+)$/);
    if (!match || Number(match[1]) !== floor) return null;
    const room = nodes.find(node => keyForMap(node.name) === match[2]);
    return room ? { x: room.x + 63, y: room.y + 28.5 } : null;
  };
  const activeIndex = (routeResult?.steps || []).findIndex(step => step.id === activeStepId);
  const activeStep = activeIndex >= 0 ? routeResult.steps[activeIndex] : null;
  const currentPoint = pointForStep(activeStep);
  const previousPoint = activeIndex > 0 ? pointForStep(routeResult.steps[activeIndex - 1]) : null;
  const t = Math.max(0, Math.min(1, walkingProgress));
  const activePoint = currentPoint && previousPoint
    ? { x: previousPoint.x + (currentPoint.x - previousPoint.x) * t, y: previousPoint.y + (currentPoint.y - previousPoint.y) * t }
    : currentPoint;
  return <svg className="floor-svg" viewBox="0 0 690 400" role="img" aria-label={`${floorNames[floor]} illustrative floor plan`}>
    <rect x="20" y="20" width="650" height="360" rx="14" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="3"/><path d="M40 195H650M345 40V360" stroke="#b8c6d4" strokeWidth="14"/><path d="M40 195H650M345 40V360" stroke="#fff" strokeWidth="3" strokeDasharray="8 7"/>
    {routeResult && routePoints.length > 1 && <g aria-label="Calculated route segment"><polyline points={routePoints.map(point=>`${point.x},${point.y}`).join(" ")} fill="none" stroke="#ee7b35" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity=".92"/><polyline points={routePoints.map(point=>`${point.x},${point.y}`).join(" ")} fill="none" stroke="#fff4e8" strokeWidth="2" strokeDasharray="5 7" strokeLinecap="round"/><circle cx={routePoints[0].x} cy={routePoints[0].y} r="6" fill="#ee7b35" stroke="#fff" strokeWidth="2"/><circle cx={routePoints[routePoints.length-1].x} cy={routePoints[routePoints.length-1].y} r="6" fill="#ee7b35" stroke="#fff" strokeWidth="2"/></g>}
    {activePoint && <g className="indoor-live-marker" transform={`translate(${activePoint.x} ${activePoint.y})`} aria-label="Estimated current position"><circle r="17" fill="#2563eb" opacity=".18"/><circle r="9" fill="#2563eb" stroke="#fff" strokeWidth="3"/><path d="M0 -5 L4 3 L0 1 L-4 3 Z" fill="#fff"/><text x="16" y="-12" fontSize="11" fontWeight="800" fill="#1d4ed8">YOU</text></g>}
    {nodes.map((r,i)=>{return <g key={r.name} onClick={()=>onDestination(r.name, floor)} className={`room-node ${destination===r.name?"room-node-selected":""}`} role="button" tabIndex="0" onKeyDown={e=>{if(e.key==="Enter")onDestination(r.name, floor)}}><rect x={r.x} y={r.y} width="126" height="57" rx="8" fill={destination===r.name?"#dbeafe":/washroom|water cooler|lift|stair/i.test(r.name)?"#eef6f2":"#fff"} stroke={destination===r.name?"#2563eb":"#b8c6d4"} strokeWidth={destination===r.name?3:1.3}/><text x={r.x+63} y={r.y+24} textAnchor="middle" className="room-label">{r.name.length>19?r.name.slice(0,18)+"…":r.name}</text><text x={r.x+63} y={r.y+41} textAnchor="middle" className="room-sub">{/ washroom|water cooler/i.test(r.name)?"FACILITY":/lift|stair/i.test(r.name)?"VERTICAL ACCESS":/chemistry|physics|lab/i.test(r.name)?"LABORATORY":/gate|lecture block/i.test(r.name)?"ENTRANCE":/fee|accounts|admissions|admin|reception|idea/i.test(r.name)?"ADMINISTRATION":/bvk|room 10|room 20|lecture room/i.test(r.name)?"CLASSROOM":"ROOM"}</text></g>})}
    <text x="345" y="390" textAnchor="middle" className="tiny-label">{routeResult ? "ORANGE LINE = CALCULATED FLOOR SEGMENT · SCHEMATIC" : "ROOM POSITIONS ARE ILLUSTRATIVE · SELECT A ROOM"}</text>
  </svg>;
}


function WalkView({ building, floor, destination, routeResult, onBackToPlan }) {
  return <ThreeWalk building={building} floor={floor} destination={destination} routeResult={routeResult} onBackToPlan={onBackToPlan} />;
}

function keyForMap(value) {
  return String(value).trim().toLowerCase();
}

function App() {
  const [view,setView] = useState("navigate");
  const [accessibleStart,setAccessibleStart] = useState("Main Gate");
  const [accessibleDestination,setAccessibleDestination] = useState("BVS Block · BVK12");
  const [accessiblePreview,setAccessiblePreview] = useState(false);
  const accessibleAssessment = useMemo(() => {
    const dest = accessibleDestination.toLowerCase();
    const start = accessibleStart.toLowerCase();
    if (start.includes("lab block entrance")) return {state:"blocked",title:"This starting point is not step-free",detail:"The Lab Block entrance has stairs. The internal lift cannot help until a step-free entrance to the building is confirmed.",reason:"Stair-only entrance reported",steps:["Selected entrance", "Step-free entrance unavailable", "Journey cannot continue"]};
    if (dest.includes("room 202")) return {state:"blocked",title:"Destination is above the accessible floor",detail:"You reported that Academic Block has a ramp at its second gate but no lift. Room 202 is on the second floor, so this destination must not be offered as wheelchair-accessible.",reason:"No lift reported for Academic Block",steps:[accessibleStart,"Academic Block · Second Gate","Room 202 · access blocked"]};
    if (dest.includes("reading room") && !start.includes("lab block · lift lobby")) return {state:"blocked",title:"Lab Block entrance access is unresolved",detail:"The Lab Block lift is inside the building, but the entrance has stairs. Start from the lift lobby only if already inside; from outside, a step-free entrance has not been confirmed.",reason:"Step-free entrance not confirmed",steps:[accessibleStart,"Lab Block entrance · stairs reported","Reading Room · route blocked"]};
    return {state:"unknown",title:"Step-free route not verified yet",detail:"The destination may be reachable based on reported facilities, but the full path, entrance, doorway clearance and any lift connection have not been surveyed and verified. Treat this as a planning check, not navigation guidance.",reason:"One or more links are unverified",steps:[accessibleStart,"Campus path · reported / unverified",accessibleDestination]};
  }, [accessibleStart, accessibleDestination]);
  const [selectedBuilding,setSelectedBuilding] = useState("lab");
  const [showIndoor,setShowIndoor] = useState(false);
  const [interiorMode,setInteriorMode] = useState("plan");
  const [enteringBuilding,setEnteringBuilding] = useState(false);
  const [floor,setFloor] = useState(0);
  const [search,setSearch] = useState("");
  const [destination,setDestination] = useState("");
  const [start,setStart] = useState("Main Gate");
  const [routeReady,setRouteReady] = useState(false);
  const [routeResult,setRouteResult] = useState(null);
  const [indoorStep,setIndoorStep] = useState(0);
  const [indoorNavigating,setIndoorNavigating] = useState(false);
  const [indoorWalkTracking,setIndoorWalkTracking] = useState(false);
  const [indoorSensorStatus,setIndoorSensorStatus] = useState("Not started");
  const [indoorDetectedSteps,setIndoorDetectedSteps] = useState(0);
  const motionPeakRef = useRef({lastPeak:0, baseline:0, lastStepAt:0, steps:0});
  const [blockedLinks,setBlockedLinks] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem("campusaccess-v34-blocked-links") || "[]"); }
    catch { return []; }
  });
  const [reports,setReports] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem("campusaccess-v34-reports") || "[]"); }
    catch { return []; }
  });
  const [reportType,setReportType] = useState("Blocked path");
  const [reportLocation,setReportLocation] = useState("corridor:0|room:0:lift 1");
  const [reportText,setReportText] = useState("");
  const [message,setMessage] = useState("");
  const building = buildings.find(b=>b.id===selectedBuilding) || buildings[2];
  useEffect(() => {
    try { window.localStorage.setItem("campusaccess-v34-blocked-links", JSON.stringify(blockedLinks)); } catch { /* storage may be unavailable */ }
  }, [blockedLinks]);
  useEffect(() => {
    try { window.localStorage.setItem("campusaccess-v34-reports", JSON.stringify(reports)); } catch { /* storage may be unavailable */ }
  }, [reports]);
  const allDestinations = useMemo(()=>[
    {name:"Main Gate",building:"Campus",buildingId:"campus",floor:null},{name:"Fountain",building:"Campus",buildingId:"campus",floor:null},{name:"Canteen 1",building:"Campus",buildingId:"campus",floor:null},{name:"Canteen 2",building:"Campus",buildingId:"campus",floor:null},
    ...Object.entries(labRooms).flatMap(([f,rooms])=>rooms.map(name=>({name,building:"Lab Block",buildingId:"lab",floor:Number(f)}))),
    ...Object.entries(buildingFloorRooms).flatMap(([id,floors])=>Object.entries(floors).flatMap(([f,rooms])=>rooms.map(name=>({name,building:buildings.find(b=>b.id===id).name,buildingId:id,floor:Number(f)}))))
  ],[]);
  const results = allDestinations.filter(d=>d.name.toLowerCase().includes(search.toLowerCase()));
  function enterLabInterior(){
    setSelectedBuilding("lab");
    setDestination("");
    setRouteReady(false);
    setRouteResult(null);
    setEnteringBuilding(true);
    window.setTimeout(() => { setShowIndoor(true); setEnteringBuilding(false); }, 620);
  }
  function chooseBuilding(id){
    setSelectedBuilding(id); setDestination(""); setRouteReady(false); setRouteResult(null); setMessage("");
    if(id === "lab") enterLabInterior(); else { setFloor(0); setEnteringBuilding(true); window.setTimeout(() => { setShowIndoor(true); setEnteringBuilding(false); }, 420); }
  }
  function chooseDestination(name, destFloor){
    const match = allDestinations.find(d=>d.name===name && (d.floor===destFloor || destFloor==null));
    setDestination(name); setRouteReady(false); setRouteResult(null); setMessage("");
    if(match?.buildingId && ["bvs","academic","lab"].includes(match.buildingId)){ setSelectedBuilding(match.buildingId); setShowIndoor(true); setFloor(destFloor ?? 0); }
    else { setShowIndoor(false); }
  }
  useEffect(() => {
    if (!indoorWalkTracking) return undefined;
    const onMotion = (event) => {
      const a = event.accelerationIncludingGravity;
      if (!a) return;
      const magnitude = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
      const now = Date.now();
      const data = motionPeakRef.current;
      data.baseline = data.baseline ? data.baseline * 0.88 + magnitude * 0.12 : magnitude;
      const deviation = Math.abs(magnitude - data.baseline);
      if (deviation > 1.15 && now - data.lastStepAt > 330) {
        data.lastStepAt = now;
        const next = (motionPeakRef.current.steps || 0) + 1;
        motionPeakRef.current.steps = next;
        setIndoorDetectedSteps(next);
        // This is a step-count estimate: advance the route instruction every 7 detected steps.
        if (next % 7 === 0) setIndoorStep(current => {
          const max = Math.max(0, (routeResult?.steps?.length || 1) - 1);
          const nextStep = Math.min(max, current + 1);
          const target = routeResult?.steps?.[nextStep];
          const floorMatch = String(target?.id || "").match(/(?:room|corridor):(\d+):?/);
          if (floorMatch) setFloor(Number(floorMatch[1]));
          if (nextStep >= max) { setIndoorWalkTracking(false); setIndoorSensorStatus("Destination step reached — confirm the room visually"); }
          if (target && "speechSynthesis" in window) { window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(`Continue to ${target.label}`)); }
          return nextStep;
        });
        setIndoorSensorStatus(`Walking detected · ${next} estimated steps`);
      }
    };
    window.addEventListener("devicemotion", onMotion, true);
    setIndoorSensorStatus("Walk sensor active · move your phone naturally while walking");
    return () => window.removeEventListener("devicemotion", onMotion, true);
  }, [indoorWalkTracking, routeResult, destination]);
  async function startIndoorWalkTracking() {
    if (!routeResult?.steps?.length) return;
    const motion = window.DeviceMotionEvent;
    if (!motion) { setIndoorSensorStatus("Motion sensor unavailable in this browser. Use QR checkpoints or Next step."); return; }
    try {
      if (typeof motion.requestPermission === "function") {
        const permission = await motion.requestPermission();
        if (permission !== "granted") { setIndoorSensorStatus("Motion permission denied. Enable it in browser settings or use Next step."); return; }
      }
      motionPeakRef.current = {lastPeak:0, baseline:0, lastStepAt:0, steps:0};
      setIndoorDetectedSteps(0);
      setIndoorNavigating(true);
      setIndoorStep(0);
      setIndoorWalkTracking(true);
      setIndoorSensorStatus("Waiting for walking movement…");
    } catch {
      setIndoorSensorStatus("Could not start motion sensor. Use Next step or QR checkpoints.");
    }
  }
  function previewRoute(){if(!destination){setMessage("Choose a destination from search first.");return;}const match=allDestinations.find(d=>d.name===destination && (d.floor===floor || d.floor===null));const result=calculateCampusRoute({start,destination,destinationFloor:match?.floor,buildingId:match?.buildingId,blockedLinks});setRouteResult(result);setRouteReady(!result.error);setIndoorStep(0);setIndoorNavigating(false);setMessage(result.error || "Route calculated using illustrative campus and indoor data.");}
  function loadJudgeDemo(){
    const demoStart = "Main Gate";
    const demoDestination = "Reading room";
    const demoFloor = 2;
    const result = calculateCampusRoute({start:demoStart,destination:demoDestination,destinationFloor:demoFloor,buildingId:"lab",blockedLinks});
    setView("navigate");
    setSelectedBuilding("lab");
    setShowIndoor(true);
    setInteriorMode("plan");
    setFloor(demoFloor);
    setStart(demoStart);
    setSearch(demoDestination);
    setDestination(demoDestination);
    setRouteResult(result);
    setRouteReady(!result.error);
    setIndoorStep(0);
    setIndoorNavigating(false);
    setIndoorWalkTracking(false);
    setIndoorSensorStatus("Not started");
    setReportType("Lift out of service");
    setReportLocation("corridor:0|room:0:lift 1");
    setReportText("");
    setMessage(result.error || "Judge demo loaded: Main Gate → Lab Block → Reading Room. Next, submit the preselected Lift 1 outage, verify it in Admin, then recalculate to see the stair alternative.");
  }
  function resetDemoData(){
    setReports([]); setBlockedLinks([]); setRouteReady(false); setRouteResult(null); setIndoorNavigating(false); setIndoorWalkTracking(false); setIndoorDetectedSteps(0); setIndoorStep(0); setIndoorSensorStatus("Not started");
    try { window.localStorage.removeItem("campusaccess-v34-reports"); window.localStorage.removeItem("campusaccess-v34-blocked-links"); } catch { /* storage may be unavailable */ }
    setMessage("Demo data reset. No real campus reports or facility states were changed.");
  }
  function goToIndoorStep(nextIndex){
    if(!routeResult?.steps?.length) return;
    const index=Math.max(0,Math.min(routeResult.steps.length-1,nextIndex));
    setIndoorStep(index);
    const step=routeResult.steps[index];
    const floorMatch=String(step.id||"").match(/(?:room|corridor):(\d+):?/);
    if(floorMatch) setFloor(Number(floorMatch[1]));
    const via=String(step.via||"").toLowerCase();
    const instruction=index===routeResult.steps.length-1 ? `You have reached ${destination}.` : via.includes("lift") ? `Go to ${step.label}. Follow the lift route to the next floor.` : via.includes("stairs") ? `Follow the stairs to ${step.label}.` : index===0 ? `Start at ${step.label}.` : `Continue along the corridor to ${step.label}.`;
    if("speechSynthesis" in window){window.speechSynthesis.cancel();window.speechSynthesis.speak(new SpeechSynthesisUtterance(instruction));}
  }
  function submitReport(e){e.preventDefault();if(!reportText.trim()){setMessage("Please add a description.");return;}setReports(old=>[{id:Date.now(),type:reportType,locationId:reportLocation,locationLabel:getDemoBlockedLinkIds().find(link=>link.id===reportLocation)?.label || "General campus issue",text:reportText.trim(),status:"Pending review",time:new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})},...old]);setReportText("");setMessage("Report submitted to the local demo queue for admin review.");}
  function verifyReport(id){const report=reports.find(r=>r.id===id);if(!report)return;setReports(old=>old.map(r=>r.id===id?{...r,status:"Verified · route restricted"}:r));if(["Blocked path","Lift out of service","Ramp/accessibility issue","Entrance closed"].includes(report.type)){let ids=[report.locationId];if(report.type==="Lift out of service" && /lift 1/i.test(report.locationLabel)){for(let f=0;f<4;f++){ids.push([`corridor:${f}`,`room:${f}:lift 1`].sort().join("|"));if(f<3)ids.push([`room:${f}:lift 1`,`room:${f+1}:lift 1`].sort().join("|"));}/* The demo graph also has a direct Ground→Second Floor lift shortcut; block it too when Lift 1 is unavailable. */ids.push(["room:0:lift 1","room:2:lift 1"].sort().join("|"));}if(report.type==="Lift out of service" && /lift 2/i.test(report.locationLabel)){for(let f=0;f<4;f++){ids.push([`corridor:${f}`,`room:${f}:lift 2`].sort().join("|"));if(f<3)ids.push([`room:${f}:lift 2`,`room:${f+1}:lift 2`].sort().join("|"));}}setBlockedLinks(old=>[...new Set([...old,...ids])]);setRouteReady(false);setRouteResult(null);setMessage(`Report verified. ${report.type==="Lift out of service"?"The selected lift's demo connections":"The selected demo connection"} are now restricted; calculate the route again to test rerouting.`);}else{setMessage("Report marked verified. This report type does not automatically block a route connection.");}}
  return <div className="app-shell">
    <header className="topbar"><button className="brand" onClick={()=>{setView("navigate");setShowIndoor(false)}}><span className="brand-mark"><Accessibility size={22}/></span><span><strong>CampusAccess</strong><small>Navigate without barriers</small></span></button><div className="topbar-right"><span className="campus-chip"><span className="status-dot"/>GTBIT · Rajouri Garden</span><button className={`nav-link ${view==="navigate"?"active":""}`} onClick={()=>setView("navigate")}><Navigation size={16}/>Navigate</button><button className={`nav-link ${view==="accessible"?"active":""}`} onClick={()=>{setView("accessible");setShowIndoor(false);setAccessiblePreview(false)}}><Accessibility size={16}/>Accessible Journey</button><button className={`nav-link ${view==="report"?"active":""}`} onClick={()=>setView("report")}><TriangleAlert size={16}/>Report issue</button><button className={`nav-link ${view==="admin"?"active":""}`} onClick={()=>setView("admin")}><ShieldCheck size={16}/>Admin</button></div></header>
    {enteringBuilding && <div className="building-entry-transition" role="status" aria-live="polite"><div className="entry-orbit"><Building2 size={38}/></div><span className="entry-kicker">ENTERING BUILDING</span><strong>{buildings.find(b=>b.id===selectedBuilding)?.name || "Campus building"}</strong><small>Loading illustrative indoor map…</small><div className="entry-progress"><span/></div></div>}
    {view==="accessible"&&<AccessibleJourney/>}
    {view==="navigate"&&<main className={`main-layout ${showIndoor ? "indoor-active" : "campus-active"}`}><aside className="sidebar"><div className="eyebrow">CAMPUS WAYFINDING</div><h1>Find your way.<br/><span>On your terms.</span></h1><p className="intro">Explore the GTBIT campus schematic, select a building, and browse an illustrative indoor directory.</p>
      <div className="route-card"><div className="route-card-title"><div><Route size={18}/><strong>Plan a journey</strong></div><span className="demo-pill">DEMO</span></div><button type="button" className="primary-button" onClick={loadJudgeDemo}><Navigation size={16}/> Load judge demo journey</button><p className="form-footnote">Loads Main Gate → Lab Block Reading Room (Second Floor), then test report → admin verification → rerouting.</p><LocationCheckpoints onCheckpoint={(checkpointStart, checkpointLabel) => { setStart(checkpointStart); setRouteReady(false); setRouteResult(null); setMessage(`Starting point confirmed: ${checkpointLabel}. Choose a destination and calculate the route.`); }} /><label>STARTING POINT</label><select value={start} onChange={e=>{setStart(e.target.value);setRouteReady(false);setRouteResult(null)}}><option>Main Gate</option><option>Fountain</option><option>BVS Block entrance</option><option>Academic Block entrance</option><option>Lab Block entrance</option><option>Lab Block · Lift lobby</option></select><p className="indoor-start-hint">For navigation already inside the Lab Block, choose <strong>Lab Block · Lift lobby</strong> as your starting point.</p><label>DESTINATION SEARCH</label><div className="search-field"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search labs, washrooms, facilities…"/><button className="clear-search" onClick={()=>setSearch("")} aria-label="Clear search"><X size={14}/></button></div><div className="destination-results">{results.slice(0,7).map(d=><button key={`${d.name}-${d.floor}`} className={`destination-result ${destination===d.name?"chosen":""}`} onClick={()=>chooseDestination(d.name,d.floor)}><span className="result-icon">{(()=>{const I=roomIcon(d.name);return <I size={16}/>})()}</span><span><strong>{d.name}</strong><small>{d.building}{d.floor!==null?` · ${floorNames[d.floor]}`:""}</small></span><ArrowRight size={15}/></button>)}{results.length===0&&<p className="empty-search">No matching demo destinations.</p>}</div><button className="primary-button" onClick={previewRoute}><Footprints size={18}/>Calculate route</button>{message&&<p className="inline-message">{message}</p>}
      <div className="access-note"><Accessibility size={20}/><div><strong>Accessibility status</strong><small>Ramps, lift access and step-free connections are not verified yet.</small></div></div></div>
      {routeReady && routeResult && !routeResult.error && <SmartEtaPanel routeResult={routeResult} start={start} destination={destination} />}
      <div className="building-picker"><div className="section-heading"><strong>Explore buildings</strong><span>3 blocks + 2 canteens</span></div>{buildings.map(b=><button key={b.id} className={`building-option ${selectedBuilding===b.id?"selected":""}`} onClick={()=>chooseBuilding(b.id)}><span className={`building-swatch ${b.color}`}>{b.id==="lab"?<FlaskConical size={18}/>:<Building2 size={18}/>}</span><span><strong>{b.name}</strong><small>{b.desc}</small></span><ChevronDown size={16}/></button>)}<button className="building-option canteen-option" onClick={()=>chooseDestination("Canteen 1",null)}><span className="building-swatch"><Utensils size={18}/></span><span><strong>Canteen 1</strong><small>Route to first canteen · illustrative path</small></span><ArrowRight size={16}/></button><button className="building-option canteen-option" onClick={()=>chooseDestination("Canteen 2",null)}><span className="building-swatch"><Utensils size={18}/></span><span><strong>Canteen 2</strong><small>Route to second canteen · illustrative path</small></span><ArrowRight size={16}/></button></div>
      <div className="disclaimer"><ShieldCheck size={16}/><span><strong>Data transparency</strong><br/>Campus arrangement is based on your sketch/photos. Indoor room positions are illustrative and not official.</span></div>
    </aside><section className="map-panel"><div className="map-toolbar"><div><span className="live-map-dot"/><div><strong>{showIndoor?`${building.name} · ${floorNames[floor]}`:"GTBIT campus overview"}</strong><small>{showIndoor?"Illustrative indoor room directory":"Exterior reference with interactive building hotspots"}</small></div></div><div className="toolbar-actions"><button className={!showIndoor?"active":""} onClick={()=>setShowIndoor(false)}><MapPin size={15}/>Campus</button><button className={showIndoor?"active":""} onClick={enterLabInterior}><Layers size={15}/>Indoor</button></div></div>
      {showIndoor?<><div className="floor-toolbar"><div><span className="floor-kicker">{building.name.toUpperCase()}</span><strong>Select a floor</strong></div><div className="floor-tabs">{floorNames.slice(0, building.id === "bvs" ? 5 : 4).map((n,i)=><button key={n} className={floor===i?"active":""} onClick={()=>{setFloor(i);setDestination("");setRouteReady(false);setRouteResult(null)}}>{["G","1","2","3","4"][i]}<small>{n}</small></button>)}</div></div><div className="interior-mode-tabs"><button className={interiorMode === "plan" ? "active" : ""} onClick={() => setInteriorMode("plan")}><Layers size={14}/> Floor plan</button><button className={interiorMode === "walk" ? "active" : ""} onClick={() => setInteriorMode("walk")}><Footprints size={14}/> 3D Walk</button><span>Illustrative walkthrough</span></div>{interiorMode === "walk" ? <WalkView building={building} floor={floor} destination={destination} routeResult={routeReady && routeResult && !routeResult.error ? routeResult : null} onBackToPlan={() => setInteriorMode("plan")}/> : <div className="floor-canvas immersive-floor"><div className="floor-depth-label"><span className="depth-dot"/> INTERIOR VIEW <span>·</span> {floorNames[floor].toUpperCase()}</div><div className="floor-slab"><FloorDiagram floor={floor} destination={destination} onDestination={chooseDestination} buildingId={building.id} routeResult={routeReady && routeResult && !routeResult.error ? routeResult : null} activeStepId={routeResult?.steps?.[indoorStep]?.id || ""} walkingProgress={indoorDetectedSteps % 7 / 7}/></div><div className="floor-depth-caption">{building.id === "lab" ? "Lab Block prototype interior · advanced virtual interior planned next" : "Illustrative prototype interior · room names and positions are assumptions"} · select any room to explore</div></div>}<div className="map-bottom-note"><span><span className="legend-dot blue"/>Selected room</span><span><span className="legend-dot green"/>Facilities</span>{routeReady && routeResult && !routeResult.error && <span><span className="legend-dot orange"/>Calculated route segment</span>}<span><TriangleAlert size={14}/> Room layout illustrative</span></div>{destination&&<div className="selected-destination"><div className="selected-destination-icon"><MapPin size={18}/></div><div><strong>{destination}</strong><small>{building.name} · {floorNames[floor]} · location illustrative</small></div><button onClick={previewRoute}>Show route <ArrowRight size={15}/></button></div>}{routeReady&&routeResult&&!routeResult.error&&<div className="route-preview route-result"><CheckCircle2 size={17}/><div className="route-result-content"><strong>Indoor route calculated</strong><small>{start} → {destination} · {routeResult.estimatedDistance}</small><section className="indoor-guidance-card" aria-live="polite"><div className="indoor-guidance-kicker">{indoorNavigating ? `STEP ${indoorStep+1} OF ${routeResult.steps.length}` : "INDOOR TURN-BY-TURN"}</div><strong className="indoor-guidance-title">{indoorStep>=routeResult.steps.length-1 ? `Arrive at ${destination}` : indoorStep===0 ? `Start at ${routeResult.steps[indoorStep]?.label || start}` : String(routeResult.steps[indoorStep]?.via||"").toLowerCase().includes("lift") ? `Use the lift near ${routeResult.steps[indoorStep]?.label}` : String(routeResult.steps[indoorStep]?.via||"").includes("stairs") ? `Take the stairs toward ${routeResult.steps[indoorStep]?.label}` : `Continue to ${routeResult.steps[indoorStep]?.label}`}</strong><p>{routeResult.steps[indoorStep]?.label || destination}{routeResult.steps[indoorStep]?.via && routeResult.steps[indoorStep].via !== "start" ? ` · ${routeResult.steps[indoorStep].via}` : " · Starting point"}</p><div className="indoor-step-progress"><span style={{width:`${Math.round(((indoorStep+1)/routeResult.steps.length)*100)}%`}}/></div><div className="indoor-guidance-actions"><button type="button" className="primary-button" onClick={()=>{if(!indoorNavigating){setIndoorNavigating(true);goToIndoorStep(indoorStep);}else{goToIndoorStep(Math.min(indoorStep+1,routeResult.steps.length-1));}}}>{indoorNavigating && indoorStep>=routeResult.steps.length-1 ? "At destination" : indoorNavigating ? "Next step" : "Start indoor navigation"}<ArrowRight size={15}/></button><button type="button" onClick={()=>goToIndoorStep(Math.max(0,indoorStep-1))} disabled={indoorStep===0}>Previous</button><button type="button" onClick={()=>goToIndoorStep(indoorStep)} title="Read current instruction aloud">Speak</button><button type="button" className={indoorWalkTracking ? "sensor-active" : ""} onClick={indoorWalkTracking ? () => {setIndoorWalkTracking(false);setIndoorSensorStatus("Walk tracking paused")} : startIndoorWalkTracking} title="Use the phone motion sensor to estimate walking steps">{indoorWalkTracking ? "Pause walk tracking" : "Track my walking"}</button></div><div className="indoor-sensor-status" role="status"><span className={indoorWalkTracking ? "sensor-pulse" : ""}/><div><strong>{indoorSensorStatus}</strong><small>{indoorDetectedSteps} estimated steps · sensor-based estimate, not precise indoor positioning</small></div></div></section><details className="indoor-full-steps"><summary>View all route steps ({routeResult.steps.length})</summary><ol className="route-steps">{routeResult.steps.map((step,i)=><li key={`${step.id}-${i}`} className={i===indoorStep?"active-indoor-step":""}><button type="button" onClick={()=>{setIndoorNavigating(true);goToIndoorStep(i)}}><span>{i+1}</span><div><strong>{step.label}</strong><small>{step.via === "start" ? "Starting point" : `Via ${step.via}`}</small></div></button></li>)}</ol></details><div className="route-warning" role="alert"><TriangleAlert size={18}/><div><strong>Prototype indoor guidance</strong><p>{routeResult.accessNote} Floor layouts and room positions are illustrative; confirm the actual corridor and lift/stair locations on site.</p><small>Phone motion can estimate steps, but cannot identify your exact corridor or detect turns. Use QR checkpoints for reliable position confirmation.</small></div></div></div><button onClick={()=>{setRouteReady(false);setRouteResult(null);setIndoorNavigating(false);setIndoorWalkTracking(false);setIndoorSensorStatus("Not started")}} aria-label="Close route preview"><X size={15}/></button></div>}</>:<><div className="map-canvas"><CampusDiagram selected={selectedBuilding} onSelect={chooseBuilding} routeActive={routeReady && !showIndoor} routeResult={routeResult} startPoint={start} destination={destination}/></div><div className="map-bottom-note"><span><span className="legend-dot blue"/>Building selected</span><span><span className="legend-dot orange"/>Demo route preview</span><span><TriangleAlert size={14}/> Illustrative geometry</span></div><div className="selected-destination"><div className="selected-destination-icon"><Building2 size={18}/></div><div><strong>{building.name}</strong><small>{building.desc}</small></div><button onClick={()=>chooseBuilding(selectedBuilding)}>Explore floors <ArrowRight size={15}/></button></div></>}
    </section></main>}
    {view==="report"&&<main className="simple-page"><div className="page-heading"><div className="eyebrow">COMMUNITY UPDATES</div><h1>Report a barrier.</h1><p>Submit a demo report about a blocked path, lift or incorrect map detail.</p></div><form className="report-card" onSubmit={submitReport}><label>ISSUE TYPE</label><select value={reportType} onChange={e=>setReportType(e.target.value)}><option>Blocked path</option><option>Lift out of service</option><option>Ramp/accessibility issue</option><option>Entrance closed</option><option>Incorrect map information</option><option>Other</option></select><label>LOCATION / CONNECTION</label><select value={reportLocation} onChange={e=>setReportLocation(e.target.value)}>{getDemoBlockedLinkIds().map(link=><option key={link.id} value={link.id}>{link.label}</option>)}</select><label>DESCRIPTION</label><textarea value={reportText} onChange={e=>setReportText(e.target.value)} placeholder="Describe the location and issue…" rows={5}/><button className="primary-button"><TriangleAlert size={17}/>Submit report</button>{message&&<p className="inline-message">{message}</p>}<p className="form-footnote">Demo reports are saved in this browser only; they are not sent to GTBIT staff. Refreshing this page will not clear them. A verified route-related report blocks its selected illustrative connection.</p></form></main>}
    {view==="admin"&&<main className="simple-page"><div className="page-heading"><div className="eyebrow">CAMPUS OPERATIONS</div><h1>Review reported issues.</h1><p>Verify reports before treating them as confirmed restrictions.</p></div><button type="button" className="verify-button" onClick={resetDemoData}>Reset local demo data</button><div className="admin-summary"><div><small>All reports</small><strong>{reports.length}</strong></div><div><small>Pending review</small><strong>{reports.filter(r=>r.status==="Pending review").length}</strong></div><div><small>Verified</small><strong>{reports.filter(r=>r.status.startsWith("Verified")).length}</strong></div></div>{message&&<p className="inline-message admin-feedback">{message}</p>}<div className="admin-list">{reports.length===0?<div className="empty-state"><ShieldCheck size={34}/><strong>No reports yet</strong><p>Submit a report to test the admin review workflow.</p></div>:reports.map(r=><article className="admin-report" key={r.id}><div className="report-badge"><TriangleAlert size={18}/></div><div className="admin-report-content"><div className="admin-report-title"><strong>{r.type}</strong><span>{r.time}</span></div><p>{r.text}</p><small className="report-location-label">Location: {r.locationLabel}</small><div className="admin-report-actions"><span className={`status-pill ${r.status.startsWith("Verified")?"verified":""}`}>{r.status}</span>{r.status==="Pending review"&&<button className="verify-button" onClick={()=>verifyReport(r.id)}><CheckCircle2 size={15}/>Mark verified</button>}</div></div></article>)}</div><RouteSurvey/><section className="route-admin-card"><div><strong>Demo route restrictions</strong><p>Verified route-related reports automatically restrict their selected demo connection. You can also toggle sample links manually. These are illustrative graph links, not confirmed campus closures.</p></div>{getDemoBlockedLinkIds().map(link=><label className="blocked-link-row" key={link.id}><input type="checkbox" checked={blockedLinks.includes(link.id)} onChange={e=>{setBlockedLinks(old=>e.target.checked?[...old,link.id]:old.filter(id=>id!==link.id));setRouteReady(false);setRouteResult(null)}}/><span>{link.label}</span><small>{blockedLinks.includes(link.id)?"Unavailable in demo":"Available in demo"}</small></label>)}</section><div className="admin-warning"><TriangleAlert size={18}/><span>Verification and route restrictions are local prototype state. They do not sync across devices or represent confirmed campus conditions.</span></div></main>}
    <footer className="footer"><span>CampusAccess <span className="footer-dot">•</span> GTBIT prototype</span><span>Built around clarity, access and trust</span></footer>
  </div>;
}
export default App;
