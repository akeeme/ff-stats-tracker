from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from .base import BaseResponse, BaseModelSchema


# create team

class TeamCreate(BaseModel):
    name: str
    season: int
    league: str
    wins: int = 0
    losses: int = 0
    ties: int = 0



#  fetch existing team

class TeamOut(BaseModelSchema):
    id: int
    name: str
    season: int
    league: str
    wins: int
    losses: int
    ties: int
    players: List['PlayerOut'] = []

    model_config = ConfigDict(from_attributes=True)


# update team (wins/losses)

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    season: Optional[int] = None
    league: Optional[str] = None
    wins: Optional[int] = None
    losses: Optional[int] = None
    ties: Optional[int] = None


class TeamResponse(BaseResponse):
    data: Optional[TeamOut] = None


# Import PlayerOut after TeamOut is defined
from schemas.players import PlayerOut
