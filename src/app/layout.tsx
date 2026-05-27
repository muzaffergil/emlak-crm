import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/components/AuthProvider";
import AuthGate from "@/components/AuthGate";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EstateIQ",
  description: "Emlak portföy ve müşteri yönetimi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={`${geist.className} bg-slate-50 min-h-screen`}>
        <AuthProvider>
          <AuthGate>
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-4 md:py-6">{children}</main>
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
