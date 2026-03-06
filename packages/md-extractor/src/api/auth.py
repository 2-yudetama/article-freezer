import hmac

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from src.settings import settings


async def verify_api_token(
    authorization: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
) -> None:
    """
    AuthorizationヘッダーのBearerトークンを検証する

    - タイミング攻撃対策を実施
    - https://docs.python.org/ja/3/library/hmac.html#hmac.compare_digest
    """
    # タイミング攻撃対策
    result = hmac.compare_digest(
        authorization.credentials, settings.api_secret_key
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized"
        )
