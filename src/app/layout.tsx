import type { Metadata } from "next";
import { Inter, Rajdhani } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"],
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-rajdhani",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MachineBio - Car Enthusiast Social Network",
  description: "Share your garage, document your builds, connect with car people",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${rajdhani.variable} font-sans bg-zinc-950 text-zinc-100 antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

