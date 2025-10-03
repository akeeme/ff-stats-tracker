from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from sqlalchemy import and_

from database.database import get_db
from models.player_stats import PlayerStats
from models.player import Player
from models.game import Game
from models.team import Team
from schemas.player_stats import PlayerStatsCreate, PlayerStatsOut, PlayerStatsUpdate, PlayerStatsResponse

router = APIRouter(
    prefix="/stats",
    tags=["stats"]
)

@router.post("/", response_model=PlayerStatsResponse)
def create_stats(stats: PlayerStatsCreate, db: Session = Depends(get_db)):
    try:
        # Find the player
        player = db.query(Player).filter(Player.name == stats.player_name).first()
        if not player:
            raise HTTPException(status_code=404, detail=f"Player '{stats.player_name}' not found")
            
        # Find the game
        game = db.query(Game).filter(
            and_(
                Game.week == stats.game_week,
                Game.season == stats.game_season,
                Game.league == stats.league,
                Game.team1.has(Team.name == stats.team1_name),
                Game.team2.has(Team.name == stats.team2_name)
            )
        ).first()
        
        if not game:
            raise HTTPException(
                status_code=404, 
                detail=f"Game not found for week {stats.game_week}, season {stats.game_season}, league {stats.league} between {stats.team1_name} and {stats.team2_name}"
            )
        
        # Create stats
        db_stats = PlayerStats(
            player_id=player.id,
            game_id=game.id,
            passing_tds=stats.passing_tds,
            passes_completed=stats.passes_completed,
            passes_attempted=stats.passes_attempted,
            interceptions_thrown=stats.interceptions_thrown,
            receptions=stats.receptions,
            targets=stats.targets,
            receiving_tds=stats.receiving_tds,
            drops=stats.drops,
            first_downs=stats.first_downs,
            rushing_tds=stats.rushing_tds,
            rush_attempts=stats.rush_attempts,
            flag_pulls=stats.flag_pulls,
            interceptions=stats.interceptions,
            pass_breakups=stats.pass_breakups,
            def_td=stats.def_td
        )
        
        try:
            db.add(db_stats)
            db.commit()
            db.refresh(db_stats)
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to create stats: {str(e)}")
        
        # Create response
        stats_data = PlayerStatsOut(
            id=db_stats.id,
            player_id=player.id,
            player_name=player.name,
            game_id=game.id,
            game_week=game.week,
            game_season=game.season,
            league=game.league,
            team1_name=game.team1.name,
            team2_name=game.team2.name,
            passing_tds=db_stats.passing_tds,
            passes_completed=db_stats.passes_completed,
            passes_attempted=db_stats.passes_attempted,
            interceptions_thrown=db_stats.interceptions_thrown,
            receptions=db_stats.receptions,
            targets=db_stats.targets,
            receiving_tds=db_stats.receiving_tds,
            drops=db_stats.drops,
            first_downs=db_stats.first_downs,
            rushing_tds=db_stats.rushing_tds,
            rush_attempts=db_stats.rush_attempts,
            flag_pulls=db_stats.flag_pulls,
            interceptions=db_stats.interceptions,
            pass_breakups=db_stats.pass_breakups,
            def_td=db_stats.def_td,
            version=db_stats.version,
            created_at=db_stats.created_at,
            updated_at=db_stats.updated_at,
            is_deleted=db_stats.is_deleted,
            deleted_at=db_stats.deleted_at
        )
        
        return PlayerStatsResponse(
            success=True,
            data=stats_data,
            message="Stats created successfully"
        )
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@router.get("/", response_model=List[PlayerStatsOut])
def get_stats(skip: int = 0, limit: int = 100, include_deleted: bool = False, db: Session = Depends(get_db)):
    query = db.query(PlayerStats)
    if not include_deleted:
        query = query.filter(PlayerStats.is_deleted == False)
    stats = query.offset(skip).limit(limit).all()
    return [PlayerStatsOut.model_validate(stat) for stat in stats]

@router.get("/{stats_id}", response_model=PlayerStatsResponse)
def get_stat(stats_id: int, include_deleted: bool = False, db: Session = Depends(get_db)):
    query = db.query(PlayerStats).filter(PlayerStats.id == stats_id)
    if not include_deleted:
        query = query.filter(PlayerStats.is_deleted == False)
    stats = query.first()
    
    if not stats:
        raise HTTPException(status_code=404, detail="Stats not found")
    
    return PlayerStatsResponse(
        success=True,
        data=PlayerStatsOut.model_validate(stats)
    )

@router.put("/{stats_id}", response_model=PlayerStatsResponse)
def update_stats(stats_id: int, stats_update: PlayerStatsUpdate, version: int, db: Session = Depends(get_db)):
    db_stats = db.query(PlayerStats).filter(
        and_(
            PlayerStats.id == stats_id,
            PlayerStats.is_deleted == False
        )
    ).first()
    
    if not db_stats:
        raise HTTPException(status_code=404, detail="Stats not found")
    
    # Check version for optimistic locking
    if db_stats.version != version:
        raise HTTPException(status_code=409, detail="Record has been modified. Please refresh and try again.")
    
    # Increment version
    db_stats.version += 1
    
    # Update fields
    update_data = stats_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_stats, key, value)
    
    db.commit()
    db.refresh(db_stats)
    
    return PlayerStatsResponse(
        success=True,
        data=PlayerStatsOut.model_validate(db_stats),
        message="Stats updated successfully"
    )

@router.delete("/{stats_id}", response_model=PlayerStatsResponse)
def delete_stats(stats_id: int, version: int, db: Session = Depends(get_db)):
    db_stats = db.query(PlayerStats).filter(
        and_(
            PlayerStats.id == stats_id,
            PlayerStats.is_deleted == False
        )
    ).first()
    
    if not db_stats:
        raise HTTPException(status_code=404, detail="Stats not found")
    
    # Check version for optimistic locking
    if db_stats.version != version:
        raise HTTPException(status_code=409, detail="Record has been modified. Please refresh and try again.")
    
    # Soft delete
    db_stats.is_deleted = True
    db_stats.deleted_at = datetime.utcnow()
    db_stats.version += 1
    
    db.commit()
    db.refresh(db_stats)
    
    return PlayerStatsResponse(
        success=True,
        message="Stats deleted successfully"
    ) 