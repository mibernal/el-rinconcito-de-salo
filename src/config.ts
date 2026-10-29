/**
 * Datos de la tienda. Cambia aquí el nombre, el WhatsApp y las redes:
 * todo el sitio toma estos valores.
 */
export const tienda = {
  nombre: 'El Rinconcito de Salo',
  // Partes del logo (se dibujan en dos líneas en la portada)
  logoLinea1: 'El Rinconcito',
  logoLinea2: 'de Salo',
  lema: 'Maquillaje, mascarillas y cuidado facial',
  descripcion:
    'Catálogo de maquillaje, mascarillas y cuidado facial de El Rinconcito de Salo. Arma tu pedido y envíalo por WhatsApp.',

  /**
   * Número de WhatsApp que recibe los pedidos: código de país + número, solo dígitos.
   * Ejemplo Colombia: 57 + 3001234567 → '573001234567'
   * Recomendado: el número de un adulto responsable de la tienda.
   */
  whatsapp: '573228957446',

  instagram: '', // ej. 'elrinconcitodesalo' (déjalo vacío para ocultarlo)
  // Horario en que se responden los mensajes (se muestra en la bolsita y el pie de página).
  // Déjalo vacío para ocultarlo. Ej: 'Respondemos de lunes a sábado, de 3:00 a 7:00 p. m.'
  horario: '',
  entregas: 'Coordinamos contigo la entrega o el envío por WhatsApp.',
  pagos: 'Nequi, Daviplata, transferencia o efectivo.',
} as const;

export type Tienda = typeof tienda;
