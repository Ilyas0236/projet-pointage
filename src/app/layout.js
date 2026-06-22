import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import ToastContainer from "@/components/Toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "ScanTime - Pointage Numérique",
  description: "Application professionnelle de gestion de pointage et de présence par QR Code et Géolocalisation.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${inter.variable} ${outfit.variable} antialiased dark`} suppressHydrationWarning>
      <body className="font-sans min-h-screen bg-background text-foreground">
        <ToastContainer />
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
