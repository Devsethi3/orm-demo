import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const NeueMontrealMedium = localFont({
  src: "../../public/fonts/PPNeueMontreal-Medium.ttf",
  variable: "--font-montreal-medium",
});

const NeueMontrealRegular = localFont({
  src: "../../public/fonts/PPNeueMontreal-Regular.ttf",
  variable: "--font-montreal-regular",
});

const NeueMontrealSemiBold = localFont({
  src: "../../public/fonts/PPNeueMontreal-SemiBold.ttf",
  variable: "--font-montreal-semibold",
});

const NeueMontrealMono = localFont({
  src: "../../public/fonts/PPNeueMontreal-Mono.ttf",
  variable: "--font-montreal-mono",
});
export const metadata: Metadata = {
  title: "Finance CRM | OceanLabs",
  description: "Financial Operations Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${NeueMontrealRegular.variable} ${NeueMontrealMedium.variable} ${NeueMontrealSemiBold.variable} ${NeueMontrealMono.variable} antialiased font-montreal-regular`}
      >
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </QueryProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
