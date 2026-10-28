import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { cargarProductos } from './lib/cargar-productos';

import { CATEGORIAS, type Categoria } from './lib/categorias';

export { CATEGORIAS, type Categoria };

const productos = defineCollection({
  // Supabase si está configurado; si no, src/data/productos.yaml (ver src/lib/cargar-productos.ts)
  loader: cargarProductos(),
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
