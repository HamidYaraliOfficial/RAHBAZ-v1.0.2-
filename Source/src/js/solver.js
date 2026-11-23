// Breadth-first solver. A "move" = sliding one vehicle any number of free cells. BFS gives the exact minimum.
import { fillOcc, rangeOf } from './engine.js';

const keyOf = (arr, off, m) => {
  let s = '';
  for (let i = 0; i < m; i++) s += String.fromCharCode(arr[off + i]);
  return s;
};

// Returns {moves, path:[{i,from,to}], states} | {capped:true, states} | null (unsolvable)
export function solve(puz, start, cap) {
  cap = cap || 200000;
  const m = puz.vs.length, n = puz.n, goal = puz.goal;
  if (start[0] === goal) return { moves: 0, path: [], states: 1 };
  let capacity = 2048;
  let flat = new Uint8Array(capacity * m);
  let parent = new Int32Array(capacity);
  let mvI = new Uint8Array(capacity), mvFrom = new Uint8Array(capacity);
  let count = 1;
  for (let i = 0; i < m; i++) flat[i] = start[i];
  parent[0] = -1;
  const seen = new Set();
  seen.add(keyOf(flat, 0, m));
  const occ = new Uint8Array(n * n);
  const pos = new Uint8Array(m);
  const tmp = new Uint8Array(m);

  const rebuild = (idx) => {
    const path = [];
    while (parent[idx] >= 0) {
      const i = mvI[idx];
      path.push({ i, from: mvFrom[idx], to: flat[idx * m + i] });
      idx = parent[idx];
    }
    path.reverse();
    return path;
  };

  for (let head = 0; head < count; head++) {
    for (let i = 0; i < m; i++) pos[i] = flat[head * m + i];
    fillOcc(puz, pos, occ);
    for (let i = 0; i < m; i++) {
      const r = rangeOf(puz, pos, occ, i);
      for (let q = r[0]; q <= r[1]; q++) {
        if (q === pos[i]) continue;
        for (let k = 0; k < m; k++) tmp[k] = pos[k];
        tmp[i] = q;
        const key = keyOf(tmp, 0, m);
        if (seen.has(key)) continue;
        seen.add(key);
        if (count >= capacity) {
          capacity *= 2;
          const nf = new Uint8Array(capacity * m); nf.set(flat); flat = nf;
          const np = new Int32Array(capacity); np.set(parent); parent = np;
          const ni = new Uint8Array(capacity); ni.set(mvI); mvI = ni;
          const nff = new Uint8Array(capacity); nff.set(mvFrom); mvFrom = nff;
        }
        for (let k = 0; k < m; k++) flat[count * m + k] = tmp[k];
        parent[count] = head; mvI[count] = i; mvFrom[count] = pos[i];
        if (i === 0 && q === goal) {
          const path = rebuild(count);
          return { moves: path.length, path, states: count + 1 };
        }
        count++;
      }
    }
    if (count > cap) return { capped: true, states: count };
  }
  return null;
}
