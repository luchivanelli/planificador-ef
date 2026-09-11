"use client";

import { useCallback, useSyncExternalStore } from "react";
import { CLAVE_TEMA, type ModoTema } from "@/lib/tema";

export type TemaResuelto = "claro" | "oscuro";

export type EstadoTema = {
  /** Lo que eligió la persona: puede ser "sistema". */
  modo: ModoTema;
  /** Lo que efectivamente se ve. Es `null` mientras se renderiza en el
   *  servidor, donde no hay manera de saber el tema de quien mira. */
  resuelto: TemaResuelto | null;
};

/**
 * El tema no vive en React: vive en `localStorage` y en una media query del
 * navegador. Por eso se modela como un store externo y se lee con
 * `useSyncExternalStore`, que ya resuelve el caso del servidor (donde no hay
 * nada de eso) sin tener que sincronizar estado dentro de un efecto.
 */
const ESTADO_SERVIDOR: EstadoTema = { modo: "sistema", resuelto: null };

let cache: EstadoTema | null = null;
let consulta: MediaQueryList | null = null;
const oyentes = new Set<() => void>();

function consultaOscuro() {
  consulta ??= window.matchMedia("(prefers-color-scheme: dark)");
  return consulta;
}

function leerModoGuardado(): ModoTema {
  try {
    const guardado = localStorage.getItem(CLAVE_TEMA);
    if (guardado === "claro" || guardado === "oscuro") return guardado;
  } catch {
    // Navegador con el almacenamiento bloqueado: se sigue con "sistema".
  }
  return "sistema";
}

/** Sólo lee: se la puede llamar durante el render. */
function resolver(modo: ModoTema): TemaResuelto {
  const oscuro = modo === "oscuro" || (modo === "sistema" && consultaOscuro().matches);
  return oscuro ? "oscuro" : "claro";
}

/** Única función que toca el DOM: pone la clase que lee la variante `dark:`. */
function pintar(modo: ModoTema): TemaResuelto {
  const resuelto = resolver(modo);
  const html = document.documentElement;
  html.classList.toggle("dark", resuelto === "oscuro");
  // Pinta en el tema correcto lo que dibuja el navegador: barras de scroll,
  // controles nativos de fecha, autocompletado.
  html.style.colorScheme = resuelto === "oscuro" ? "dark" : "light";
  return resuelto;
}

function guardar(estado: EstadoTema) {
  cache = estado;
  for (const avisar of oyentes) avisar();
}

// Con "sistema" hay que acompañar al sistema operativo también en vivo (por
// ejemplo cuando el celular entra en modo oscuro al anochecer).
function alCambiarElSistema() {
  if (cache?.modo !== "sistema") return;
  guardar({ modo: "sistema", resuelto: pintar("sistema") });
}

function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  if (oyentes.size === 1) consultaOscuro().addEventListener("change", alCambiarElSistema);

  return () => {
    oyentes.delete(avisar);
    if (oyentes.size === 0) consultaOscuro().removeEventListener("change", alCambiarElSistema);
  };
}

function leer(): EstadoTema {
  // La clase del <html> ya la dejó puesta el script del layout antes del primer
  // pintado; acá sólo se recupera esa misma preferencia.
  cache ??= (() => {
    const modo = leerModoGuardado();
    return { modo, resuelto: resolver(modo) };
  })();
  return cache;
}

export function useTema() {
  const { modo, resuelto } = useSyncExternalStore(suscribir, leer, () => ESTADO_SERVIDOR);

  const cambiarModo = useCallback((nuevo: ModoTema) => {
    guardar({ modo: nuevo, resuelto: pintar(nuevo) });
    try {
      localStorage.setItem(CLAVE_TEMA, nuevo);
    } catch {
      // Sin persistencia el tema igual cambia; se pierde al recargar.
    }
  }, []);

  return { modo, resuelto, cambiarModo };
}
