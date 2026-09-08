export const prerender = false;

const ES = new Set(['AR','BO','CL','CO','CR','CU','DO','EC','SV','GQ','GT','HN','MX','NI','PA','PY','PE','PR','ES','UY','VE']);
const PT = new Set(['BR','PT','AO','MZ','CV','GW','ST','TL']);

export async function GET({ request }: { request: Request }) {
  const h = request.headers;
  // Cloudflare provides cf-ipcountry at the edge; Vercel equivalent kept for portability.
  const country =
    h.get('cf-ipcountry') || h.get('x-vercel-ip-country') || h.get('x-country') || null;

  let suggestedLocale = 'en';
  if (country && PT.has(country)) suggestedLocale = 'pt';
  else if (country && ES.has(country)) suggestedLocale = 'es';
  else {
    const al = (h.get('accept-language') || '').toLowerCase();
    if (al.startsWith('es')) suggestedLocale = 'es';
    else if (al.startsWith('pt')) suggestedLocale = 'pt';
  }

  return new Response(JSON.stringify({ country, suggestedLocale }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
