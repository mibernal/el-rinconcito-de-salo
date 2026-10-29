import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { CATEGORIAS } from '../../lib/categorias';
import { SUPABASE_KEY, SUPABASE_URL, supabaseActivo } from '../../lib/supabase-config';
import { formatoPrecio, imagenProducto, normalizar } from '../../lib/utils';
import { Icono } from '../cart/Icono';

// ── Tipos ────────────────────────────────────────────────────
interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  precio_antes: number | null;
  descripcion: string;
  detalles: string[];
  imagen: string;
  color: string;
  etiqueta: string | null;
  stock: number | null;
  disponible: boolean;
  visible: boolean;
  orden: number;
}

interface Pedido {
  id: number;
  codigo: string;
  cliente_nombre: string | null;
  nota: string | null;
  total: number;
  estado: Estado;
  creado_en: string;
  pedido_items: { nombre: string; precio: number; cantidad: number }[];
}

type Estado = 'nuevo' | 'confirmado' | 'entregado' | 'cancelado';

const ESTADOS: Record<Estado, string> = {
  nuevo: 'Nuevo',
  confirmado: 'Confirmado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

const COLORES = ['rosa', 'menta', 'lavanda', 'durazno'] as const;
const ETIQUETAS = { '': 'Sin etiqueta', nuevo: 'Nuevo', favorito: 'Favorito', oferta: 'Oferta' };

const vacio: Producto = {
  id: '',
  nombre: '',
  categoria: 'mascarillas',
  precio: 0,
  precio_antes: null,
  descripcion: '',
  detalles: [],
  imagen: '',
  color: 'rosa',
  etiqueta: null,
  stock: null,
  disponible: true,
  visible: true,
  orden: 100,
};

const slug = (texto: string) =>
  normalizar(texto)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

const campo =
  'w-full rounded-2xl border-2 border-pincel bg-white px-4 py-2.5 outline-none placeholder:text-tinta-suave/60 focus:border-fucsia';

/** Reduce la foto a máx. 1200 px y la pasa a WebP para que cargue rápido. */
async function prepararFoto(archivo: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(archivo);
    const escala = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.85));
    return blob ?? archivo;
  } catch {
    return archivo;
  }
}

// ── Componente principal ─────────────────────────────────────
export default function Admin() {
  const supabase = useMemo(
    () => (supabaseActivo ? createClient(SUPABASE_URL, SUPABASE_KEY) : null),
    [],
  );
  const [sesion, setSesion] = useState<Session | null>(null);
  const [esAdmin, setEsAdmin] = useState<boolean | null>(null);
  const [pestana, setPestana] = useState<'productos' | 'pedidos'>('productos');

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSesion(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSesion(s));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !sesion) return setEsAdmin(null);
    supabase.rpc('es_admin').then(({ data }) => setEsAdmin(Boolean(data)));
  }, [supabase, sesion?.user.id]);

  if (!supabase) return <SinConfigurar />;
  if (!sesion) return <Ingreso supabase={supabase} />;
  if (esAdmin === null) return <p class="py-20 text-center text-tinta-suave">Cargando…</p>;
  if (!esAdmin) return <NoAdmin supabase={supabase} sesion={sesion} />;

  return (
    <div>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" class="flex gap-2">
          {(['productos', 'pedidos'] as const).map((p) => (
            <button
              type="button"
              role="tab"
              aria-selected={pestana === p}
              onClick={() => setPestana(p)}
              class="rounded-full bg-white px-5 py-2 font-medium shadow-[inset_0_0_0_2px_var(--color-pincel)] aria-selected:bg-tinta aria-selected:text-white aria-selected:shadow-none"
            >
              {p === 'productos' ? 'Productos' : 'Pedidos'}
            </button>
          ))}
        </div>
        <div class="flex flex-wrap gap-2">
          <BotonPublicar supabase={supabase} />
          <button type="button" onClick={() => supabase.auth.signOut()} class="btn btn-borde">
            Salir
          </button>
        </div>
      </div>

      <div class="mt-8">
        {pestana === 'productos' ? <Productos supabase={supabase} /> : <Pedidos supabase={supabase} />}
      </div>
    </div>
  );
}

// ── Estados de acceso ────────────────────────────────────────
function SinConfigurar() {
  return (
    <div class="mx-auto max-w-lg rounded-tile bg-rosa p-8">
      <h2 class="text-2xl font-semibold">Falta conectar la base de datos</h2>
      <p class="mt-3">
        Este panel funciona con Supabase. Agrega las variables <code>PUBLIC_SUPABASE_URL</code> y{' '}
        <code>PUBLIC_SUPABASE_KEY</code> en GitHub (Settings → Secrets and variables → Actions → Variables) y vuelve
        a publicar. Los pasos completos están en el README del repositorio.
      </p>
    </div>
  );
}

