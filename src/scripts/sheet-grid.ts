/**
 * Puts every ruled line of the trip sheet on the drafting grid.
 *
 * The grid is drawn from the sheet's border box (`.sheet-inner`, background-origin: border-box): its 1px lines cover
 * the pixels [10k, 10k + 1) on both axes, and the sheet's own border is line zero. A ruled edge sits on the grid when
 * its first border pixel does. Layout (wrapping text, fluid columns) puts edges anywhere, so after layout this walks
 * the page top to bottom and nudges each edge forward onto the next line: never more than one square, always by
 * growing a padding, a margin, a column or a row, so content is never cropped. Positions below a nudge move with it,
 * which is why the walk re-measures as it goes.
 */

const U = 10;
/** Every inline property this walk set, so a re-run starts from the stylesheet's layout. */
const touched = new Map<HTMLElement, Set<string>>();
const mod = (v: number) => ((v % U) + U) % U;
let ox = 0;
let oy = 0;

/** How far v must move forward to land on a grid line (0 when it already does). */
function need(v: number) {
  const m = ((v % U) + U) % U;
  return m < 0.02 || m > U - 0.02 ? 0 : U - m;
}
function box(el: Element) {
  const r = el.getBoundingClientRect();
  return { left: r.left - ox, top: r.top - oy, right: r.right - ox, bottom: r.bottom - oy, width: r.width, height: r.height };
}
function set(el: HTMLElement, prop: string, value: string) {
  if (!touched.has(el)) touched.set(el, new Set());
  touched.get(el)!.add(prop);
  el.style.setProperty(prop, value);
}
function grow(el: HTMLElement, prop: 'padding-bottom' | 'padding-top' | 'margin-top' | 'margin-left' | 'margin-right', d: number) {
  if (!d) return;
  set(el, prop, `${(parseFloat(getComputedStyle(el).getPropertyValue(prop)) || 0) + d}px`);
}
const hasBorder = (el: Element, side: 'top' | 'bottom') => parseFloat(getComputedStyle(el).getPropertyValue(`border-${side}-width`)) > 0;
/** Bottom edge onto a line: its border's first pixel if it has one, else the edge itself (the next block's rule). */
function bottom(el: HTMLElement) {
  const b = box(el);
  if (b.height) grow(el, 'padding-bottom', need(hasBorder(el, 'bottom') ? b.bottom - 1 : b.bottom));
}
function top(el: HTMLElement) {
  const b = box(el);
  const d = need(b.top);
  if (!b.height || !d) return;
  // Vertical margins collapse: a larger margin above would swallow a small nudge. Start from the gap actually shown.
  // Only block flow collapses; grid and flex items keep their margin plus the container's gap.
  // Floats are out of flow: the margin that collapses with ours belongs to the block before them.
  let prev = el.previousElementSibling as HTMLElement | null;
  while (prev && getComputedStyle(prev).float !== 'none') prev = prev.previousElementSibling as HTMLElement | null;
  const mt = parseFloat(getComputedStyle(el).marginTop) || 0;
  const parent = el.parentElement ? getComputedStyle(el.parentElement).display : 'block';
  const flows = /^(block|flow-root|list-item)$/.test(parent) && prev;
  const gap = flows ? Math.max(mt, b.top - box(prev!).bottom) : mt;
  set(el, 'margin-top', `${gap + d}px`);
}

/** Boxes in a grid (export buttons): whole-square boxes (≡ 1px, so both borders land on lines) with 9px gaps. */
function boxGrid(grid: HTMLElement) {
  const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
  const b = box(grid);
  const shift = need(b.left);
  grow(grid, 'margin-left', shift);
  const k = Math.floor((b.width - shift - cols - 9 * (cols - 1)) / (U * cols));
  set(grid, 'grid-template-columns', `repeat(${cols}, ${k * U + 1}px)`);
  set(grid, 'gap', '9px');
  set(grid, 'grid-auto-rows', 'auto');
  const tallest = Math.max(...[...grid.children].map((c) => c.getBoundingClientRect().height));
  set(grid, 'grid-auto-rows', `${Math.ceil((tallest - 1) / U - 1e-6) * U + 1}px`);
  top(grid);
}

