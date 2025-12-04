
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { ModeToggle } from "@/components/theme/ModeToggle";
import { ThemeSwatches } from "@/components/theme/ThemeSwatches";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@radix-ui/react-separator";
import { DynamicBreadcrumb } from "@/components/navigation/DynamicBreadcrumb";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (

    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 w-full items-center gap-2 bg-background text-foreground border-b group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 pl-4 pr-0 w-full">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <DynamicBreadcrumb />
            <div className="ml-auto flex items-center gap-2 me-2">
              <ThemeSwatches />
              <ModeToggle />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>

  );
}