function Ingreso({ supabase }: { supabase: SupabaseClient }) {
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const entrar = async (e: Event) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: clave });
    setCargando(false);
    if (error) setError('Correo o contraseña incorrectos.');
  };

  return (
    <form onSubmit={entrar} class="mx-auto max-w-sm space-y-4 rounded-tile bg-white p-8 shadow-[inset_0_0_0_2px_var(--color-pincel)]">
      <h2 class="text-2xl font-semibold">Entrar al panel</h2>
      <label class="block">
        <span class="mb-1 block text-sm font-medium">Correo</span>
        <input type="email" required autocomplete="username" value={email} onInput={(e) => setEmail(e.currentTarget.value)} class={campo} />
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium">Contraseña</span>
        <input type="password" required autocomplete="current-password" value={clave} onInput={(e) => setClave(e.currentTarget.value)} class={campo} />
      </label>
      {error && <p class="rounded-2xl bg-rosa px-4 py-2 text-sm text-fucsia-oscuro" role="alert">{error}</p>}
      <button type="submit" disabled={cargando} class="btn btn-fucsia w-full">
        {cargando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}

function NoAdmin({ supabase, sesion }: { supabase: SupabaseClient; sesion: Session }) {
  return (
    <div class="mx-auto max-w-lg rounded-tile bg-rosa p-8">
      <h2 class="text-2xl font-semibold">Este usuario no es administrador</h2>
      <p class="mt-3">
        Para darle acceso, ejecuta esto en Supabase → SQL Editor:
      </p>
      <pre class="mt-3 overflow-x-auto rounded-2xl bg-white p-4 text-sm">
        {`insert into public.admins (user_id, nombre)\nvalues ('${sesion.user.id}', '${sesion.user.email}');`}
      </pre>
      <button type="button" onClick={() => supabase.auth.signOut()} class="btn btn-borde mt-5">
        Salir
      </button>
    </div>
  );
}

const FLUJO_PUBLICAR = 'https://github.com/mibernal/el-rinconcito-de-salo/actions/workflows/deploy.yml';

function BotonPublicar({ supabase }: { supabase: SupabaseClient }) {
  const [estado, setEstado] = useState<'listo' | 'enviando' | 'ok' | 'error'>('listo');
  const [mensaje, setMensaje] = useState('');

  const publicar = async () => {
    setEstado('enviando');
    const { data, error } = await supabase.functions.invoke('publicar', { method: 'POST' });
    if (error) {
      setEstado('error');
      setMensaje('El botón aún no está conectado. Los cambios salen solos en menos de una hora, o');
    } else {
      setEstado('ok');
      setMensaje(data?.mensaje ?? 'Publicando…');
    }
  };

  return (
    <div class="flex flex-wrap items-center justify-end gap-3">
      {mensaje && (
        <span class={`text-sm ${estado === 'error' ? 'text-fucsia-oscuro' : 'text-menta-fuerte'}`} role="status">
          {mensaje}{' '}
          {estado === 'error' && (
            <a href={FLUJO_PUBLICAR} target="_blank" rel="noopener" class="font-semibold underline">
              Publicar desde GitHub
            </a>
          )}
        </span>
      )}
      <button type="button" onClick={publicar} disabled={estado === 'enviando'} class="btn btn-fucsia">
        {estado === 'enviando' ? 'Publicando…' : 'Publicar cambios'}
      </button>
    </div>
  );
}

// ── Productos ────────────────────────────────────────────────
function Productos({ supabase }: { supabase: SupabaseClient }) {
  const [lista, setLista] = useState<Producto[] | null>(null);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [error, setError] = useState('');

  const cargar = async () => {
    const { data, error } = await supabase.from('productos').select('*').order('orden').order('nombre');
    if (error) setError(error.message);
    else setLista(data as Producto[]);
  };

  useEffect(() => {
    void cargar();
  }, []);

  if (editando) {
    return (
      <FormularioProducto
        supabase={supabase}
        inicial={editando}
        existentes={lista?.map((p) => p.id) ?? []}
        alTerminar={() => {
          setEditando(null);
          void cargar();
        }}
      />
    );
  }

  return (
    <div>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-tinta-suave">
          {lista ? `${lista.length} productos` : 'Cargando…'} · Los cambios aparecen en la página en menos de una hora, o al tocar <strong>Publicar cambios</strong>.
        </p>
        <button
          type="button"
          onClick={() => setEditando({ ...vacio, orden: ((lista?.at(-1)?.orden ?? 0) + 10) })}
          class="btn btn-fucsia"
        >
          <Icono nombre="mas" /> Agregar producto
        </button>
      </div>
      {error && <p class="mt-4 rounded-2xl bg-rosa px-4 py-3 text-fucsia-oscuro">{error}</p>}

      <ul class="mt-6 divide-y-2 divide-dashed divide-pincel rounded-tile bg-white px-4" role="list">
        {lista?.map((p) => (
          <li key={p.id} class="flex items-center gap-4 py-3">
            <div class={`tile-${p.color} size-16 shrink-0 rounded-2xl p-1`}>
              <img src={imagenProducto(p.imagen)} alt="" class="size-full object-contain" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-medium">{p.nombre}</p>
              <p class="text-sm text-tinta-suave">
                {CATEGORIAS[p.categoria as keyof typeof CATEGORIAS] ?? p.categoria} · {formatoPrecio(p.precio)}
                {p.stock !== null && ` · ${p.stock} en stock`}
              </p>
              <div class="mt-1 flex flex-wrap gap-1.5 text-xs font-semibold">
                {!p.visible && <span class="rounded-full bg-tinta px-2 py-0.5 text-white">Oculto</span>}
                {(!p.disponible || p.stock === 0) && <span class="rounded-full bg-durazno px-2 py-0.5">Agotado</span>}
                {p.etiqueta && <span class="rounded-full bg-menta px-2 py-0.5">{ETIQUETAS[p.etiqueta as keyof typeof ETIQUETAS]}</span>}
              </div>
            </div>
            <button type="button" onClick={() => setEditando(p)} class="btn btn-borde min-h-10 px-4 text-base">
              Editar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FormularioProducto({
  supabase,
  inicial,
  existentes,
  alTerminar,
}: {
  supabase: SupabaseClient;
  inicial: Producto;
  existentes: string[];
  alTerminar: () => void;
}) {
  const esNuevo = !inicial.id;
  const [p, setP] = useState<Producto>(inicial);
  const [foto, setFoto] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);

  const cambiar = <K extends keyof Producto>(k: K, v: Producto[K]) => setP((prev) => ({ ...prev, [k]: v }));
  const id = esNuevo ? slug(p.nombre) : p.id;

  useEffect(() => {
    if (!foto) return setVistaPrevia('');
    const u = URL.createObjectURL(foto);
    setVistaPrevia(u);
    return () => URL.revokeObjectURL(u);
  }, [foto]);

  const guardar = async (e: Event) => {
    e.preventDefault();
    setError('');
    if (!id) return setError('Escribe el nombre del producto.');
    if (esNuevo && existentes.includes(id)) return setError(`Ya existe un producto con el código "${id}". Cambia un poco el nombre.`);
    if (!foto && !p.imagen) return setError('Agrega una foto del producto.');
    if (p.precio_antes !== null && p.precio_antes <= p.precio) return setError('El "precio antes" debe ser mayor que el precio.');

    setGuardando(true);
    let imagen = p.imagen;
    if (foto) {
      const blob = await prepararFoto(foto);
      const ext = blob.type === 'image/webp' ? 'webp' : (foto.name.split('.').pop() ?? 'jpg');
      const ruta = `${id}-${Date.now()}.${ext}`;
      const subida = await supabase.storage.from('productos').upload(ruta, blob, { contentType: blob.type || foto.type });
      if (subida.error) {
        setGuardando(false);
        return setError(`No se pudo subir la foto: ${subida.error.message}`);
      }
      imagen = supabase.storage.from('productos').getPublicUrl(ruta).data.publicUrl;
    }

    const fila = { ...p, id, imagen, detalles: p.detalles.map((d) => d.trim()).filter(Boolean) };
    const { error } = esNuevo
      ? await supabase.from('productos').insert(fila)
      : await supabase.from('productos').update(fila).eq('id', id);
    setGuardando(false);
    if (error) return setError(error.message);
    alTerminar();
  };

  const borrar = async () => {
    const { error } = await supabase.from('productos').delete().eq('id', p.id);
    if (error) return setError(error.message);
    alTerminar();
  };

  const imagenActual = vistaPrevia || (p.imagen ? imagenProducto(p.imagen) : '');

  return (
    <form onSubmit={guardar} class="grid gap-8 md:grid-cols-[18rem_1fr]">
      <div>
        <div class={`tile-${p.color} grid aspect-square place-items-center overflow-hidden rounded-tile p-4`}>
          {imagenActual ? (
            <img src={imagenActual} alt="" class="size-full object-contain" />
          ) : (
            <span class="text-tinta-suave">Sin foto</span>
          )}
        </div>
        <label class="btn btn-borde mt-4 w-full cursor-pointer">
          {imagenActual ? 'Cambiar foto' : 'Subir foto'}
          <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" onChange={(e) => setFoto(e.currentTarget.files?.[0] ?? null)} />
        </label>
        <p class="mt-2 text-sm text-tinta-suave">Cuadrada y con fondo claro se ve mejor.</p>
      </div>

      <div class="space-y-4">
        <h2 class="text-2xl font-semibold">{esNuevo ? 'Nuevo producto' : `Editar: ${inicial.nombre}`}</h2>

        <label class="block">
          <span class="mb-1 block text-sm font-medium">Nombre</span>
          <input required maxLength={80} value={p.nombre} onInput={(e) => cambiar('nombre', e.currentTarget.value)} class={campo} />
          {esNuevo && id && <span class="mt-1 block text-sm text-tinta-suave">Enlace: /producto/{id}/</span>}
        </label>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1 block text-sm font-medium">Categoría</span>
            <select value={p.categoria} onChange={(e) => cambiar('categoria', e.currentTarget.value)} class={campo}>
              {Object.entries(CATEGORIAS).map(([v, t]) => <option value={v}>{t}</option>)}
            </select>
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium">Color de fondo</span>
            <select value={p.color} onChange={(e) => cambiar('color', e.currentTarget.value)} class={campo}>
              {COLORES.map((c) => <option value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
            </select>
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium">Precio (pesos)</span>
            <input type="number" required min={1} step={100} value={p.precio || ''} onInput={(e) => cambiar('precio', Number(e.currentTarget.value))} class={campo} />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium">Precio antes (opcional)</span>
            <input type="number" min={1} step={100} value={p.precio_antes ?? ''} onInput={(e) => cambiar('precio_antes', e.currentTarget.value ? Number(e.currentTarget.value) : null)} class={campo} />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium">Unidades en stock</span>
            <input type="number" min={0} value={p.stock ?? ''} placeholder="Vacío = no llevar inventario" onInput={(e) => cambiar('stock', e.currentTarget.value === '' ? null : Number(e.currentTarget.value))} class={campo} />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium">Etiqueta</span>
            <select value={p.etiqueta ?? ''} onChange={(e) => cambiar('etiqueta', e.currentTarget.value || null)} class={campo}>
              {Object.entries(ETIQUETAS).map(([v, t]) => <option value={v}>{t}</option>)}
            </select>
          </label>
        </div>

        <label class="block">
          <span class="mb-1 block text-sm font-medium">Descripción</span>
          <textarea rows={3} maxLength={400} value={p.descripcion} onInput={(e) => cambiar('descripcion', e.currentTarget.value)} class={`${campo} resize-y`} />
        </label>

        <label class="block">
          <span class="mb-1 block text-sm font-medium">Detalles (uno por línea)</span>
          <textarea rows={3} value={p.detalles.join('\n')} onInput={(e) => cambiar('detalles', e.currentTarget.value.split('\n'))} class={`${campo} resize-y`} placeholder={'50 ml\nPara todo tipo de piel'} />
        </label>

        <div class="flex flex-wrap gap-x-6 gap-y-2">
          <label class="flex items-center gap-2">
            <input type="checkbox" checked={p.disponible} onChange={(e) => cambiar('disponible', e.currentTarget.checked)} class="size-5 accent-fucsia" />
            Disponible (si no, aparece como agotado)
          </label>
          <label class="flex items-center gap-2">
            <input type="checkbox" checked={p.visible} onChange={(e) => cambiar('visible', e.currentTarget.checked)} class="size-5 accent-fucsia" />
            Mostrar en el catálogo
          </label>
        </div>

        <label class="block max-w-40">
          <span class="mb-1 block text-sm font-medium">Orden en el catálogo</span>
          <input type="number" value={p.orden} onInput={(e) => cambiar('orden', Number(e.currentTarget.value))} class={campo} />
        </label>

        {error && <p class="rounded-2xl bg-rosa px-4 py-3 text-fucsia-oscuro" role="alert">{error}</p>}

        <div class="flex flex-wrap items-center gap-3 pt-2">
          <button type="submit" disabled={guardando} class="btn btn-fucsia">
            {guardando ? 'Guardando…' : 'Guardar producto'}
          </button>
          <button type="button" onClick={alTerminar} class="btn btn-borde">
            Cancelar
          </button>
          {!esNuevo &&
            (confirmarBorrado ? (
              <span class="flex items-center gap-2">
                ¿Borrar para siempre?
                <button type="button" onClick={borrar} class="font-semibold text-fucsia-oscuro underline">Sí, borrar</button>
                <button type="button" onClick={() => setConfirmarBorrado(false)} class="underline">No</button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmarBorrado(true)} class="ml-auto text-sm text-tinta-suave underline">
                Borrar producto
              </button>
            ))}
        </div>
        {!esNuevo && <p class="text-sm text-tinta-suave">Para quitarlo solo por un tiempo, desmarca “Mostrar en el catálogo”.</p>}
      </div>
    </form>
  );
}

// ── Pedidos ──────────────────────────────────────────────────
function Pedidos({ supabase }: { supabase: SupabaseClient }) {
  const [lista, setLista] = useState<Pedido[] | null>(null);
  const [filtro, setFiltro] = useState<Estado | 'todos'>('todos');
  const [error, setError] = useState('');

  const cargar = async () => {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, pedido_items(nombre, precio, cantidad)')
      .order('creado_en', { ascending: false })
      .limit(200);
    if (error) setError(error.message);
    else setLista(data as Pedido[]);
  };

  useEffect(() => {
    void cargar();
  }, []);

  const cambiarEstado = async (id: number, estado: Estado) => {
    const { error } = await supabase.from('pedidos').update({ estado }).eq('id', id);
    if (error) setError(error.message);
    void cargar();
  };

  const visibles = lista?.filter((p) => filtro === 'todos' || p.estado === filtro) ?? [];
  const fecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div>
      <div class="flex flex-wrap gap-2">
        {(['todos', ...Object.keys(ESTADOS)] as (Estado | 'todos')[]).map((e) => (
          <button
            type="button"
            aria-pressed={filtro === e}
            onClick={() => setFiltro(e)}
            class="rounded-full bg-white px-4 py-1.5 text-sm font-medium shadow-[inset_0_0_0_2px_var(--color-pincel)] aria-pressed:bg-tinta aria-pressed:text-white aria-pressed:shadow-none"
          >
            {e === 'todos' ? 'Todos' : ESTADOS[e]} ({lista?.filter((p) => e === 'todos' || p.estado === e).length ?? 0})
          </button>
        ))}
        <button type="button" onClick={cargar} class="ml-auto text-sm underline">Actualizar</button>
      </div>
      <p class="mt-3 text-sm text-tinta-suave">
        Al marcar un pedido como <strong>Confirmado</strong> se descuenta el stock; si lo cancelas, se devuelve.
      </p>
      {error && <p class="mt-4 rounded-2xl bg-rosa px-4 py-3 text-fucsia-oscuro">{error}</p>}

      {lista && visibles.length === 0 && (
        <p class="mt-8 rounded-tile bg-white p-8 text-center text-tinta-suave">
          Aún no hay pedidos aquí. Aparecen cuando un cliente toca “Enviar pedido por WhatsApp”.
        </p>
      )}

      <ul class="mt-6 grid gap-4 md:grid-cols-2" role="list">
        {visibles.map((p) => (
          <li key={p.id} class="rounded-tile bg-white p-5 shadow-[inset_0_0_0_2px_var(--color-pincel)]">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-lg font-semibold">{p.codigo}</p>
                <p class="text-sm text-tinta-suave">
                  {fecha.format(new Date(p.creado_en))}
                  {p.cliente_nombre && ` · ${p.cliente_nombre}`}
                </p>
              </div>
              <select
                value={p.estado}
                onChange={(e) => cambiarEstado(p.id, e.currentTarget.value as Estado)}
                aria-label={`Estado del pedido ${p.codigo}`}
                class="rounded-full border-2 border-pincel bg-nube px-3 py-1.5 text-sm font-medium"
              >
                {Object.entries(ESTADOS).map(([v, t]) => <option value={v}>{t}</option>)}
              </select>
            </div>
            <ul class="mt-3 space-y-1 text-sm" role="list">
              {p.pedido_items.map((i) => (
                <li class="flex justify-between gap-3">
                  <span>{i.cantidad} × {i.nombre}</span>
                  <span class="tabular-nums">{formatoPrecio(i.precio * i.cantidad)}</span>
                </li>
              ))}
            </ul>
            {p.nota && <p class="mt-3 rounded-2xl bg-nube px-3 py-2 text-sm">Nota: {p.nota}</p>}
            <p class="mt-3 flex justify-between border-t-2 border-dashed border-pincel pt-3 font-semibold">
              <span>Total</span>
              <span class="tabular-nums">{formatoPrecio(p.total)}</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
