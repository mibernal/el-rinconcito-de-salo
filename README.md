# El Rinconcito de Salo 💖

Catálogo web de maquillaje, mascarillas y cuidado facial. Los clientes arman su pedido en la **bolsita** y lo envían por **WhatsApp** con un mensaje ya listo (productos, cantidades, total, nombre y nota).

Hecho con [Astro](https://astro.build) + TypeScript + Tailwind CSS 4, con islas de Preact para la bolsita. Es un sitio estático: carga rápido, no necesita servidor y se publica gratis en GitHub Pages.

---

## Lo primero que hay que cambiar

| Qué | Dónde |
| --- | --- |
| Número de WhatsApp que recibe los pedidos (`57` + número, solo dígitos) | `src/config.ts` → `whatsapp` (hoy `573228957446`) |
| Horario de respuesta (opcional, se muestra en la bolsita y el pie) | `src/config.ts` → `horario` |
| Nombre de la tienda, lema, formas de pago, entregas, Instagram | `src/config.ts` |
| Productos, precios y fotos | `src/data/productos.yaml` + `public/productos/`, o el panel `/admin/` con Supabase |
| Texto "¡Hola! Soy Salo" | `src/components/SobreMi.astro` |

> Los 14 productos que vienen son **de ejemplo**, con ilustraciones. Reemplázalos por los reales.

## Agregar o cambiar productos

Hay dos formas. Mientras Supabase no esté conectado, se usa el archivo YAML; apenas se conecte, manda la base de datos y se edita desde el panel **/admin** (ver [Base de datos](#base-de-datos-supabase)).

### Con el archivo (sin base de datos)

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

## Base de datos (Supabase)

El sitio ya está preparado para Supabase. Al conectarlo:

- Los productos se cargan desde la tabla `productos` (con fotos en Supabase Storage).
- Cada pedido enviado por WhatsApp queda guardado con un código (ej. `SALO-7KQ4`) que también aparece en el mensaje.
- El panel **https://mibernal.github.io/el-rinconcito-de-salo/admin/** permite agregar/editar productos con foto, manejar stock y cambiar el estado de los pedidos.
- Al marcar un pedido como *Confirmado* se descuenta el stock; si se cancela, se devuelve. Con stock en 0 el producto sale como agotado.

### Pasos para activarla (una sola vez)

1. **Crear el proyecto:** en [supabase.com](https://supabase.com) → *New project*. Región sugerida: São Paulo (`sa-east-1`), la más cercana a Colombia.
2. **Crear las tablas:** *SQL Editor* → pegar y ejecutar `supabase/migrations/20261028000000_tienda.sql`. Para cargar los 14 productos de ejemplo, ejecutar también `supabase/seed.sql`.
3. **Crear el usuario administrador:** *Authentication → Users → Add user* (correo y contraseña, marcando *Auto confirm*). Entrar a `/admin/` con ese usuario: la página muestra la línea SQL exacta para darle permisos de administrador; ejecutarla en el *SQL Editor*.
4. **Cerrar el registro público:** *Authentication → Sign In / Providers* → desactivar *Allow new users to sign up*.
5. **Conectar el sitio:** en *Project Settings → API Keys* copiar la URL del proyecto y la clave **publishable** (o *anon*). En GitHub: *Settings → Secrets and variables → Actions → Variables* → crear `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_KEY`. Luego *Actions → Publicar en GitHub Pages → Run workflow*.
6. **Botón "Publicar cambios" del panel (opcional pero recomendado):**
   - En GitHub crear un token *fine-grained* (*Settings → Developer settings → Personal access tokens*) solo para este repositorio con permiso **Contents: Read and write**.
   - Instalar la función: `npx supabase login`, `npx supabase link --project-ref TU_REF`, `npx supabase functions deploy publicar`, `npx supabase secrets set GITHUB_TOKEN=el_token`.
   - Sin este paso, los cambios del panel aparecen en la página con la publicación automática diaria o al correr el workflow a mano.

La clave publishable es pública por diseño: lo que se puede hacer con ella lo limitan las reglas RLS de la migración (el público solo lee productos visibles y crea pedidos con precios tomados de la base de datos; solo los administradores editan).

> El sitio se republica solo cada día a las 6:17 a. m. (hora Colombia): eso refresca stock y precios y evita que Supabase pause el proyecto gratuito por inactividad.

## Cómo está organizado

```
src/
  config.ts                 ← datos de la tienda (WhatsApp, nombre, pagos…)
  data/productos.yaml       ← catálogo cuando no hay base de datos
  lib/cargar-productos.ts   ← lee productos de Supabase o del YAML
  lib/pedidos.ts            ← registra pedidos en Supabase
  lib/cart.ts               ← bolsita (nanostores, se guarda en el navegador)
  lib/whatsapp.ts           ← arma los mensajes de WhatsApp
  components/               ← secciones de la página
  components/cart/          ← bolsita (Preact)
  components/admin/         ← panel de administración (Preact + supabase-js)
  pages/index.astro         ← portada + catálogo
  pages/producto/[id].astro ← una página por producto
  pages/admin.astro         ← panel /admin
supabase/
  migrations/               ← tablas, reglas de seguridad, pedidos, stock, fotos
  seed.sql                  ← productos de ejemplo
  functions/publicar/       ← botón "Publicar cambios" del panel
public/
  productos/                ← fotos de productos (modo archivo)
  og.jpg                    ← imagen que aparece al compartir el enlace
```

## Seguridad

- **Content Security Policy** en todas las páginas: solo se ejecutan scripts y estilos del propio sitio (con hash) y solo se conecta a Supabase.
- **RLS en Supabase:** el público solo lee productos visibles y crea pedidos mediante `crear_pedido`, que toma los precios de la base de datos y limita a 30 pedidos cada 10 minutos.
- **Bolsita validada:** lo guardado en el navegador se limpia y se corrige con el catálogo publicado (precios, agotados y productos retirados).
- **Panel /admin:** `noindex`, excluido del sitemap y del `robots.txt`; solo usuarios de la tabla `admins` pueden escribir.
- **Función publicar:** exige sesión de administrador y solo acepta llamadas desde `https://mibernal.github.io` (`ALLOWED_ORIGIN`).
- **Dependabot** revisa dependencias npm (semanal) y acciones de GitHub (mensual).
- **Recomendado en Supabase:** contraseña larga para el admin, activar *Leaked password protection* y desactivar el registro público.

## Estado de la tienda virtual

| Función | Estado |
| --- | --- |
| Catálogo con categorías, búsqueda y página por producto | ✅ |
| Bolsita (carrito) que se guarda en el navegador | ✅ |
| Pedido por WhatsApp con detalle, total, nombre y nota | ✅ |
| Etiquetas nuevo / favorito / oferta con descuento, agotados | ✅ |
| Imagen para compartir en WhatsApp/redes, SEO por producto, sitemap | ✅ |
| Ordenar por precio, compartir producto, "avísame cuando llegue" | ✅ |
| Se puede instalar en el celular (manifest e íconos) | ✅ |
| Base de datos de productos con panel /admin y fotos | ✅ listo, falta activar Supabase |
| Registro de pedidos con código y estados | ✅ listo, falta activar Supabase |
| Inventario que se descuenta al confirmar pedidos | ✅ listo, falta activar Supabase |
| Pago en línea (Wompi, Bold, Mercado Pago) | ⏳ requiere backend: Supabase Edge Function + webhook |
| Costo de envío por zona | ⏳ pendiente |
| Cuentas de cliente / historial de compras | ⏳ pendiente (Supabase Auth) |
| Términos, política de datos (Ley 1581) y derecho de retracto | ⏳ pendiente, necesario antes de cobrar en línea |
