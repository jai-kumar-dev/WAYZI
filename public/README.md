# CampusAccess v2.9 — Shared Route Graph + Floor Templates

This is an update overlay for the existing CampusAccess Vite + React project.

## Install
1. Extract the ZIP.
2. Copy the contents of the included `src` folder into your existing project's `src` folder, replacing matching files and adding `campusRouteData.js`.
3. Keep your existing `package.json`, `src/main.jsx`, and `public/gtbit-campus-map.png`.
4. In the project terminal, run:

```bash
npm install three
npm run dev
```

## What's new
- `campusRouteData.js` is the shared source for the 19 distances recorded in the conversation and the reusable floor template.
- `navigation.js` now uses those values to calculate routes.
- Ground, First, Second and Third floor routes use the same general corridor/lift/stair/lab pattern, with special destinations such as Reading Room and CSE Lab preserved.
- The existing calculated route result is still used by the outdoor map, indoor floor plan and 3D walkthrough.
- The Admin survey builder remains available for on-site GPS survey work; the GPS survey data is still separate from the illustrative prototype graph until explicitly reviewed and imported.

See `ROUTE-DATA-NOTES.md` for the full entered values and limitations.

## Prototype disclaimer
Distances and room locations are illustrative. Lift costs are routing costs, not physical distance or time. This version demonstrates the shared route graph; it does not prove the campus has been surveyed, and should not be used as real-world accessibility guidance until checked on site.
