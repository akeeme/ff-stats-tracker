from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BaseModelSchema(BaseModel):
    version: int
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

class BaseResponse(BaseModel):
    success: bool
    message: Optional[str] = None 