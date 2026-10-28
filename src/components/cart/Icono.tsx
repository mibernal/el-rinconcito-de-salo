import { ICONOS, type NombreIcono } from '../../lib/icons';

export function Icono({ nombre, size = 22, class: className = '' }: { nombre: NombreIcono; size?: number; class?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      class={className}
      dangerouslySetInnerHTML={{ __html: ICONOS[nombre] }}
    />
  );
}
