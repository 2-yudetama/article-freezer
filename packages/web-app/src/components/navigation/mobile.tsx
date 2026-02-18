import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import type { NavigationItemsResult } from "@/components/navigation/use-navigation-items";
import { cn } from "@/lib/utils";

export function MobileNavigationView({
  navItems,
  pathname,
  registrationHref,
}: NavigationItemsResult) {
  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">記事コレクション</span>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center z-10">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}

        <Link
          href={registrationHref}
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 h-full",
            pathname.startsWith(registrationHref)
              ? "text-primary"
              : "text-muted-foreground",
          )}
        >
          <Plus className="w-5 h-5" />
          <span className="text-xs font-medium">記事保存</span>
        </Link>
      </nav>
    </>
  );
}
