import type { Metadata } from "next";
import { AppSidebar } from "@/components/app-sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Himcolor App",
  description: "Управление на рецепти, себестойности и производство",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg">
      <body>
        <AppSidebar />
        <div className="min-h-screen pl-72">
          <main className="p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
