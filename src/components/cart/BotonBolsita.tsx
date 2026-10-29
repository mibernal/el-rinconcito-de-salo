import { useStore } from '@nanostores/preact';
import { useEffect, useState } from 'preact/hooks';
import { $cantidadTotal, $ultimoAgregado, abrirBolsita } from '../../lib/cart';
import { Icono } from './Icono';

/** Botón de la bolsita en el encabezado, con el número de productos. */
export default function BotonBolsita() {
  // Primero se pinta igual que el HTML del servidor (0) y luego la cantidad guardada,
  // para que la hidratación no mezcle estados.
  const cantidadGuardada = useStore($cantidadTotal);
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  const cantidad = montado ? cantidadGuardada : 0;
  const ultimo = useStore($ultimoAgregado);
  const [rebote, setRebote] = useState(false);

  useEffect(() => {
    if (!ultimo) return;
    setRebote(true);
    const t = setTimeout(() => setRebote(false), 450);
    return () => clearTimeout(t);
  }, [ultimo?.t]);

  const etiqueta =
    cantidad === 0
      ? 'Abrir mi bolsita (vacía)'
      : `Abrir mi bolsita (${cantidad} ${cantidad === 1 ? 'producto' : 'productos'})`;

  return (
    <button
      type="button"
      onClick={abrirBolsita}
      aria-label={etiqueta}
      class="relative inline-flex h-12 items-center gap-2 rounded-full bg-white pl-3.5 pr-4 font-semibold text-tinta shadow-[inset_0_0_0_2px_var(--color-tinta),0_3px_0_var(--color-tinta)] transition-colors hover:bg-pincel"
    >
      <Icono nombre="bolsa" size={24} />
      <span class="hidden sm:inline">Mi bolsita</span>
      <span
        class={`grid min-w-6 place-items-center rounded-full px-1.5 text-sm leading-6 tabular-nums ${
          cantidad > 0 ? 'bg-fucsia text-white' : 'bg-rosa text-tinta-suave'
        } ${rebote ? 'animate-bounce-once' : ''}`}
      >
        {cantidad}
      </span>
    </button>
  );
}
