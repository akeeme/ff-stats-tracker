from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from .base import BaseResponse, BaseModelSchema

# creating new stats via api
class PlayerStatsCreate(BaseModel):
    player_name: str
    game_week: int
    game_season: int
    league: str
    team1_name: str
    team2_name: str
    
    # qb
    passing_tds: int = 0
    passes_completed: int = 0
    passes_attempted: int = 0
    interceptions_thrown: int = 0
    qb_rushing_tds: int = 0
    
    # wr
    receptions: int = 0
    targets: int = 0
    receiving_tds: int = 0
    drops: int = 0
    first_downs: int = 0
    
    # rb
    rushing_tds: int = 0
    rush_attempts: int = 0
    
    # defense
    flag_pulls: int = 0
    interceptions: int = 0
    pass_breakups: int = 0
    def_td: int = 0
    sacks: int = 0

class PlayerStatsCreateById(BaseModel):
    player_id: int
    game_id: int
    passing_tds: int = 0
    passes_completed: int = 0
    passes_attempted: int = 0
    interceptions_thrown: int = 0
    qb_rushing_tds: int = 0
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
    sacks: int = 0

# fetching existing stats (from db)
class PlayerStatsOut(BaseModelSchema):
    id: int
    player_id: int
    player_name: str
    game_id: int
    game_week: int
    game_season: int
    league: str
    team1_name: str
    team2_name: str
    
    # qb
    passing_tds: int
    passes_completed: int
    passes_attempted: int
    interceptions_thrown: int
    qb_rushing_tds: int
    
    # wr
    receptions: int
    targets: int
    receiving_tds: int
    drops: int
    first_downs: int
    
    # rb
    rushing_tds: int
    rush_attempts: int
    
    # defense
    flag_pulls: int
    interceptions: int
    pass_breakups: int
    def_td: int
    sacks: int
    
    model_config = ConfigDict(from_attributes=True)

class PlayerStatsUpdate(BaseModel):
    # qb
    passing_tds: Optional[int] = None
    passes_completed: Optional[int] = None
    passes_attempted: Optional[int] = None
    interceptions_thrown: Optional[int] = None
    qb_rushing_tds: Optional[int] = None
    
    # wr
    receptions: Optional[int] = None
    targets: Optional[int] = None
    receiving_tds: Optional[int] = None
    drops: Optional[int] = None
    first_downs: Optional[int] = None
    
    # rb
    rushing_tds: Optional[int] = None
    rush_attempts: Optional[int] = None
    
    # defense
    flag_pulls: Optional[int] = None
    interceptions: Optional[int] = None
    pass_breakups: Optional[int] = None
    def_td: Optional[int] = None
    sacks: Optional[int] = None

class PlayerStatsResponse(BaseResponse):
    data: Optional[PlayerStatsOut] = None