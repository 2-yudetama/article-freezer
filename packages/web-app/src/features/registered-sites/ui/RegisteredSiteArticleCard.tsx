"use client";

import { ExternalLink, ImageOff } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTimeInTokyo } from "@/lib/utils/data-format";
import { cn } from "@/lib/utils/tw-merge";
import type { FeedEntryView } from "../common/types";

export default function RegisteredSiteArticleCard({
  userId,
  siteName,
  entry,
}: {
  userId: string;
  siteName: string;
  entry: FeedEntryView;
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden py-0 transition-shadow hover:shadow-lg",
        entry.isNew && "border-primary/70 shadow-primary/10",
      )}
    >
      <div className="grid grid-cols-[6rem_1fr] gap-4 sm:grid-cols-[9rem_1fr]">
        <div className="flex items-center justify-center py-5">
          <div className="flex aspect-square w-full items-center justify-center bg-muted text-muted-foreground">
            {entry.thumbnailUrl ? (
              // biome-ignore lint/performance/noImgElement: フィードごとに異なる画像ホストを許容するため Next Image の固定ドメイン設定を使わない
              <img
                src={entry.thumbnailUrl}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <ImageOff aria-label="サムネイルなし" />
            )}
          </div>
        </div>
        <div className="min-w-0 py-5 pr-5">
          <CardHeader className="p-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {entry.isNew && <Badge>新着</Badge>}
              <Badge variant="secondary">{siteName}</Badge>
            </div>
            <CardTitle className="line-clamp-3 text-base leading-snug">
              {entry.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="mt-3 space-y-3 p-0">
            {entry.publishedAt && (
              <p className="text-xs text-muted-foreground">
                投稿日: {formatDateTimeInTokyo(entry.publishedAt)}
              </p>
            )}
            <p className="truncate text-xs text-muted-foreground">
              {entry.articleUrl}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <a
                  href={entry.articleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  元サイトで開く
                  <ExternalLink />
                </a>
              </Button>
              <Button asChild size="sm">
                <Link
                  href={`/users/${userId}/articles/registration?url=${encodeURIComponent(entry.articleUrl)}`}
                >
                  保存する
                </Link>
              </Button>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
