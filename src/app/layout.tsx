import type { Metadata } from "next";
import { ToastCenter } from "@/components/common/toast-center";
import "./globals.css";

export const metadata: Metadata = {
  title: "TravelMate Partner",
  description: "Partner access portal for TravelMate stays and transfers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {children}
        <ToastCenter />
      </body>
    </html>
  );
}
