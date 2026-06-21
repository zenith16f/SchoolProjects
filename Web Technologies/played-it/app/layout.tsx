import Providers from "@/components/Providers";
import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Solo los weights que realmente se usan
const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  preload: true,
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  themeColor: "#14181c",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "PlayedIt — Tu bitácora de juegos",
    template: "%s | PlayedIt",
  },
  description:
    "Registra lo que jugaste, califica tus experiencias y descubre qué jugar después gracias a la comunidad.",
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  openGraph: {
    siteName: "PlayedIt",
    type: "website",
    locale: "es_MX",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${inter.variable}`}
    >
      <body className="min-h-screen flex flex-col antialiased">
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-100 focus:bg-accent focus:text-surface focus:px-4 focus:py-2 focus:rounded-md focus:top-2 focus:left-2"
          >
            Saltar al contenido
          </a>
          {children}
        </Providers>
      </body>
    </html>
  );
}
