import { NextResponse } from "next/server";
import * as v from "valibot";
import { toRegisteredSiteExceptionResponse } from "@/features/registered-sites/api/response";
import { RegisteredSiteSearchParamsSchema } from "@/features/registered-sites/common/types";
import { refreshExpiredRegisteredSites } from "@/features/registered-sites/server/registered-sites.service";
import { authorizeUserApiRequest } from "@/lib/api/auth-user";
import { BadRequestError } from "@/lib/errors";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    await authorizeUserApiRequest(userId);
    const url = new URL(request.url);
    const result = v.safeParse(RegisteredSiteSearchParamsSchema, {
      siteId: url.searchParams.get("siteId") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
      since: url.searchParams.get("since") ?? undefined,
      accessStartedAt: url.searchParams.get("accessStartedAt") ?? undefined,
    });
    if (!result.success) throw new BadRequestError();
    if (!result.output.siteId) {
      throw new BadRequestError("登録先を指定してください");
    }

    return NextResponse.json(
      await refreshExpiredRegisteredSites({
        userId,
        registeredSiteId: result.output.siteId,
        cursor: result.output.cursor,
        since: result.output.since,
        accessStartedAt: result.output.accessStartedAt,
      }),
    );
  } catch (error) {
    return toRegisteredSiteExceptionResponse(error);
  }
}
