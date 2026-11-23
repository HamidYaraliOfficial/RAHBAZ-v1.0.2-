import test from 'node:test';
import assert from 'node:assert/strict';
import { TYPES, TYPE_BY_ID } from '../src/js/vehicles.js';
import { makePuzzle, startPositions, fillOcc, rangeOf, isWin, validate } from '../src/js/engine.js';
import { solve } from '../src/js/solver.js';
import { generate, starThresholds, difficultyOf } from '../src/js/generator.js';
import { dailyOpts, endlessOpts, timeOpts } from '../src/js/presets.js';
import { LEVELS } from '../src/js/levels-data.js';

test('vehicle catalogue: unique ids, valid sizes, all categories present', () => {
  const ids = new Set(TYPES.map((t) => t.id));
  assert.equal(ids.size, TYPES.length);
  assert.ok(TYPES.length >= 70);
  for (const t of TYPES) { assert.ok(t.len >= 1 && t.len <= 6); assert.ok(t.wid >= 1 && t.wid <= 2); assert.ok(t.spd > 0); }
  for (const c of ['moto', 'car', 'van', 'bus', 'truck', 'trailer', 'machine', 'special']) assert.ok(TYPES.some((t) => t.cat === c), c);
});

const mini = () => makePuzzle({ n: 5, exit: 'R', walls: [[4, 4]], veh: [['hatch', 0, 2, 'h', 0, 0], ['sedan', 2, 1, 'v', 0, 1], ['bus_city', 0, 4, 'h', 0, 2]] });

test('engine: ranges respect walls, vehicles and board edges', () => {
  const p = mini(), pos = startPositions(p), occ = new Uint8Array(25);
  assert.equal(validate(p), null);
  assert.ok(fillOcc(p, pos, occ));
  assert.deepEqual(rangeOf(p, pos, occ, 0), [0, 0]); // hero blocked by the vertical sedan at x=2
  assert.deepEqual(rangeOf(p, pos, occ, 1), [0, 2]); // sedan (vertical, lane x=2) is stopped by the bus below
  assert.deepEqual(rangeOf(p, pos, occ, 2), [0, 1]); // bus stopped by the wall at (4,4)
});

test('engine: overlap and orientation errors are detected', () => {
  const bad = makePuzzle({ n: 5, exit: 'R', veh: [['hatch', 0, 0, 'h', 0, 0], ['sedan', 1, 0, 'h', 0, 0]] });
  assert.ok(validate(bad));
  const bad2 = makePuzzle({ n: 5, exit: 'R', veh: [['hatch', 0, 0, 'v', 0, 0]] });
  assert.ok(validate(bad2));
});

test('solver: finds the optimal solution of a hand-made puzzle and the path is legal', () => {
  const p = mini(), r = solve(p, startPositions(p), 50000);
  assert.ok(r && !r.capped);
  assert.equal(r.moves, 2);
  replay(p, startPositions(p), r.path);
});

test('solver: reports unsolvable puzzles (permanent blocker in the hero lane)', () => {
  const p = makePuzzle({ n: 5, exit: 'R', veh: [['hatch', 0, 2, 'h', 0, 0], ['sedan', 2, 2, 'h', 0, 1]] }); // sedan is stuck ahead and can reach the exit cells
  assert.equal(solve(p, startPositions(p), 50000), null);
});

function replay(p, start, path) {
  const pos = start.slice(), occ = new Uint8Array(p.n * p.n);
  for (const m of path) {
    assert.ok(fillOcc(p, pos, occ), 'overlap during replay');
    const [lo, hi] = rangeOf(p, pos, occ, m.i);
    assert.equal(pos[m.i], m.from);
    assert.ok(m.to >= lo && m.to <= hi && m.to !== m.from, 'illegal move in solution');
    pos[m.i] = m.to;
  }
  assert.ok(isWin(p, pos), 'hero did not reach the exit');
  return pos;
}

