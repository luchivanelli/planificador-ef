import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `@react-pdf/renderer` sólo corre del lado del servidor, en las dos rutas
  // que arman los PDF. Sin esto el bundler lo empaqueta entero en la salida del
  // servidor, que es una dependencia grande y lenta de procesar; dejándolo
  // afuera se carga de `node_modules` y el arranque del servidor es más liviano.
  serverExternalPackages: ["@react-pdf/renderer"],

  experimental: {
    // Sólo se empaquetan los íconos que cada pantalla usa, en vez del índice
    // entero de la librería.
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
