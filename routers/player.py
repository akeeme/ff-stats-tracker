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
    try:
        # First find the team by name
        team = db.query(Team).filter(Team.name == player.team_name).first()
        if not team:
            raise HTTPException(status_code=404, detail=f"Team '{player.team_name}' not found")
        
        # Create new player
        now = datetime.utcnow()
        db_player = Player(
            name=player.name,
            team_id=team.id,
            season=player.season,
            is_active=player.is_active,
            jersey_number=player.jersey_number,
            version=1,
            is_deleted=False,
            created_at=now,
            updated_at=now
        )
        
        # Prepare the response data to validate it before committing
        display_name = f"#{db_player.jersey_number} {db_player.name}" if db_player.jersey_number else db_player.name
        try:
            player_data = PlayerOut(
                id=0,  # Temporary ID since we haven't committed yet
                name=db_player.name,
                team_id=team.id,
                team_name=team.name,
                season=db_player.season,
                display_name=display_name,
                is_active=db_player.is_active,
                jersey_number=db_player.jersey_number,
                version=db_player.version,
                created_at=db_player.created_at,
                updated_at=db_player.updated_at,
                is_deleted=db_player.is_deleted,
                deleted_at=db_player.deleted_at
            )
        except Exception as e:
            # If we can't create a valid response, don't add to database
            raise HTTPException(status_code=422, detail=f"Invalid player data: {str(e)}")
        
        # Only add to database if we can create a valid response
        db.add(db_player)
        try:
            db.commit()
            db.refresh(db_player)
            
            # Update the response with the real ID
            player_data.id = db_player.id
            
            return PlayerResponse(
                success=True,
                data=player_data,
                message="Player created successfully"
            )
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to create player: {str(e)}")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@router.get("/", response_model=List[PlayerOut])
def get_players(skip: int = 0, limit: int = 100, include_deleted: bool = False, db: Session = Depends(get_db)):
    query = db.query(Player)
    if not include_deleted:
        query = query.filter(Player.is_deleted == False)
    players = query.offset(skip).limit(limit).all()
    
    # Create response with all required fields
    return [
        PlayerOut(
            id=player.id,
            name=player.name,
            team_id=player.team_id,
            team_name=player.team.name if player.team else None,
            season=player.season,
            display_name=f"#{player.jersey_number} {player.name}" if player.jersey_number else player.name,
            is_active=player.is_active,
            jersey_number=player.jersey_number,
            version=player.version,
            created_at=player.created_at,
            updated_at=player.updated_at,
            is_deleted=player.is_deleted,
            deleted_at=player.deleted_at
        ) for player in players
    ]

@router.get("/{player_id}", response_model=PlayerResponse)
def get_player(player_id: int, include_deleted: bool = False, db: Session = Depends(get_db)):
    query = db.query(Player).filter(Player.id == player_id)
    if not include_deleted:
        query = query.filter(Player.is_deleted == False)
    player = query.first()
    
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Create response with all required fields
    player_data = PlayerOut(
        id=player.id,
        name=player.name,
        team_id=player.team_id,
        team_name=player.team.name if player.team else None,
        season=player.season,
        display_name=f"#{player.jersey_number} {player.name}" if player.jersey_number else player.name,
        is_active=player.is_active,
        jersey_number=player.jersey_number,
        version=player.version,
        created_at=player.created_at,
        updated_at=player.updated_at,
        is_deleted=player.is_deleted,
        deleted_at=player.deleted_at
    )
    
    return PlayerResponse(
        success=True,
        data=player_data,
        message="Player retrieved successfully"
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
    
    # Handle team name update if provided
    update_data = player_update.model_dump(exclude_unset=True)
    if 'team_name' in update_data:
        team = db.query(Team).filter(Team.name == update_data['team_name']).first()
        if not team:
            raise HTTPException(status_code=404, detail=f"Team '{update_data['team_name']}' not found")
        update_data['team_id'] = team.id
        del update_data['team_name']
    
    # Update fields
    for key, value in update_data.items():
        setattr(db_player, key, value)
    
    db.commit()
    db.refresh(db_player)
    
    # Create response with all required fields
    player_data = PlayerOut(
        id=db_player.id,
        name=db_player.name,
        team_id=db_player.team_id,
        team_name=db_player.team.name if db_player.team else None,
        season=db_player.season,
        display_name=f"#{db_player.jersey_number} {db_player.name}" if db_player.jersey_number else db_player.name,
        is_active=db_player.is_active,
        jersey_number=db_player.jersey_number,
        version=db_player.version,
        created_at=db_player.created_at,
        updated_at=db_player.updated_at,
        is_deleted=db_player.is_deleted,
        deleted_at=db_player.deleted_at
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