test('built-in levels: 110+ levels, ids unique, every one valid & solvable with the stored optimum', () => {
  assert.ok(LEVELS.length >= 110, 'levels: ' + LEVELS.length);
  assert.equal(new Set(LEVELS.map((l) => l.id)).size, LEVELS.length);
  const packs = new Set(LEVELS.map((l) => l.pack));
  for (let i = 1; i <= 11; i++) assert.ok(packs.has(i), 'pack ' + i);
  for (const l of LEVELS) {
    const p = makePuzzle(l);
    assert.equal(validate(p), null, l.id);
    const r = solve(p, startPositions(p), 400000);
    assert.ok(r && !r.capped, l.id + ' unsolvable');
    assert.equal(r.moves, l.min, l.id + ' optimum mismatch');
    replay(p, startPositions(p), r.path);
    assert.equal(l.d, difficultyOf(l.min));
  }
});

test('built-in levels: variety – no duplicate layouts, many vehicle types, all four exits used', () => {
  const sigs = new Set(LEVELS.map((l) => JSON.stringify([l.n, l.exit, l.veh])));
  assert.equal(sigs.size, LEVELS.length);
  const used = new Set(); LEVELS.forEach((l) => l.veh.forEach((v) => used.add(v[0])));
  assert.ok(used.size >= 55, 'vehicle types used: ' + used.size);
  assert.deepEqual([...new Set(LEVELS.map((l) => l.exit))].sort(), ['B', 'L', 'R', 'T']);
  assert.ok(LEVELS.some((l) => l.walls.length > 0));
  assert.ok(new Set(LEVELS.map((l) => l.n)).size >= 4);
});

test('hint safety: from every state along a solution, a fresh solve yields a legal first move', () => {
  for (const l of LEVELS.filter((_, i) => i % 9 === 0)) {
    const p = makePuzzle(l), pos = startPositions(p), r = solve(p, pos, 400000), occ = new Uint8Array(p.n * p.n);
    const cur = pos.slice();
    for (const m of r.path.slice(0, 4)) {
      const h = solve(p, cur, 400000);
      assert.ok(h && h.path.length === r.path.length - r.path.indexOf(m), 'hint optimal from here');
      fillOcc(p, cur, occ); const [lo, hi] = rangeOf(p, cur, occ, h.path[0].i);
      assert.ok(h.path[0].to >= lo && h.path[0].to <= hi);
      cur[m.i] = m.to;
    }
  }
});

test('generator: deterministic per seed, always returns a solver-verified solvable level', () => {
  const o = endlessOpts(3, 424242);
  const a = generate(o), b = generate(o);
  assert.deepEqual(a, b);
  const p = makePuzzle(a); assert.equal(solve(p, startPositions(p), 100000).moves, a.min);
  assert.notDeepEqual(generate(endlessOpts(3, 424243)).veh, a.veh);
});

test('daily challenge: same date -> same puzzle; different date -> different', () => {
  const x = generate(dailyOpts('2026-11-20')), y = generate(dailyOpts('2026-11-20')), z = generate(dailyOpts('2026-11-21'));
  assert.deepEqual(x, y); assert.notDeepEqual(x.veh, z.veh);
});

test('time/endless presets produce solvable puzzles within their move ranges', () => {
  for (const d of ['easy', 'medium']) { const r = generate(timeOpts(d, 99)); assert.ok(r.min >= 3); }
  assert.ok(starThresholds(10)[0] >= 10 && starThresholds(10)[1] > starThresholds(10)[0]);
});

test('large vehicles keep their footprint: len/wid map to rectangles for both orientations', () => {
  const p = makePuzzle({ n: 8, exit: 'R', veh: [['semi', 0, 0, 'h', 0, 0], ['excavator', 5, 3, 'v', 0, 0], ['crane', 0, 5, 'h', 0, 0]] });
  const occ = new Uint8Array(64); assert.ok(fillOcc(p, startPositions(p), occ));
  assert.equal([...occ].filter((x) => x === 1).length, 5);
  assert.equal([...occ].filter((x) => x === 2).length, 4);
  assert.equal([...occ].filter((x) => x === 3).length, 6);
  assert.equal(TYPE_BY_ID.semi.len, 5);
});

test('difficulty ladder: all six tiers exist and the "10 Expert levels" achievement is reachable', () => {
  const d = [0, 0, 0, 0, 0, 0]; LEVELS.forEach((l) => d[l.d]++);
  for (let i = 0; i < 6; i++) assert.ok(d[i] > 0, 'tier ' + i + ' missing: ' + d.join(','));
  assert.ok(d[4] + d[5] >= 10, 'expert+ levels: ' + (d[4] + d[5]));
});
