"use client";

import { BookOpen, Plus, Settings, Tags } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserId } from "@/app/users/[userId]/userIdProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DesktopNavigation() {
  const pathname = usePathname();
  const userId = useUserId();
  const navItems = [
    { href: `/users/${userId}/articles`, icon: BookOpen, label: "記事一覧" },
    { href: `/users/${userId}/article-tags`, icon: Tags, label: "タグ管理" },
    { href: `/users/${userId}/settings`, icon: Settings, label: "設定" },
  ];

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 border-r border-border bg-card fixed left-0 top-0 h-screen">
      <div className="flex items-center gap-2 p-6 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-semibold text-lg">記事コレクション</span>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
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

      <div className="p-4 border-t border-border">
        <Link href={`/users/${userId}/articles/registration`}>
          <Button className="w-full" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            記事を登録
          </Button>
        </Link>
      </div>
    </aside>
  );
}

export function MobileNavigation() {
  const pathname = usePathname();
  const userId = useUserId();
  const navItems = [
    { href: `/users/${userId}/articles`, icon: BookOpen, label: "記事一覧" },
    { href: `/users/${userId}/article-tags`, icon: Tags, label: "タグ管理" },
    { href: `/users/${userId}/settings`, icon: Settings, label: "設定" },
  ];

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
          href={`/users/${userId}/articles/registration`}
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 h-full",
            pathname.startsWith(`/users/${userId}/articles/registration`)
              ? "text-primary"
              : "text-muted-foreground",
          )}
        >
          <Plus className="w-5 h-5" />
          <span className="text-xs font-medium">登録</span>
        </Link>
      </nav>
    </>
  );
}
