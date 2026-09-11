import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans } from "next/font/google";
import { SCRIPT_TEMA } from "@/lib/tema";
import ToasterTema from "@/components/tema/ToasterTema";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      className={`${geistSans.variable} ${geistMono.variable} ${ibmPlex.variable} h-full antialiased`}
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
