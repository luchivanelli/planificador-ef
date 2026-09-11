import "./plan.css";

/**
 * Todo lo que se imprime vive en este grupo de rutas: sin menú lateral, sin
 * barra de navegación y sin nada que dependa del tema, porque el papel siempre
 * es blanco. Sólo trae la hoja de estilos del documento.
 */
export default function ImpresionLayout({ children }: { children: React.ReactNode }) {
  return <div className="plan">{children}</div>;
}
