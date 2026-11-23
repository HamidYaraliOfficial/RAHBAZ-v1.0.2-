# Changelog

## 1.0.2 – landscape layout
- Home screen is a two-column layout on short landscape screens (phones held sideways) instead of being cut off.
- Level-complete / pause / fail dialogs are compact on short screens so every button is visible; toasts moved to the top.

## 1.0.1 – graphics overhaul
- Cars and motorcycles redrawn from scratch: tapered body silhouettes, bright slanted windshield, headlights with glow at the FRONT and red tail-lights at the REAR, side mirrors, panel lines; motorcycles now have a rider with helmet + visor, fork, handlebar, mirrors and a headlight, so the driving direction is unmistakable.
- Board redrawn as an asphalt parking lot (grain, painted dashed bay lines, curb), vehicles cast soft drop shadows, brighter exit gate.
- Brighter headlights / tail-lights on vans, buses and trucks as well.

## 1.0.0 – first release
- 110 built-in levels in 11 packs (10 themed packs + "Motorcycle Escape"), all verified solvable by a BFS solver; stored optimum = exact minimum moves.
- 75 vehicle types in 8 categories (motorcycles, cars, vans/minibuses, buses, trucks, semi-trailers, machinery, service vehicles), each with its own size, speed and top-down artwork.
- Grid engine for 5×5 … 8×8 boards (generator supports up to 9×9), 1×1 … 6×1 and 2×2 / 3×2 vehicles, walls/barriers, exits on any side.
- Ten game modes: Classic, Motorcycle Escape, Heavy Transport, Public Transport, Emergency Mission, Construction Zone, Endless, Daily Challenge, Time Challenge, Minimum Moves.
- Seeded level generator + solver-verified output (Endless / Daily / Time use it at runtime, fully offline).
- Hint (always a legal, optimal next move), step-by-step solution playback, undo, reset, pause, move limits on selected levels.
- Stars, score, coins, XP / player level, 10 achievements, statistics, 8 vehicle skins (shop), garage with all vehicles.
- Persian (RTL, default) and English (LTR) UI; synthesised sound effects + procedural music (no audio files).
- Versioned local save with corruption recovery. No permissions, no network, no ads, no analytics.
- Android WebView shell (API 24+), signed APK (v1+v2+v3), boot loader with polyfills and an on-screen diagnostic page for old WebViews.
