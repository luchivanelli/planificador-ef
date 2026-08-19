import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans } from "next/font/google";
import { Toaster } from "sonner";
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
  themeColor: "#4f46e5",
  // La app se usa mucho en el celular: que la barra del navegador acompañe.
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${ibmPlex.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        {/* Arriba y al centro: abajo la taparía la barra de navegación del celular. */}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
