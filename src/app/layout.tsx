import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Instrument_Serif,
  Chivo_Mono,
  Bricolage_Grotesque,
} from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import "./fonts.css";
import Header from "@/components/landing/header";

const geistSans = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

const chivoMono = Chivo_Mono({
  variable: "--font-chivo-mono",
  subsets: ["latin"],
});

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://xocket.vercel.app"),
  title: {
    default: "Xocket | Your Structured Startup Execution Partner",
    template: "%s | Xocket",
  },
  description:
    "Partner with Xocket for structured product execution and scaling. Design, build, and launch production-ready products with proven methodologies and support.",
  keywords: [
    "startup execution",
    "product development",
    "MVP launch",
    "scalable architecture",
    "execution sprints",
    "product scaling",
    "structured development",
    "startup consulting",
  ],
  authors: [{ name: "Xocket" }],
  creator: "Xocket",
  publisher: "Xocket",
  formatDetection: {
    email: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://xocket.vercel.app",
    siteName: "Xocket",
    title: "Xocket | Your Structured Startup Execution Partner",
    description:
      "Partner with Xocket for structured product execution and scaling. Design, build, and launch production-ready products with proven methodologies and support.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Xocket - Structured Product Execution",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Xocket | Your Structured Startup Execution Partner",
    description:
      "Partner with Xocket for structured product execution and scaling. Design, build, and launch production-ready products with proven methodologies and support.",
    images: ["/og-image.png"],
    creator: "@xocket",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  alternates: {
    canonical: "https://xocket.vercel.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full dark",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        instrumentSerif.variable,
        chivoMono.variable,
        bricolageGrotesque.variable,
        "font-sans",
      )}
    >
      <body className="bg-black">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
