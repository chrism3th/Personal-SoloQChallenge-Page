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
  "lg:grid-cols-[3rem_minmax(11rem,1fr)_5rem_8.5rem_8.5rem_6rem_4.5rem_4rem_5rem_6.5rem_3.5rem]";

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
