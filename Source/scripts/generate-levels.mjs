// Offline level factory: generates and verifies the built-in levels with the SAME generator + BFS solver the game uses.
// Usage: node scripts/generate-levels.mjs   -> writes src/js/levels-data.js
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { generate, difficultyOf, starThresholds } from '../src/js/generator.js';
import { hashStr } from '../src/js/rng.js';
import { TYPES } from '../src/js/vehicles.js';

const W = (ids, w) => ids.map((t) => ({ t, w: w || 1 }));
const cat = (c) => TYPES.filter((t) => t.cat === c).map((t) => t.id);
const CARS = cat('car'), MOTOS = cat('moto'), VANS = cat('van'), BUSES = cat('bus'), TRUCKS = cat('truck'), TRAILERS = cat('trailer');
const lerp = (a, b, k) => Math.round(a + (b - a) * k);

// Pack recipes. lo/hi = [first level, last level] target minimum-move ranges.
const PACKS = {
  1: { sizes: [5], heroes: ['hatch', 'sedan', 'mini', 'taxi', 'ev'], pool: [...W(CARS), ...W(MOTOS, 0.6)], count: [3, 8], lo: [2, 8], hi: [3, 11], steps: 80, cap: 20000 },
  2: { sizes: [6], heroes: ['sedan', 'suv', 'sports', 'luxury', 'crossover', 'classic', 'ev', 'taxi'], pool: [...W(CARS), ...W(MOTOS, 0.7)], count: [7, 11], lo: [6, 13], hi: [8, 17], steps: 140, cap: 40000 },
  3: { sizes: [6], heroes: ['taxi', 'pickup', 'racer', 'hatch', 'sedan', 'van_city'], pool: [...W(CARS), ...W(VANS, 1.2), ...W(MOTOS, 0.5)], count: [8, 12], lo: [8, 15], hi: [11, 20], steps: 160, cap: 50000 },
  4: { sizes: [6, 6, 6, 6, 6, 7, 7, 7, 7, 7], heroes: ['bus_city', 'bus_school', 'bus_ev', 'minibus_city', 'minibus_school', 'bus_inter', 'bus_tour', 'bus_double', 'bus_artic'], pool: [...W(BUSES, 1.2), ...W(VANS), ...W(CARS, 0.8), ...W(MOTOS, 0.3)], count: [6, 10], lo: [8, 16], hi: [11, 21], steps: 160, cap: 50000 },
  5: { sizes: [7], heroes: ['truck_small', 'truck_mid', 'truck_cargo', 'truck_reefer', 'truck_tanker', 'truck_garbage', 'truck_dump', 'truck_heavy', 'truck_tow'], pool: [...W(TRUCKS, 1.2), ...W(VANS, 0.7), ...W(CARS, 0.7)], count: [7, 11], lo: [9, 18], hi: [12, 23], steps: 150, cap: 60000 },
  6: { sizes: [7, 7, 7, 7, 8, 8, 8, 8, 8, 8], heroes: ['rigid_artic', 'tractor_unit', 'semi', 'flatbed', 'container', 'reefer_trailer', 'tanker_trailer', 'car_trailer'], pool: [...W(TRAILERS, 0.9), ...W(TRUCKS, 1.0), ...W(BUSES, 0.4)], count: [8, 12], lo: [10, 20], hi: [14, 26], steps: 110, cap: 80000 },
  7: { sizes: [7], heroes: ['truck_tanker', 'mixer', 'truck_dump', 'truck_heavy', 'truck_cargo', 'ind_garbage'], pool: [...W(['mixer', 'forklift', 'ind_garbage', 'truck_tanker', 'truck_dump', 'truck_cargo', 'tractor', 'snowplow', 'truck_heavy', 'van_cargo', 'truck_small'], 1)], count: [8, 12], walls: [2, 4], lo: [10, 20], hi: [14, 25], steps: 140, cap: 60000 },
  8: { sizes: [7, 7, 7, 7, 7, 8, 8, 8, 8, 8], heroes: ['mixer', 'truck_dump', 'snowplow', 'forklift', 'tractor', 'truck_heavy'], pool: [...W(['excavator', 'loader', 'bulldozer', 'roller'], 1.3), ...W(['forklift', 'mixer', 'truck_dump', 'tractor', 'crane', 'mining', 'truck_small', 'ind_garbage'], 1)], count: [6, 10], walls: [3, 5], lo: [10, 22], hi: [14, 28], steps: 120, cap: 80000 },
  9: { sizes: [6, 6, 6, 6, 7, 7, 7, 7, 8, 8], heroes: ['ambulance', 'fire_mini', 'police_car', 'rescue', 'truck_fire', 'ambulance', 'moto_police', 'van_police'], pool: [...W(CARS), ...W(VANS, 0.8), ...W(['rescue', 'truck_fire', 'truck_tow', 'road_service', 'money', 'animal', 'city_service'], 0.9), ...W(MOTOS, 0.4)], count: [8, 12], lo: [10, 22], hi: [14, 28], steps: 130, cap: 70000 },
  10: { sizes: [6, 6, 6, 6, 7, 7, 7, 7, 7, 7], heroes: ['sports', 'racer', 'luxury', 'bus_double', 'taxi', 'truck_heavy', 'ambulance', 'suv'], pool: [...W(CARS), ...W(VANS, 0.7), ...W(BUSES, 0.5), ...W(TRUCKS, 0.7), ...W(MOTOS, 0.3)], count: [10, 13], walls: [0, 1], lo: [24, 40], hi: [32, 52], steps: 900, cap: 12000, att: 5, anneal: 0.4, push: true },
  11: { sizes: [6, 6, 6, 6, 6, 7, 7, 7, 7, 7], heroes: MOTOS, pool: [...W(MOTOS, 1.2), ...W(CARS, 0.8), ...W(VANS, 0.5)], count: [8, 12], lo: [6, 18], hi: [9, 24], steps: 70, cap: 15000, att: 3 },
};