/** A photo plate: box on lines, image one square inside on lines, in whole steps (3:2 → 30px, 2:3 → 20px). */
function plate(fig: HTMLElement) {
  const img = fig.querySelector('img') as HTMLImageElement;
  const ratio = Number(img.getAttribute('width')) / Number(img.getAttribute('height'));
  const step = ratio >= 1 ? 3 * U : 2 * U;
  const r = box(fig);
  const w = Math.floor((r.width - U) / step + 1e-6) * step;
  if (w <= 0) return;
  set(img, 'width', `${w}px`);
  set(img, 'height', `${Math.round(w / ratio / U) * U}px`);
  set(img, 'max-height', 'none');
  set(fig, 'width', `${w + 2 * U + 1}px`);
  set(fig, 'padding-right', `${U}px`);
  const now = box(fig);
  // A right float is placed by its right margin, everything else by its left one.
  if (getComputedStyle(fig).float === 'right') grow(fig, 'margin-right', -need(now.left));
  else grow(fig, 'margin-left', need(now.left));
  // Paired plates share a row: move the pair, not one of them.
  // Side by side only: stacked on one column (phones), each plate of a pair is placed on its own.
  const parent = fig.parentElement;
  const pair = parent?.classList.contains('plates') && getComputedStyle(parent).gridTemplateColumns.split(' ').filter(Boolean).length > 1 ? parent : null;
  if (pair) {
    if (fig === pair.firstElementChild) top(pair);
  } else top(fig);
  if (!pair) return bottom(fig);
  // A pair stretches to one row: once its last plate is placed, grow both together onto the next line.
  if (fig === pair.lastElementChild) {
    const d = need(box(fig).bottom - 1);
    for (const f of pair.children as HTMLCollectionOf<HTMLElement>) grow(f, 'padding-bottom', d);
  }
}

/** Tips next to running text are set into its panel (same selector as global.css). */
const TEXT = ':is(p, ul, ol)';
export const TIP_IN_TEXT = `.col > aside.tip:is(${TEXT} + *, ${TEXT} + aside.tip + *, ${TEXT} + aside.tip + aside.tip + *, :has(+ ${TEXT}), :has(+ aside.tip + ${TEXT}), :has(+ aside.tip + aside.tip + ${TEXT}))`;

/** A hazard tip's title band ends on a rule of its own; the growth is shared above and below, so it stays centred. */
function band(head: HTMLElement | null) {
  if (!head || !hasBorder(head, 'bottom')) return;
  const d = need(box(head).bottom - 1);
  grow(head, 'padding-top', d / 2);
  grow(head, 'padding-bottom', d / 2);
}

/** A tip box: all four borders on lines. Set into a text panel, the stretch is placed like a paragraph first. */
function tip(el: HTMLElement) {
  const inner = el.querySelector<HTMLElement>(':scope > .box')!;
  if (el.matches(TIP_IN_TEXT)) {
    // The stretch's sides land on lines like the panel's, and its rule plus padding is whole squares, so the box's
    // sides land on lines too. Only the box's top and bottom are left to place.
    textRun(el, false);
    top(inner);
    band(inner.querySelector('.head'));
    bottom(inner);
    if (hasBorder(el, 'bottom')) bottom(el);
    return;
  }
  top(el);
  const b = box(el);
  const left = b.left + need(b.left);
  const right = Math.floor((b.right - 1) / U + 1e-6) * U + 1;
  grow(el, 'margin-left', left - b.left);
  set(el, 'width', `${right - left}px`);
  band(inner.querySelector('.head'));
  bottom(inner);
}

/** Text runs that sit beside a lone portrait (same selector as global.css). */
const BESIDE = '.col > .plate.portrait ~ :is(p, ul, ol):not(.plate.portrait ~ :not(p, ul, ol) ~ *)';

