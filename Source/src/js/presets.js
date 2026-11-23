// Parameter presets for the runtime generators (Endless, Daily, Time Challenge). Pure data -> usable in tests.
import { TYPES } from './vehicles.js';
import { hashStr } from './rng.js';

const w = (cat, k, maxLen) => TYPES.filter((t) => t.cat === cat && t.len <= (maxLen || 9) && t.wid === 1).map((t) => ({ t: t.id, w: k }));
const POOL = [].concat(w('car', 1), w('moto', 0.5), w('van', 0.7, 3), w('truck', 0.3, 3), w('bus', 0.2, 3), w('special', 0.3, 3));
const HEROES = TYPES.filter((t) => (t.cat === 'car' || t.cat === 'moto' || t.cat === 'van') && t.wid === 1).map((t) => t.id);

export function endlessOpts(round, seed) {
  const n = round < 7 ? 6 : 7;
  const lo = Math.min(4 + round, 20), hi = Math.min(lo + 4, 24);
  return { seed, n, heroTypes: HEROES, pool: POOL, count: [Math.min(5 + Math.floor(round / 2), 9), 10], target: [lo, hi], steps: 40, cap: 25000 };
}
export function dailyOpts(dateKey) {
  const seed = hashStr('rahbaz-daily-' + dateKey);
  const n = 6 + (seed % 3 === 0 ? 1 : 0);
  return { seed, n, heroTypes: HEROES, pool: POOL, count: [8, 11], target: [11, 17], steps: 70, cap: 30000 };
}
export const TIME_LEVELS = { easy: { n: 6, target: [5, 9], count: [5, 8], base: 25, per: 7 }, medium: { n: 6, target: [9, 14], count: [7, 10], base: 25, per: 6 }, hard: { n: 7, target: [13, 19], count: [8, 11], base: 30, per: 6 } };
export function timeOpts(diff, seed) {
  const c = TIME_LEVELS[diff];
  return { seed, n: c.n, heroTypes: HEROES, pool: POOL, count: c.count, target: c.target, steps: 40, cap: 25000 };
}
export const timeLimitFor = (diff, min) => TIME_LEVELS[diff].base + TIME_LEVELS[diff].per * min;
