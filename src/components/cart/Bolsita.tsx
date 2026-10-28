import { useStore } from '@nanostores/preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  $bolsita,
  $bolsitaAbierta,
  $cantidadTotal,
  $cliente,
  $total,
  $ultimoAgregado,
  abrirBolsita,
  cambiarCantidad,
  cerrarBolsita,
  quitar,
  vaciar,
} from '../../lib/cart';
import { formatoPrecio, url } from '../../lib/utils';
import { enlaceWhatsApp, mensajePedido } from '../../lib/whatsapp';
import { Icono } from './Icono';

const plural = (n: number) => `${n} ${n === 1 ? 'producto' : 'productos'}`;

/** Panel de la bolsita + aviso de "agregado" + barra inferior en celulares. */
export default function Bolsita() {
  const items = useStore($bolsita);
  const abierta = useStore($bolsitaAbierta);
  const cantidad = useStore($cantidadTotal);
  const total = useStore($total);
  const cliente = useStore($cliente);
  const [enviado, setEnviado] = useState(false);
  const cerrarRef = useRef<HTMLButtonElement>(null);
  const focoPrevio = useRef<HTMLElement | null>(null);

  // Abrir / cerrar: foco, scroll del fondo y tecla Escape
  useEffect(() => {
    const raiz = document.documentElement;
    if (abierta) {
      focoPrevio.current = document.activeElement as HTMLElement | null;
      raiz.style.overflow = 'hidden';
      requestAnimationFrame(() => cerrarRef.current?.focus());
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && cerrarBolsita();
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
    raiz.style.overflow = '';
    focoPrevio.current?.focus?.();
    setEnviado(false);
  }, [abierta]);

  const enlace = enlaceWhatsApp(mensajePedido(items, cliente));

  return (
    <>
      <div
        class={`fixed inset-0 z-40 bg-tinta/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          abierta ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={cerrarBolsita}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-bolsita"
        aria-hidden={!abierta}
        inert={!abierta}
        class={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-nube transition-[translate,visibility] duration-300 ease-out ${
          abierta
            ? 'visible translate-x-0 shadow-[-12px_0_40px_-12px_rgb(43_18_32/0.35)]'
            : 'invisible translate-x-full'
        }`}
      >
        <header class="flex items-center justify-between gap-4 border-b-2 border-dashed border-pincel px-5 py-4">
          <h2 id="titulo-bolsita" class="flex items-center gap-2 text-2xl font-semibold">
            <Icono nombre="bolsa" size={26} class="text-fucsia" />
            Mi bolsita
            {cantidad > 0 && (
              <span class="text-base font-medium text-tinta-suave">({plural(cantidad)})</span>
            )}
          </h2>
          <button
            ref={cerrarRef}
            type="button"
            onClick={cerrarBolsita}
            class="grid size-11 place-items-center rounded-full text-tinta hover:bg-pincel"
            aria-label="Cerrar la bolsita"
          >
            <Icono nombre="cerrar" size={24} />
          </button>
        </header>

        {items.length === 0 ? (
          <div class="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div class="grid size-24 place-items-center rounded-full bg-rosa text-fucsia">
              <Icono nombre="bolsa" size={44} />
            </div>
            <p class="text-xl font-semibold">Tu bolsita está vacía</p>
            <p class="text-tinta-suave">Toca “Agregar” en los productos que te gusten y aparecerán aquí.</p>
            <a href={url('#catalogo')} onClick={cerrarBolsita} class="btn btn-fucsia mt-2">
              Ver catálogo
            </a>
          </div>
        ) : (
          <>
            <ul class="flex-1 divide-y-2 divide-dashed divide-pincel overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.id} class="flex gap-3 py-4">
                  <div class={`tile-${item.color ?? 'rosa'} size-20 shrink-0 rounded-2xl p-1`}>
                    <img src={item.imagen} alt="" width={72} height={72} class="size-full object-contain" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-start justify-between gap-2">
                      <p class="font-medium leading-snug">{item.nombre}</p>
                      <button
                        type="button"
                        onClick={() => quitar(item.id)}
                        class="-mr-2 -mt-1 grid size-9 shrink-0 place-items-center rounded-full text-tinta-suave hover:bg-pincel hover:text-fucsia-oscuro"
                        aria-label={`Quitar ${item.nombre}`}
                      >
                        <Icono nombre="basura" size={19} />
                      </button>
                    </div>
                    <p class="text-sm text-tinta-suave">{formatoPrecio(item.precio)} c/u</p>
                    <div class="mt-2 flex items-center justify-between gap-2">
                      <div class="inline-flex items-center rounded-full bg-white shadow-[inset_0_0_0_2px_var(--color-pincel)]">
                        <button
                          type="button"
                          onClick={() => cambiarCantidad(item.id, item.cantidad - 1)}
                          class="grid size-9 place-items-center rounded-full hover:bg-pincel"
                          aria-label={`Quitar una unidad de ${item.nombre}`}
                        >
                          <Icono nombre="menos" size={18} />
                        </button>
                        <span class="w-7 text-center font-semibold tabular-nums" aria-live="polite">
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => cambiarCantidad(item.id, item.cantidad + 1)}
                          class="grid size-9 place-items-center rounded-full hover:bg-pincel"
                          aria-label={`Agregar una unidad de ${item.nombre}`}
                        >
                          <Icono nombre="mas" size={18} />
                        </button>
                      </div>
                      <p class="font-semibold tabular-nums">{formatoPrecio(item.precio * item.cantidad)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div class="space-y-3 border-t-2 border-dashed border-pincel bg-white/70 px-5 pb-5 pt-4">
              <label class="block">
                <span class="mb-1 block text-sm font-medium">Tu nombre</span>
                <input
                  type="text"
                  autocomplete="name"
                  value={cliente.nombre}
                  onInput={(e) => $cliente.set({ ...cliente, nombre: e.currentTarget.value })}
                  placeholder="¿A nombre de quién va el pedido?"
                  class="w-full rounded-2xl border-2 border-pincel bg-white px-4 py-2.5 outline-none placeholder:text-tinta-suave/70 focus:border-fucsia"
                />
              </label>
              <label class="block">
                <span class="mb-1 block text-sm font-medium">Nota (opcional)</span>
                <textarea
                  rows={2}
                  value={cliente.nota}
                  onInput={(e) => $cliente.set({ ...cliente, nota: e.currentTarget.value })}
                  placeholder="Ej: barrio, hora de entrega o color que prefieres"
                  class="w-full resize-none rounded-2xl border-2 border-pincel bg-white px-4 py-2.5 outline-none placeholder:text-tinta-suave/70 focus:border-fucsia"
                />
              </label>

              <div class="flex items-baseline justify-between pt-1">
                <span class="text-lg font-medium">Total</span>
                <span class="text-2xl font-semibold tabular-nums">{formatoPrecio(total)}</span>
              </div>

              <a
                href={enlace}
                target="_blank"
                rel="noopener"
                onClick={() => setEnviado(true)}
                class="btn btn-fucsia w-full text-lg"
              >
                <Icono nombre="chat" size={22} />
                Enviar pedido por WhatsApp
              </a>

              {enviado ? (
                <p class="rounded-2xl bg-menta px-4 py-3 text-sm" role="status">
                  Se abrió WhatsApp con tu pedido. Cuando lo envíes, puedes{' '}
                  <button type="button" onClick={vaciar} class="font-semibold underline underline-offset-2">
                    vaciar la bolsita
                  </button>
                  .
                </p>
              ) : (
                <button
                  type="button"
                  onClick={vaciar}
                  class="mx-auto block text-sm text-tinta-suave underline underline-offset-2 hover:text-fucsia-oscuro"
                >
                  Vaciar bolsita
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <AvisoAgregado />

      {/* Barra inferior en celulares */}
      <div
        class={`fixed inset-x-0 bottom-0 z-30 p-3 transition-[translate,visibility] duration-300 md:hidden ${
          cantidad > 0 && !abierta ? 'visible translate-y-0' : 'invisible translate-y-full'
        }`}
        aria-hidden={cantidad === 0 || abierta}
        inert={cantidad === 0 || abierta}
      >
        <button type="button" onClick={abrirBolsita} class="btn btn-fucsia w-full justify-between px-5 text-base">
          <span class="flex items-center gap-2">
            <Icono nombre="bolsa" size={22} />
            Ver mi bolsita ({cantidad})
          </span>
          <span class="tabular-nums">{formatoPrecio(total)}</span>
        </button>
      </div>
    </>
  );
}

function AvisoAgregado() {
  const ultimo = useStore($ultimoAgregado);
  const abierta = useStore($bolsitaAbierta);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ultimo) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2800);
    return () => clearTimeout(t);
  }, [ultimo?.t]);

  return (
    <div class="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 md:bottom-8" aria-live="polite">
      {visible && !abierta && ultimo && (
        <div class="pointer-events-auto flex animate-pop items-center gap-3 rounded-full bg-tinta py-2 pl-4 pr-2 text-white shadow-lg">
          <span class="grid size-7 shrink-0 place-items-center rounded-full bg-fucsia">
            <Icono nombre="check" size={16} />
          </span>
          <span class="text-sm">
            Agregaste <strong class="font-semibold">{ultimo.nombre}</strong>
          </span>
          <button
            type="button"
            onClick={() => {
              setVisible(false);
              abrirBolsita();
            }}
            class="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-tinta hover:bg-pincel"
          >
            Ver bolsita
          </button>
        </div>
      )}
    </div>
  );
}
