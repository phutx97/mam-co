import { CAP, applyMove, canMove, isSolved, type Move, type Tray } from './game';

export interface Level {
  number: number;
  trays: Tray[];
  /** Length of the solution the solver found; a rough difficulty score. */
  solutionLength: number;
}

export const DISH_COUNT = 10;
const EMPTY_TRAYS = 2;
const SOLVER_BUDGET = 200_000;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function levelParams(n: number) {
  return {
    dishes: Math.min(DISH_COUNT, 3 + Math.floor((n - 1) / 3)),
    hiddenRatio: n < 8 ? 0 : Math.min(0.5, 0.15 + (n - 8) * 0.02),
  };
}

/** Same level number always gives the same board. */
export function generateLevel(n: number): Level {
  const { dishes, hiddenRatio } = levelParams(n);
  const rand = mulberry32(n * 7919);
  for (;;) {
    const pool: number[] = [];
    for (let d = 0; d < dishes; d++) for (let k = 0; k < CAP; k++) pool.push(d);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const trays: Tray[] = [];
    for (let t = 0; t < dishes; t++) {
      trays.push(pool.slice(t * CAP, (t + 1) * CAP).map((dish, i) => ({ dish, hidden: i < CAP - 1 && rand() < hiddenRatio })));
    }
    for (let e = 0; e < EMPTY_TRAYS; e++) trays.push([]);
    if (trays.some((t) => t.length === CAP && t.every((i) => i.dish === t[0].dish))) continue;
    const solution = solve(trays);
    if (solution) return { number: n, trays, solutionLength: solution.length };
  }
}

const key = (trays: Tray[]) =>
  trays
    .map((t) => t.map((i) => i.dish).join(','))
    .sort()
    .join('|');

/** Depth-first search with full knowledge of covered dishes. Null if unsolvable within budget. */
export function solve(trays: Tray[], budget = SOLVER_BUDGET): Move[] | null {
  const seen = new Set<string>();
  const path: Move[] = [];
  const dfs = (s: Tray[]): boolean => {
    if (isSolved(s)) return true;
    const k = key(s);
    if (seen.has(k) || seen.size >= budget) return false;
    seen.add(k);
    const moves: Move[] = [];
    for (let from = 0; from < s.length; from++) {
      const src = s[from];
      if (!src.length) continue;
      const uniform = src.every((i) => i.dish === src[0].dish);
      let triedEmpty = false;
      for (let to = 0; to < s.length; to++) {
        if (!canMove(s, from, to)) continue;
        if (s[to].length === 0) {
          // Empty trays are interchangeable, and moving a single-dish tray into one changes nothing.
          if (triedEmpty || uniform) continue;
          triedEmpty = true;
          moves.push([from, to]);
        } else {
          moves.unshift([from, to]);
        }
      }
    }
    for (const m of moves) {
      path.push(m);
      if (dfs(applyMove(s, m[0], m[1]))) return true;
      path.pop();
    }
    return false;
  };
  return dfs(trays) ? path : null;
}
