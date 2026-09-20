import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authorizeUserApiRequest = vi.hoisted(() => vi.fn());
const refreshExpiredRegisteredSites = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("db", () => ({
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {},
  },
}));
vi.mock("@/lib/api/auth-user", () => ({ authorizeUserApiRequest }));
vi.mock("@/features/registered-sites/server/registered-sites.service", () => ({
  refreshExpiredRegisteredSites,
}));

import { POST } from "@/app/api/users/[userId]/registered-sites/refresh-expired/route";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const SITE_ID = "22222222-2222-4222-8222-222222222222";
const BASELINE = "2026-09-19T00:00:00.000Z";
const STARTED_AT = "2026-09-19T00:01:00.000Z";

function params(userId = USER_ID): {
  params: Promise<{ userId: string }>;
} {
  return { params: Promise.resolve({ userId }) };
}

function request(query = "") {
  return new Request(
    `http://localhost/api/users/${USER_ID}/registered-sites/refresh-expired${query}`,
    { method: "POST" },
  );
}

beforeEach(() => {
  authorizeUserApiRequest.mockReset().mockResolvedValue(undefined);
  refreshExpiredRegisteredSites.mockReset().mockResolvedValue({ ok: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("期限切れ登録サイト更新 API", () => {
  it("siteId を所有対象 ID としてサービスへ渡す", async () => {
    const response = await POST(
      request(
        `?siteId=${SITE_ID}&cursor=cursor-1&since=${encodeURIComponent(BASELINE)}&accessStartedAt=${encodeURIComponent(STARTED_AT)}`,
      ),
      params(),
    );

    expect(response.status).toBe(200);
    expect(authorizeUserApiRequest).toHaveBeenCalledWith(USER_ID);
    expect(refreshExpiredRegisteredSites).toHaveBeenCalledWith({
      userId: USER_ID,
      registeredSiteId: SITE_ID,
      cursor: "cursor-1",
      since: BASELINE,
      accessStartedAt: STARTED_AT,
    });
  });

  it("不正な siteId を 400 として拒否する", async () => {
    const response = await POST(request("?siteId=not-a-uuid"), params());

    expect(response.status).toBe(400);
    expect(refreshExpiredRegisteredSites).not.toHaveBeenCalled();
  });

  it("siteId がない場合を 400 として拒否する", async () => {
    const response = await POST(request(), params());

    expect(response.status).toBe(400);
    expect(refreshExpiredRegisteredSites).not.toHaveBeenCalled();
  });
});
