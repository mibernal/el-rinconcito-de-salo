// Edge Function "publicar": la llama el botón "Publicar cambios" del panel /admin.
// Verifica que quien la llama sea admin y le pide a GitHub Actions reconstruir el sitio.
//
// Secretos necesarios (Supabase → Edge Functions → Secrets):
//   GITHUB_TOKEN  token fine-grained del repo con permiso "Contents: Read and write"
//   GITHUB_REPO   opcional, por defecto "mibernal/el-rinconcito-de-salo"
//   ALLOWED_ORIGIN opcional, por defecto "https://mibernal.github.io" (cámbialo si usas dominio propio)
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Solo la página de la tienda puede llamar esta función desde el navegador
const ORIGEN = Deno.env.get('ALLOWED_ORIGIN') ?? 'https://mibernal.github.io';

const cors = {
  'Access-Control-Allow-Origin': ORIGEN,
  Vary: 'Origin',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Usa POST' }, 405);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });

  const { data: esAdmin, error } = await supabase.rpc('es_admin');
  if (error || !esAdmin) return json({ error: 'Solo un administrador puede publicar' }, 403);

  const token = Deno.env.get('GITHUB_TOKEN');
  if (!token) return json({ error: 'Falta el secreto GITHUB_TOKEN en Supabase' }, 500);
  const repo = Deno.env.get('GITHUB_REPO') ?? 'mibernal/el-rinconcito-de-salo';

  const res = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'rinconcito-de-salo',
    },
    body: JSON.stringify({ event_type: 'publicar' }),
  });

  if (!res.ok) {
    return json({ error: `GitHub respondió ${res.status}`, detalle: await res.text() }, 502);
  }
  return json({ ok: true, mensaje: 'Publicando. La página se actualiza en 1 o 2 minutos.' });
});
