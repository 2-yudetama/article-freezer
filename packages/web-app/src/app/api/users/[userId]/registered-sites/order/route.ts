import { NextResponse } from "next/server";
import * as v from "valibot";
import { toRegisteredSiteExceptionResponse } from "@/features/registered-sites/api/response";
import { ReorderRegisteredSitesRequestSchema } from "@/features/registered-sites/common/types";
import { reorderRegisteredSites } from "@/features/registered-sites/server/registered-sites.service";
import { authorizeUserApiRequest } from "@/lib/api/auth-user";
import { BadRequestError } from "@/lib/errors";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    await authorizeUserApiRequest(userId);
    const result = v.safeParse(
      ReorderRegisteredSitesRequestSchema,
      await request.json().catch(() => null),
    );
    if (!result.success) throw new BadRequestError();

    const sites = await reorderRegisteredSites({ userId, ...result.output });
    return NextResponse.json({
      registeredSiteIds: sites.map((site) => site.registered_site_id),
    });
  } catch (error) {
    return toRegisteredSiteExceptionResponse(error);
  }
}
