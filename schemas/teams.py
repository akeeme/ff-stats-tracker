from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from .base import BaseResponse, BaseModelSchema


# create team

class TeamBase(BaseModel):
    name: str
    season: int
    league: str
    wins: Optional[int] = 0
    losses: Optional[int] = 0
    ties: Optional[int] = 0
    is_active: Optional[int] = 1


class TeamCreate(TeamBase):
    pass


#  fetch existing team

class TeamOut(TeamBase, BaseModelSchema):
    id: int
    display_name: str

    class Config:
        from_attributes = True


class TeamWithPlayers(TeamOut):
    players: List["PlayerOut"] = []

    class Config:
        from_attributes = True


# update team (wins/losses)

class TeamUpdate(TeamBase):
    name: Optional[str] = None
    season: Optional[int] = None
    league: Optional[str] = None


class TeamResponse(BaseResponse):
    data: Optional[TeamOut] = None


# Import PlayerOut after TeamOut is defined
from schemas.players import PlayerOut
TeamWithPlayers.model_rebuild()
