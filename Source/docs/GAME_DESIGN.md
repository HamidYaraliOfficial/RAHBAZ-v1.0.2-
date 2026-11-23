# Game design
**Goal**: slide vehicles along their own axes to open a lane so the gold hero vehicle can leave through the green gate. A move = one drag-and-release that displaces a vehicle (any distance).

**Vehicles**: 75 types, 8 categories, sizes 1×1 … 6×1 plus 2×2 / 3×2 machines; speed factor per type (heavier = slower tween), points value per type. Artwork is procedural (`src/js/art.js`): each category has its own silhouette (e.g. buses show roof AC units / articulation joint, tankers a metallic cylinder, car carriers stacked cars, excavators tracks + boom + bucket).

**Boards**: 5×5 tutorial, 6×6 standard, 7×7 medium, 8×8 advanced (generator also supports 9×9). Exits on any of the four sides; walls (concrete barriers) in industrial / construction / pro packs.

**Packs (110 levels)**: 1 Learn the Basics · 2 City Parking · 3 Busy Street · 4 Bus Terminal · 5 Truck Park · 6 Heavy Transport Zone · 7 Industrial Zone · 8 Construction Site · 9 Emergency Route · 10 Pro League · 11 Motorcycle Escape (10 levels each). Classic unlocks pack *n+1* after 5 levels of pack *n*; inside a pack a level unlocks when the previous one is finished (the five mode-specific packs open their first level directly).

**Difficulty tiers** (by exact minimum moves): Beginner ≤5 · Easy ≤10 · Medium ≤14 · Hard ≤17 · Expert ≤23 · Master ≥24. Distribution of built-in levels: 5 / 30 / 42 / 18 / 8 / 7. Difficulty comes from layout (hill-climbing + annealing maximises the optimal move count), not just from vehicle count.

**Stars**: 3★ if moves ≤ opt + ⌈15 %·opt⌉, 2★ if moves ≤ opt + ⌈60 %·opt⌉ + 2, otherwise 1★. Using "Show solution" caps the result at 1★. Hints are free but counted (−40 score each). Score = 1000 + 20·opt − 25·(extra moves) − 40·hints − 2·seconds.

**Economy**: first clear 10 + 5/star coins (improving stars: +5 each; replays +2); daily +25 (+3 per streak day, max 7); Time/Endless +4/+3 per solve; 15 for a first minimum-move clear; achievement +20. Skins cost 120–280 coins. XP → player level `floor(sqrt(xp/40))+1`.

**Modes**: Classic (packs), Motorcycle Escape (pack 11), Heavy Transport (packs 5+6), Public Transport (pack 4), Emergency Mission (pack 9), Construction Zone (pack 8), Endless (3 lives, move limit = 2·opt+4, rising difficulty), Daily Challenge (seed from the device date, once-per-day reward + streak), Time Challenge (easy/medium/hard, time = base + k·opt, streak record), Minimum Moves (success only with ≤ opt moves).

**Achievements**: First Exit, 10/50/100 levels, No Hints, Minimum Moves, 10 motorcycles, 10 ambulances, 10 trucks/trailers, 10 Expert-or-higher levels.
