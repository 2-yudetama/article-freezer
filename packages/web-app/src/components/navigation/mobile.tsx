import Image from "next/image";
import Link from "next/link";
import {
  isActiveItem,
  type NavigationItemsResult,
} from "@/components/navigation/use-navigation-items";
import { cn } from "@/lib/utils/tw-merge";

export function MobileNavigationView({
  navItems,
  pathname,
}: NavigationItemsResult) {
  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10">
            <Image
              src="/icons/icon-512-rounded.png"
              alt="記事冷凍庫"
              width={40}
              height={40}
              unoptimized
              className="w-10 h-10"
            />
          </div>
          <span className="font-semibold text-xl">記事冷凍庫</span>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center z-10">
        {navItems.map((item) => {
          const isActive = isActiveItem(
            pathname,
            item.href,
            item.matchMode,
            item.excludedHrefs,
          );
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
      </nav>
    </>
  );
}
