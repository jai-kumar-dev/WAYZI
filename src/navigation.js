/**
 * CampusAccess route engine v1.
 * All node names, distances and links are illustrative prototype data.
 * Replace them with surveyed corridors and verified accessibility data before real use.
 */
import { routeSurveyConnections, floorTemplate } from "./campusRouteData.js";

const floorRooms = {
  0: ["Main entrance / lobby", "CSE Lab 01", "ECE Lab 01", "EEE Lab 01", "General Lab 01", "General Lab 02", "Boys' washroom", "Girls' washroom", "Water cooler", "Lift 1", "Lift 2", "Staircase"],
  1: ["CSE Programming Lab", "CSE Hardware Lab", "ECE Electronics Lab", "ECE Communication Lab", "EEE Circuits Lab", "EEE Machines Lab", "General Lab 07", "General Lab 08", "Classroom 101", "Boys' washroom", "Girls' washroom", "Water cooler", "Lift 1", "Lift 2", "Staircase"],
  2: ["Reading room", "Quiet study area", "CSE Lab 11", "CSE Lab 12", "ECE Lab 11", "EEE Lab 11", "Project Lab", "Classroom 201", "Boys' washroom", "Girls' washroom", "Water cooler", "Lift 1", "Lift 2", "Staircase"],
  3: ["Advanced Computing Lab", "CSE Project Lab", "ECE Embedded Systems Lab", "ECE Communication Lab", "EEE Power Systems Lab", "EEE Control Lab", "Innovation Lab", "Project discussion room", "Classroom 301", "Boys' washroom", "Girls' washroom", "Water cooler", "Lift 1", "Lift 2", "Staircase"]
};

const campusStarts = ["Main Gate", "Fountain", "BVS Block entrance", "Academic Block entrance", "Lab Block entrance", "Lab Block · Lift lobby"];
const key = (value) => String(value).trim().toLowerCase();
const roomId = (floor, name) => `room:${floor}:${key(name)}`;

function addEdge(graph, from, to, weight, meta = {}) {
  if (!graph.has(from)) graph.set(from, []);
  if (!graph.has(to)) graph.set(to, []);
  graph.get(from).push({ to, weight, ...meta });
  graph.get(to).push({ to: from, weight, ...meta });
}

