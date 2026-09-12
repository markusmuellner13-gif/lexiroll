import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { SPLASH_SPECS, splashHref, splashMedia } from "@/lib/splash";
import { BootScreen } from "@/components/BootScreen";
import { ServiceWorker } from "@/components/ServiceWorker";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

const title = "Wortjagd";
const description =
  "Stadt Land Fluss, neu gewürfelt: solo gegen schlaue Bots oder online mit Freunden. Eigene Kategorien, Buchstabenwürfel, Punktewertung.";

export const metadata: Metadata = {
  title: { default: `${title} — Stadt Land Fluss neu gewürfelt`, template: `%s — ${title}` },
  description,
  applicationName: title,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: { title, description, type: "website", locale: "de_DE", siteName: title },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  themeColor: "#07060f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  userScalable: false,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={outfit.variable}>
      <head>
        {SPLASH_SPECS.map((spec) => (
          <link
            key={spec.label}
            rel="apple-touch-startup-image"
            media={splashMedia(spec)}
            href={splashHref(spec)}
          />
        ))}
      </head>
      <body className="antialiased">
        <BootScreen />
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
