/**
 * Plantilla de columnas del ladder, compartida por LadderHeader y LadderRow.
 *
 * Estaba duplicada literal en los dos archivos, así que agregar o mover una
 * columna obligaba a acordarse de editar ambos o el encabezado quedaba
 * desalineado con las filas. Vive acá para que eso no pueda pasar.
 *
 * Desde `lg` se muestran las 11 columnas. Por debajo de `lg` la fila NO usa
 * esta grilla: refluye a una tarjeta apilada (ver LadderRow), porque esconder
 * columnas dejaba fuera la mitad de la información en móvil.
 */
export const LADDER_GRID =
  "lg:grid-cols-[2.5rem_minmax(10rem,1fr)_3rem_8rem_8rem_5.5rem_4rem_3.5rem_5rem_9rem_3.5rem]";

export const LADDER_COLUMNS = [
  "#",
  "Jugador",
  "Rol",
  "Elo",
  "V/D",
  "Campeones",
  "Forma",
  "Racha",
  "±LP",
  "Estado",
  "",
] as const;
