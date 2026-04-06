import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "MediLife — Find the Right Hospital, Right Now",
  description: "AI-powered hospital finder. Tell Medi your symptoms and get matched with the best hospital by severity, distance, and live bed availability. Emergency SOS with one tap.",
  keywords: "hospital finder, emergency hospital, bed availability, AI health assistant, MediLife, nearest hospital",
  openGraph: {
    title: "MediLife — Smart Hospital Intelligence",
    description: "Find the right hospital instantly. Real-time bed availability, AI triage, and emergency SOS.",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#16a34a" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
