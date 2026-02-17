import "dotenv/config";
import { prisma } from "./client.js";

try {
  // 環境変数のチェック
  const { SEED_PROVIDER, SEED_PROVIDER_ACCOUNT_ID } = process.env;
  if (!SEED_PROVIDER || !SEED_PROVIDER_ACCOUNT_ID) {
    throw new Error("Seed data environment value is required");
  }

  // ユーザ情報をDBにupsert
  const dbUser = await prisma.user.upsert({
    where: {
      provider_provider_account_id: {
        provider: SEED_PROVIDER,
        provider_account_id: SEED_PROVIDER_ACCOUNT_ID,
      },
    },
    create: {
      provider: SEED_PROVIDER,
      provider_account_id: SEED_PROVIDER_ACCOUNT_ID,
      name: "seed_name",
      email: "seed_email",
      image: "seed_image",
      role: 1, // アプリ利用権限を持つユーザとする
    },
    update: {},
  });

  console.log("[Seed] Upsert seed user successfully: ", dbUser);
} catch (error) {
  console.error("[Seed] Upsert Create error: ", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
