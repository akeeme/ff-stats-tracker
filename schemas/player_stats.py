from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from .players import PlayerOut
from .base import BaseResponse, BaseModelSchema

# creating new player via api

class StatsCreate(BaseModel):
    player_id: int
    game_id: int
    passing_tds: int = 0
    passes_completed: int = 0
    passes_attempted: int = 0
    interceptions_thrown: int = 0
    receptions: int = 0
    targets: int = 0
    receiving_tds: int = 0
    drops: int = 0
    first_downs: int = 0
    rushing_tds: int = 0
    rush_attempts: int = 0
    flag_pulls: int = 0
    interceptions: int = 0
    pass_breakups: int = 0
    def_td: int = 0

# fetching existing player (from db) (e.g. GET /players)

class StatsOut(BaseModelSchema):
    id: int
    player_id: int
    game_id: int
    passing_tds: int
    passes_completed: int
    passes_attempted: int
    interceptions_thrown: int
    receptions: int
    targets: int
    receiving_tds: int
    drops: int
    first_downs: int
    rushing_tds: int
    rush_attempts: int
    flag_pulls: int
    interceptions: int
    pass_breakups: int
    def_td: int
    
    model_config = ConfigDict(from_attributes=True)
    
    
class StatsUpdate(BaseModel):
    passing_tds: Optional[int] = None
    passes_completed: Optional[int] = None
    passes_attempted: Optional[int] = None
    interceptions_thrown: Optional[int] = None
    receptions: Optional[int] = None
    targets: Optional[int] = None
    receiving_tds: Optional[int] = None
    drops: Optional[int] = None
    first_downs: Optional[int] = None
    rushing_tds: Optional[int] = None
    rush_attempts: Optional[int] = None
    flag_pulls: Optional[int] = None
    interceptions: Optional[int] = None
    pass_breakups: Optional[int] = None
    def_td: Optional[int] = None


class StatsResponse(BaseResponse):
    data: Optional[StatsOut] = None


class PlayerStatsCreate(BaseModel):
    player_id: int
    game_id: int
    passing_tds: int
    passes_completed: int
    passes_attempted: int
    interceptions_thrown: int
    receptions: int
    targets: int
    receiving_tds: int
    drops: int
    first_downs: int
    rushing_tds: int
    rush_attempts: int
    flag_pulls: int
    interceptions: int
    pass_breakups: int
    def_td: int


class PlayerStatsOut(BaseModel):
    id: int
    player_id: int
    game_id: int
    passing_tds: int
    passes_completed: int
    passes_attempted: int
    interceptions_thrown: int
    receptions: int
    targets: int
    receiving_tds: int
    drops: int
    first_downs: int
    rushing_tds: int
    rush_attempts: int
    flag_pulls: int
    interceptions: int
    pass_breakups: int
    def_td: int
    player: PlayerOut
    
    model_config = ConfigDict(from_attributes=True)


class PlayerStatsUpdate(BaseModel):
    passing_tds: Optional[int] = None
    passes_completed: Optional[int] = None
    passes_attempted: Optional[int] = None
    interceptions_thrown: Optional[int] = None
    receptions: Optional[int] = None
    targets: Optional[int] = None
    receiving_tds: Optional[int] = None
    drops: Optional[int] = None
    first_downs: Optional[int] = None
    rushing_tds: Optional[int] = None
    rush_attempts: Optional[int] = None
    flag_pulls: Optional[int] = None
    interceptions: Optional[int] = None
    pass_breakups: Optional[int] = None
    def_td: Optional[int] = None


class PlayerStatsResponse(BaseResponse):
    data: Optional[PlayerStatsOut] = None