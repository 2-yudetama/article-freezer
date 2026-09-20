import { NextResponse } from "next/server";
import * as v from "valibot";
import { toRegisteredSiteExceptionResponse } from "@/features/registered-sites/api/response";
import { RegisteredSiteIdSchema } from "@/features/registered-sites/common/types";
import { deleteRegisteredSite } from "@/features/registered-sites/server/registered-sites.service";
import { authorizeUserApiRequest } from "@/lib/api/auth-user";
import { BadRequestError, NotFoundError } from "@/lib/errors";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string; registeredSiteId: string }> },
) {
  try {
    const { userId, registeredSiteId } = await params;
    await authorizeUserApiRequest(userId);
    const result = v.safeParse(RegisteredSiteIdSchema, registeredSiteId);
    if (!result.success) throw new BadRequestError();
    if (!(await deleteRegisteredSite({ userId, registeredSiteId }))) {
      throw new NotFoundError();
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return toRegisteredSiteExceptionResponse(error);
  }
}