/** One paragraph of a text panel: sides on lines; the run's first draws the top rule, its last the bottom rule. */
function textRun(el: HTMLElement, snapBottom = true) {
  if (hasBorder(el, 'top')) top(el);
  // Same width rule as the plates it lines up with: a full-width panel matches a landscape plate (30px steps), a
  // half-width panel beside a portrait matches a portrait plate (20px steps).
  const b = box(el);
  const half = matchMedia('(min-width: 1100px)').matches && el.matches(BESIDE);
  const step = half ? 2 * U : 3 * U;
  const width = Math.floor((b.width - U) / step + 1e-6) * step + 2 * U + 1;
  grow(el, 'margin-left', need(b.left));
  set(el, 'width', `${width}px`);
  if (snapBottom && hasBorder(el, 'bottom')) bottom(el);
  // Text beside a floated portrait: the pair shares its top line, like two plates side by side.
  const prev = el.previousElementSibling as HTMLElement | null;
  if (prev?.matches('figure.plate') && getComputedStyle(prev).float !== 'none') {
    const d = box(el).top - box(prev).top;
    if (d) set(prev, 'margin-top', `${(parseFloat(getComputedStyle(prev).marginTop) || 0) + d}px`);
  }
}

/** A day strip: on the grid like a text panel, its extra height shared above and below the text (centred). */
function dayStrip(el: HTMLElement) {
  textRun(el, false);
  const b = box(el);
  set(el, 'height', `${b.height + need(b.bottom - 1)}px`);
}

/** A region's "Mon avis" panel: wide like the text panels; head rule, the rule between its two parts, bottom rule. */
function review(el: HTMLElement) {
  textRun(el, false);
  const head = el.querySelector<HTMLElement>(':scope > .head');
  if (head) bottom(head);
  const parts = el.querySelector<HTMLElement>(':scope > .parts');
  const [a, b] = parts ? ([...parts.children] as HTMLElement[]) : [];
  if (parts && a && b) {
    // The parts are stacked: the second one's top rule goes on a line.
    grow(a, 'padding-bottom', need(box(b).top));
  }
  bottom(el);
}

function runningHead(el: HTMLElement) {
  bottom(el);
}

function sheetTop(el: HTMLElement) {
  const hero = el.querySelector<HTMLElement>('.hero-plate')!;
  const cartouche = el.querySelector<HTMLElement>('.cartouche')!;
  const legend = el.querySelector<HTMLElement>('.legend')!;
  const wrap = el.querySelector<HTMLElement>('.trip-map')!;
  const map = wrap.querySelector<HTMLElement>('.sheet-map')!;
  const summary = el.querySelector<HTMLElement>('.summary')!;
  const facts = el.querySelector<HTMLElement>('.facts')!;
  const side = box(hero).right < box(legend).left + 5;

  const heroPlate = hero.querySelector<HTMLElement>('figure.plate');
  if (side) {
    // The plate column ends on a line (its right rule).
    const b = box(hero);
    set(el, 'grid-template-columns', `${b.width - mod(b.right - 1)}px minmax(0, 1fr)`);
    if (heroPlate) plate(heroPlate);
    top(facts);
    bottom(cartouche);
    boxGrid(legend.querySelector<HTMLElement>('.exports')!);
    // The map's top rule closes the row above: grow both columns' cells, the taller one decides.
    const d = need(box(wrap).top);
    grow(hero, 'padding-bottom', d);
    grow(legend, 'padding-bottom', d);
  } else {
    if (heroPlate) plate(heroPlate);
    grow(hero, 'padding-bottom', need(box(wrap).top));
  }
  // The map itself: its outline's bottom on a line.
  const m = box(map);
  set(map, 'height', `${m.height + need(m.bottom)}px`);
  if (!side) {
    top(facts);
    bottom(summary);
    boxGrid(legend.querySelector<HTMLElement>('.exports')!);
  }
  bottom(el);
}

