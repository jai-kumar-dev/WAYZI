/**
 * Unified CampusAccess prototype routing graph.
 * Distances and indoor layouts are illustrative, not surveyed measurements.
 */
import { routeSurveyConnections, floorTemplate } from "./campusRouteData.js";

const campusNodes = ["Main Gate", "Fountain", "Canteen 1", "Canteen 2", "BVS Block entrance", "Academic Block entrance", "Lab Block entrance", "Lab Block side ramp", "BVS Block side ramp", "Right-side path junction", "Left-side path junction", "Upper-left path bend", "Lab Block rear walkway west", "Lab Block rear walkway center", "Lab Block rear walkway east", "Covered Connector", "Ground Path under connector", "Academic Block second entrance"];
const floorsByBuilding = { lab: 4, bvs: 5, academic: 4 };
const floorNames = ["Ground floor", "First floor", "Second floor", "Third floor", "Fourth floor"];
const floorName = (floor) => floorNames[Number(floor)] || `Floor ${Number(floor) + 1}`;
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
    ["Fountain", "BVS Block entrance", 18, "paved central courtyard path"],
    ["Fountain", "Academic Block entrance", 22, "direct central courtyard path"],
    ["Fountain", "Lab Block entrance", 72, "paved courtyard path to central front entrance"],
    // Direct step-free courtyard crossing from Lab Block to the Academic Block second entrance.
    ["Lab Block entrance", "Academic Block second entrance", 48, "direct step-free central courtyard path"],
    // Direct step-free connection from the Lab Block side ramp around the courtyard edge to the Academic second entrance.
    ["Lab Block side ramp", "Academic Block second entrance", 36, "direct step-free courtyard edge path"],
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
    ["BVS Block entrance", "Covered Connector", 60, "longer connector-side walkway"],
    ["Canteen 1", "BVS Block side ramp", 18, "left-side paved approach to BVS ramp"],
    ["BVS Block entrance", "BVS Block side ramp", 24, "paved side approach to BVS ramp"],
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
    edge(campusId(entranceFor[building]), corridorId(building, 0), building === "lab" ? 10 : building === "bvs" ? 8 : 8, building === "lab" ? "main entrance stairs" : building === "bvs" ? "step-only front entrance" : "building entrance walkway");
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
    // Step-free prototype entrances connect their outdoor ramp nodes directly to ground-floor corridors.
    if (building === "lab") edge(campusId("Lab Block side ramp"), corridorId("lab", 0), 8, "Lab Block right-side ramp to ground floor");
    if (building === "bvs") edge(campusId("BVS Block side ramp"), corridorId("bvs", 0), 8, "BVS Block left-side ramp to ground floor");
    // Academic Block has an illustrative step-free ramp at its second entrance behind the covered connector.
    // This is an outdoor access point only; upper-floor wheelchair access is not claimed because a lift has not been verified.
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
      if (wheelchairMode && (/stairs/i.test(link.type) || /main entrance stairs/i.test(link.type) || /step-only/i.test(link.type))) continue;
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
    return { id: roomId(building, Number(floorText), name), label: `${name} · ${building} · ${floorName(floorText)}`, building, floor: Number(floorText), name };
  }
  const name = String(value);
  if (name === "Lab Block · Lift lobby") return { id: liftId("lab", 0, 1), label: `Lab Block · Lift 1 · ${floorName(0)}`, building: "lab", floor: 0, name: "Lift 1" };
  if (campusNodes.includes(name)) return { id: campusId(name), label: name, building: null, floor: null, name };
  // Legacy checkpoint names remain accepted.
  const aliases = { "Ground Floor lift lobby": { id: liftId("lab", 0, 1), floor: 0 }, "Second Floor lift lobby": { id: liftId("lab", 2, 1), floor: 2 } };
  if (aliases[name]) return { id: aliases[name].id, label: `Lab Block · Lift 1 · ${floorName(aliases[name].floor)}`, building: "lab", floor: aliases[name].floor, name: "Lift 1" };
  return { id: roomId(fallbackBuilding, fallbackFloor, name), label: name, building: fallbackBuilding, floor: fallbackFloor, name };
}

