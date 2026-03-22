import type { Metadata } from "next";
import { Inter, Lora, Playfair_Display } from "next/font/google";
import "./globals.css";
import { LanguageModal } from "./components/LanguageModal";
import { ToastProvider } from "./components/Toast";
import { LookupProvider } from "./providers/LookupProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Lora({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Angel Nadar Matrimony",
  description:
    "Find your life partner within the Nadar community — trusted, community-focused matrimony.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-text">
        <ToastProvider>
          <LookupProvider>
            <LanguageModal />
            {children}
          </LookupProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
