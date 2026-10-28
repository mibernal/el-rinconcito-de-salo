import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';
import { parse } from 'yaml';

export const CATEGORIAS = {
  mascarillas: 'Mascarillas',
  'cuidado-facial': 'Cuidado facial',
  labios: 'Labios',
  maquillaje: 'Maquillaje',
  accesorios: 'Accesorios',
} as const;

export type Categoria = keyof typeof CATEGORIAS;

const productos = defineCollection({
  // "orden" guarda la posición en el archivo para mostrar los productos en ese mismo orden
  loader: file('src/data/productos.yaml', {
    parser: (texto) =>
      (parse(texto) as Record<string, unknown>[]).map((p, orden) => ({ ...p, orden })),
  }),
  schema: z.object({
    orden: z.number(),
    nombre: z.string().min(2),
    categoria: z.enum(Object.keys(CATEGORIAS) as [Categoria, ...Categoria[]]),
    precio: z.number().int().positive(),
    precioAntes: z.number().int().positive().optional(),
    descripcion: z.string(),
    detalles: z.array(z.string()).default([]),
    imagen: z.string(),
    color: z.enum(['rosa', 'menta', 'lavanda', 'durazno']).default('rosa'),
    etiqueta: z.enum(['nuevo', 'favorito', 'oferta']).optional(),
    disponible: z.boolean().default(true),
  }),
});

export const collections = { productos };
