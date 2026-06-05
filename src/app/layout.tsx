import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/components/AuthProvider";
import AuthGate from "@/components/AuthGate";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NestroTR",
  description: "Emlak portföy ve müşteri yönetimi",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={`${geist.className} bg-slate-50 h-dvh overflow-hidden flex flex-col`}>
        <AuthProvider>
          <AuthGate>
            <Navbar />
            <main className="flex-1 min-h-0 overflow-y-auto">
              <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">{children}</div>
            </main>
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
