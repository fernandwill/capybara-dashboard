"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Wraps the app in next-themes so the theme toggle can switch the `dark`
 * class on <html>. First-time visitors follow their OS preference; the
 * toggle can pin light or dark, and the choice is persisted in localStorage
 * by next-themes.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
