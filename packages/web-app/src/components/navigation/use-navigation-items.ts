"use client";

import type { LucideIcon } from "lucide-react";
import { BookOpen, FilePlusCorner, Settings, Tags } from "lucide-react";
import { usePathname } from "next/navigation";
import { useUserId } from "@/components/providers/user-id-provider";

type NavigationItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  matchMode?: "exact" | "startsWith";
  excludedHrefs?: string[];
};

export type NavigationItemsResult = {
  navItems: NavigationItem[];
  pathname: string;
};

export function useNavigationItems(): NavigationItemsResult {
  const pathname = usePathname();
  const userId = useUserId();
  const registrationHref = `/users/${userId}/articles/registration`;
  const navItems: NavigationItem[] = [
    {
      href: `/users/${userId}/articles`,
      icon: BookOpen,
      label: "記事一覧",
      matchMode: "startsWith",
      excludedHrefs: [registrationHref],
    },
    {
      href: registrationHref,
      icon: FilePlusCorner,
      label: "記事を保存",
      matchMode: "startsWith",
    },
    { href: `/users/${userId}/article-tags`, icon: Tags, label: "タグ管理" },
    { href: `/users/${userId}/settings`, icon: Settings, label: "設定" },
  ];

  return {
    navItems,
    pathname,
  };
}
