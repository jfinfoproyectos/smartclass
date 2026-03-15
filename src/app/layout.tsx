import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ScrollRestorer } from "@/components/ScrollRestorer";


export const metadata: Metadata = {
  title: "SmartClass",
  description: "Plataforma educativa inteligente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          forcedTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ScrollRestorer />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