/** The regions index: column rules on lines, then its bottom rule. */
function regionsIndex(el: HTMLElement) {
  const ol = el.querySelector<HTMLElement>('ol')!;
  const cols = getComputedStyle(ol).gridTemplateColumns.split(' ').filter(Boolean).length;
  const b = box(ol);
  const widths: string[] = [];
  let prev = b.left;
  for (let k = 1; k < cols; k++) {
    const rule = Math.floor((b.left + (k * b.width) / cols) / U) * U; // next cell's left rule
    widths.push(`${rule - prev}px`);
    prev = rule;
  }
  widths.push('minmax(0, 1fr)');
  set(ol, 'grid-template-columns', widths.join(' '));
  // A cell that wraps to the start of a row would draw its rule against the sheet's own border.
  for (const li of ol.children as HTMLCollectionOf<HTMLElement>) {
    if (box(li).left - b.left < 1) set(li, 'border-left-width', '0');
  }
  bottom(el);
}

function sectionHead(el: HTMLElement) {
  top(el);
  bottom(el);
}

/** Region map beside (or above) its points table: map outline, column rule, table rows, bottom rule. */
function detail(el: HTMLElement) {
  const map = el.querySelector<HTMLElement>('.sheet-map')!;
  const rows = [...el.querySelectorAll<HTMLElement>('.points tr')];
  const side = box(map).right < (el.querySelector('.points')?.getBoundingClientRect().left ?? Infinity) - ox + 5;
  const alignRows = () => {
    for (const tr of rows) {
      const b = box(tr);
      if (b.height) set(tr, 'height', `${b.height + need(b.bottom - 1)}px`);
    }
  };
  if (side) {
    const b = box(map);
    const cols = getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean);
    set(el, 'grid-template-columns', `${parseFloat(cols[0]) - mod(b.right)}px minmax(0, 1fr)`);
    alignRows();
    const m = box(map);
    set(map, 'min-height', `${m.height + need(m.bottom)}px`);
  } else {
    const m = box(map);
    set(map, 'min-height', `${m.height + need(m.bottom)}px`);
    alignRows();
    bottom(el);
  }
}

function pager(el: HTMLElement) {
  top(el);
  bottom(el);
}
function foot(el: HTMLElement) {
  top(el);
  // The sheet's bottom border follows the footer directly.
  const b = box(el);
  grow(el, 'padding-bottom', need(b.bottom));
}

const handlers: [string, (el: HTMLElement) => void][] = [
  ['.sheet-inner > header.rhead', runningHead],
  ['.top', sheetTop],
  ['.regions-index', regionsIndex],
  ['section.region > .rhead, section.before > .rhead', sectionHead],
  ['.region > .detail', detail],
  ['figure.plate', (el) => !el.closest('.top') && plate(el)],
  ['aside.tip', tip],
  ['aside.review', review],
  ['.col > :is(p, ul, ol), .prose > :is(p, ul, ol)', textRun],
  ['.col > .day', dayStrip],
  ['.pager', pager],
  ['.foot', foot],
];

export function snapSheet() {
  const sheet = document.querySelector<HTMLElement>('.sheet-inner');
  if (!sheet) return;
  for (const [el, props] of touched) for (const p of props) el.style.removeProperty(p);
  touched.clear();
  const r = sheet.getBoundingClientRect();
  ox = r.left;
  oy = r.top;
  // The frame's scale starts where the grid does: the inner sheet's offset inside the frame's padding box.
  const frame = sheet.parentElement as HTMLElement;
  const f = frame.getBoundingClientRect();
  set(frame, '--rx', `${r.left - (f.left + frame.clientLeft)}px`);
  set(frame, '--ry', `${r.top - (f.top + frame.clientTop)}px`);
  const all = sheet.querySelectorAll<HTMLElement>(handlers.map(([s]) => s).join(','));
  for (const el of all) {
    const h = handlers.find(([s]) => el.matches(s));
    h?.[1](el);
    // The walk measures in viewport space; keep the origin current if anything above moved the sheet.
    const now = sheet.getBoundingClientRect();
    ox = now.left;
    oy = now.top;
  }
  document.dispatchEvent(new Event('sheet:snapped'));
}

export function watchSheet() {
  let timer = 0;
  const later = () => {
    clearTimeout(timer);
    timer = window.setTimeout(snapSheet, 120);
  };
  snapSheet();
  document.fonts?.ready.then(snapSheet);
  addEventListener('load', snapSheet);
  addEventListener('resize', later);
}
