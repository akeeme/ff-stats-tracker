from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime
from sqlalchemy import and_

from database.database import get_db
from models.game import Game
from models.team import Team
from schemas.games import GameCreate, GameOut, GameUpdate, GameResponse

router = APIRouter(
    prefix="/games",
    tags=["games"]
)

@router.post("/", response_model=GameResponse)
def create_game(game: GameCreate, db: Session = Depends(get_db)):
    # Find teams by name
    team1 = db.query(Team).filter(Team.name == game.team1_name).first()
    team2 = db.query(Team).filter(Team.name == game.team2_name).first()
    winning_team = None
    if game.winning_team_name:
        winning_team = db.query(Team).filter(Team.name == game.winning_team_name).first()
    
    if not team1:
        raise HTTPException(status_code=404, detail=f"Team {game.team1_name} not found")
    if not team2:
        raise HTTPException(status_code=404, detail=f"Team {game.team2_name} not found")
    if game.winning_team_name and not winning_team:
        raise HTTPException(status_code=404, detail=f"Winning team {game.winning_team_name} not found")
    
    # Validate winning team matches the score
    if game.winning_team_name:
        if game.winning_team_name == game.team1_name and game.team1_score <= game.team2_score:
            raise HTTPException(status_code=400, detail="Winning team score must be higher than losing team score")
        if game.winning_team_name == game.team2_name and game.team2_score <= game.team1_score:
            raise HTTPException(status_code=400, detail="Winning team score must be higher than losing team score")
    
    db_game = Game(
        week=game.week,
        league=game.league,
        season=game.season,
        team1_id=team1.id,
        team2_id=team2.id,
        winning_team_id=winning_team.id if winning_team else None,
        team1_score=game.team1_score,
        team2_score=game.team2_score
    )
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    
    return GameResponse(
        success=True,
        data=GameOut.model_validate(db_game),
        message="Game created successfully"
    )

@router.get("/", response_model=List[GameOut])
def get_games(skip: int = 0, limit: int = 100, include_deleted: bool = False, db: Session = Depends(get_db)):
    query = db.query(Game)
    if not include_deleted:
        query = query.filter(Game.is_deleted == False)
    games = query.options(
        joinedload(Game.team1),
        joinedload(Game.team2),
        joinedload(Game.winning_team),
        joinedload(Game.stats)
    ).offset(skip).limit(limit).all()
    return [GameOut.model_validate(game) for game in games]

@router.get("/{game_id}", response_model=GameResponse)
def get_game(game_id: int, include_deleted: bool = False, db: Session = Depends(get_db)):
    query = db.query(Game).filter(Game.id == game_id)
    if not include_deleted:
        query = query.filter(Game.is_deleted == False)
    game = query.options(
        joinedload(Game.team1),
        joinedload(Game.team2),
        joinedload(Game.winning_team),
        joinedload(Game.stats)
    ).first()
    
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    return GameResponse(
        success=True,
        data=GameOut.model_validate(game)
    )

@router.put("/{game_id}", response_model=GameResponse)
def update_game(game_id: int, game_update: GameUpdate, version: int, db: Session = Depends(get_db)):
    db_game = db.query(Game).filter(
        and_(
            Game.id == game_id,
            Game.is_deleted == False
        )
    ).first()
    
    if not db_game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Check version for optimistic locking
    if db_game.version != version:
        raise HTTPException(status_code=409, detail="Record has been modified. Please refresh and try again.")
    
    # Increment version
    db_game.version += 1
    
    # Update fields
    update_data = game_update.model_dump(exclude_unset=True)
    
    # Handle team name updates
    if 'team1_name' in update_data:
        team1 = db.query(Team).filter(Team.name == update_data['team1_name']).first()
        if not team1:
            raise HTTPException(status_code=404, detail=f"Team {update_data['team1_name']} not found")
        update_data['team1_id'] = team1.id
        del update_data['team1_name']
    
    if 'team2_name' in update_data:
        team2 = db.query(Team).filter(Team.name == update_data['team2_name']).first()
        if not team2:
            raise HTTPException(status_code=404, detail=f"Team {update_data['team2_name']} not found")
        update_data['team2_id'] = team2.id
        del update_data['team2_name']
    
    if 'winning_team_name' in update_data:
        if update_data['winning_team_name']:
            winning_team = db.query(Team).filter(Team.name == update_data['winning_team_name']).first()
            if not winning_team:
                raise HTTPException(status_code=404, detail=f"Team {update_data['winning_team_name']} not found")
            update_data['winning_team_id'] = winning_team.id
        else:
            update_data['winning_team_id'] = None
        del update_data['winning_team_name']
    
    for key, value in update_data.items():
        setattr(db_game, key, value)
    
    db.commit()
    db.refresh(db_game)
    
    return GameResponse(
        success=True,
        data=GameOut.model_validate(db_game),
        message="Game updated successfully"
    )

@router.delete("/{game_id}", response_model=GameResponse)
def delete_game(game_id: int, version: int, db: Session = Depends(get_db)):
    db_game = db.query(Game).filter(
        and_(
            Game.id == game_id,
            Game.is_deleted == False
        )
    ).first()
    
    if not db_game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Check version for optimistic locking
    if db_game.version != version:
        raise HTTPException(status_code=409, detail="Record has been modified. Please refresh and try again.")
    
    # Soft delete
    db_game.is_deleted = True
    db_game.deleted_at = datetime.utcnow()
    db_game.version += 1
    
    db.commit()
    db.refresh(db_game)
    
    return GameResponse(
        success=True,
        message="Game deleted successfully"
    ) 