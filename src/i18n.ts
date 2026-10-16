export const languages = ['fr', 'en'] as const;
export type Lang = (typeof languages)[number];
export type Localized = Record<Lang, string>;

export const ui = {
  fr: {
    sheet: 'Feuille',
    otherLang: 'English',
    otherLangShort: 'EN',
    trips: 'Voyages',
    regions: 'régions',
    region: 'Région',
    day: 'Jour',
    days: 'Jours',
    night: 'Nuit',
    nights: 'Nuits',
    route: 'Tracé',
    distance: 'Distance',
    dates: 'Dates',
    legend: 'Légende',
    legendRoute: 'Itinéraire',
    legendStage: 'Étape (nuit)',
    legendSight: 'Arrêt',
    legendDetour: 'Autre lieu mentionné',
    takeRoute: 'Emporter l’itinéraire',
    gpx: 'GPX',
    gpxHint: 'GPS, Komoot, OsmAnd',
    kml: 'KML',
    kmlHint: 'Google Earth, My Maps',
    places: 'Points',
    place: 'Lieu',
    openStages: 'Étapes sur Google Maps',
    openStagesHint: 'Les nuits, dans l’ordre',
    copyAll: 'Copier les coordonnées',
    copyAllHint: 'Un point par ligne',
    coords: 'Coordonnées',
    copy: 'Copier',
    copied: 'Copié',
    openGoogle: 'Google Maps',
    openApple: 'Plans',
    tipKinds: { road: 'Route', fuel: 'Carburant', water: 'Eau', money: 'Argent', border: 'Frontière', sleep: 'Nuit', info: 'Pratique' },
    review: 'Mon avis',
    highlights: 'Les points forts',
    regrets: 'Ce que je referais autrement',
    before: 'Avant de partir',
    progress: 'Progression dans le voyage',
    beforeMeta: 'Préparation',
    plate: 'Planche',
    original: 'Original',
    previous: 'Voyage précédent',
    next: 'Voyage suivant',
    backToMap: 'Voir sur la carte du voyage',
    tripMap: 'Carte du voyage',
    regionMap: 'Carte de la région',
    allTrips: 'Tous les voyages',
    tagline: 'Carnets pratiques, photos et cartes de voyages hors des sentiers battus.',
    km: 'km',
    skip: 'Aller au contenu',
    regionsNav: 'Régions du voyage',
    legendApprox: 'Tracé approximatif',
    goToRegion: 'Aller à la région',
    goToSection: 'Aller à la section',
    showOnMap: 'Afficher sur la carte',
    readTip: 'Lire le conseil',
    showAll: 'Tout afficher',
    onMap: 'Sur la carte',
    explore: 'Explorer la carte',
    exploreDone: 'Terminer',
    credits: 'Sources de la carte',
    boxLink: 'Lien vers ce bloc',
    boxRef: 'Référence ',
    copyFallback: 'Sélectionné : copiez avec Ctrl+C',
    copiedAnnounce: 'Coordonnées copiées',
    approxSuffix: 'tracé approximatif',
  },
  en: {
    sheet: 'Sheet',
    otherLang: 'Français',
    otherLangShort: 'FR',
    trips: 'Trips',
    regions: 'regions',
    region: 'Region',
    day: 'Day',
    days: 'Days',
    night: 'Night',
    nights: 'Nights',
    route: 'Route',
    distance: 'Distance',
    dates: 'Dates',
    legend: 'Legend',
    legendRoute: 'Route',
    legendStage: 'Overnight stop',
    legendSight: 'Stop',
    legendDetour: 'Other place mentioned',
    takeRoute: 'Take the route with you',
    gpx: 'GPX',
    gpxHint: 'GPS, Komoot, OsmAnd',
    kml: 'KML',
    kmlHint: 'Google Earth, My Maps',
    places: 'Points',
    place: 'Place',
    openStages: 'Stages in Google Maps',
    openStagesHint: 'The nights, in order',
    copyAll: 'Copy coordinates',
    copyAllHint: 'One point per line',
    coords: 'Coordinates',
    copy: 'Copy',
    copied: 'Copied',
    openGoogle: 'Google Maps',
    openApple: 'Apple Maps',
    tipKinds: { road: 'Road', fuel: 'Fuel', water: 'Water', money: 'Money', border: 'Border', sleep: 'Night', info: 'Practical' },
    review: 'My take',
    highlights: 'The highlights',
    regrets: 'What I would do differently',
    before: 'Before you go',
    progress: 'Trip progress',
    beforeMeta: 'Preparation',
    plate: 'Plate',
    original: 'Original',
    previous: 'Previous trip',
    next: 'Next trip',
    backToMap: 'Show on the trip map',
    tripMap: 'Trip map',
    regionMap: 'Region map',
    allTrips: 'All trips',
    tagline: 'Practical notes, photos and maps from off-the-beaten-path trips.',
    km: 'km',
    skip: 'Skip to content',
    regionsNav: 'Trip regions',
    legendApprox: 'Approximate route',
    goToRegion: 'Go to the region',
    goToSection: 'Go to the section',
    showOnMap: 'Show on the map',
    readTip: 'Read the tip',
    showAll: 'Show all',
    onMap: 'On the map',
    explore: 'Explore the map',
    exploreDone: 'Done',
    credits: 'Map credits',
    boxLink: 'Link to this box',
    boxRef: 'Reference ',
    copyFallback: 'Selected: copy with Ctrl+C',
    copiedAnnounce: 'Coordinates copied',
    approxSuffix: 'approximate route',
  },
} as const;

export const t = (lang: Lang) => ui[lang];

/** Index numbers (regions, days, points, plates, sheets) always show two digits: 01, 02 … 28. */
export const idx = (n: number) => String(n).padStart(2, '0');
/** "Jour 03" or "Jours 08–10". */
export const dayRange = (lang: Lang, [a, b]: readonly [number, number]) =>
  a === b ? `${ui[lang].day} ${idx(a)}` : `${ui[lang].days} ${idx(a)}–${idx(b)}`;
/** Night numbers as a stay label: consecutive nights become a range, the rest are listed. [1, 2, 14] → "01–02 · 14". */
export function nightsLabel(nights: readonly number[]) {
  const sorted = [...new Set(nights)].sort((a, b) => a - b);
  const runs: [number, number][] = [];
  for (const n of sorted) {
    const last = runs.at(-1);
    if (last && n === last[1] + 1) last[1] = n;
    else runs.push([n, n]);
  }
  return runs.map(([a, b]) => (a === b ? idx(a) : `${idx(a)}–${idx(b)}`)).join(' · ');
}
/** Point badges are one square (or circle) per number they show: "05" → 1, "03–04" → 2, "01–02 · 14" → 3. */
export const badgeSpan = (label: string) => label.match(/\d+/g)?.length ?? 1;
export const isLang =(v: string | undefined): v is Lang => languages.includes(v as Lang);
export const otherLang = (lang: Lang): Lang => (lang === 'fr' ? 'en' : 'fr');

export const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const tripUrl = (lang: Lang, slug: string) => `${base}/${lang}/trips/${slug}/`;
export const homeUrl = (lang: Lang) => `${base}/${lang}/`;

export function formatDateRange(lang: Lang, start: Date, end: Date) {
  const f = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  return f.formatRange(start, end);
}
