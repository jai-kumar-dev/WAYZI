/**
 * Unified CampusAccess prototype routing graph.
 * Distances and indoor layouts are illustrative, not surveyed measurements.
 */
import { routeSurveyConnections, floorTemplate } from "./campusRouteData.js";

const campusNodes = ["Main Gate", "Fountain", "Canteen 1", "Canteen 2", "BVS Block entrance", "Academic Block entrance", "Lab Block entrance", "Lab Block side ramp", "Right-side path junction", "Left-side path junction", "Upper-left path bend", "Lab Block rear walkway west", "Lab Block rear walkway center", "Lab Block rear walkway east", "Covered Connector", "Ground Path under connector", "Academic Block second entrance"];
const floorsByBuilding = { lab: 4, bvs: 5, academic: 4 };
const roomLists = {
  lab: {
    0: ["Main entrance / lobby", "CSE Lab 01", "ECE Lab 01", "EEE Lab 01", "General Lab 01", "General Lab 02", "Boys' washroom", "Girls' washroom", "Water cooler", "Lift 1", "Lift 2", "Staircase"],
    1: ["CSE Programming Lab", "CSE Hardware Lab", "ECE Electronics Lab", "ECE Communication Lab", "EEE Circuits Lab", "EEE Machines Lab", "General Lab 07", "General Lab 08", "Classroom 101", "Boys' washroom", "Girls' washroom", "Water cooler", "Lift 1", "Lift 2", "Staircase"],
    2: ["Reading room", "Quiet study area", "CSE Lab 11", "CSE Lab 12", "ECE Lab 11", "EEE Lab 11", "Project Lab", "Classroom 201", "Boys' washroom", "Girls' washroom", "Water cooler", "Lift 1", "Lift 2", "Staircase"],
    3: ["Advanced Computing Lab", "CSE Project Lab", "ECE Embedded Systems Lab", "ECE Communication Lab", "EEE Power Systems Lab", "EEE Control Lab", "Innovation Lab", "Project discussion room", "Classroom 301", "Boys' washroom", "Girls' washroom", "Water cooler", "Lift 1", "Lift 2", "Staircase"]
  },
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
const norm = (v) => String(v ?? "").trim().toLowerCase().replace(/[’‘]/g, "'");
const campusId = (name) => `campus:${name}`;
const corridorId = (building, floor) => `corridor:${building}:${floor}`;
const roomId = (building, floor, name) => `room:${building}:${floor}:${norm(name)}`;
const liftId = (building, floor, lift = 1) => `lift:${building}:${floor}:${lift}`;
const stairId = (building, floor) => `stairs:${building}:${floor}`;

function addEdge(graph, a, b, weight, type = "walkway", blockedLinks = []) {
  if (!a || !b || a === b) return;
  const linkId = [a, b].sort().join("|");
  if (blockedLinks.includes(linkId)) return;
  if (!graph.has(a)) graph.set(a, []);
  if (!graph.has(b)) graph.set(b, []);
  graph.get(a).push({ to: b, weight, type, linkId });
  graph.get(b).push({ to: a, weight, type, linkId });
}

function buildGraph(blockedLinks = []) {
  const graph = new Map();
  const edge = (a, b, w, type) => addEdge(graph, a, b, w, type, blockedLinks);
  campusNodes.forEach(n => graph.set(campusId(n), []));
  // Connected outdoor walkway graph. Open paved courtyard areas are walkable;
  // building footprints, planted beds and the fountain basin are not shortcut nodes.
  // Weights are illustrative metres. Dijkstra selects the lowest-cost connected route.
  const outdoor = [
    ["Main Gate", "Fountain", 24, "paved courtyard path"],
    ["Fountain", "BVS Block entrance", 22, "paved courtyard path"],
    ["Fountain", "Academic Block entrance", 36, "paved courtyard path"],
    ["Fountain", "Lab Block entrance", 72, "paved courtyard path to central front entrance"],
    ["Main Gate", "Right-side path junction", 130, "paved right-side gully"],
    ["Right-side path junction", "Lab Block side ramp", 25, "paved right-side gully to ramp"],
    ["BVS Block entrance", "Canteen 1", 34, "left-side paved path"],
    ["Canteen 1", "Canteen 2", 28, "left-side paved path"],
    ["Lab Block entrance", "Left-side path junction", 42, "paved frontage path"],
    ["Left-side path junction", "Canteen 2", 28, "left-side paved path"],
    // Short upper walkway: Canteen 2 -> bend -> paved path behind the Lab Block -> side ramp.
    ["Canteen 2", "Upper-left path bend", 10, "paved upper-left bend"],
    ["Upper-left path bend", "Lab Block rear walkway west", 8, "paved walkway beside Lab Block"],
    ["Lab Block rear walkway west", "Lab Block rear walkway center", 35, "paved upper walkway"],
    ["Lab Block rear walkway center", "Lab Block rear walkway east", 35, "paved upper walkway"],
    ["Lab Block rear walkway east", "Lab Block side ramp", 18, "paved upper walkway to ramp"],
    // Both the covered connector and the ground path beneath it are walkable.
    ["BVS Block entrance", "Covered Connector", 30, "covered connector walkway"],
    ["Covered Connector", "Academic Block entrance", 30, "covered connector walkway"],
    ["Covered Connector", "Academic Block second entrance", 12, "covered connector to second entrance"],
    ["Academic Block second entrance", "Academic Block entrance", 34, "paved Academic Block side walkway"],
    ["Fountain", "Ground Path under connector", 20, "paved ground path under connector"],
    ["Ground Path under connector", "Covered Connector", 16, "paved path beneath connector"]
  ];
  outdoor.forEach(([a,b,w,t]) => edge(campusId(a), campusId(b), w, t));

  // Connect each building's outdoor entrance to its ground-floor lobby.
  const entranceFor = { lab: "Lab Block entrance", bvs: "BVS Block entrance", academic: "Academic Block entrance" };
  for (const [building, floors] of Object.entries(roomLists)) {
    const entryName = building === "lab" ? "Main entrance / lobby" : building === "bvs" ? "Main Entrance Lobby" : "Admin Entrance / Lobby";
    const entry = roomId(building, 0, entryName);
    edge(campusId(entranceFor[building]), corridorId(building, 0), building === "lab" ? 10 : 8, building === "lab" ? "main entrance stairs" : "building entrance walkway");
    edge(corridorId(building, 0), entry, 2, "ground-floor lobby");
    // Room and corridor graph on every floor, with lifts and staircases as vertical links.
    for (const [floorText, rooms] of Object.entries(floors)) {
      const floor = Number(floorText), hub = corridorId(building, floor);
      if (!graph.has(hub)) graph.set(hub, []);
      edge(hub, liftId(building, floor, 1), 4, "corridor to Lift 1");
      edge(hub, liftId(building, floor, 2), 5, "corridor to Lift 2");
      edge(hub, stairId(building, floor), 4, "corridor to stairs");
      rooms.forEach((name, index) => {
        if (/^lift [12]$/i.test(name) || /staircase/i.test(name) || /main staircase/i.test(name)) return;
        const id = roomId(building, floor, name);
        edge(hub, id, 4 + (index % 4) * 2, "indoor corridor");
      });
      if (floor > 0) {
        edge(liftId(building, floor - 1, 1), liftId(building, floor, 1), 3, "lift between floors");
        edge(liftId(building, floor - 1, 2), liftId(building, floor, 2), 4, "lift between floors");
        edge(stairId(building, floor - 1), stairId(building, floor), 15, "stairs between floors");
      }
    }
    // The Lab Block ramp connects the right-side outdoor ramp node to the ground-floor lobby.
    if (building === "lab") edge(campusId("Lab Block side ramp"), corridorId("lab", 0), 8, "Lab Block right-side ramp to ground floor");
    // Entry node is connected to its corridor; ground-floor routes can enter either way.
    edge(roomId(building, 0, entryName), corridorId(building, 0), 2, "ground-floor lobby corridor");
  }
  return graph;
}

function dijkstra(graph, start, end, wheelchairMode = false) {
  if (!graph.has(start) || !graph.has(end)) return null;
  const distances = new Map([[start, 0]]), previous = new Map(), pending = new Set(graph.keys());
  while (pending.size) {
    let current = null, best = Infinity;
    for (const node of pending) { const d = distances.get(node) ?? Infinity; if (d < best) { best = d; current = node; } }
    if (current === null || best === Infinity) break;
    if (current === end) break;
    pending.delete(current);
    for (const link of graph.get(current) || []) {
      if (wheelchairMode && (/stairs/i.test(link.type) || /main entrance stairs/i.test(link.type))) continue;
      if (!pending.has(link.to)) continue;
      const next = best + link.weight;
      if (next < (distances.get(link.to) ?? Infinity)) { distances.set(link.to, next); previous.set(link.to, { from: current, link }); }
    }
  }
  if (!distances.has(end)) return null;
  const path = []; let cursor = end;
  while (cursor !== start) {
    const item = previous.get(cursor); if (!item) return null;
    path.unshift({ id: cursor, via: item.link.type, weight: item.link.weight, linkId: item.link.linkId }); cursor = item.from;
  }
  path.unshift({ id: start, via: "start", weight: 0 });
  return { path, distance: distances.get(end) };
}

function parseLocation(value, fallbackFloor = 0, fallbackBuilding = "lab") {
  // Encoded room origins let the Navigate tab start from any searchable room.
  if (String(value).startsWith("loc::")) {
    const [, building, floorText, ...nameParts] = String(value).split("::");
    const name = nameParts.join("::");
    return { id: roomId(building, Number(floorText), name), label: `${name} · ${building} · floor ${Number(floorText) + 1}`, building, floor: Number(floorText), name };
  }
  const name = String(value);
  if (name === "Lab Block · Lift lobby") return { id: liftId("lab", 0, 1), label: name, building: "lab", floor: 0, name: "Lift 1" };
  if (campusNodes.includes(name)) return { id: campusId(name), label: name, building: null, floor: null, name };
  // Legacy checkpoint names remain accepted.
  const aliases = { "Ground Floor lift lobby": liftId("lab", 0, 1), "Second Floor lift lobby": liftId("lab", 2, 1) };
  if (aliases[name]) return { id: aliases[name], label: name, building: "lab", floor: 0, name };
  return { id: roomId(fallbackBuilding, fallbackFloor, name), label: name, building: fallbackBuilding, floor: fallbackFloor, name };
}

function labelFor(id) {
  if (id.startsWith("campus:")) return id.slice(7);
  const match = id.match(/^room:([^:]+):(\d+):(.+)$/);
  if (match) {
    const [ , building, floorText, roomKey ] = match;
    const floor = Number(floorText);
    const roomName = (roomLists[building]?.[floor] || []).find(name => norm(name) === roomKey) || roomKey;
    return `${roomName} · ${["Ground", "First", "Second", "Third", "Fourth"][floor]} floor`;
  }
  const cor = id.match(/^corridor:([^:]+):(\d+)$/);
  if (cor) return `${cor[1].toUpperCase()} Block · ${["Ground", "First", "Second", "Third", "Fourth"][Number(cor[2])]} floor corridor`;
  const lift = id.match(/^lift:([^:]+):(\d+):(\d+)$/);
  if (lift) return `${lift[1].toUpperCase()} Block · Lift ${lift[3]} · floor ${Number(lift[2]) + 1}`;
  const stairs = id.match(/^stairs:([^:]+):(\d+)$/);
  if (stairs) return `${stairs[1].toUpperCase()} Block · staircase · floor ${Number(stairs[2]) + 1}`;
  return id;
}

export function encodeLocationOrigin(location) {
  if (!location || !location.buildingId || location.floor == null) return location?.name || "Main Gate";
  return `loc::${location.buildingId}::${location.floor}::${location.name}`;
}

export function calculateCampusRoute({ start, destination, destinationFloor, buildingId = "lab", blockedLinks = [], wheelchairMode = false }) {
  const graph = buildGraph(blockedLinks);
  const startLocation = parseLocation(start, destinationFloor ?? 0, buildingId);
  const endLocation = parseLocation(destination, destinationFloor ?? 0, buildingId);
  // A selected campus facility is represented by its outdoor node.
  const target = wheelchairMode && String(destination).trim().toLowerCase() === "lab block entrance"
    ? campusId("Lab Block side ramp")
    : endLocation.id;
  const result = dijkstra(graph, startLocation.id, target, wheelchairMode);
  if (!result) {
    return { error: wheelchairMode ? "No step-free route exists in the current prototype graph for this origin and destination. Check the ramp/lift links or choose another destination." : "No connected route exists in the current prototype graph for this origin and destination." };
  }
  const steps = result.path.map((node, index) => ({ ...node, label: labelFor(node.id), ...(index === 0 ? { via: "start" } : {}) }));
  const hasLift = result.path.some(node => /lift/i.test(String(node.via || "")));
  const hasStairs = result.path.some(node => /stairs/i.test(String(node.via || "")));
  const speedMetersPerMinute = wheelchairMode ? 48 : 72;
  const walkingTimeMinutes = Math.max(1, Math.ceil(result.distance / speedMetersPerMinute));
  return {
    steps,
    distanceUnits: result.distance,
    estimatedDistance: `~${Math.round(result.distance)} m · ${walkingTimeMinutes} min walk`,
    walkingTimeMinutes,
    accessNote: wheelchairMode ? "The algorithm excludes stair links and prefers ramp/lift connections. All distances, indoor layouts and accessibility attributes are illustrative and must be verified on site." : hasLift ? "Route uses a lift connection; lift availability and step-free access are not verified." : hasStairs ? "Route includes stairs." : "Prototype route follows assumed connected campus walkways; distances are illustrative.",
    isIllustrative: true,
    origin: startLocation.label,
    destination: wheelchairMode && String(destination).trim().toLowerCase() === "lab block entrance"
      ? "Lab Block side ramp (step-free access)"
      : endLocation.label
  };
}

export function getDemoBlockedLinkIds() {
  return [
    { id: "corridor:lab:0|lift:lab:0:1", label: "Lab Block ground corridor ↔ Lift 1" },
    { id: "corridor:lab:1|lift:lab:1:1", label: "Lab Block first-floor corridor ↔ Lift 1" },
    { id: "corridor:lab:0|lift:lab:0:2", label: "Lab Block ground corridor ↔ Lift 2" },
    { id: "corridor:lab:1|lift:lab:1:2", label: "Lab Block first-floor corridor ↔ Lift 2" },
    { id: "corridor:bvs:0|room:bvs:0:reception", label: "BVS ground-floor corridor ↔ Reception" }
  ];
}
