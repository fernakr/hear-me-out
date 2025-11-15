import type { Metadata } from "next";
import { Yomogi, Pangolin, Poppins, Geist_Mono } from "next/font/google";
import "./globals.css";
import LayoutClient from "@/components/LayoutClient";
import { MotionProvider } from "@/components/MotionContext";
import { AudioProvider } from "@/components/AudioContext";

const yomogi = Yomogi({
  variable: "--font-yomogi",
  subsets: ["latin"],
  weight: "400",
});

const pangolin = Pangolin({
  variable: "--font-pangolin",
  subsets: ["latin"],
  weight: "400",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${yomogi.variable} ${pangolin.variable} ${poppins.variable} ${geistMono.variable} antialiased py-5 px-4 lg:px-8 flex min-h-screen items-center justify-center`}
      >
        <MotionProvider>
          <AudioProvider>
            <LayoutClient>
              {children}
            </LayoutClient>
          </AudioProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
