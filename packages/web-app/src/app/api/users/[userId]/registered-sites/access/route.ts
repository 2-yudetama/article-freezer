import { NextResponse } from "next/server";
import * as v from "valibot";
import { toRegisteredSiteExceptionResponse } from "@/features/registered-sites/api/response";
import { RecordSiteAccessRequestSchema } from "@/features/registered-sites/common/types";
import { recordRegisteredSiteAccess } from "@/features/registered-sites/server/registered-sites.service";
import { authorizeUserApiRequest } from "@/lib/api/auth-user";
import { BadRequestError } from "@/lib/errors";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    await authorizeUserApiRequest(userId);
    const result = v.safeParse(
      RecordSiteAccessRequestSchema,
      await request.json().catch(() => null),
    );
    if (!result.success) throw new BadRequestError();

    return NextResponse.json({
      recorded: await recordRegisteredSiteAccess({
        userId,
        ...result.output,
      }),
    });
  } catch (error) {
    return toRegisteredSiteExceptionResponse(error);
  }
}
