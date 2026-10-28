const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Ruta interna respetando el base path (GitHub Pages sirve en /nombre-repo/). */
export function url(path = ''): string {
  const clean = path.replace(/^\//, '');
  return clean ? `${BASE}/${clean}` : `${BASE}/`;
}

/** Ruta de la imagen de un producto (archivo dentro de public/productos/). */
export function imagenProducto(archivo: string): string {
  if (/^https?:\/\//.test(archivo)) return archivo;
  return url(`productos/${archivo}`);
}

const pesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

/** 18000 → "$ 18.000" */
export function formatoPrecio(valor: number): string {
  return pesos.format(valor).replace(/ /g, ' ');
}

/** Quita tildes y pasa a minúsculas, para buscar "serum" y encontrar "Sérum". */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
