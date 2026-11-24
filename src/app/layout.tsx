import type { Metadata, Viewport } from "next";
import { Figtree, Geist_Mono } from "next/font/google";
import CelebrationProvider from "@/components/CelebrationProvider";
import SiteFooter from "@/components/SiteFooter";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

// Figtree: friendly, rounded-terminal sans for all UI; Geist Mono keeps
// numbers and dates lining up.
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "LeetCode Tracker · Jack Preston",
    template: "%s · LeetCode Tracker",
  },
  description:
    "A public log of my LeetCode practice — spaced-repetition progress and a link to every solution.",
  openGraph: {
    title: "LeetCode Tracker · Jack Preston",
    description:
      "A public log of my LeetCode practice — spaced-repetition progress and a link to every solution.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fbfb" },
    { media: "(prefers-color-scheme: dark)", color: "#141c2b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // the theme script toggles .dark before React hydrates, hence the suppression
    <html
      lang="en"
      suppressHydrationWarning
      className={`${figtree.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <CelebrationProvider>
          {children}
          <SiteFooter />
        </CelebrationProvider>
      </body>
    </html>
  );
}
