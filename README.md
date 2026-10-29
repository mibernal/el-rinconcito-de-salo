# El Rinconcito de Salo 💖

Catálogo web de maquillaje, mascarillas y cuidado facial. Los clientes arman su pedido en la **bolsita** y lo envían por **WhatsApp** con un mensaje listo (productos, cantidades, total, nombre, nota y código de pedido).

- **Página:** https://mibernal.github.io/el-rinconcito-de-salo/
- **Panel de administración:** https://mibernal.github.io/el-rinconcito-de-salo/admin/
- **Base de datos:** Supabase, proyecto *Rinconcito de Salo* ([dashboard](https://supabase.com/dashboard/project/atadjqraehymwosjgxia))
- **WhatsApp de pedidos:** +57 312 313 3192

> 📘 **¿Vas a agregar o cambiar productos, fotos o precios?** Lee la [guía de productos](GUIA-PRODUCTOS.md).

Hecho con [Astro](https://astro.build) 7 + TypeScript + Tailwind CSS 4, con islas de Preact para la bolsita y el panel. Es un sitio estático publicado en GitHub Pages; los productos salen de Supabase al construir el sitio.

---

## Cómo funciona

```
Panel /admin ──(supabase-js, sesión de admin)──► Supabase (productos, fotos, pedidos)
                                                     │
GitHub Actions (push, cada hora, botón Publicar) ────┘ lee productos al construir
        │
        ▼
GitHub Pages (HTML estático) ──► cliente arma la bolsita ──► WhatsApp
                                         └──(crear_pedido)──► Supabase guarda el pedido
```

- Si las variables de Supabase existen, el catálogo sale de la tabla `productos`. Si no, de `src/data/productos.yaml` (respaldo).
- Los cambios hechos en el panel llegan a la página en la siguiente publicación: **cada hora de 7 a. m. a 10 p. m.**, con cada `push` a `main`, al correr el workflow a mano o con el botón *Publicar cambios* (si la función está instalada).

## Configuración

### Variables de entorno

| Variable | Valor | Dónde va |
| --- | --- | --- |
| `PUBLIC_SUPABASE_URL` | `https://atadjqraehymwosjgxia.supabase.co` | `.env` (local) y GitHub → *Variables* |
| `PUBLIC_SUPABASE_KEY` | clave **publishable** `sb_publishable_…` | `.env` (local) y GitHub → *Variables* |

- La clave *publishable* es pública por diseño (va dentro de la página). Lo que se puede hacer con ella lo limitan las reglas RLS. **Nunca** uses la clave *secret* / *service_role* en este proyecto.
- En GitHub están en **Settings → Secrets and variables → Actions → Variables** (no en *Secrets*), y el workflow las pasa al build.
- En local van en `.env` (copiado de `.env.example`). `.env` está en `.gitignore`: no se sube.

### Trabajar en tu computador

Necesitas Node.js 22.23 o más reciente (o Node 24).

```bash
git clone https://github.com/mibernal/el-rinconcito-de-salo.git
cd el-rinconcito-de-salo
cp .env.example .env      # y pega la URL y la clave publishable
npm install
npm run dev               # http://localhost:4321  (el panel: http://localhost:4321/admin/)
```

Al arrancar, la consola dice de dónde salieron los productos: `14 productos desde Supabase` o `… desde src/data/productos.yaml`.

```bash
npm run check     # tipos y errores
npm run build     # genera dist/ (igual que en GitHub)
npm run preview   # sirve dist/ para probar la versión final
```

### Publicar (deploy)

`.github/workflows/deploy.yml` construye y publica en GitHub Pages (*Settings → Pages → Source: GitHub Actions*). Se ejecuta:

- con cada `push` a `main`;
- cada hora de 7 a. m. a 10 p. m. (hora Colombia), para llevar a la página lo editado en el panel y mantener activo el proyecto gratuito de Supabase (se pausa tras 7 días sin uso);
- a mano: [Actions → Publicar en GitHub Pages → Run workflow](https://github.com/mibernal/el-rinconcito-de-salo/actions/workflows/deploy.yml);
- desde el botón *Publicar cambios* del panel (`repository_dispatch`), cuando la función `publicar` esté instalada.

La ruta base (`/el-rinconcito-de-salo/`) se detecta sola, así que también funciona con dominio propio.

## Supabase

Estado actual: **activo**. Migración y productos de ejemplo cargados, registro público cerrado y dos administradores (`elrinconcitodesalo@gmail.com` y `miguelangelbernal1991@gmail.com`).

- `supabase/migrations/20261028000000_tienda.sql`: tablas `productos`, `pedidos`, `pedido_items` y `admins`; bucket público `productos` para fotos; reglas RLS; función `crear_pedido` (toma precios de la base de datos y limita a 30 pedidos cada 10 minutos); trigger que descuenta stock al confirmar un pedido y lo devuelve al cancelarlo. Se puede volver a ejecutar sin romper nada.
- `supabase/seed.sql`: los 14 productos de ejemplo.

### Agregar otro administrador

1. *Authentication → Users → Add user → Create new user* (correo + contraseña, con *Auto Confirm User*).
2. *SQL Editor*:

```sql
insert into public.admins (user_id, nombre)
select id, 'Nombre' from auth.users where email = 'correo@ejemplo.com';
```

### Cambiar la contraseña de un administrador

*SQL Editor*:

```sql
update auth.users
set encrypted_password = extensions.crypt('la-nueva-contraseña', extensions.gen_salt('bf'))
where email = 'elrinconcitodesalo@gmail.com';
```

### Botón "Publicar cambios" (opcional)

Sin esto todo funciona: los cambios salen en la publicación de cada hora. Para que el botón publique al instante:

1. En GitHub crea un token *fine-grained* (*Settings → Developer settings → Personal access tokens → Fine-grained tokens*), solo para el repositorio `el-rinconcito-de-salo`, con permiso **Contents: Read and write**.
2. Instala la función (desde la carpeta del proyecto):

```bash
npx supabase login
npx supabase link --project-ref atadjqraehymwosjgxia
npx supabase functions deploy publicar
npx supabase secrets set GITHUB_TOKEN=el_token_de_github
```

## Estructura

```
src/
  config.ts                 ← datos de la tienda (WhatsApp, horario, pagos, entregas…)
  data/productos.yaml       ← catálogo de respaldo (solo si no hay Supabase)
  lib/cargar-productos.ts   ← lee productos de Supabase o del YAML
  lib/supabase-config.ts    ← lee PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_KEY
  lib/pedidos.ts            ← registra pedidos (crear_pedido)
  lib/cart.ts               ← bolsita (nanostores; se valida y se sincroniza con el catálogo)
  lib/whatsapp.ts           ← mensajes de WhatsApp
  lib/categorias.ts         ← categorías
  components/               ← secciones de la página
  components/cart/          ← bolsita (Preact)
  components/admin/         ← panel de administración (Preact + supabase-js)
  pages/                    ← portada, producto/[id], admin, 404, robots.txt
supabase/
  migrations/  seed.sql  functions/publicar/
public/
  productos/  og.jpg  favicon.svg  manifest.webmanifest  icono-*.png
```

## Seguridad

- **Content Security Policy** en todas las páginas: solo scripts y estilos propios (con hash) y conexiones a Supabase.
- **RLS:** el público solo lee productos visibles y crea pedidos mediante `crear_pedido`; solo los usuarios de `admins` editan productos, fotos y pedidos.
- **Bolsita validada:** lo guardado en el navegador se limpia y se corrige con el catálogo publicado.
- **Panel:** `noindex`, fuera del sitemap y del `robots.txt`; registro público cerrado en Supabase.
- **Función publicar:** exige sesión de admin y solo acepta llamadas desde `https://mibernal.github.io`.
- **Dependabot:** revisa npm (semanal) y GitHub Actions (mensual).
- **Recomendado:** contraseñas largas y distintas para cada admin, y activar *Leaked password protection* en *Authentication → Attack Protection*.

## Estado de la tienda virtual

| Función | Estado |
| --- | --- |
| Catálogo con categorías, búsqueda, orden por precio y página por producto | ✅ |
| Bolsita que se guarda en el navegador y se corrige si cambian precios | ✅ |
| Pedido por WhatsApp con detalle, total, nombre, nota y código | ✅ |
| Etiquetas nuevo / favorito / oferta, agotados y "avísame cuando llegue" | ✅ |
| Compartir producto, imagen para redes, SEO, sitemap, instalable en el celular | ✅ |
| Base de datos con panel /admin, fotos y stock | ✅ |
| Registro de pedidos con estados e inventario automático | ✅ |
| Botón "Publicar cambios" al instante | ⏳ falta instalar la función `publicar` (opcional) |
| Pago en línea (Wompi, Bold, Mercado Pago) | ⏳ pendiente |
| Costo de envío por zona | ⏳ pendiente |
| Términos, política de datos (Ley 1581) y derecho de retracto | ⏳ pendiente, necesario antes de cobrar en línea |