function buildGraph(blockedLinks = []) {
  const graph = new Map();
  const blocked = new Set(blockedLinks);
  const addIfOpen = (from, to, weight, type = "corridor") => {
    const id = [from, to].sort().join("|");
    if (!blocked.has(id)) addEdge(graph, from, to, weight, { type, linkId: id });
  };

  // Outdoor connections use the owner's 6 entered prototype distances.
  const startId = (name) => `start:${name}`;
  const canteen1 = "campus:canteen-1";
  const canteen2 = "campus:canteen-2";
  const outsideIds = {
    "Main Gate": startId("Main Gate"),
    "Fountain": startId("Fountain"),
    "BVS Block entrance": startId("BVS Block entrance"),
    "Academic Block entrance": startId("Academic Block entrance"),
    "Lab Block entrance": startId("Lab Block entrance"),
  };
  const outdoorMap = {
    "01": [outsideIds["Main Gate"], outsideIds.Fountain],
    "02": [outsideIds.Fountain, outsideIds["BVS Block entrance"]],
    "03": [outsideIds.Fountain, outsideIds["Academic Block entrance"]],
    "04": [outsideIds.Fountain, outsideIds["Lab Block entrance"]],
    "05": [outsideIds["BVS Block entrance"], canteen1],
    "06": [canteen1, canteen2],
  };
  routeSurveyConnections.filter((edge) => outdoorMap[edge.id]).forEach((edge) => {
    const [from, to] = outdoorMap[edge.id];
    addIfOpen(from, to, edge.distance, edge.kind);
  });

  const lobby = (floor) => roomId(floor, "Lift 1");
  const stairs = (floor) => roomId(floor, "Staircase");
  const corridor = (floor) => `corridor:${floor}`;
  const entry = roomId(0, "Main entrance / lobby");
  // Lab Block entry -> lift lobby is the entered 10 m connection. The stairs
  // and corridor are adjacent branches in the simplified prototype template.
  addIfOpen(startId("Lab Block entrance"), lobby(0), 10, "entrance path");
  // The entrance must also connect to the shared ground-floor corridor. Without
  // this edge, blocking Lift 1 disconnects the entire building from the stairs.
  addIfOpen(startId("Lab Block entrance"), corridor(0), 10, "entrance corridor");
  addIfOpen(startId("Lab Block · Lift lobby"), lobby(0), 0, "starting checkpoint");
  addIfOpen(lobby(0), corridor(0), 4, "indoor corridor");
  addIfOpen(stairs(0), corridor(0), 4, "indoor corridor");

  // Shared floor template: all floors have a corridor, lift lobby, stairs,
  // labs and amenities. Room names remain floor-specific for destination search.
  for (const [floorText, rooms] of Object.entries(floorRooms)) {
    const floor = Number(floorText);
    graph.set(corridor(floor), graph.get(corridor(floor)) || []);
    rooms.forEach((name, index) => {
      const id = roomId(floor, name);
      if (["Main entrance / lobby", "Lift 1", "Lift 2", "Staircase"].includes(name)) return;
      let positionCost = floorTemplate.labDoorDistance[floor] ?? 7;
      if (/reading room/i.test(name)) positionCost = 20;
      else if (/cse lab 11/i.test(name)) positionCost = 30;
      else if (name === "CSE Lab 01" || name === "CSE Programming Lab") positionCost = 7;
      else positionCost = 5 + (index % 4) * 2;
      addIfOpen(id, corridor(floor), positionCost, "indoor corridor");
    });
    if (floor > 0) {
      addIfOpen(lobby(floor), corridor(floor), floorTemplate.corridorToLiftLobby[floor] ?? 6, "indoor corridor");
      addIfOpen(stairs(floor), corridor(floor), floorTemplate.corridorToStaircase[floor] ?? 6, "indoor corridor");
    }
    // Lift 2 is a parallel lift option using the same corridor template.
    addIfOpen(roomId(floor, "Lift 2"), corridor(floor), floor === 0 ? 4 : (floorTemplate.corridorToLiftLobby[floor] ?? 6), "indoor corridor");
  }

  // Vertical links: Lift 1 and Lift 2 are independent parallel routes.
  // Reports block each lift's own links, allowing the shortest-path engine to
  // choose Lift 2 when Lift 1 is out, then use stairs only when both are out.
  const lift2 = (floor) => roomId(floor, "Lift 2");
  addIfOpen(lobby(0), lobby(1), 2, "Lift 1 (routing cost; demo availability)");
  addIfOpen(lobby(1), lobby(2), floorTemplate.liftBetweenFloorsRoutingCost, "Lift 1 (routing cost; demo availability)");
  addIfOpen(lobby(2), lobby(3), floorTemplate.liftBetweenFloorsRoutingCost, "Lift 1 (routing cost; demo availability)");
  addIfOpen(lobby(0), lobby(2), 3, "Lift 1 (routing cost; demo availability)");
  addIfOpen(lift2(0), lift2(1), 2, "Lift 2 (routing cost; demo availability)");
  addIfOpen(lift2(1), lift2(2), floorTemplate.liftBetweenFloorsRoutingCost, "Lift 2 (routing cost; demo availability)");
  addIfOpen(lift2(2), lift2(3), floorTemplate.liftBetweenFloorsRoutingCost, "Lift 2 (routing cost; demo availability)");
  addIfOpen(lift2(0), lift2(2), 3, "Lift 2 (routing cost; demo availability)");
  addIfOpen(stairs(0), stairs(1), 15, "stairs");
  addIfOpen(stairs(0), stairs(2), 15, "stairs (entered prototype routing cost)");
  addIfOpen(stairs(1), stairs(2), floorTemplate.stairsBetweenFloorsDistance, "stairs");
  addIfOpen(stairs(2), stairs(3), floorTemplate.stairsBetweenFloorsDistance, "stairs");

  // Entered special room distances and corridor junctions.
  addIfOpen(lobby(2), roomId(2, "Reading room"), 20, "indoor corridor");
  addIfOpen(lobby(2), roomId(2, "CSE Lab 11"), 30, "indoor corridor");
  addIfOpen(corridor(0), roomId(0, "CSE Lab 01"), 7, "indoor corridor");
  addIfOpen(corridor(1), roomId(1, "CSE Programming Lab"), 7, "indoor corridor");
  addIfOpen(stairs(1), corridor(1), 6, "indoor corridor");
  addIfOpen(stairs(2), corridor(2), 23, "indoor corridor");
  return graph;
}

function dijkstra(graph, startId, endId) {
  const distances = new Map([[startId, 0]]);
  const previous = new Map();
  const pending = new Set(graph.keys());
  while (pending.size) {
    let current = null;
    let best = Infinity;
    for (const node of pending) {
      const distance = distances.get(node) ?? Infinity;
      if (distance < best) { best = distance; current = node; }
    }
    if (current === null || best === Infinity) break;
    if (current === endId) break;
    pending.delete(current);
    for (const edge of graph.get(current) || []) {
      if (!pending.has(edge.to)) continue;
      const candidate = best + edge.weight;
      if (candidate < (distances.get(edge.to) ?? Infinity)) {
        distances.set(edge.to, candidate);
        previous.set(edge.to, { from: current, edge });
      }
    }
  }
  if (!distances.has(endId)) return null;
  const path = [];
  let cursor = endId;
  while (cursor !== startId) {
    const item = previous.get(cursor);
    if (!item) return null;
    path.unshift({ id: cursor, via: item.edge.type, weight: item.edge.weight, linkId: item.edge.linkId });
    cursor = item.from;
  }
  path.unshift({ id: startId, via: "start", weight: 0 });
  return { path, distanceUnits: distances.get(endId) };
}

