-- ─────────────────────────────────────────────────────────────
--  El Rinconcito de Salo · esquema de la tienda
--  Ejecutar una vez en Supabase → SQL Editor (o `supabase db push`).
-- ─────────────────────────────────────────────────────────────

-- ── Administradores ──────────────────────────────────────────
-- Usuarios de Supabase Auth que pueden editar productos y ver pedidos.
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nombre text,
  creado_en timestamptz not null default now()
);

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

alter table public.admins enable row level security;

drop policy if exists "admins se ven a sí mismos" on public.admins;
create policy "admins se ven a sí mismos" on public.admins
  for select to authenticated
  using (user_id = auth.uid());

-- ── Productos ────────────────────────────────────────────────
create table if not exists public.productos (
  id text primary key
    check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nombre text not null
    check (char_length(nombre) between 2 and 80),
  categoria text not null
    check (categoria in ('mascarillas', 'cuidado-facial', 'labios', 'maquillaje', 'accesorios')),
  precio integer not null check (precio > 0),
  precio_antes integer check (precio_antes is null or precio_antes > precio),
  descripcion text not null default '' check (char_length(descripcion) <= 400),
  detalles text[] not null default '{}',
  -- nombre de archivo en public/productos/ del repo, o URL completa (Supabase Storage)
  imagen text not null,
  color text not null default 'rosa'
    check (color in ('rosa', 'menta', 'lavanda', 'durazno')),
  etiqueta text check (etiqueta in ('nuevo', 'favorito', 'oferta')),
  -- null = no se lleva inventario de este producto
  stock integer check (stock is null or stock >= 0),
  disponible boolean not null default true, -- false = se muestra como agotado
  visible boolean not null default true,    -- false = no aparece en el catálogo
  orden integer not null default 100,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists productos_orden_idx on public.productos (orden, nombre);

create or replace function public.tocar_actualizado_en()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

drop trigger if exists productos_actualizado_en on public.productos;
create trigger productos_actualizado_en
  before update on public.productos
  for each row execute function public.tocar_actualizado_en();

alter table public.productos enable row level security;

drop policy if exists "catálogo público" on public.productos;
create policy "catálogo público" on public.productos
  for select to anon, authenticated
  using (visible or public.es_admin());

drop policy if exists "admins crean productos" on public.productos;
create policy "admins crean productos" on public.productos
  for insert to authenticated
  with check (public.es_admin());

drop policy if exists "admins editan productos" on public.productos;
create policy "admins editan productos" on public.productos
  for update to authenticated
  using (public.es_admin())
  with check (public.es_admin());

drop policy if exists "admins borran productos" on public.productos;
create policy "admins borran productos" on public.productos
  for delete to authenticated
  using (public.es_admin());

-- ── Pedidos ──────────────────────────────────────────────────
-- Se registran cuando el cliente toca "Enviar pedido por WhatsApp".
create table if not exists public.pedidos (
  id bigint generated always as identity primary key,
  codigo text not null unique check (codigo ~ '^[A-Z0-9-]{4,20}$'),
  cliente_nombre text check (char_length(cliente_nombre) <= 80),
  nota text check (char_length(nota) <= 300),
  total integer not null check (total >= 0),
  estado text not null default 'nuevo'
    check (estado in ('nuevo', 'confirmado', 'entregado', 'cancelado')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.pedido_items (
  id bigint generated always as identity primary key,
  pedido_id bigint not null references public.pedidos (id) on delete cascade,
  producto_id text references public.productos (id) on delete set null,
  nombre text not null,
  precio integer not null check (precio >= 0),
  cantidad integer not null check (cantidad between 1 and 20)
);

create index if not exists pedidos_creado_idx on public.pedidos (creado_en desc);
create index if not exists pedido_items_pedido_idx on public.pedido_items (pedido_id);

drop trigger if exists pedidos_actualizado_en on public.pedidos;
create trigger pedidos_actualizado_en
  before update on public.pedidos
  for each row execute function public.tocar_actualizado_en();

alter table public.pedidos enable row level security;
alter table public.pedido_items enable row level security;

drop policy if exists "admins gestionan pedidos" on public.pedidos;
create policy "admins gestionan pedidos" on public.pedidos
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());

drop policy if exists "admins ven items" on public.pedido_items;
create policy "admins ven items" on public.pedido_items
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());

-- Crear pedido desde la página (sin login). Los precios se toman de la base de datos,
-- no de lo que envía el navegador, así nadie puede cambiar el total.
create or replace function public.crear_pedido(
  p_codigo text,
  p_cliente text,
  p_nota text,
  p_items jsonb
)
returns table (codigo text, total integer)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_pedido_id bigint;
  v_total integer := 0;
  v_item jsonb;
  v_producto public.productos%rowtype;
  v_cantidad integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos';
  end if;
  if jsonb_array_length(p_items) > 30 then
    raise exception 'Demasiados productos en un pedido';
  end if;

  -- Freno contra abuso: máximo 30 pedidos nuevos por cada 10 minutos en toda la tienda
  if (select count(*) from public.pedidos where creado_en > now() - interval '10 minutes') >= 30 then
    raise exception 'Demasiados pedidos seguidos, intenta en unos minutos';
  end if;

  insert into public.pedidos (codigo, cliente_nombre, nota, total)
  values (
    upper(p_codigo),
    nullif(left(trim(coalesce(p_cliente, '')), 80), ''),
    nullif(left(trim(coalesce(p_nota, '')), 300), ''),
    0
  )
  returning id into v_pedido_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_producto
    from public.productos
    where id = v_item ->> 'id' and visible and disponible and (stock is null or stock > 0);

    if not found then
      continue; -- producto inexistente, oculto o agotado: se ignora
    end if;

    v_cantidad := least(greatest(coalesce((v_item ->> 'cantidad')::integer, 1), 1), 20);

    insert into public.pedido_items (pedido_id, producto_id, nombre, precio, cantidad)
    values (v_pedido_id, v_producto.id, v_producto.nombre, v_producto.precio, v_cantidad);

    v_total := v_total + v_producto.precio * v_cantidad;
  end loop;

  if v_total = 0 then
    raise exception 'Ninguno de los productos está disponible';
  end if;

  update public.pedidos set total = v_total where id = v_pedido_id;

  return query select upper(p_codigo), v_total;
end;
$$;

revoke all on function public.crear_pedido(text, text, text, jsonb) from public;
grant execute on function public.crear_pedido(text, text, text, jsonb) to anon, authenticated;

-- Inventario: al confirmar un pedido se descuenta el stock; si se cancela uno
-- que ya estaba confirmado o entregado, se devuelve.
create or replace function public.mover_stock_pedido()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_signo integer := 0;
begin
  if new.estado in ('confirmado', 'entregado') and old.estado in ('nuevo', 'cancelado') then
    v_signo := -1;
  elsif new.estado in ('nuevo', 'cancelado') and old.estado in ('confirmado', 'entregado') then
    v_signo := 1;
  end if;

  if v_signo <> 0 then
    update public.productos p
    set stock = greatest(p.stock + v_signo * i.cantidad, 0)
    from public.pedido_items i
    where i.pedido_id = new.id
      and i.producto_id = p.id
      and p.stock is not null;
  end if;

  return new;
end;
$$;

drop trigger if exists pedidos_mover_stock on public.pedidos;
create trigger pedidos_mover_stock
  after update of estado on public.pedidos
  for each row execute function public.mover_stock_pedido();

-- ── Fotos de productos (Supabase Storage) ────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('productos', 'productos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "admins suben fotos" on storage.objects;
create policy "admins suben fotos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'productos' and public.es_admin());

drop policy if exists "admins cambian fotos" on storage.objects;
create policy "admins cambian fotos" on storage.objects
  for update to authenticated
  using (bucket_id = 'productos' and public.es_admin());

drop policy if exists "admins borran fotos" on storage.objects;
create policy "admins borran fotos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'productos' and public.es_admin());
