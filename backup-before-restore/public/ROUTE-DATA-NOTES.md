# CampusAccess v2.9 — shared route graph

## What changed
- Added `src/campusRouteData.js` as the single source of prototype route connections and reusable floor-template settings.
- Updated `src/navigation.js` so route calculation uses the entered outdoor distances and the Lab Block indoor connections.
- Reused a corridor/lift/stair/lab pattern across Ground, First, Second and Third floors instead of requiring every room-to-corridor distance to be entered manually.
- The same `calculateCampusRoute()` result continues to feed the exterior route overlay, floor plan and 3D walkthrough.

## Values entered in this conversation
1. Main Gate → Fountain: 5 m
2. Fountain → BVS entrance: 7 m
3. Fountain → Academic Block Admin entrance: 8 m
4. Fountain → Lab Block entrance: 100 m
5. BVS entrance → Canteen 1: 50 m
6. Canteen 1 → Canteen 2: 70 m
7. Lab Block entrance → Ground Floor lift lobby: 10 m
8. Ground Floor → Second Floor by lift: 3 routing-cost units
9. Second Floor lift lobby → Reading Room: 20 m
10. Second Floor lift lobby → CSE Lab: 30 m
11. Ground Floor → Second Floor by stairs: 15 m (prototype cost)
12. Second Floor staircase exit → corridor junction: 23 m
13. Ground Floor staircase entrance → corridor junction: 4 m
14. Ground Floor lift lobby → corridor junction: 4 m
15. Ground Floor corridor junction → nearest lab: 7 m
16. Ground Floor → First Floor by lift: 2 routing-cost units
17. First Floor lift lobby → corridor junction: 6 m
18. First Floor staircase exit → corridor junction: 6 m
19. Ground Floor → First Floor by stairs: 15 m

## Important limitations
- These values are assumptions provided for a prototype, not verified GTBIT measurements.
- Lift routing costs are not physical distances or lift travel times.
- First and Third floor geometry is reused from a template. Update the template if a floor differs.
- Routes and accessibility labels are not safe to rely on for real navigation until paths, entrances, lifts, ramps and room locations are checked on site.
- This is a client-side demo graph, not a backend/shared database. Changes are not synchronized across devices.
