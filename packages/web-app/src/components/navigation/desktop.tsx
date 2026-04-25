import Image from "next/image";
import Link from "next/link";
import type { NavigationItemsResult } from "@/components/navigation/use-navigation-items";
import { cn } from "@/lib/utils/tw-merge";

function isActiveItem(
  pathname: string,
  href: string,
  matchMode = "startsWith",
  excludedHrefs: string[] = [],
) {
  if (excludedHrefs.some((excludedHref) => pathname.startsWith(excludedHref))) {
    return false;
  }

  return matchMode === "exact" ? pathname === href : pathname.startsWith(href);
}

export function DesktopNavigationView({
  navItems,
  pathname,
}: NavigationItemsResult) {
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 border-r border-border bg-card fixed left-0 top-0 h-screen">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <div className="w-10 h-10">
          <Image
            src="/icons/icon512_rounded.png"
            alt="記事冷凍庫"
            width={32}
            height={32}
            unoptimized
            className="w-10 h-10"
          />
        </div>
        <span className="font-semibold text-xl">記事冷凍庫</span>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = isActiveItem(
              pathname,
              item.href,
              item.matchMode,
              item.excludedHrefs,
            );
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
