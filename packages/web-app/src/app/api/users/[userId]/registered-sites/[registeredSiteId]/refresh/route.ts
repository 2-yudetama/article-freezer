import { NextResponse } from "next/server";
import * as v from "valibot";
import { toRegisteredSiteExceptionResponse } from "@/features/registered-sites/api/response";
import { RegisteredSiteIdSchema } from "@/features/registered-sites/common/types";
import { refreshRegisteredSite } from "@/features/registered-sites/server/registered-sites.service";
import { authorizeUserApiRequest } from "@/lib/api/auth-user";
import { BadRequestError } from "@/lib/errors";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string; registeredSiteId: string }> },
) {
  try {
    const { userId, registeredSiteId } = await params;
    await authorizeUserApiRequest(userId);
    if (!v.safeParse(RegisteredSiteIdSchema, registeredSiteId).success) {
      throw new BadRequestError();
    }
    const url = new URL(request.url);
    return NextResponse.json(
      await refreshRegisteredSite({
        userId,
        registeredSiteId,
        cursor: url.searchParams.get("cursor") ?? undefined,
        since: url.searchParams.get("since") ?? undefined,
        accessStartedAt: url.searchParams.get("accessStartedAt") ?? undefined,
      }),
    );
  } catch (error) {
    return toRegisteredSiteExceptionResponse(error);
  }
}
