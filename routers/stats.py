from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from sqlalchemy import and_

from database.database import get_db
from models.player_stats import PlayerStats
from schemas.player_stats import StatsCreate, StatsOut, StatsUpdate, StatsResponse

router = APIRouter(
    prefix="/stats",
    tags=["stats"]
)

@router.post("/", response_model=StatsResponse)
def create_stats(stats: StatsCreate, db: Session = Depends(get_db)):
    db_stats = PlayerStats(
        player_id=stats.player_id,
        game_id=stats.game_id,
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
    db.add(db_stats)
    db.commit()
    db.refresh(db_stats)
    
    return StatsResponse(
        success=True,
        data=StatsOut.model_validate(db_stats),
        message="Stats created successfully"
    )

@router.get("/", response_model=List[StatsOut])
def get_stats(skip: int = 0, limit: int = 100, include_deleted: bool = False, db: Session = Depends(get_db)):
    query = db.query(PlayerStats)
    if not include_deleted:
        query = query.filter(PlayerStats.is_deleted == False)
    stats = query.offset(skip).limit(limit).all()
    return [StatsOut.model_validate(stat) for stat in stats]

@router.get("/{stats_id}", response_model=StatsResponse)
def get_stat(stats_id: int, include_deleted: bool = False, db: Session = Depends(get_db)):
    query = db.query(PlayerStats).filter(PlayerStats.id == stats_id)
    if not include_deleted:
        query = query.filter(PlayerStats.is_deleted == False)
    stats = query.first()
    
    if not stats:
        raise HTTPException(status_code=404, detail="Stats not found")
    
    return StatsResponse(
        success=True,
        data=StatsOut.model_validate(stats)
    )

@router.put("/{stats_id}", response_model=StatsResponse)
def update_stats(stats_id: int, stats_update: StatsUpdate, version: int, db: Session = Depends(get_db)):
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
    
    return StatsResponse(
        success=True,
        data=StatsOut.model_validate(db_stats),
        message="Stats updated successfully"
    )

@router.delete("/{stats_id}", response_model=StatsResponse)
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
    
    return StatsResponse(
        success=True,
        message="Stats deleted successfully"
    ) 