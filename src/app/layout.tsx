import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
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
  title: "Organized — Get your time back",
  description: "Life balance app — plan your orbit, track progress, stay organized",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-dvh overflow-hidden font-sans">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("organized-theme");var r=document.documentElement;r.classList.remove("light","dark");r.classList.add(t==="light"?"light":"dark");r.style.colorScheme=t==="light"?"light":"dark";}catch(e){document.documentElement.classList.add("dark");}})();`,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
