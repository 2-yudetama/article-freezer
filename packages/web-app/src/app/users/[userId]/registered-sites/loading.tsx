import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="container mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-10 w-48 animate-pulse rounded bg-muted" />
          <div className="h-5 w-80 animate-pulse rounded bg-muted" />
        </div>
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <Card className="h-32 animate-pulse" />
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="h-8 w-2/5 animate-pulse rounded bg-muted" />
            <div className="h-24 animate-pulse rounded bg-muted" />
            <div className="h-24 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
