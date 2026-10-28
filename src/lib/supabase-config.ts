/**
 * Conexión a Supabase. Se activa cuando existen estas dos variables
 * (en GitHub: Settings → Secrets and variables → Actions → Variables; en local: archivo .env):
 *   PUBLIC_SUPABASE_URL   https://xxxx.supabase.co
 *   PUBLIC_SUPABASE_KEY   clave pública (publishable / anon). Es segura en el navegador:
 *                         lo que se puede hacer con ella lo limitan las reglas RLS.
 * Sin ellas, el sitio usa src/data/productos.yaml y no registra pedidos.
 */
export const SUPABASE_URL: string = (import.meta.env.PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
export const SUPABASE_KEY: string = import.meta.env.PUBLIC_SUPABASE_KEY ?? '';
export const supabaseActivo = Boolean(SUPABASE_URL && SUPABASE_KEY);

export const cabecerasSupabase = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};
