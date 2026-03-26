import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const NeueMontrealRegular = localFont({
  src: "../public/fonts/PPNeueMontreal-Regular.ttf",
  variable: "--font-montreal-regular",
});

const NeueMontrealMedium = localFont({
  src: "../public/fonts/PPNeueMontreal-Medium.ttf",
  variable: "--font-montreal-medium",
});

const NeueMontrealSemiBold = localFont({
  src: "../public/fonts/PPNeueMontreal-SemiBold.ttf",
  variable: "--font-montreal-semibold",
});

const NeueMontrealMono = localFont({
  src: "../public/fonts/PPNeueMontreal-Mono.ttf",
  variable: "--font-montreal-mono",
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: "Internal Finance Operating System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${NeueMontrealRegular.variable} ${NeueMontrealMedium.variable} ${NeueMontrealSemiBold.variable} ${NeueMontrealMono.variable} antialiased font-montreal-regular`}
      >
        {children}
      </body>
    </html>
  );
}
