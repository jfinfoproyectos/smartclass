import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";


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
        {/* 
          🔒 SECURITY NOTE: dangerouslySetInnerHTML is used here for theme initialization
          This is safe because:
          1. The content is a hardcoded string literal (not user input)
          2. It sets CSS custom properties for theme colors
          3. It runs before hydration to prevent theme flash
          4. No external data or user input is involved
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var p=localStorage.getItem('theme-palette');var name=p||'emerald';if(name==='emerald'){var r=document.documentElement;var s=[[\"--primary\",\"oklch(0.769 0.188 70.08)\"],[\"--primary-foreground\",\"oklch(0.145 0 0)\"],[\"--accent\",\"oklch(0.769 0.188 70.08)\"],[\"--accent-foreground\",\"oklch(0.985 0 0)\"],[\"--chart-1\",\"oklch(0.769 0.188 70.08)\"],[\"--chart-2\",\"oklch(0.6 0.118 184.704)\"],[\"--chart-3\",\"oklch(0.398 0.07 227.392)\"],[\"--chart-4\",\"oklch(0.828 0.189 84.429)\"],[\"--chart-5\",\"oklch(0.646 0.222 41.116)\"]];s.forEach(function(a){r.style.setProperty(a[0],a[1]);});}}catch(e){}})();",
          }}
        />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
