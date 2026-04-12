import "server-only";

import { getLogger } from "@logtape/logtape";
import * as v from "valibot";
import { auth } from "@/lib/auth";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "@/lib/errors";

const logger = getLogger(["web-app", "api", "auth"]);

/**
 * ユーザ単位のAPIリクエストで以下のチェックを行う
 * - userIdの型チェック(UUID)
 * - ユーザのリソース権限チェック
 * - ユーザのロールチェック(一時的に利用ユーザを制限するため)
 */
export async function authorizeUserApiRequest(userId: string) {
  // userIdの型チェック(UUID)
  const userIdResult = v.safeParse(v.pipe(v.string(), v.uuid()), userId);
  if (!userIdResult.success) {
    logger.error("Invalid userId", {
      user_id: userId,
      message: new v.ValiError(userIdResult.issues).message,
    });
    throw new NotFoundError();
  }

  const session = await auth();
  if (!session) {
    throw new UnauthorizedError();
  }

  // セッションからユーザ情報を取得
  const user = session.user;
  if (!user.id) {
    throw new NotFoundError();
  }

  // ログインしているユーザに関連しないリソースへのアクセスを禁止
  if (userId !== user.id) {
    logger.warn("Unauthorized user access to other user's API resource", {
      user_id: user.id,
      target_user_id: userId,
    });
    throw new NotFoundError();
  }

  // 暫定的に、roleが1以外のユーザはアクセス制限をかける
  if (user.role !== 1) {
    throw new ForbiddenError();
  }
}
