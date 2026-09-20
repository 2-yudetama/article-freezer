import { NextResponse } from "next/server";
import * as v from "valibot";
import { toRegisteredSiteExceptionResponse } from "@/features/registered-sites/api/response";
import {
  RegisteredSiteSearchParamsSchema,
  RegisterSiteRequestSchema,
} from "@/features/registered-sites/common/types";
import {
  getRegisteredSitePageData,
  registerSite,
} from "@/features/registered-sites/server/registered-sites.service";
import { authorizeUserApiRequest } from "@/lib/api/auth-user";
import { BadRequestError } from "@/lib/errors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    await authorizeUserApiRequest(userId);
    const url = new URL(request.url);
    const queryResult = v.safeParse(RegisteredSiteSearchParamsSchema, {
      siteId: url.searchParams.get("siteId") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
      since: url.searchParams.get("since") ?? undefined,
      accessStartedAt: url.searchParams.get("accessStartedAt") ?? undefined,
      mode: url.searchParams.get("mode") ?? undefined,
      refresh: url.searchParams.get("refresh") ?? undefined,
    });
    if (!queryResult.success) throw new BadRequestError();

    return NextResponse.json(
      await getRegisteredSitePageData({
        userId,
        registeredSiteId: queryResult.output.siteId,
        cursor: queryResult.output.cursor,
        since: queryResult.output.since,
        accessStartedAt: queryResult.output.accessStartedAt,
        operation:
          queryResult.output.mode === "page" || queryResult.output.cursor
            ? "page"
            : "initial",
        forceRefresh: queryResult.output.refresh === "true",
      }),
    );
  } catch (error) {
    return toRegisteredSiteExceptionResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    await authorizeUserApiRequest(userId);
    const result = v.safeParse(
      RegisterSiteRequestSchema,
      await request.json().catch(() => null),
    );
    if (!result.success) throw new BadRequestError();

    return NextResponse.json(await registerSite({ userId, ...result.output }), {
      status: 201,
    });
  } catch (error) {
    return toRegisteredSiteExceptionResponse(error);
  }
}
