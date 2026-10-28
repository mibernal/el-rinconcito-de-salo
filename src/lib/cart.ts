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

/** Contenido de la bolsita, guardado en el navegador para no perderlo al recargar. */
export const $bolsita = persistentAtom<ItemBolsita[]>('salo:bolsita', [], {
  encode: JSON.stringify,
  decode: (raw) => {
    try {
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
});

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
