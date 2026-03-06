from pydantic import BaseModel
from typing import Literal


class Health(BaseModel):
    status: Literal["ok"]


class Extract(BaseModel):
    pass
