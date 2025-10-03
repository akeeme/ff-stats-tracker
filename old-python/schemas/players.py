from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from .base import BaseResponse, BaseModelSchema


# creating new player via api

class PlayerBase(BaseModel):
    name: str
    team_id: Optional[int] = None
    season: int
    is_active: bool = True
    jersey_number: Optional[str] = None


class PlayerCreate(PlayerBase):
    team_name: str  # Used for creating player with team name instead of ID


# fetching existing player (from db) (e.g. GET /players)

class PlayerOut(PlayerBase, BaseModelSchema):
    id: int
    display_name: str
    team_name: Optional[str] = None

    class Config:
        from_attributes = True


class PlayerUpdate(PlayerBase):
    name: Optional[str] = None
    team_id: Optional[int] = None
    season: Optional[int] = None
    is_active: Optional[bool] = None
    jersey_number: Optional[str] = None


class PlayerResponse(BaseResponse):
    data: Optional[PlayerOut] = None


class PlayerWithStats(PlayerOut):
    stats: List["PlayerStatsOut"] = []

    class Config:
        from_attributes = True


# Update forward references
PlayerOut.model_rebuild()

# Avoid circular imports
from schemas.player_stats import PlayerStatsOut
PlayerWithStats.model_rebuild()