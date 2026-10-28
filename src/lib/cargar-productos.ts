import { readFile } from 'node:fs/promises';
import type { Loader } from 'astro/loaders';
import { parse } from 'yaml';

/** Fila de la tabla public.productos en Supabase */
interface FilaProducto {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  precio_antes: number | null;
  descripcion: string;
  detalles: string[] | null;
  imagen: string;
  color: string;
  etiqueta: string | null;
  stock: number | null;
  disponible: boolean;
  orden: number;
}

const ARCHIVO_YAML = 'src/data/productos.yaml';

async function desdeSupabase(url: string, key: string): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${url}/rest/v1/productos?select=*&visible=eq.true&order=orden.asc,nombre.asc`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    throw new Error(`Supabase respondió ${res.status} al leer productos: ${await res.text()}`);
  }
  const filas = (await res.json()) as FilaProducto[];
  return filas.map((f, orden) => ({
    id: f.id,
    orden,
    nombre: f.nombre,
    categoria: f.categoria,
    precio: f.precio,
    precioAntes: f.precio_antes ?? undefined,
    descripcion: f.descripcion,
    detalles: f.detalles ?? [],
    imagen: f.imagen,
    color: f.color,
    etiqueta: f.etiqueta ?? undefined,
    // Sin stock = agotado (si se lleva inventario de ese producto)
    disponible: f.disponible && (f.stock === null || f.stock > 0),
  }));
}

async function desdeYaml(): Promise<Record<string, unknown>[]> {
  const texto = await readFile(ARCHIVO_YAML, 'utf8');
  return (parse(texto) as Record<string, unknown>[]).map((p, orden) => ({ ...p, orden }));
}

/**
 * Carga los productos desde Supabase si está configurado (variables PUBLIC_SUPABASE_URL y
 * PUBLIC_SUPABASE_KEY); si no, desde src/data/productos.yaml. Las páginas no notan la diferencia.
 */
export function cargarProductos(): Loader {
  return {
    name: 'productos',
    load: async ({ store, parseData, logger, watcher }) => {
      const url = (process.env.PUBLIC_SUPABASE_URL ?? import.meta.env.PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
      const key = process.env.PUBLIC_SUPABASE_KEY ?? import.meta.env.PUBLIC_SUPABASE_KEY ?? '';
      const usarSupabase = Boolean(url && key);

      const sincronizar = async () => {
        const productos = usarSupabase ? await desdeSupabase(url, key) : await desdeYaml();
        logger.info(`${productos.length} productos desde ${usarSupabase ? 'Supabase' : ARCHIVO_YAML}`);

        store.clear();
        for (const { id, ...resto } of productos) {
          const data = await parseData({ id: String(id), data: resto });
          store.set({ id: String(id), data });
        }
      };

      await sincronizar();

      // En desarrollo, recargar al guardar el YAML
      if (!usarSupabase && watcher) {
        watcher.add(ARCHIVO_YAML);
        watcher.on('change', (ruta) => {
          if (ruta.endsWith('productos.yaml')) void sincronizar();
        });
      }
    },
  };
}
