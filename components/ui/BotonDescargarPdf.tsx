"use client";

import { useState } from "react";
import { Check, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Modal from "./Modal";

/**
 * Botón que descarga un PDF y avisa cuándo terminó.
 *
 * Antes esto era un `<a download>` apuntando al route handler. Funcionaba,
 * pero el archivo se arma en el servidor y puede tardar (un curso entero con
 * el detalle de cada alumno son varias hojas): el navegador no muestra nada
 * mientras tanto, así que la docente tocaba el botón, no pasaba nada visible
 * y volvía a tocarlo. Acá se pide el archivo con `fetch`, el botón queda en
 * "generando" hasta que llega, y recién entonces se dispara la descarga y se
 * avisa que salió bien.
 *
 * El nombre del archivo lo sigue decidiendo el servidor: con un blob el
 * navegador ya no lee el `Content-Disposition`, así que se lee acá y se pasa
 * al `download` del enlace. Lo que se ve es lo mismo que antes.
 */

type Estado = "listo" | "generando" | "guardado";

/**
 * El nombre que mandó el servidor en el `Content-Disposition`.
 * `filename*` (RFC 5987) gana porque es el que viaja con los acentos intactos.
 */
function nombreDeLaRespuesta(respuesta: Response) {
  const cabecera = respuesta.headers.get("Content-Disposition");
  if (!cabecera) return null;

  const codificado = /filename\*=UTF-8''([^;]+)/i.exec(cabecera);
  if (codificado) {
    try {
      return decodeURIComponent(codificado[1]);
    } catch {
      // Un `filename*` mal formado no debería tirar abajo la descarga: se sigue
      // con el `filename` común.
    }
  }

  const simple = /filename="([^"]+)"/i.exec(cabecera);
  return simple ? simple[1] : null;
}

/** Le da el archivo al navegador para que lo baje. */
function guardarArchivo(archivo: Blob, nombre: string) {
  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  // Se libera más tarde a propósito: revocarlo en el mismo tick le corta la
  // descarga a los navegadores que todavía no terminaron de leer el blob.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export default function BotonDescargarPdf({
  href,
  etiqueta = "Guardar PDF",
  className = "button-primary",
  descripcion,
}: {
  /** La ruta que devuelve el PDF. */
  href: string;
  etiqueta?: string;
  className?: string;
  /** Qué se guardó, para el cartel de "listo". */
  descripcion?: string;
}) {
  const [estado, setEstado] = useState<Estado>("listo");
  const [nombre, setNombre] = useState("");

  async function descargar() {
    setEstado("generando");

    try {
      const respuesta = await fetch(href);
      const tipo = respuesta.headers.get("Content-Type") ?? "";

      // La sesión vencida no llega como error: `requerirDocente` redirige al
      // login y `fetch` sigue el redirect, así que llega el HTML del login con
      // un 200. Por eso no alcanza con mirar `respuesta.ok`.
      if (!respuesta.ok || !tipo.includes("application/pdf")) {
        throw new Error(
          tipo.includes("text/html")
            ? "Se venció la sesión. Volvé a entrar y probá de nuevo."
            : (await respuesta.text()) || "No se pudo generar el PDF"
        );
      }

      const archivo = await respuesta.blob();
      const nombreDelArchivo = nombreDeLaRespuesta(respuesta) ?? "documento.pdf";

      guardarArchivo(archivo, nombreDelArchivo);
      setNombre(nombreDelArchivo);
      setEstado("guardado");
    } catch (error) {
      setEstado("listo");
      toast.error(error instanceof Error ? error.message : "No se pudo generar el PDF");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={descargar}
        disabled={estado === "generando"}
        className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {estado === "generando" ? (
          <>
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            Generando PDF...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 shrink-0" />
            {etiqueta}
          </>
        )}
      </button>

      {estado === "guardado" && (
        <Modal etiqueta="PDF guardado" onCerrar={() => setEstado("listo")}>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Check className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-base font-bold text-ink-900">PDF guardado</p>
              <p className="mt-1 text-sm text-ink-500">
                {descripcion ? `${descripcion} ` : ""}
                Buscalo en las descargas de tu navegador.
              </p>
              <p className="mt-2 break-words rounded-control border border-linea bg-ink-50 px-2.5 py-1.5 text-xs font-medium text-ink-600">
                {nombre}
              </p>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              // Con el foco acá adentro, Enter y Escape cierran sin tener que
              // ir con el mouse hasta el botón.
              autoFocus
              onClick={() => setEstado("listo")}
              className="button-primary w-full sm:w-auto"
            >
              Listo
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
