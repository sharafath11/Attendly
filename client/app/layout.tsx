import type React from "react";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import ToastProvider from "@/components/providers/ToastProvider";
import ThemeProvider from "@/components/providers/ThemeProvider";
import QueryProvider from "@/components/providers/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Attendly | Tuition Management",
  description: "Modern SaaS dashboard for tuition teachers.",
  icons: {
    icon: [
      { url: "/images/logo-light-v2.png", media: "(prefers-color-scheme: light)" },
      { url: "/images/logo-dark-v2.png", media: "(prefers-color-scheme: dark)" },
    ],
    shortcut: "/images/logo-light-v2.png",
    apple: "/images/logo-light-v2.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <QueryProvider>
            <ToastProvider />
            {children}
          </QueryProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
