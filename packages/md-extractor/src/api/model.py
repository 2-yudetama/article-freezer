from pydantic import BaseModel, HttpUrl
from typing import Literal


class Health(BaseModel):
    status: Literal["ok"]


class ExtractReq(BaseModel):
    url: HttpUrl


class ExtractRes(BaseModel):
    pass
