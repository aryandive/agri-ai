import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Agri AI — Smart Farming Assistant",
  description:
    "AI-powered agricultural assistant for plant disease detection, weather forecasts, crop planning, and market prices.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap"
            rel="stylesheet"
          />
        </head>
        <body>
          <Sidebar />
          <main className="main-content">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
