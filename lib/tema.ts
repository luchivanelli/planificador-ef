/** Los tres modos que puede elegir la persona desde el botón de tema. */
export type ModoTema = "claro" | "oscuro" | "sistema";

export const CLAVE_TEMA = "planificador-ef:tema";

export const MODOS: ModoTema[] = ["sistema", "claro", "oscuro"];

/**
 * Se ejecuta en el `<head>`, antes de pintar nada, para que la página no
 * aparezca en claro y salte a oscuro un instante después (el clásico flash).
 * Va como string porque tiene que ser síncrono y anterior a React: el estado
 * del proveedor recién se sincroniza cuando hidrata.
 */
export const SCRIPT_TEMA = `(function(){try{var m=localStorage.getItem(${JSON.stringify(
  CLAVE_TEMA
)});if(m!=="claro"&&m!=="oscuro"){m="sistema";}var o=m==="oscuro"||(m==="sistema"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var e=document.documentElement;e.classList.toggle("dark",o);e.style.colorScheme=o?"dark":"light";}catch(_){}})();`;
