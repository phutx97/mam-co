import { describe, expect, it } from 'vitest';
import { CAP, applyMove, canMove, isSolved, topRun, type Tray } from '../src/game';
import { generateLevel, solve } from '../src/generate';

const tray = (...dishes: number[]): Tray => dishes.map((dish) => ({ dish, hidden: false }));

describe('rules', () => {
  it('moves the whole top run when it fits', () => {
    const next = applyMove([tray(0, 1, 1), tray(1)], 0, 1);
    expect(next[0].map((i) => i.dish)).toEqual([0]);
    expect(next[1].map((i) => i.dish)).toEqual([1, 1, 1]);
  });

  it('moves only what fits', () => {
    const next = applyMove([tray(1, 1, 1), tray(1, 1)], 0, 1);
    expect(next[0]).toHaveLength(1);
    expect(next[1]).toHaveLength(CAP);
  });

  it('rejects a move onto a different dish or a full tray', () => {
    expect(canMove([tray(0), tray(1)], 0, 1)).toBe(false);
    expect(canMove([tray(1), tray(1, 1, 1, 1)], 0, 1)).toBe(false);
    expect(canMove([tray(0), []], 0, 1)).toBe(true);
  });

  it('uncovers the new top and does not carry hidden dishes in a run', () => {
    const trays: Tray[] = [[{ dish: 1, hidden: true }, { dish: 1, hidden: false }], []];
    expect(topRun(trays[0])).toBe(1);
    const next = applyMove(trays, 0, 1);
    expect(next[0][0].hidden).toBe(false);
    expect(next[1]).toHaveLength(1);
  });

  it('does not mutate the input', () => {
    const trays = [tray(0, 1), []];
    applyMove(trays, 0, 1);
    expect(trays[0]).toHaveLength(2);
  });

  it('detects a solved board', () => {
    expect(isSolved([tray(0, 0, 0, 0), [], tray(1, 1, 1, 1)])).toBe(true);
    expect(isSolved([tray(0, 0, 0), tray(0)])).toBe(false);
  });
});

describe('levels', () => {
  it('is deterministic', () => {
    expect(generateLevel(12)).toEqual(generateLevel(12));
  });

  it('levels 1-30 are solvable, unsolved at start, and each dish appears exactly CAP times', () => {
    for (let n = 1; n <= 30; n++) {
      const level = generateLevel(n);
      expect(isSolved(level.trays)).toBe(false);
      expect(solve(level.trays)).not.toBeNull();
      const counts = new Map<number, number>();
      for (const t of level.trays) for (const i of t) counts.set(i.dish, (counts.get(i.dish) ?? 0) + 1);
      expect([...counts.values()].every((c) => c === CAP)).toBe(true);
      // Top dishes are always visible.
      expect(level.trays.every((t) => !t.at(-1)?.hidden)).toBe(true);
    }
  });

  it('replaying the solver solution solves the board', () => {
    const level = generateLevel(20);
    let trays = level.trays;
    for (const [from, to] of solve(trays)!) {
      expect(canMove(trays, from, to)).toBe(true);
      trays = applyMove(trays, from, to);
    }
    expect(isSolved(trays)).toBe(true);
  });
});
