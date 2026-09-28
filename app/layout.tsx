import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { SCRIPT_TEMA } from "@/lib/tema";
import ToasterTema from "@/components/tema/ToasterTema";
import "./globals.css";

// La única tipografía de la app. Antes se cargaban también Geist y Geist Mono,
// pero sus variables no las usaba ninguna regla ni ninguna clase: eran dos
// familias que el navegador se bajaba en cada primera visita para nada.
const ibmPlex = IBM_Plex_Sans({
  variable: "--font-ibm-plex",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Planificador EF",
  description: "Planificador para docentes de Educación Física",
  applicationName: "Planificador EF",
};

export const viewport: Viewport = {
  // La app se usa mucho en el celular: que la barra del navegador acompañe al
  // tema en vez de quedar siempre índigo sobre una pantalla oscura.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4f46e5" },
    { media: "(prefers-color-scheme: dark)", color: "#0b111d" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // El script de tema le agrega la clase "dark" a <html> antes de hidratar:
    // sin esto React avisaría que el marcado del servidor no coincide.
    <html
      lang="es"
      suppressHydrationWarning
      className={`${ibmPlex.variable} h-full antialiased`}
    >
      <head>
        {/* Antes de cualquier pintado, para que no haya un flash en claro. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        <ToasterTema />
      </body>
    </html>
  );
}
