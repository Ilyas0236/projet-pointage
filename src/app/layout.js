import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import ToastContainer from "@/components/Toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Chronos - Pointage",
  description: "Plateforme de gestion de temps et présences",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${inter.variable} ${poppins.variable} antialiased dark`} suppressHydrationWarning>
      <body className="font-sans min-h-screen bg-background text-foreground">
        <ToastContainer />
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
