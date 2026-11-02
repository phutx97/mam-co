import { applyMove, canMove, isSolved, topRun, type Move, type Tray } from './game';
import { generateLevel, solve } from './generate';
import { DISHES } from './dishes';

const SAVE_KEY = 'mam-co:level';
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const board = $('board');
const undoBtn = $<HTMLButtonElement>('undo');
const addBtn = $<HTMLButtonElement>('add');

let levelNo = 1;
let trays: Tray[] = [];
let history: Tray[][] = [];
let selected: number | null = null;
let addedTray = false;
let hint: Move | null = null;
// Remaining solver moves. Kept while the player follows them, so hints never undo each other.
let plan: Move[] = [];

function savedLevel(): number {
  const fromUrl = Number(new URLSearchParams(location.search).get('level'));
  if (fromUrl > 0) return fromUrl;
  try {
    return Number(localStorage.getItem(SAVE_KEY)) || 1;
  } catch {
    return 1;
  }
}

function start(n: number) {
  levelNo = n;
  try {
    localStorage.setItem(SAVE_KEY, String(n));
  } catch {}
  trays = generateLevel(n).trays;
  history = [];
  selected = null;
  addedTray = false;
  hint = null;
  plan = [];
  $('win').hidden = true;
  render();
}

function render() {
  $('level').textContent = `Màn ${levelNo}`;
  undoBtn.disabled = history.length === 0;
  addBtn.disabled = addedTray;
  board.replaceChildren(
    ...trays.map((tray, t) => {
      const el = document.createElement('div');
      el.className = 'tray';
      el.classList.toggle('sel', t === selected);
      el.classList.toggle('hint-from', hint?.[0] === t);
      el.classList.toggle('hint-to', hint?.[1] === t);
      const lift = tray.length - (t === selected ? topRun(tray) : 0);
      tray.forEach((item, i) => {
        const d = document.createElement('div');
        d.className = 'dish';
        d.classList.toggle('hidden', item.hidden);
        d.classList.toggle('lift', i >= lift);
        d.textContent = item.hidden ? '?' : DISHES[item.dish].emoji;
        if (!item.hidden) d.title = DISHES[item.dish].name;
        el.append(d);
      });
      el.onclick = () => tap(t, el);
      return el;
    }),
  );
}

function tap(t: number, el: HTMLElement) {
  hint = null;
  if (selected === null) {
    if (trays[t].length) selected = t;
  } else if (selected === t) {
    selected = null;
  } else if (canMove(trays, selected, t)) {
    history.push(trays);
    trays = applyMove(trays, selected, t);
    if (plan[0]?.[0] === selected && plan[0][1] === t) plan.shift();
    else plan = [];
    selected = null;
  } else {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
    return;
  }
  render();
  if (isSolved(trays)) $('win').hidden = false;
}

undoBtn.onclick = () => {
  const prev = history.pop();
  if (!prev) return;
  trays = prev;
  selected = null;
  hint = null;
  plan = [];
  render();
};

// Rewarded-ad slots later: hint and the extra tray.
$('hint').onclick = () => {
  if (!plan.length) plan = solve(trays) ?? [];
  hint = plan[0] ?? null;
  selected = null;
  render();
  if (!hint) alert('Bế tắc rồi, hãy hoàn tác hoặc thêm khay.');
};

addBtn.onclick = () => {
  if (addedTray) return;
  addedTray = true;
  // Undo must not take the extra tray away again.
  history = history.map((h) => [...h, []]);
  trays = [...trays, []];
  plan = [];
  render();
};

$('restart').onclick = () => start(levelNo);
$('next').onclick = () => start(levelNo + 1);

start(savedLevel());
