export const prerender = false;

/** Panel ops — persiste adjudicaciones en src/data/overrides.json (repo).
 *  Acceso: Cloudflare Access protege /ops/* al borde; además se exige el header
 *  del JWT de Access en producción (defensa ante un Access mal configurado).
 *  Secrets requeridos en Cloudflare Pages:
 *    - GITHUB_TOKEN: token con contents:write (y workflow si se quiere disparar el ingest)
 *    - GITHUB_REPO:  "owner/name"
 *  Opcionales: GITHUB_BRANCH (default: branch por defecto), GITHUB_DISPATCH ("1" dispara
 *  el workflow refresh-jobs.yml tras guardar para aplicar el cambio el mismo día). */

const COUNTRIES = new Set([
  'AU', 'CA', 'CL', 'PE', 'ZA', 'US', 'ID', 'GH', 'BR', 'MX', 'ZM', 'CD', 'MN', 'KZ', 'MR', 'GLOBAL',
]);
const FILE_PATH = 'src/data/overrides.json';

const b64encode = (s: string) => {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};
const b64decode = (b64: string) => {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

export async function POST({
  request,
  locals,
}: {
  request: Request;
  locals: { runtime?: { env?: Record<string, string | undefined> } };
}) {
  if (!import.meta.env.DEV && !request.headers.get('cf-access-jwt-assertion')) {
    return json({ ok: false, error: 'Not found' }, 404);
  }

  const env = locals?.runtime?.env ?? {};
  const token = env.GITHUB_TOKEN;
  const repo = env.GITHUB_REPO;
  if (!token || !repo) {
    return json(
      { ok: false, error: 'Falta GITHUB_TOKEN o GITHUB_REPO en el entorno de Cloudflare Pages.' },
      500
    );
  }

  let body: { id?: string; action?: string; country?: string };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'JSON inválido' }, 400);
  }
  const { id, action, country } = body ?? {};
  if (!id || typeof id !== 'string') return json({ ok: false, error: 'id requerido' }, 400);
  if (action !== 'correct' && action !== 'exclude' && action !== 'dismiss') {
    return json({ ok: false, error: 'acción inválida' }, 400);
  }
  if (action === 'correct' && (!country || !COUNTRIES.has(country))) {
    return json({ ok: false, error: 'país inválido' }, 400);
  }

  const headers = {
    authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'content-type': 'application/json',
    'user-agent': 'labormin-ops-panel',
  };
  try {
    let branch = env.GITHUB_BRANCH || '';
    if (!branch) {
      const meta = await fetch(`https://api.github.com/repos/${repo}`, { headers });
      if (!meta.ok) throw new Error(`GitHub ${meta.status} (repo)`);
      branch = ((await meta.json()) as { default_branch: string }).default_branch;
    }

    // Estado actual del archivo (tolera 404 — primera vez).
    let sha: string | undefined;
    let data: {
      corrections?: Record<string, unknown>;
      exclude?: Record<string, unknown>;
      dismissed?: Record<string, unknown>;
    } = {};
    const get = await fetch(`https://api.github.com/repos/${repo}/contents/${FILE_PATH}?ref=${branch}`, {
      headers,
    });
    if (get.ok) {
      const file = (await get.json()) as { sha: string; content: string };
      sha = file.sha;
      data = JSON.parse(b64decode(file.content));
    } else if (get.status !== 404) {
      throw new Error(`GitHub ${get.status} (lectura)`);
    }
    data.corrections ||= {};
    data.exclude ||= {};
    data.dismissed ||= {};

    const now = new Date().toISOString();
    if (action === 'correct') {
      delete data.exclude![id];
      delete data.dismissed![id];
      data.corrections![id] = { country, at: now };
    } else if (action === 'exclude') {
      delete data.corrections![id];
      delete data.dismissed![id];
      data.exclude![id] = { at: now };
    } else {
      delete data.corrections![id];
      delete data.exclude![id];
      data.dismissed![id] = { at: now };
    }

    const put = await fetch(`https://api.github.com/repos/${repo}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `ops: ${action} ${id}`,
        content: b64encode(JSON.stringify(data, null, 2)),
        sha,
        branch,
      }),
    });
    if (!put.ok) throw new Error(`GitHub ${put.status} (escritura)`);

    let dispatched = false;
    if (env.GITHUB_DISPATCH === '1') {
      const disp = await fetch(
        `https://api.github.com/repos/${repo}/actions/workflows/refresh-jobs.yml/dispatches`,
        { method: 'POST', headers, body: JSON.stringify({ ref: branch }) }
      );
      dispatched = disp.ok;
    }

    return json({
      ok: true,
      message: dispatched
        ? 'Guardado en el repo. Ingest disparado: el cambio entra cuando termine el run.'
        : 'Guardado en el repo. El ingest aplicará el cambio en su próximo run.',
    });
  } catch (err) {
    return json({ ok: false, error: String((err as Error)?.message || err) }, 500);
  }
}
