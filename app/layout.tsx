import type { Metadata } from "next";
import "./globals.css";

const siteName = "CaseReady";
const siteDescription =
  "Turn messy evidence into judge-ready exhibits in minutes.";

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  openGraph: {
    title: siteName,
    description: siteDescription,
    url: "https://caseready.io",
    siteName,
    images: [
      {
        url: "/logo.svg",
        width: 512,
        height: 512,
        alt: "CaseReady folder-check logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: siteName,
    description: siteDescription,
    images: ["/logo.svg"],
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
