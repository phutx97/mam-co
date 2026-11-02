// Rules of the sort puzzle. A tray is a stack of dishes, bottom first.
// Hidden dishes stay covered until they reach the top of their tray.

export const CAP = 4;

export interface Item {
  dish: number;
  hidden: boolean;
}

export type Tray = Item[];

export type Move = [from: number, to: number];

/** Number of same, uncovered dishes on top of the tray. */
export function topRun(tray: Tray): number {
  const top = tray.at(-1);
  if (!top) return 0;
  let n = 0;
  for (let i = tray.length - 1; i >= 0 && tray[i].dish === top.dish && !tray[i].hidden; i--) n++;
  return n;
}

export function canMove(trays: Tray[], from: number, to: number): boolean {
  if (from === to) return false;
  const src = trays[from];
  const dst = trays[to];
  const top = src.at(-1);
  if (!top || dst.length >= CAP) return false;
  return dst.length === 0 || dst.at(-1)!.dish === top.dish;
}

/** Moves as many matching dishes as fit, then uncovers the new top of the source. */
export function applyMove(trays: Tray[], from: number, to: number): Tray[] {
  const next = trays.map((t) => t.slice());
  const src = next[from];
  const dst = next[to];
  const n = Math.min(topRun(src), CAP - dst.length);
  dst.push(...src.splice(src.length - n, n));
  const newTop = src.at(-1);
  if (newTop?.hidden) src[src.length - 1] = { ...newTop, hidden: false };
  return next;
}

export function isSolved(trays: Tray[]): boolean {
  return trays.every((t) => t.length === 0 || (t.length === CAP && t.every((i) => i.dish === t[0].dish)));
}
