"use client";

import { Toaster } from "sonner";
import { useTema } from "./useTema";

/**
 * Los avisos de sonner se pintan en un portal con estilos propios, así que no
 * alcanza con la clase `.dark`: hay que pasarle el tema por prop.
 */
export default function ToasterTema() {
  const { resuelto } = useTema();

  return (
    <Toaster
      // Arriba y al centro: abajo la taparía la barra de navegación del celular.
      position="top-center"
      richColors
      closeButton
      // Mientras no hidrató todavía no se sabe qué eligió la persona; "system"
      // es la aproximación que menos se nota.
      theme={resuelto === null ? "system" : resuelto === "oscuro" ? "dark" : "light"}
    />
  );
}
