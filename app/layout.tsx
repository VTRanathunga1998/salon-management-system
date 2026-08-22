import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";
import { BUSINESS_INFO } from "@/lib/settings";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: `${BUSINESS_INFO.name} - Salon Management`,
    template: `%s | ${BUSINESS_INFO.name}`,
  },

  description:
    "Salon management system for managing customers, appointments, services, invoices and payments.",

  icons: {
    icon: "/favicon.ico",
  },

  robots: {
    index: false,
    follow: false,
  },

  openGraph: {
    title: `${BUSINESS_INFO.name} - Salon Management`,
    description:
      "Manage customers, appointments, services, invoices and payments.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: BUSINESS_INFO.name,
      },
    ],
  },
};

<meta name="apple-mobile-web-app-title" content="Avenue" />;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="apple-mobile-web-app-title"
          content="SmartUniversitySystem"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={inter.className}>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
