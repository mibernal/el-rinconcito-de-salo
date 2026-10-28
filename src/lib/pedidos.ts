import type { DatosCliente, ItemBolsita } from './cart';
import { SUPABASE_URL, cabecerasSupabase, supabaseActivo } from './supabase-config';

const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O ni 1/I para que no se confundan

/** Código corto para identificar el pedido en WhatsApp, ej. "SALO-7KQ4". */
export function nuevoCodigoPedido(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return `SALO-${Array.from(bytes, (b) => LETRAS[b % LETRAS.length]).join('')}`;
}

/**
 * Guarda el pedido en Supabase (si está configurado). No bloquea el envío por WhatsApp:
 * si falla, el pedido igual llega por el chat.
 */
export function registrarPedido(codigo: string, items: ItemBolsita[], cliente: DatosCliente): void {
  if (!supabaseActivo || items.length === 0) return;
  fetch(`${SUPABASE_URL}/rest/v1/rpc/crear_pedido`, {
    method: 'POST',
    headers: cabecerasSupabase,
    keepalive: true,
    body: JSON.stringify({
      p_codigo: codigo,
      p_cliente: cliente.nombre,
      p_nota: cliente.nota,
      p_items: items.map((i) => ({ id: i.id, cantidad: i.cantidad })),
    }),
  }).catch(() => {
    /* el pedido sigue llegando por WhatsApp */
  });
}
