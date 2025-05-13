from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime
from sqlalchemy import and_, or_

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
    try:
        # Find teams by name
        team1 = db.query(Team).filter(Team.name == game.team1_name).first()
        team2 = db.query(Team).filter(Team.name == game.team2_name).first()
        
        if not team1:
            raise HTTPException(status_code=404, detail=f"Team '{game.team1_name}' not found")
        if not team2:
            raise HTTPException(status_code=404, detail=f"Team '{game.team2_name}' not found")
            
        # Check if either team already has a game in this week
        existing_game = db.query(Game).filter(
            and_(
                Game.season == game.season,
                Game.week == game.week,
                Game.is_deleted == False,
                or_(
                    Game.team1_id == team1.id,
                    Game.team1_id == team2.id,
                    Game.team2_id == team1.id,
                    Game.team2_id == team2.id
                )
            )
        ).first()
        
        if existing_game:
            # Determine which team(s) already have a game
            teams_with_games = []
            if existing_game.team1_id in [team1.id, team2.id]:
                teams_with_games.append(team1.name if existing_game.team1_id == team1.id else team2.name)
            if existing_game.team2_id in [team1.id, team2.id]:
                teams_with_games.append(team1.name if existing_game.team2_id == team1.id else team2.name)
            
            teams_str = " and ".join(teams_with_games)
            raise HTTPException(
                status_code=400,
                detail=f"{teams_str} already {'has' if len(teams_with_games) == 1 else 'have'} a game in week {game.week}"
            )
        
        # Determine winning team
        winning_team = None
        if game.winning_team_name:
            if game.winning_team_name == game.team1_name:
                winning_team = team1
            elif game.winning_team_name == game.team2_name:
                winning_team = team2
            else:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Winning team '{game.winning_team_name}' must be either '{game.team1_name}' or '{game.team2_name}'"
                )
            
            # Validate winning team matches the score
            if winning_team == team1 and game.team1_score <= game.team2_score:
                raise HTTPException(status_code=400, detail="Winning team score must be higher than losing team score")
            if winning_team == team2 and game.team2_score <= game.team1_score:
                raise HTTPException(status_code=400, detail="Winning team score must be higher than losing team score")
        
        # Create game
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
        
        try:
            db.add(db_game)
            db.commit()
            db.refresh(db_game)
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to create game: {str(e)}")
        
        # Create response
        game_data = GameOut(
            id=db_game.id,
            week=db_game.week,
            league=db_game.league,
            season=db_game.season,
            team1_id=team1.id,
            team1_name=team1.name,
            team1_score=db_game.team1_score,
            team2_id=team2.id,
            team2_name=team2.name,
            team2_score=db_game.team2_score,
            winning_team_id=winning_team.id if winning_team else None,
            winning_team_name=winning_team.name if winning_team else None,
            version=db_game.version,
            created_at=db_game.created_at,
            updated_at=db_game.updated_at,
            is_deleted=db_game.is_deleted,
            deleted_at=db_game.deleted_at
        )
        
        return GameResponse(
            success=True,
            data=game_data,
            message="Game created successfully"
        )
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@router.get("/", response_model=List[GameOut])
def get_games(skip: int = 0, limit: int = 100, include_deleted: bool = False, db: Session = Depends(get_db)):
    query = db.query(Game)
    if not include_deleted:
        query = query.filter(Game.is_deleted == False)
    games = query.options(
        joinedload(Game.team1),
        joinedload(Game.team2),
        joinedload(Game.winning_team)
    ).offset(skip).limit(limit).all()
    
    # Create response with all required fields
    return [
        GameOut(
            id=game.id,
            week=game.week,
            league=game.league,
            season=game.season,
            team1_id=game.team1_id,
            team1_name=game.team1.name if game.team1 else None,
            team1_score=game.team1_score,
            team2_id=game.team2_id,
            team2_name=game.team2.name if game.team2 else None,
            team2_score=game.team2_score,
            winning_team_id=game.winning_team_id,
            winning_team_name=game.winning_team.name if game.winning_team else None,
            completed=game.completed,
            version=game.version,
            created_at=game.created_at,
            updated_at=game.updated_at,
            is_deleted=game.is_deleted,
            deleted_at=game.deleted_at
        ) for game in games
    ]

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

@router.put("/{game_id}/complete")
def mark_game_complete(game_id: int, db: Session = Depends(get_db)):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    game.completed = True
    db.commit()
    return {"success": True, "message": "Game marked as complete"} 