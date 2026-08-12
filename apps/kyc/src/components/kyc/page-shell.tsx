import { Link } from "@tanstack/react-router";
import { Bell, Menu, Plus } from "lucide-react";
import type { ReactNode } from "react";

import { AppSidebar } from "@/components/kyc/sidebar";
import { ThemeToggle } from "@/components/kyc/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function PageShell({
  activePath,
  title,
  subtitle,
  actions,
  children,
}: {
  activePath: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border/70 lg:block">
        <AppSidebar activePath={activePath} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <AppSidebar activePath={activePath} />
              </SheetContent>
            </Sheet>

            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold sm:text-lg">{title}</h1>
              {subtitle ? (
                <p className="hidden text-xs text-muted-foreground sm:block">{subtitle}</p>
              ) : null}
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              {actions}
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
              </Button>
              <Button asChild className="gap-2 rounded-full">
                <Link to="/verify">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Verification</span>
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
