"use client";

import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api/response.shared";
import type { FeedCandidate } from "../common/types";

type Props = {
  userId: string;
  onRegistered: (registeredSiteId?: string) => void;
};

type Discovery = {
  siteUrl: string;
  siteTitle?: string | null;
  candidates: FeedCandidate[];
};

export default function AddRegisteredSiteDialog({
  userId,
  onRegistered,
}: Props) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isDisplayNameEdited, setIsDisplayNameEdited] = useState(false);
  const [discovery, setDiscovery] = useState<Discovery | null>(null);
  const [selectedFeedUrl, setSelectedFeedUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const reset = () => {
    setUrl("");
    setDisplayName("");
    setIsDisplayNameEdited(false);
    setDiscovery(null);
    setSelectedFeedUrl("");
    setIsLoading(false);
  };

  const showError = async (response: Response) => {
    toast.error("サイトを登録できません", {
      description: await getApiErrorMessage(response),
    });
  };

  const discover = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/users/${userId}/registered-sites/discover`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        },
      );
      if (!response.ok) {
        await showError(response);
        return;
      }
      const result = (await response.json()) as Discovery;
      setDiscovery(result);
      setSelectedFeedUrl(result.candidates[0]?.feedUrl ?? "");
      setDisplayName(
        (
          result.candidates[0]?.title ??
          result.siteTitle ??
          new URL(result.siteUrl).hostname
        ).slice(0, 255),
      );
      setIsDisplayNameEdited(false);
      if (result.candidates.length === 0) {
        toast.info("フィードは見つかりませんでした", {
          description: "サイトへのリンクとして登録できます",
        });
      }
    } catch {
      toast.error("サイトを登録できません", {
        description: "通信に失敗しました。再試行してください",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (feedUrl: string | null) => {
    if (!discovery) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/registered-sites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteUrl: discovery.siteUrl,
          feedUrl,
          ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
        }),
      });
      if (!response.ok) {
        await showError(response);
        return;
      }
      const result = (await response.json()) as {
        site?: { registeredSiteId?: string };
      };
      toast.success("登録サイトを追加しました");
      setOpen(false);
      reset();
      onRegistered(result.site?.registeredSiteId);
    } catch {
      toast.error("サイトを登録できません", {
        description: "通信に失敗しました。再試行してください",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus />
          サイトを追加
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>登録サイトを追加</DialogTitle>
          <DialogDescription>
            サイト URL または RSS / Atom フィード URL を入力してください
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="registered-site-url">URL</Label>
          <Input
            id="registered-site-url"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="example.com"
            disabled={isLoading || Boolean(discovery)}
          />
        </div>

        {discovery && (
          <div className="rounded-lg border bg-muted/40 p-3 text-sm">
            <p className="text-xs text-muted-foreground">登録する URL</p>
            <p className="mt-1 break-all font-medium">{discovery.siteUrl}</p>
          </div>
        )}

        {discovery && (
          <div className="space-y-2">
            <Label htmlFor="registered-site-display-name">表示名</Label>
            <Input
              id="registered-site-display-name"
              value={displayName}
              onChange={(event) => {
                setDisplayName(event.target.value);
                setIsDisplayNameEdited(true);
              }}
              placeholder="サイト名（任意）"
              maxLength={255}
              disabled={isLoading}
            />
          </div>
        )}

        {discovery && discovery.candidates.length > 0 && (
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">利用するフィード</legend>
            {discovery.candidates.map((candidate) => (
              <label
                key={candidate.feedUrl}
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-3"
              >
                <input
                  type="radio"
                  name="feed-candidate"
                  value={candidate.feedUrl}
                  checked={selectedFeedUrl === candidate.feedUrl}
                  onChange={() => {
                    setSelectedFeedUrl(candidate.feedUrl);
                    if (!isDisplayNameEdited) {
                      setDisplayName(candidate.title.slice(0, 255));
                    }
                  }}
                  disabled={isLoading}
                />
                <span className="min-w-0 space-y-1">
                  <span className="block truncate text-sm font-medium">
                    {candidate.title}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {candidate.feedUrl}
                  </span>
                  <Badge variant="outline">
                    {candidate.format.toUpperCase()}
                  </Badge>
                </span>
              </label>
            ))}
          </fieldset>
        )}

        {discovery && discovery.candidates.length === 0 && (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            新着取得には未対応のサイトです。サイトへのリンクとして登録できます
          </div>
        )}

        <DialogFooter>
          {!discovery ? (
            <Button onClick={discover} disabled={isLoading || !url.trim()}>
              {isLoading && <Loader2 className="animate-spin" />}
              {isLoading ? "確認中" : "フィードを確認"}
            </Button>
          ) : discovery.candidates.length === 0 ? (
            <Button onClick={() => register(null)} disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin" />}
              リンクとして登録
            </Button>
          ) : (
            <>
              <Button
                onClick={() => register(selectedFeedUrl)}
                disabled={isLoading || !selectedFeedUrl}
              >
                {isLoading && <Loader2 className="animate-spin" />}
                このフィードを登録
              </Button>
              <Button
                variant="outline"
                onClick={() => register(null)}
                disabled={isLoading}
              >
                リンクとして登録
              </Button>
            </>
          )}
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading}>
              キャンセル
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
