from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from .teams import TeamOut
from .base import BaseResponse, BaseModelSchema

# creating new game via api

class GameCreate(BaseModel):
    week: int
    league: str
    season: int
    team1_name: str
    team1_score: int = 0
    team2_name: str
    team2_score: int = 0
    winning_team_name: Optional[str] = None


# fetching existing games (from db) (e.g. GET /players)

class GameOut(BaseModelSchema):
    id: int
    week: int
    league: str
    season: int
    team1_id: int
    team1_name: str
    team1_score: int
    team2_id: int
    team2_name: str
    team2_score: int
    winning_team_id: Optional[int] = None
    winning_team_name: Optional[str] = None
    completed: bool = False
    
    model_config = ConfigDict(from_attributes=True)
        
class GameUpdate(BaseModel):
    week: Optional[int] = None
    league: Optional[str] = None
    season: Optional[int] = None
    team1_name: Optional[str] = None
    team1_score: Optional[int] = None
    team2_name: Optional[str] = None
    team2_score: Optional[int] = None
    winning_team_name: Optional[str] = None
    


class GameResponse(BaseResponse):
    data: Optional[GameOut] = None
