import { Font } from "@react-pdf/renderer";

/**
 * La tipografía compartida por los PDF de la app, y el apagado del guionado.
 *
 * `@react-pdf/renderer` corta las palabras al final del renglón con un
 * separador pensado para el inglés, y en castellano parte donde no va:
 * "Secun-daria", "orien-tado", "asisten-cia". En una ficha de datos con
 * columnas angostas eso aparece en casi todos los campos y se lee mal.
 *
 * Con este callback cada palabra se devuelve entera: el texto pasa a cortarse
 * sólo en los espacios, que es como se escribe a mano. Una palabra más larga
 * que su columna se sigue acomodando sola, pero sin guión inventado.
 *
 * `registerHyphenationCallback` es global al proceso, no al documento: por eso
 * vive en un módulo aparte que importan TODOS los PDF, así el comportamiento no
 * depende de cuál se haya generado primero.
 *
 * Helvetica es la fuente que el PDF ya trae, así que el archivo no depende de
 * ninguna descarga y las tildes y la ñ salen bien. Lo que esa codificación NO
 * tiene es la raya de diálogo (—): sale en blanco y sin aviso, así que en los
 * documentos se usa un punto medio (·) o un guión común.
 */
Font.registerHyphenationCallback((palabra) => [palabra]);

export const FUENTE = "Helvetica";
export const FUENTE_NEGRITA = "Helvetica-Bold";
export const FUENTE_CURSIVA = "Helvetica-Oblique";
