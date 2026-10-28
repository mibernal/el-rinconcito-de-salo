/** Íconos de línea (24×24). Se usan desde Icon.astro y desde los componentes Preact. */
export const ICONOS = {
  bolsa:
    '<path d="M5.5 8.5h13l-1.1 11.2a1.5 1.5 0 0 1-1.5 1.3H8.1a1.5 1.5 0 0 1-1.5-1.3L5.5 8.5Z"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/><path d="M12 17.3c-1.9-1.2-2.6-2.2-2.3-3.1.3-.8 1.4-1 2.3-.2.9-.8 2-.6 2.3.2.3.9-.4 1.9-2.3 3.1Z" fill="currentColor" stroke="none"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  menos: '<path d="M5 12h14"/>',
  cerrar: '<path d="M6 6l12 12M18 6 6 18"/>',
  buscar: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  chat: '<path d="M12 4a8 8 0 0 0-6.9 12l-1.1 4 4.1-1.1A8 8 0 1 0 12 4Z"/><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" stroke-width="2.6"/>',
  basura: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12.5h8L17 7"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  camara: '<path d="M4 8.5h3.2L9 6h6l1.8 2.5H20V19H4z"/><circle cx="12" cy="13.2" r="3.3"/>',
  atras: '<path d="M15 6l-6 6 6 6"/>',
  corazon:
    '<path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.4 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" fill="currentColor" stroke="none"/>',
} as const;

export type NombreIcono = keyof typeof ICONOS;
