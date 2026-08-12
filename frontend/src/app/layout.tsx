import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Capybara's Dashboard",
  description: "Badminton match tracker and management system",
  applicationName: "Capybara",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Capybara",
  },
  icons: {
    icon: "/icons/icon.jpg",
    shortcut: "/icons/icon.jpg",
    apple: "/icons/icon.jpg",
  },
};

// Mobile web-app polish: expand into the status bar/notch area (safe-area
// padding is applied in CSS), theme the browser UI to match the dark theme.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#07090c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${inter.className}`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