function labelFor(id) {
  if (id.startsWith("start:")) return id.slice(6);
  if (id === "campus:canteen-1") return "Canteen 1";
  if (id === "campus:canteen-2") return "Canteen 2";
  if (id.startsWith("campus:")) return "Campus path junction";
  if (id.startsWith("corridor:")) return `Corridor · ${["Ground", "First", "Second", "Third"][Number(id.split(":")[1])]} floor`;
  const [, floorText, ...rest] = id.split(":");
  return `${rest.join(":")} · ${["Ground", "First", "Second", "Third"][Number(floorText)]} floor`;
}

export function calculateCampusRoute({ start, destination, destinationFloor, buildingId = "lab", blockedLinks = [] }) {
  const supportedStarts = ["Main Gate", "Fountain", "BVS Block entrance", "Academic Block entrance", "Lab Block entrance", "Lab Block · Lift lobby"];
  if (!supportedStarts.includes(start)) return { error: "Choose a supported starting point." };
  if (destination === "Canteen 1" || destination === "Canteen 2") {
    const target = destination === "Canteen 1" ? "campus:canteen-1" : "campus:canteen-2";
    const graph = buildGraph(blockedLinks);
    const result = dijkstra(graph, `start:${start}`, target);
    if (!result) return { error: "No outdoor route is available in this demo graph." };
    const steps = result.path.map(node => ({ ...node, label: labelFor(node.id) }));
    return { steps, distanceUnits: result.distanceUnits, estimatedDistance: `~${Math.round(result.distanceUnits)} prototype routing units`, accessNote: "Outdoor path width, slope and step-free access have not been verified.", isIllustrative: true };
  }
  if (buildingId === "bvs" || buildingId === "academic") {
    return { steps: [{id:`start:${start}`,label:start,via:"start"},{id:`building:${buildingId}:entrance`,label:`${buildingId === "bvs" ? "BVS Block" : "Academic Block"} entrance`,via:"outdoor path"},{id:`building:${buildingId}:room`,label:`${destination} · Ground floor`,via:"illustrative indoor corridor"}], distanceUnits: 24, estimatedDistance: "~29 schematic units", accessNote: "Building interior route and step-free access have not been verified.", isIllustrative: true };
  }
  if (destinationFloor === null || destinationFloor === undefined) return { error: "Choose a supported campus or indoor destination." };
  if (!campusStarts.includes(start)) return { error: "Choose a supported starting point." };
  const graph = buildGraph(blockedLinks);
  const startId = `start:${start}`;
  const endId = roomId(destinationFloor, destination);
  if (!graph.has(endId)) return { error: "This destination is not connected in the current demo graph." };
  const result = dijkstra(graph, startId, endId);
  if (!result) return { error: "No route is available in the current demo graph. Check whether a corridor or vertical connection is blocked." };
  const steps = result.path.map((node) => ({ ...node, label: labelFor(node.id) })).filter((node, index, all) => index === 0 || node.label !== all[index - 1].label);
  const hasLift = result.path.some((node) => String(node.via).toLowerCase().startsWith("lift"));
  const hasStairs = result.path.some((node) => String(node.via || "").startsWith("stairs"));
  return {
    steps,
    distanceUnits: result.distanceUnits,
    estimatedDistance: `~${Math.round(result.distanceUnits)} prototype routing units`,
    accessNote: hasLift ? "Route uses a lift connection; lift availability and step-free access are NOT verified." : hasStairs ? "Route uses stairs and is not step-free." : "Step-free access has not been verified for this route.",
    isIllustrative: true
  };
}

export function getDemoBlockedLinkIds() {
  // A few plausible corridor links exposed to the Admin demo for testing reroutes.
  return [
    { id: "corridor:0|room:0:boys' washroom", label: "Ground floor corridor ↔ boys' washroom" },
    { id: "corridor:0|room:0:lift 1", label: "Ground floor corridor ↔ Lift 1" },
    { id: "corridor:1|room:1:lift 1", label: "First floor corridor ↔ Lift 1" },
    { id: "corridor:0|room:0:lift 2", label: "Ground floor corridor ↔ Lift 2" },
    { id: "corridor:1|room:1:lift 2", label: "First floor corridor ↔ Lift 2" },
    { id: "corridor:2|room:2:reading room", label: "Second floor corridor ↔ reading room" }
  ];
}
