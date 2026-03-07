from typing import Literal

from pydantic import BaseModel, HttpUrl


class Health(BaseModel):
    status: Literal["ok"]


class ExtractReq(BaseModel):
    url: HttpUrl


class ExtractRes(BaseModel):
    pass
