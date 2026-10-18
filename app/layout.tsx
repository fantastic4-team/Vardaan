import type { Metadata, Viewport } from "next";
import { Oxygen, EB_Garamond } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const oxygen = Oxygen({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-oxygen",
});

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-garamond",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  keywords: ["Vardaan", "Vardaan beta", "early access", "waitlist"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: site.name,
    title: site.title,
    description: site.description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${oxygen.variable} ${garamond.variable}`}>
      <body>{children}</body>
    </html>
  );
}
