import { t, type Lang } from '../i18n';
import type { TripView } from './trips';

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);

const pointLabel = (lang: Lang, kind: string) => {
  const s = t(lang);
  return ({ stage: s.legendStage, sight: s.legendSight, pass: s.legendPass, warning: s.legendWarning } as Record<string, string>)[kind];
};

export function toGpx(trip: TripView, title: string) {
  const { lang, data } = trip;
  const s = t(lang);
  const wpts = trip.points
    .map(
      (p) => `  <wpt lat="${p.at[0]}" lon="${p.at[1]}">
    <name>${esc(`${p.ref}${p.name}`)}</name>
    <type>${esc(pointLabel(lang, p.kind))}</type>
  </wpt>`,
    )
    .join('\n');
  // Recorded stretches form one track per region; approximate ones (ends only) get their own, clearly named track.
  const trk = (name: string, type: string, segs: [number, number][][]) => `  <trk>
    <name>${esc(name)}</name>
    <type>${type}</type>
${segs.map((seg) => `    <trkseg>\n${seg.map(([lat, lng]) => `      <trkpt lat="${lat}" lon="${lng}"/>`).join('\n')}\n    </trkseg>`).join('\n')}
  </trk>`;
  const trks = data.regions
    .flatMap((r) => {
      const recorded = r.route.filter((seg) => !seg.approx).map((seg) => seg.path);
      const approx = r.route.filter((seg) => seg.approx).map((seg) => seg.path);
      return [
        recorded.length ? trk(r.name[lang], 'route', recorded) : '',
        approx.length ? trk(`${r.name[lang]} (${s.approxSuffix})`, 'approximate', approx) : '',
      ];
    })
    .filter(Boolean)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Odysseyra" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${esc(title)}</name></metadata>
${wpts}
${trks}
</gpx>
`;
}

export function toKml(trip: TripView, title: string) {
  const { lang, data } = trip;
  const folders = data.regions
    .map((r) => {
      const pts = trip.points
        .filter((p) => p.regionId === r.id)
        .map(
          (p) => `      <Placemark>
        <name>${esc(`${p.ref}${p.name}`)}</name>
        <description>${esc(pointLabel(lang, p.kind))}</description>
        <styleUrl>#${p.kind}</styleUrl>
        <Point><coordinates>${p.at[1]},${p.at[0]},0</coordinates></Point>
      </Placemark>`,
        )
        .join('\n');
      const s = t(lang);
      const line = r.route
        .map(
          (seg) => `      <Placemark>
        <name>${esc(seg.approx ? `${r.name[lang]} (${s.approxSuffix})` : r.name[lang])}</name>
        <styleUrl>#${seg.approx ? 'approx' : 'route'}</styleUrl>
        <LineString><tessellate>1</tessellate><coordinates>${seg.path.map(([lat, lng]) => `${lng},${lat},0`).join(' ')}</coordinates></LineString>
      </Placemark>`,
        )
        .join('\n');
      return `    <Folder>
      <name>${esc(r.name[lang])}</name>
${line}
${pts}
    </Folder>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${esc(title)}</name>
    <Style id="route"><LineStyle><color>ff3e8db0</color><width>4</width></LineStyle></Style>
    <Style id="approx"><LineStyle><color>803e8db0</color><width>2</width></LineStyle></Style>
    <Style id="stage"><IconStyle><color>ff4f2912</color></IconStyle></Style>
    <Style id="sight"><IconStyle><color>ff4f2912</color><scale>0.8</scale></IconStyle></Style>
    <Style id="pass"><IconStyle><color>ff4f2912</color></IconStyle></Style>
    <Style id="warning"><IconStyle><color>ff3e8db0</color></IconStyle></Style>
${folders}
  </Document>
</kml>
`;
}
