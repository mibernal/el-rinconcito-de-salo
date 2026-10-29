import { persistentAtom } from '@nanostores/persistent';
import { atom, computed } from 'nanostores';

export interface ItemBolsita {
  id: string;
  nombre: string;
  precio: number;
  imagen: string;
  color?: string;
  cantidad: number;
}

export interface DatosCliente {
  nombre: string;
  nota: string;
}

const MAX_POR_PRODUCTO = 20;
const MAX_LINEAS = 30;

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');

/** Acepta solo ítems bien formados (lo guardado en el navegador puede estar dañado o alterado). */
function limpiarItems(data: unknown): ItemBolsita[] {
  if (!Array.isArray(data)) return [];
  const vistos = new Set<string>();
  const items: ItemBolsita[] = [];
  for (const d of data) {
    if (!d || typeof d !== 'object') continue;
    const { id, nombre, precio, imagen, color, cantidad } = d as Record<string, unknown>;
    if (typeof id !== 'string' || !/^[a-z0-9-]{1,80}$/.test(id) || vistos.has(id)) continue;
    if (typeof precio !== 'number' || !Number.isInteger(precio) || precio <= 0) continue;
    const n = typeof cantidad === 'number' ? Math.trunc(cantidad) : 0;
    if (n < 1) continue;
    vistos.add(id);
    items.push({
      id,
      nombre: texto(nombre, 80) || id,
      precio,
      imagen: texto(imagen, 500),
      color: texto(color, 20) || undefined,
      cantidad: Math.min(n, MAX_POR_PRODUCTO),
    });
    if (items.length >= MAX_LINEAS) break;
  }
  return items;
}

/** Contenido de la bolsita, guardado en el navegador para no perderlo al recargar. */
export const $bolsita = persistentAtom<ItemBolsita[]>('salo:bolsita', [], {
  encode: JSON.stringify,
  decode: (raw) => {
    try {
      return limpiarItems(JSON.parse(raw));
    } catch {
      return [];
    }
  },
});

/** Mensaje cuando la bolsita se ajustó porque cambió el catálogo (precio, agotado…). */
export const $avisoBolsita = atom('');

export interface ProductoCatalogo {
  nombre: string;
  precio: number;
  imagen: string;
  color: string;
  disponible: boolean;
}

/**
 * Pone la bolsita al día con el catálogo publicado: actualiza precios, nombres y fotos,
 * y quita lo que ya no existe o se agotó.
 */
export function sincronizarConCatalogo(catalogo: Record<string, ProductoCatalogo>) {
  const antes = $bolsita.get();
  if (antes.length === 0) return;
  let cambiosPrecio = 0;
  const quitados: string[] = [];
  const despues: ItemBolsita[] = [];

  for (const item of antes) {
    const actual = catalogo[item.id];
    if (!actual || !actual.disponible) {
      quitados.push(item.nombre);
      continue;
    }
    if (actual.precio !== item.precio) cambiosPrecio++;
    despues.push({ ...item, nombre: actual.nombre, precio: actual.precio, imagen: actual.imagen, color: actual.color });
  }

  const cambio = quitados.length > 0 || cambiosPrecio > 0 ||
    despues.some((d, i) => d.nombre !== antes[i]?.nombre || d.imagen !== antes[i]?.imagen);
  if (!cambio) return;

  $bolsita.set(despues);
  const partes: string[] = [];
  if (quitados.length) {
    const lista = new Intl.ListFormat('es', { type: 'conjunction' }).format(quitados);
    partes.push(
      quitados.length === 1
        ? `Quitamos ${lista} porque ya no está disponible.`
        : `Quitamos ${lista} porque ya no están disponibles.`,
    );
  }
  if (cambiosPrecio) partes.push('Actualizamos algunos precios al valor de hoy.');
  if (partes.length) $avisoBolsita.set(partes.join(' '));
}

export const $cliente = persistentAtom<DatosCliente>(
  'salo:cliente',
  { nombre: '', nota: '' },
  {
    encode: JSON.stringify,
    decode: (raw) => {
      try {
        return { nombre: '', nota: '', ...JSON.parse(raw) };
      } catch {
        return { nombre: '', nota: '' };
      }
    },
  },
);

export const $bolsitaAbierta = atom(false);

/** Último producto agregado; lo usa el aviso "Agregado a tu bolsita". */
export const $ultimoAgregado = atom<{ nombre: string; t: number } | null>(null);

export const $cantidadTotal = computed($bolsita, (items) =>
  items.reduce((n, i) => n + i.cantidad, 0),
);

export const $total = computed($bolsita, (items) =>
  items.reduce((n, i) => n + i.precio * i.cantidad, 0),
);

export function agregar(item: Omit<ItemBolsita, 'cantidad'>, cantidad = 1) {
  const items = $bolsita.get();
  const existente = items.find((i) => i.id === item.id);
  if (existente) {
    $bolsita.set(
      items.map((i) =>
        i.id === item.id
          ? { ...i, ...item, cantidad: Math.min(i.cantidad + cantidad, MAX_POR_PRODUCTO) }
          : i,
      ),
    );
  } else {
    if (items.length >= MAX_LINEAS) return;
    $bolsita.set([...items, { ...item, cantidad: Math.min(cantidad, MAX_POR_PRODUCTO) }]);
  }
  $ultimoAgregado.set({ nombre: item.nombre, t: Date.now() });
}

export function cambiarCantidad(id: string, cantidad: number) {
  if (cantidad <= 0) return quitar(id);
  $bolsita.set(
    $bolsita
      .get()
      .map((i) => (i.id === id ? { ...i, cantidad: Math.min(cantidad, MAX_POR_PRODUCTO) } : i)),
  );
}

export function quitar(id: string) {
  $bolsita.set($bolsita.get().filter((i) => i.id !== id));
}

export function vaciar() {
  $bolsita.set([]);
}

export function abrirBolsita() {
  $bolsitaAbierta.set(true);
}

export function cerrarBolsita() {
  $bolsitaAbierta.set(false);
}
