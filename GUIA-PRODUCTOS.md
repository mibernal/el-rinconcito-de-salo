# Guía: cómo agregar y cambiar productos 💖

Esta guía es para quien maneja la tienda día a día. No hace falta saber programar.

**Resumen rápido**

| Quiero… | Dónde |
| --- | --- |
| Agregar, editar, ocultar o borrar productos, cambiar fotos, precios o stock | Panel **https://mibernal.github.io/el-rinconcito-de-salo/admin/** |
| Ver los pedidos que llegaron y marcarlos como confirmados o entregados | Panel → pestaña **Pedidos** |
| Cambiar el número de WhatsApp, horario, formas de pago o entregas | Archivo `src/config.ts` (lo hace Miguel, ver al final) |
| Cambiar el texto "¡Hola! Soy Salo" | Archivo `src/components/SobreMi.astro` (lo hace Miguel) |

---

## 1. Entrar al panel

1. Abre **https://mibernal.github.io/el-rinconcito-de-salo/admin/** (guárdalo en favoritos).
2. Escribe el correo y la contraseña de la tienda. Hay dos usuarios administradores:
   - `elrinconcitodesalo@gmail.com`
   - `miguelangelbernal1991@gmail.com`
3. Arriba verás dos pestañas: **Productos** y **Pedidos**.

> Si olvidas la contraseña, pídele a Miguel que la cambie (en el README, sección *Cambiar la contraseña de un administrador*).

## 2. Agregar un producto nuevo

1. En **Productos**, toca **Agregar producto**.
2. **Subir foto:** toca *Subir foto* y elige la imagen del celular o el computador.
3. Llena los datos:

| Campo | Qué poner | Ejemplo |
| --- | --- | --- |
| Nombre | Como lo verán los clientes | `Mascarilla de coco` |
| Categoría | Mascarillas, Cuidado facial, Labios, Maquillaje o Accesorios | Mascarillas |
| Color de fondo | Rosa, Menta, Lavanda o Durazno (el color detrás de la foto) | Menta |
| Precio | En pesos, **sin puntos ni signo $** | `6000` |
| Precio antes | Solo si está en oferta: el precio anterior, más alto. Si no, déjalo vacío | `7000` |
| Unidades en stock | Cuántas tienes. Si no quieres llevar la cuenta, déjalo **vacío** | `10` |
| Etiqueta | Nuevo, Favorito, Oferta o Sin etiqueta | Nuevo |
| Descripción | Una o dos frases | `Hidratante y con olor a coco.` |
| Detalles | Uno por línea (tamaño, uso…) | `Uso único, 20 minutos` |
| Orden en el catálogo | Número: los más pequeños salen primero | `150` |

4. Deja marcadas **Disponible** y **Mostrar en el catálogo**.
5. Toca **Guardar producto**.

El enlace del producto se crea solo a partir del nombre (por ejemplo `/producto/mascarilla-de-coco/`). Después de creado, ese enlace no cambia aunque edites el nombre.

## 3. Fotos: cómo tomarlas para que se vean lindas

- **Cuadradas** (1:1). Si la foto es alargada, se verá con espacio a los lados.
- **Fondo claro y liso** (blanco, rosado clarito) y buena luz de día, sin flash.
- El producto **centrado** y ocupando casi toda la foto.
- Formatos: **JPG, PNG o WebP**, máximo **2 MB**. El panel la achica sola antes de subirla, así que una foto normal del celular sirve.
- Si es una foto de internet, que sea del fabricante o de la marca, nunca de otra tienda.

Para **cambiar la foto** de un producto: *Editar* → *Cambiar foto* → *Guardar producto*.

## 4. Cambiar precio, poner en oferta o marcar agotado

En **Productos**, toca **Editar** en el producto y:

- **Cambiar precio:** escribe el nuevo en *Precio* y guarda.
- **Poner en oferta:** en *Precio antes* escribe el precio viejo (más alto), en *Precio* el nuevo y en *Etiqueta* elige **Oferta**. La página muestra el descuento solo (por ejemplo "Oferta −13%").
- **Agotado:** desmarca **Disponible**, o pon **0** en *Unidades en stock*. Sigue apareciendo en el catálogo, en gris y con el botón "Avísame cuando vuelva a llegar".
- **Esconderlo por un tiempo:** desmarca **Mostrar en el catálogo**.
- **Borrarlo para siempre:** *Borrar producto* → *Sí, borrar*. Mejor ocultarlo si quizá vuelve.

## 5. ¿Cuándo aparecen los cambios en la página?

La página se actualiza **sola cada hora entre las 7 a. m. y las 10 p. m.** Si quieres que salga ya:

- Toca **Publicar cambios** en el panel (cuando esté conectado; ver la sección técnica del README), **o**
- Entra a **https://github.com/mibernal/el-rinconcito-de-salo/actions/workflows/deploy.yml** → **Run workflow** → **Run workflow**. En unos 2 minutos queda publicado.

## 6. Pedidos

Cuando un cliente toca **Enviar pedido por WhatsApp**:

1. Llega un mensaje al WhatsApp de la tienda con los productos, el total y un código, por ejemplo **SALO-7KQ4**.
2. El mismo pedido queda guardado en el panel → **Pedidos**, con el total calculado con los precios reales (aunque alguien cambie el mensaje).

Qué hacer con cada pedido:

| Estado | Cuándo usarlo | Qué pasa con el stock |
| --- | --- | --- |
| **Nuevo** | Acaba de llegar | Nada |
| **Confirmado** | Ya hablaste con el cliente y va el pedido | Se descuentan las unidades |
| **Entregado** | Ya lo recibió | Nada más |
| **Cancelado** | No se hizo | Si estaba confirmado, las unidades vuelven al stock |

Compara siempre el código y el total del mensaje con el que aparece en el panel antes de confirmar.

---

## Para Miguel: cambios que se hacen en el código

Todo se edita en el repositorio y se publica con `git push` a `main` (o desde la web de GitHub con el lápiz ✏️ y *Commit changes*).

| Qué | Archivo |
| --- | --- |
| WhatsApp de pedidos (`57` + número, solo dígitos), horario, pagos, entregas, Instagram, nombre | `src/config.ts` |
| Texto "¡Hola! Soy Salo" | `src/components/SobreMi.astro` |
| Categorías (agregar una nueva) | `src/lib/categorias.ts` **y** el `check` de `categoria` en una migración nueva de `supabase/migrations/` |
| Colores de la marca | `src/styles/global.css` (bloque `@theme`) |
| Imagen al compartir el enlace | `public/og.jpg` (1200 × 630) |

### Si algún día se desconecta Supabase

Sin las variables `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_KEY`, la página vuelve a leer `src/data/productos.yaml` y las fotos de `public/productos/`. El formato de cada producto está explicado al inicio de ese archivo. **Mientras Supabase esté conectado, ese archivo no se usa.**
