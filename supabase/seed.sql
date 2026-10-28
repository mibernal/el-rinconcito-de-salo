-- Productos de ejemplo (los mismos de src/data/productos.yaml). Reemplázalos por los reales.
-- Las imágenes son archivos de public/productos/ del repositorio.
insert into public.productos
  (id, nombre, categoria, precio, precio_antes, descripcion, detalles, imagen, color, etiqueta, disponible, orden)
values
  ('mascarilla-rosas', 'Mascarilla de rosas', 'mascarillas', 5000, null, 'Mascarilla de tela hidratante con extracto de rosas. Deja la piel suave y fresquita.', array['Uso único, 20 minutos', 'Para todo tipo de piel', 'Aroma suave a rosas']::text[], 'mascarilla-rosas.svg', 'rosa', 'favorito', true, 10),
  ('mascarilla-te-verde', 'Mascarilla de té verde', 'mascarillas', 5000, null, 'Mascarilla refrescante de té verde, ideal después de un día de calor.', array['Uso único, 15 a 20 minutos', 'Ayuda a refrescar la piel']::text[], 'mascarilla-te-verde.svg', 'menta', null, true, 20),
  ('mascarilla-lavanda', 'Mascarilla de lavanda', 'mascarillas', 5000, null, 'Mascarilla calmante con lavanda para relajarte antes de dormir.', array['Uso único, 20 minutos', 'Aroma relajante']::text[], 'mascarilla-lavanda.svg', 'lavanda', null, true, 30),
  ('kit-mascarillas', 'Kit de 3 mascarillas', 'mascarillas', 13000, 15000, 'Una de rosas, una de té verde y una de lavanda. Perfecto para regalar o para una noche de spa con amigas.', array['Incluye 3 mascarillas surtidas', 'Viene en bolsita de regalo']::text[], 'kit-mascarillas.svg', 'lavanda', 'oferta', true, 40),
  ('crema-hidratante', 'Crema hidratante facial', 'cuidado-facial', 16000, null, 'Crema ligera de uso diario que se absorbe rápido y no deja la piel grasosa.', array['50 g', 'Uso de día y de noche']::text[], 'crema-hidratante.svg', 'rosa', null, true, 50),
  ('serum-facial', 'Sérum facial', 'cuidado-facial', 22000, null, 'Sérum suave con gotero. Unas gotitas antes de la crema y listo.', array['30 ml', 'Textura ligera']::text[], 'serum-facial.svg', 'lavanda', 'nuevo', true, 60),
  ('gel-limpiador', 'Gel limpiador suave', 'cuidado-facial', 15000, null, 'Limpia la cara sin resecarla. Hace espumita y huele delicioso.', array['120 ml', 'Uso en la mañana y en la noche']::text[], 'gel-limpiador.svg', 'menta', null, true, 70),
  ('balsamo-labial', 'Bálsamo labial de durazno', 'labios', 6000, null, 'Bálsamo hidratante con sabor a durazno para unos labios suavecitos.', array['Barra de 4 g', 'Con sabor a durazno']::text[], 'balsamo-labial.svg', 'durazno', null, true, 80),
  ('brillo-labial', 'Brillo labial rosado', 'labios', 8000, null, 'Brillo con un toque de color rosado y acabado jugoso.', array['Aplicador de esponjita', 'Color rosado translúcido']::text[], 'brillo-labial.svg', 'menta', 'favorito', true, 90),
  ('paleta-sombras', 'Paleta de sombras rosé', 'maquillaje', 18000, null, 'Seis tonos rosados, malva y durazno, con espejo incluido.', array['6 colores', 'Acabados mate y brillante']::text[], 'paleta-sombras.svg', 'lavanda', null, true, 100),
  ('rubor', 'Rubor en polvo', 'maquillaje', 12000, null, 'Rubor rosado para un efecto natural en las mejillas. Trae espejo.', array['Polvo compacto', 'Tono rosa natural']::text[], 'rubor.svg', 'durazno', null, true, 110),
  ('set-brochas', 'Set de 4 brochas', 'maquillaje', 24000, null, 'Cuatro brochas suaves con su vasito para tenerlas siempre ordenadas.', array['4 brochas de cerdas sintéticas', 'Incluye vaso organizador']::text[], 'set-brochas.svg', 'rosa', null, false, 120),
  ('diadema-spa', 'Diadema de moño para skincare', 'accesorios', 9000, null, 'Diadema de tela suavecita con moño para recogerte el pelo mientras te cuidas la cara.', array['Tela tipo toalla', 'Talla única']::text[], 'diadema-spa.svg', 'durazno', 'nuevo', true, 130),
  ('ganchitos', 'Ganchitos de colores', 'accesorios', 7000, null, 'Paquete de 6 ganchitos en tonos pastel para combinar con tu outfit.', array['6 unidades', 'Colores rosa, lila y menta']::text[], 'ganchitos.svg', 'rosa', null, true, 140)
on conflict (id) do nothing;
