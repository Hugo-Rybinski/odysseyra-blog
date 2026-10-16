/**
 * Stamps every box of the trip sheet with a reference, as on a technical drawing: 2026-KGZ-R04-D09-TXT-01.
 *
 * Trip year and country code; the region (R04), left out outside the regions (sheet top, "before you go"); the day
 * (D09) when a day strip comes before the box in its region; the box type (MAP, TXT, PIC, TIP, RGN for a region
 * header, OPN for "Mon avis"); and a number that counts the boxes sharing all of the above, from 00 (the second text
 * panel of day 9 is TXT-01, its first tip still TIP-00). The page is the same in every language, so a box keeps its
 * reference across languages. Each reference sits in the box's bottom right corner and links to its top.
 *
 * Text panels have no element of their own (a run of paragraphs, see global.css), which is why this runs in the page
 * rather than at build time: the run's first paragraph takes the anchor, its last one the label.
 */
import { isLang, t } from '../i18n';
import { TIP_IN_TEXT } from './sheet-grid';

type Kind = 'MAP' | 'TXT' | 'PIC' | 'TIP' | 'RGN' | 'OPN';
/** Kinds that belong to one day rather than to a whole region. */
const DATED: Kind[] = ['TXT', 'PIC', 'TIP', 'OPN'];

const BOXES = [
  '.hero-plate figure.plate',
  '.sheet-map',
  '.prose > :is(p, ul, ol)',
  'section > .rhead',
  '.col > .day',
  '.col > :is(p, ul, ol, aside.tip)',
  '.col figure.plate',
  'aside.review',
].join(', ');

const inRun = (el: Element | null): el is HTMLElement => !!el && (el.matches(':is(p, ul, ol)') || el.matches(TIP_IN_TEXT));

export function stampBoxes() {
  const main = document.querySelector<HTMLElement>('main[data-uid]');
  if (!main || main.dataset.stamped) return;
  main.dataset.stamped = '';
  const lang = document.documentElement.lang;
  const s = t(isLang(lang) ? lang : 'en');
  const counts = new Map<string, number>();
  let section: Element | null = null;
  let day = '';

  /** top: the element the reference links to; host: the element whose bottom right corner carries the label. */
  const stamp = (kind: Kind, top: HTMLElement, host: HTMLElement) => {
    const region = (top.closest('section.region') as HTMLElement | null)?.dataset.region;
    const key = [main.dataset.uid, region && `R${region}`, day && DATED.includes(kind) && `D${day}`, kind].filter(Boolean).join('-');
    const n = counts.get(key) ?? 0;
    counts.set(key, n + 1);
    const uid = `${key}-${String(n).padStart(2, '0')}`;
    // Boxes that already carry an id (maps: other links point at them) get a marker at their top instead.
    if (top.id) {
      const at = document.createElement('span');
      at.className = 'uid-at';
      at.id = uid;
      top.prepend(at);
    } else top.id = uid;
    top.classList.add('has-uid');
    const a = document.createElement('a');
    a.className = 'uid';
    a.href = `#${uid}`;
    a.textContent = s.boxRef + uid;
    a.title = s.boxLink;
    a.setAttribute('aria-label', `${s.boxLink} ${uid}`);
    if (kind === 'MAP') {
      // On a map the corner belongs to the scale strip: the reference joins it, left of the credits.
      const place = () => top.querySelector('.leaflet-bottom.leaflet-right')?.prepend(a);
      if (top.querySelector('.leaflet-bottom.leaflet-right')) place();
      else top.addEventListener('sheetmap:ready', place, { once: true });
      a.classList.add('on-map');
    } else {
      // A plate's caption can run to its right edge: an invisible copy ends the caption's last line, so its text
      // never runs under the reference in the corner.
      const last = kind === 'PIC' ? host.querySelector('figcaption > p:last-child') : null;
      if (last) {
        const room = document.createElement('span');
        room.className = 'uid-room';
        room.setAttribute('aria-hidden', 'true');
        room.textContent = a.textContent;
        last.append(room);
      }
      host.classList.add('has-uid-label');
      host.append(a);
    }
  };

  for (const el of main.querySelectorAll<HTMLElement>(BOXES)) {
    const sec = el.closest('section');
    if (sec !== section) {
      section = sec;
      day = '';
    }
    if (el.matches('.day')) {
      day = el.dataset.day ?? '';
      continue;
    }
    if (el.matches('.sheet-map')) stamp('MAP', el, el);
    else if (el.matches('figure.plate')) stamp('PIC', el, el);
    else if (el.matches('.rhead')) stamp('RGN', el, el);
    else if (el.matches('aside.review')) stamp('OPN', el, el);
    else {
      // A text run starts here: the run's first item takes the anchor, its last the label.
      if (inRun(el) && !inRun(el.previousElementSibling)) {
        let last = el;
        while (inRun(last.nextElementSibling)) last = last.nextElementSibling;
        stamp('TXT', el, last);
      }
      if (el.matches('aside.tip')) {
        const box = el.querySelector<HTMLElement>(':scope > .box')!;
        stamp('TIP', box, box);
      }
    }
  }

  // A reference in the address: the boxes only got their ids now, and the sheet walk moves them once more.
  const target = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (/^\d{4}-[A-Z]{3}-/.test(id)) document.getElementById(id)?.scrollIntoView();
  };
  addEventListener('load', () => requestAnimationFrame(target), { once: true });
}
