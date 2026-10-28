export const CATEGORIAS = {
  mascarillas: 'Mascarillas',
  'cuidado-facial': 'Cuidado facial',
  labios: 'Labios',
  maquillaje: 'Maquillaje',
  accesorios: 'Accesorios',
} as const;

export type Categoria = keyof typeof CATEGORIAS;