function labelFor(id) {
  if (id.startsWith("campus:")) return id.slice(7);
  const match = id.match(/^room:([^:]+):(\d+):(.+)$/);
  if (match) {
    const [ , building, floorText, roomKey ] = match;
    const floor = Number(floorText);
    const roomName = (roomLists[building]?.[floor] || []).find(name => norm(name) === roomKey) || roomKey;
    return `${roomName} · ${floorName(floor)}`;
  }
  const cor = id.match(/^corridor:([^:]+):(\d+)$/);
  if (cor) return `${cor[1].toUpperCase()} Block · ${floorName(cor[2])} corridor`;
  const lift = id.match(/^lift:([^:]+):(\d+):(\d+)$/);
  if (lift) return `${lift[1].toUpperCase()} Block · Lift ${lift[3]} · ${floorName(lift[2])}`;
  const stairs = id.match(/^stairs:([^:]+):(\d+)$/);
  if (stairs) return `${stairs[1].toUpperCase()} Block · staircase · ${floorName(stairs[2])}`;
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
  const destinationKey = String(destination).trim().toLowerCase();
  const target = wheelchairMode && destinationKey === "bvs block entrance"
    ? campusId("BVS Block side ramp")
    : wheelchairMode && destinationKey === "lab block entrance"
      ? campusId("Lab Block side ramp")
      : wheelchairMode && destinationKey === "academic block entrance"
        ? campusId("Academic Block second entrance")
        : endLocation.id;
  const result = dijkstra(graph, startLocation.id, target, wheelchairMode);
  if (!result) {
    return { error: wheelchairMode ? "No step-free route exists in the current prototype graph for this origin and destination. Check the ramp/lift links or choose another destination." : "No connected route exists in the current prototype graph for this origin and destination." };
  }
  const steps = result.path.map((node, index, path) => {
    const label = labelFor(node.id);
    const previous = path[index - 1];
    let instruction;
    if (index === 0) instruction = `Start at ${label}.`;
    else if (/lift between floors/i.test(node.via || "")) {
      const fromLift = String(previous?.id || "").match(/^lift:([^:]+):(\d+):(\d+)$/);
      const toLift = String(node.id || "").match(/^lift:([^:]+):(\d+):(\d+)$/);
      instruction = fromLift && toLift
        ? `Take Lift ${toLift[3]} from ${floorName(fromLift[2])} to ${floorName(toLift[2])}.`
        : `Take the lift to ${label}.`;
    } else if (/corridor to Lift/i.test(node.via || "")) {
      const lift = String(node.id || "").match(/^lift:([^:]+):(\d+):(\d+)$/);
      instruction = lift ? `Follow the corridor to Lift ${lift[3]} on the ${floorName(lift[2])}.` : `Follow the corridor to ${label}.`;
    } else if (/stairs between floors/i.test(node.via || "")) {
      instruction = `Use the stairs to reach the ${label}.`;
    } else if (/main entrance stairs/i.test(node.via || "")) {
      instruction = `Go to the Lab Block main entrance stairs and enter the ground-floor lobby.`;
    } else if (/stairs/i.test(node.via || "")) {
      instruction = `Follow the staircase to ${label}.`;
    } else if (/indoor corridor|ground-floor lobby|building entrance walkway/i.test(node.via || "")) {
      instruction = `Follow the indoor corridor to ${label}.`;
    } else if (/paved|walkway|connector|gully|path/i.test(node.via || "")) {
      instruction = `Follow the paved walkway to ${label}.`;
    } else instruction = `Continue to ${label}.`;
    return { ...node, label, instruction, ...(index === 0 ? { via: "start" } : {}) };
  });
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
    destination: wheelchairMode && destinationKey === "bvs block entrance"
      ? "BVS Block side ramp (illustrative step-free access)"
      : wheelchairMode && destinationKey === "lab block entrance"
        ? "Lab Block side ramp (step-free access)"
        : wheelchairMode && destinationKey === "academic block entrance"
          ? "Academic Block second entrance (illustrative step-free access)"
          : endLocation.label
  };
}

export function getDemoBlockedLinkIds() {
  const link = (a, b) => [a, b].sort().join("|");
  const items = [];
  // Actual indoor graph edges. These exact IDs are consumed by buildGraph/Dijkstra.
  for (const lift of [1, 2]) {
    for (let floor = 0; floor < 4; floor++) {
      items.push({
        id: link(corridorId("lab", floor), liftId("lab", floor, lift)),
        label: `Lab Block ${floorName(floor)} corridor ↔ Lift ${lift}`,
        issueGroup: `lab-lift-${lift}`
      });
      if (floor < 3) {
        items.push({
          id: link(liftId("lab", floor, lift), liftId("lab", floor + 1, lift)),
          label: `Lab Block Lift ${lift}: ${floorName(floor)} ↔ ${floorName(floor + 1)}`,
          issueGroup: `lab-lift-${lift}`
        });
      }
    }
  }
  // Outdoor links are also valid selectable report targets.
  const outdoorLinks = [
    ["Main Gate", "Fountain", "Main Gate ↔ Fountain paved path"],
    ["Fountain", "BVS Block entrance", "Fountain ↔ BVS Block entrance"],
    ["Fountain", "Academic Block entrance", "Fountain ↔ Academic Block entrance"],
    ["Fountain", "Lab Block entrance", "Fountain ↔ Lab Block entrance"],
    ["Main Gate", "Right-side path junction", "Main Gate ↔ right-side path junction"],
    ["Right-side path junction", "Lab Block side ramp", "Right-side path junction ↔ Lab Block ramp"],
    ["BVS Block entrance", "Canteen 1", "BVS Block entrance ↔ Canteen 1"],
    ["Canteen 1", "Canteen 2", "Canteen 1 ↔ Canteen 2"],
    ["Lab Block entrance", "Left-side path junction", "Lab Block entrance ↔ left-side path junction"],
    ["Left-side path junction", "Canteen 2", "Left-side path junction ↔ Canteen 2"],
    ["Canteen 2", "Upper-left path bend", "Canteen 2 ↔ upper-left path bend"],
    ["Upper-left path bend", "Lab Block rear walkway west", "Upper-left bend ↔ rear walkway west"],
    ["Lab Block rear walkway west", "Lab Block rear walkway center", "Rear walkway west ↔ center"],
    ["Lab Block rear walkway center", "Lab Block rear walkway east", "Rear walkway center ↔ east"],
    ["Lab Block rear walkway east", "Lab Block side ramp", "Rear walkway east ↔ Lab Block ramp"],
    ["BVS Block entrance", "Covered Connector", "BVS Block ↔ covered connector"],
    ["Covered Connector", "Academic Block entrance", "Covered connector ↔ Academic Block"],
    ["Covered Connector", "Academic Block second entrance", "Covered connector ↔ Academic second entrance"],
    ["Academic Block second entrance", "Academic Block entrance", "Academic Block second entrance ↔ main entrance"],
    ["Fountain", "Ground Path under connector", "Fountain ↔ ground path under connector"],
    ["Ground Path under connector", "Covered Connector", "Ground path under connector ↔ covered connector"]
  ];
  outdoorLinks.forEach(([a, b, label]) => items.push({ id: link(campusId(a), campusId(b)), label }));
  return items;
}
