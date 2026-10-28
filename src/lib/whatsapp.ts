import { tienda } from '../config';
import type { DatosCliente, ItemBolsita } from './cart';
import { formatoPrecio } from './utils';

export function enlaceWhatsApp(mensaje: string): string {
  return `https://wa.me/${tienda.whatsapp}?text=${encodeURIComponent(mensaje)}`;
}

/** Mensaje de pedido completo a partir de la bolsita. */
export function mensajePedido(items: ItemBolsita[], cliente: DatosCliente): string {
  const total = items.reduce((n, i) => n + i.precio * i.cantidad, 0);
  const lineas = items.map(
    (i) => `• ${i.cantidad} × ${i.nombre} — ${formatoPrecio(i.precio * i.cantidad)}`,
  );

  const partes = [
    `¡Hola! 💖 Quiero hacer este pedido en ${tienda.nombre}:`,
    '',
    ...lineas,
    '',
    `*Total: ${formatoPrecio(total)}*`,
  ];

  if (cliente.nombre.trim()) partes.push('', `Mi nombre: ${cliente.nombre.trim()}`);
  if (cliente.nota.trim()) partes.push(`Nota: ${cliente.nota.trim()}`);
  partes.push('', '¿Me confirmas disponibilidad y la entrega? ¡Gracias!');

  return partes.join('\n');
}

/** Pregunta rápida por un producto desde su página. */
export function mensajeProducto(nombre: string, precio: number): string {
  return `¡Hola! 💖 Me interesa *${nombre}* (${formatoPrecio(precio)}) de ${tienda.nombre}. ¿Está disponible?`;
}

export function mensajeSaludo(): string {
  return `¡Hola! 💖 Vi el catálogo de ${tienda.nombre} y tengo una pregunta.`;
}
