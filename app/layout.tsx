import type { Metadata, Viewport } from "next";
import { Cairo, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const metadataBase = process.env.APP_URL?.startsWith("http") ? new URL(process.env.APP_URL) : undefined;

export const metadata: Metadata = {
  title: "Vision Center Admin",
  description: "Vision Center Management Dashboard",
  manifest: "/manifest.json",
  metadataBase,
  openGraph: {
    title: "Vision Center Admin",
    description: "Vision Center Management Dashboard",
    type: "website",
    locale: "ar_EG",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vision Center Admin",
    description: "Vision Center Management Dashboard",
    images: ["/og.png"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A2540",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" suppressHydrationWarning dir="rtl">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className={`${cairo.variable} ${jetbrainsMono.variable} font-sans antialiased bg-gray-50 text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
