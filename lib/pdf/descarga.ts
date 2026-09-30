/**
 * Cómo se llama el archivo que baja y cómo se lo decimos al navegador.
 *
 * Lo comparten las dos rutas que devuelven un PDF (el plan de clase y la
 * evaluación general) para que los archivos se nombren igual y para que las dos
 * manden la misma cabecera, que es la que `BotonDescargarPdf` lee para ponerle
 * el nombre al archivo.
 */

/**
 * Un nombre de archivo que no rompa en ningún sistema: sin barras ni comillas,
 * con las partes unidas por un guión.
 *
 * Ojo con las fechas: la barra es separador de carpetas y acá se borra, así que
 * "11/09/2026" quedaría como "11092026". Quien las pase tiene que cambiarlas
 * antes por guiones.
 */
export function nombreDeArchivo(partes: string[]) {
  const limpio = partes
    .map((parte) => parte.replace(/["'\\/:*?<>|]/g, "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" - ");
  return `${limpio}.pdf`;
}

/**
 * El `Content-Disposition` con el nombre en sus dos formas.
 *
 * `filename` sólo puede llevar ASCII, así que un apellido con tilde ("Martínez")
 * sale mal por ahí. `filename*` (RFC 5987) lo manda en UTF-8 y es el que usan
 * tanto los navegadores como `BotonDescargarPdf`. El `filename` queda de
 * reserva, con los acentos pelados.
 */
export function cabeceraDeDescarga(nombre: string) {
  const ascii = nombre
    .normalize("NFD")
    // Saca los diacríticos que `NFD` dejó sueltos y cualquier otro no-ASCII.
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, "");

  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(nombre)}`;
}
