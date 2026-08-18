/**
 * Cierra el panel desplegable ("Editar ...", "Agregar ...") que envuelve a un
 * formulario, buscándolo por el `id` del `<form>`.
 *
 * Sirve para los `<details>` que viven en un server component: su estado abierto
 * es un atributo que maneja el navegador, no React, así que `router.refresh()`
 * no lo toca y hay que ir al DOM a sacarle el `open`.
 *
 * Si el `<details>` está controlado con estado de React (`open={...}`, como en
 * `JuegoItem`), esto NO se usa: hay que cerrarlo desde ese estado, o el DOM y el
 * estado quedan diciendo cosas distintas.
 */
export function cerrarDetails(formId: string) {
  document.getElementById(formId)?.closest("details")?.removeAttribute("open");
}
