import type { Metadata } from "next";
import { Geist, Geist_Mono, Atkinson_Hyperlegible_Mono, Poppins } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Accessible, clean font for body text
const atkinsonHyperlegibleMono = Atkinson_Hyperlegible_Mono({
  variable: "--font-atkinson-hyperlegible-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

// Modern, friendly font for headings
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Hear Me Out",
  description: "An introspective, reflective experience that encourages vulnerability and connection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${atkinsonHyperlegibleMono.variable} ${poppins.variable} antialiased py-5 px-8 flex min-h-screen items-center justify-center `}
      >
        {children}
      </body>
    </html>
  );
}
