/**
 * Shared CampusAccess prototype route data.
 * Distances supplied by the project owner are kept as illustrative estimates.
 * Floor templates intentionally reuse the same corridor/lab pattern on floors 0–3.
 */
export const routeSurveyConnections = [
  { id: "01", from: "Main Gate", to: "Fountain", distance: 5, kind: "outdoor path" },
  { id: "02", from: "Fountain", to: "BVS Block entrance", distance: 7, kind: "outdoor path" },
  { id: "03", from: "Fountain", to: "Academic Block entrance", distance: 8, kind: "outdoor path" },
  { id: "04", from: "Fountain", to: "Lab Block entrance", distance: 100, kind: "outdoor path" },
  { id: "05", from: "BVS Block entrance", to: "Canteen 1", distance: 50, kind: "outdoor path" },
  { id: "06", from: "Canteen 1", to: "Canteen 2", distance: 70, kind: "outdoor path" },
  { id: "07", from: "Lab Block entrance", to: "Ground Floor lift lobby", distance: 10, kind: "entrance path" },
  { id: "08", from: "Ground Floor lift lobby", to: "Second Floor lift lobby", distance: 3, kind: "lift routing cost" },
  { id: "09", from: "Second Floor lift lobby", to: "Reading Room", distance: 20, kind: "indoor corridor" },
  { id: "10", from: "Second Floor lift lobby", to: "CSE Lab", distance: 30, kind: "indoor corridor" },
  { id: "11", from: "Ground Floor staircase", to: "Second Floor staircase", distance: 15, kind: "stairs" },
  { id: "12", from: "Second Floor staircase", to: "Second Floor corridor junction", distance: 23, kind: "indoor corridor" },
  { id: "13", from: "Ground Floor staircase", to: "Ground Floor corridor junction", distance: 4, kind: "indoor corridor" },
  { id: "14", from: "Ground Floor lift lobby", to: "Ground Floor corridor junction", distance: 4, kind: "indoor corridor" },
  { id: "15", from: "Ground Floor corridor junction", to: "Ground Floor nearest lab", distance: 7, kind: "indoor corridor" },
  { id: "16", from: "Ground Floor lift lobby", to: "First Floor lift lobby", distance: 2, kind: "lift routing cost" },
  { id: "17", from: "First Floor lift lobby", to: "First Floor corridor junction", distance: 6, kind: "indoor corridor" },
  { id: "18", from: "First Floor staircase", to: "First Floor corridor junction", distance: 6, kind: "indoor corridor" },
  { id: "19", from: "Ground Floor staircase", to: "First Floor staircase", distance: 15, kind: "stairs" },
];

export const floorTemplate = {
  floors: [0, 1, 2, 3],
  repeatedRoomTypes: ["CSE Lab", "ECE Lab", "EEE Lab", "General Lab", "Boys' washroom", "Girls' washroom", "Water cooler", "Lift 1", "Lift 2", "Staircase"],
  corridorToLiftLobby: { 0: 4, 1: 6, 2: 6, 3: 6 },
  corridorToStaircase: { 0: 4, 1: 6, 2: 23, 3: 6 },
  labDoorDistance: { 0: 7, 1: 7, 2: 7, 3: 7 },
  liftBetweenFloorsRoutingCost: 2,
  stairsBetweenFloorsDistance: 15,
  disclaimer: "Floors 1–3 reuse an illustrative template; adjust any floor if its actual layout differs. Values are not surveyed measurements."
};
