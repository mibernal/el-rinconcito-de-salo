# El Rinconcito de Salo 💖

Catálogo web de maquillaje, mascarillas y cuidado facial. Los clientes arman su pedido en la **bolsita** y lo envían por **WhatsApp** con un mensaje ya listo (productos, cantidades, total, nombre y nota).

Hecho con [Astro](https://astro.build) + TypeScript + Tailwind CSS 4, con islas de Preact para la bolsita. Es un sitio estático: carga rápido, no necesita servidor y se publica gratis en GitHub Pages.

---

## Lo primero que hay que cambiar

| Qué | Dónde |
| --- | --- |
| Número de WhatsApp que recibe los pedidos (`57` + número, solo dígitos) | `src/config.ts` → `whatsapp` |
| Nombre de la tienda, lema, formas de pago, entregas, Instagram | `src/config.ts` |
| Productos, precios y fotos | `src/data/productos.yaml` + `public/productos/` |
| Texto "¡Hola! Soy Salo" | `src/components/SobreMi.astro` |

> Los 14 productos que vienen son **de ejemplo**, con ilustraciones. Reemplázalos por los reales.

## Agregar o cambiar productos

1. Pon la foto en `public/productos/` (ideal: cuadrada, fondo claro o transparente, `.jpg`, `.png` o `.webp`, menos de 300 KB).
2. Abre `src/data/productos.yaml`, copia un bloque completo y cambia los datos:

```yaml
- id: mascarilla-coco           # sin espacios ni tildes; se usa en el enlace
  nombre: Mascarilla de coco
  categoria: mascarillas        # mascarillas | cuidado-facial | labios | maquillaje | accesorios
  precio: 6000                  # en pesos, sin puntos
  precioAntes: 7000             # opcional, muestra el descuento
  descripcion: Hidratante y con olor a coco.
  detalles:
    - Uso único, 20 minutos
  imagen: mascarilla-coco.jpg
  color: menta                  # fondo: rosa | menta | lavanda | durazno
  etiqueta: nuevo               # opcional: nuevo | favorito | oferta
  disponible: true              # false = se muestra como agotado
```

El orden del archivo es el orden en el catálogo (los agotados van al final). Si algo queda mal escrito, `npm run build` dice exactamente qué campo falla.

## Trabajar en tu computador

Necesitas Node.js 22.23 o más reciente (o Node 24).

```bash
npm install
npm run dev        # abre http://localhost:4321
npm run build      # genera el sitio en dist/
npm run check      # revisa tipos y errores
```

## Publicar en GitHub Pages

El repositorio es [mibernal/el-rinconcito-de-salo](https://github.com/mibernal/el-rinconcito-de-salo) y el sitio queda en **https://mibernal.github.io/el-rinconcito-de-salo/**.

Cada `push` a `main` publica el sitio solo (pestaña **Actions** para ver el progreso). El flujo está en `.github/workflows/deploy.yml` y Pages está configurado con **Source: GitHub Actions**.

Para trabajar en tu computador:

```bash
git clone https://github.com/mibernal/el-rinconcito-de-salo.git
cd el-rinconcito-de-salo
npm install
npm run dev
```

La ruta base se detecta sola, así que también funciona si luego le pones un dominio propio (Settings → Pages → Custom domain).

## Cómo está organizado

```
src/
  config.ts              ← datos de la tienda (WhatsApp, nombre, pagos…)
  data/productos.yaml    ← catálogo
  content.config.ts      ← validación de los productos (Zod)
  lib/cart.ts            ← bolsita (nanostores, se guarda en el navegador)
  lib/whatsapp.ts        ← arma los mensajes de WhatsApp
  components/            ← secciones de la página
  components/cart/       ← bolsita (Preact)
  pages/index.astro      ← portada + catálogo
  pages/producto/[id].astro ← una página por producto
public/
  productos/             ← fotos de productos
  og.jpg                 ← imagen que aparece al compartir el enlace
```

## Camino a tienda en línea

La estructura ya está pensada para crecer:

- **Editar productos sin código:** agregar [Sveltia CMS](https://github.com/sveltia/sveltia-cms) o Decap CMS sobre `productos.yaml` (se entra con la cuenta de GitHub desde el navegador).
- **Pagos en línea:** pasar Astro a modo servidor (adaptador de Vercel o Netlify) y conectar una pasarela colombiana como Wompi, Bold o Mercado Pago; la bolsita (`lib/cart.ts`) se reutiliza tal cual.
- **Inventario real:** cambiar el `file()` loader de `content.config.ts` por uno que lea de una base de datos o de un headless commerce; las páginas no cambian.
