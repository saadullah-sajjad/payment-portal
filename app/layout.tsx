import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import { Providers } from "@/components/providers";
import { LogoutButton } from "@/components/logout-button";
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
  title: "Dubsea Payment Portal",
  description: "Generate secure payment links for your clients with HMAC signature protection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-black rounded-xl p-2.5 shadow-md">
                    <Image
                      src="/logo.png"
                      alt="Dubsea Logo"
                      width={50}
                      height={50}
                      priority
                    />
                  </div>
                </div>
                <LogoutButton />
              </div>
            </div>
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
