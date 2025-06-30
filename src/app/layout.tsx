import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BOM Comparison Tool - Compare SOLIDWORKS & DURO BOMs",
  description: "Efficiently compare and analyze Bill of Materials (BOMs) between SOLIDWORKS and DURO systems. Identify discrepancies, missing parts, and quantity differences with ease.",
  icons: {
    icon: '/images/ionqfavicon.svg',
    shortcut: '/images/ionqfavicon.svg',
    apple: '/images/ionqfavicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
