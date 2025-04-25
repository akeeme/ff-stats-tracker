from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from .base import BaseResponse, BaseModelSchema


# creating new player via api

class PlayerCreate(BaseModel):
    name: str
    team_name: str
    

# fetching existing player (from db) (e.g. GET /players)

class PlayerOut(BaseModelSchema):
    id: int
    name: str
    team_id: int
    team_name: str = None
    
    model_config = ConfigDict(from_attributes=True)
        
class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    team_name: Optional[str] = None


class PlayerResponse(BaseResponse):
    data: Optional[PlayerOut] = None
    
    
    
    
# Update forward references
PlayerOut.model_rebuild()