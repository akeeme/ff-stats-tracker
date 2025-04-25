from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from sqlalchemy import and_

from database.database import get_db
from models.player import Player
from models.team import Team
from schemas.players import PlayerCreate, PlayerOut, PlayerUpdate, PlayerResponse
from schemas.teams import TeamOut

router = APIRouter(
    prefix="/players",
    tags=["players"]
)

@router.post("/", response_model=PlayerResponse)
def create_player(player: PlayerCreate, db: Session = Depends(get_db)):
    # First find or create the team
    team = db.query(Team).filter(Team.name == player.team_name).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Create new player
    db_player = Player(name=player.name, team_id=team.id)
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    
    # Create response with team information
    player_data = PlayerOut(
        id=db_player.id,
        name=db_player.name,
        team_id=team.id,
        team_name=team.name
    )
    
    return PlayerResponse(
        success=True,
        data=player_data,
        message="Player created successfully"
    )

@router.get("/", response_model=List[PlayerOut])
def get_players(skip: int = 0, limit: int = 100, include_deleted: bool = False, db: Session = Depends(get_db)):
    query = db.query(Player)
    if not include_deleted:
        query = query.filter(Player.is_deleted == False)
    players = query.offset(skip).limit(limit).all()
    return [PlayerOut.model_validate(player) for player in players]

@router.get("/{player_id}", response_model=PlayerResponse)
def get_player(player_id: int, include_deleted: bool = False, db: Session = Depends(get_db)):
    query = db.query(Player).filter(Player.id == player_id)
    if not include_deleted:
        query = query.filter(Player.is_deleted == False)
    player = query.first()
    
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    return PlayerResponse(
        success=True,
        data=PlayerOut.model_validate(player)
    )

@router.put("/{player_id}", response_model=PlayerResponse)
def update_player(player_id: int, player_update: PlayerUpdate, version: int, db: Session = Depends(get_db)):
    db_player = db.query(Player).filter(
        and_(
            Player.id == player_id,
            Player.is_deleted == False
        )
    ).first()
    
    if not db_player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Check version for optimistic locking
    if db_player.version != version:
        raise HTTPException(status_code=409, detail="Record has been modified. Please refresh and try again.")
    
    # Increment version
    db_player.version += 1
    
    # Update fields
    update_data = player_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_player, key, value)
    
    db.commit()
    db.refresh(db_player)
    
    # Create response with team information
    player_data = PlayerOut(
        id=db_player.id,
        name=db_player.name,
        team_id=db_player.team_id,
        team_name=db_player.team.name
    )
    
    return PlayerResponse(
        success=True,
        data=player_data,
        message="Player updated successfully"
    )

@router.delete("/{player_id}", response_model=PlayerResponse)
def delete_player(player_id: int, version: int, db: Session = Depends(get_db)):
    db_player = db.query(Player).filter(
        and_(
            Player.id == player_id,
            Player.is_deleted == False
        )
    ).first()
    
    if not db_player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Check version for optimistic locking
    if db_player.version != version:
        raise HTTPException(status_code=409, detail="Record has been modified. Please refresh and try again.")
    
    # Soft delete
    db_player.is_deleted = True
    db_player.deleted_at = datetime.utcnow()
    db_player.version += 1
    
    db.commit()
    db.refresh(db_player)
    
    return PlayerResponse(
        success=True,
        message="Player deleted successfully"
    )