import { existsSync as ex_, mkdirSync as mk_, readFileSync as rd_ } from 'node:fs';
const LC = join(dirname(fileURLToPath(import.meta.url)), '..', '.levelcache');
if (!ex_(LC)) mk_(LC);
function buildPack(pid) {
  const P = PACKS[pid];
  const out = [];
  for (let k = 1; k <= 10; k++) {
    const lf = join(LC, 'l' + pid + '-' + k + '.json');
    if (ex_(lf)) { out.push(JSON.parse(rd_(lf, 'utf8'))); continue; }
    const f = (k - 1) / 9;
    const n = P.sizes[(k - 1) % P.sizes.length];
    const heroes = P.heroes.filter((h) => { const t = TYPES.find((x) => x.id === h); return t && t.len <= n - 2; });
    let best = null;
    for (let attempt = 0; attempt < (P.att || 5); attempt++) {
      const seed = (hashStr('rahbaz-' + pid + '-' + k) + attempt * 7919) >>> 0;
      const lo = lerp(P.lo[0], P.lo[1], f), hi = lerp(P.hi[0], P.hi[1], f);
      const cnt = [Math.min(P.count[0] + Math.round(f * 2), P.count[1]), P.count[1]];
      const res = generate({
        seed, n, heroTypes: heroes, pool: P.pool.filter((p) => TYPES.find((x) => x.id === p.t).len <= n - 1),
        count: cnt, walls: P.walls, target: [lo, hi], steps: P.steps, cap: P.cap, anneal: P.anneal,
      });
      if (res && (!best || (res.ok && !best.res.ok) || (res.ok === best.res.ok && res.min > best.res.min))) best = { res, seed };
      if (best && (P.push ? best.res.min >= hi : best.res.ok)) break;
    }
    if (!best) throw new Error('could not generate pack ' + pid + ' level ' + k);
    const r = best.res;
    const d = difficultyOf(r.min);
    const lvl = { id: 'p' + pid + '-' + k, pack: pid, k, seed: best.seed, n: r.n, exit: r.exit, walls: r.walls, veh: r.veh, min: r.min, d };
    if (pid >= 2 && pid !== 11 && (k === 5 || k === 10)) lvl.lim = Math.floor(r.min * 1.8) + 3;
    lvl.stars = starThresholds(r.min);
    writeFileSync(lf, JSON.stringify(lvl));
    out.push(lvl);
  }
  return out;
}

// Packs are generated one after another; each finished pack is cached so an interrupted run can resume.
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
const here = dirname(fileURLToPath(import.meta.url));
const cacheDir = join(here, '..', '.levelcache');
if (!existsSync(cacheDir)) mkdirSync(cacheDir);
const t0 = Date.now();
const ids = Object.keys(PACKS).map(Number);
const all = [];
for (const pid of ids) {
  const f = join(cacheDir, 'p' + pid + '.json');
  let pack;
  if (existsSync(f)) pack = JSON.parse(readFileSync(f, 'utf8'));
  else { pack = buildPack(pid); writeFileSync(f, JSON.stringify(pack)); }
  console.log('pack', pid, 'moves:', pack.map((l) => l.min).join(','), ((Date.now() - t0) / 1000).toFixed(1) + 's');
  pack.forEach((l) => { l.d = difficultyOf(l.min); });
  all.push(...pack);
}
const js = '// AUTO-GENERATED by scripts/generate-levels.mjs – do not edit. Every level is verified solvable by BFS.\nexport const LEVELS = ' + JSON.stringify(all) + ';\n';
writeFileSync(join(here, '..', 'src', 'js', 'levels-data.js'), js);
console.log('wrote', all.length, 'levels,', js.length, 'bytes in', ((Date.now() - t0) / 1000).toFixed(1) + 's');
