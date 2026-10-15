import type { APIRoute, GetStaticPaths } from 'astro';
import { languages, type Lang } from '../../../../i18n';
import { getPublishedTrips, getTripView } from '../../../../lib/trips';
import { toGpx } from '../../../../lib/exports';

export const getStaticPaths = (async () => {
  const published = await getPublishedTrips();
  return languages.flatMap((lang) =>
    published.map(({ trip, texts }) => ({ params: { lang, slug: trip.id }, props: { trip, title: texts[lang].data.title } })),
  );
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params, props }) => {
  const view = await getTripView(props.trip, params.lang as Lang);
  return new Response(toGpx(view, `Odysseyra — ${props.title}`), { headers: { 'Content-Type': 'application/gpx+xml' } });
};
