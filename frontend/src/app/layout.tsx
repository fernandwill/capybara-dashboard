import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/providers/DataProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import NavigationProgress from "@/components/layout/NavigationProgress";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "CapyHub's Dashboard",
  description: "Badminton match tracker and management system",
  applicationName: "CapyHub",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CapyHub",
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${jetbrainsMono.variable} ${jetbrainsMono.className}`}>
        <ThemeProvider>
          <AuthProvider>
            <DataProvider>
              <Suspense fallback={null}>
                <NavigationProgress />
              </Suspense>
              {children}
            </DataProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
