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
from schemas.player_stats import PlayerStatsCreate, PlayerStatsOut, PlayerStatsUpdate, PlayerStatsResponse, PlayerStatsCreateById

router = APIRouter(
    prefix="/stats",
    tags=["stats"]
)

@router.post("/", response_model=PlayerStatsResponse)
def create_stats_by_id(stats: PlayerStatsCreateById, db: Session = Depends(get_db)):
    try:
        # Find the game first to get the season
        game = db.query(Game).filter(Game.id == stats.game_id).first()
        if not game:
            raise HTTPException(status_code=404, detail=f"Game with id '{stats.game_id}' not found")
            
        # Prevent stat edits if game is completed
        if game.completed:
            raise HTTPException(status_code=403, detail="Cannot edit stats for a completed game.")
            
        # Find the player matching both ID and season
        player = db.query(Player).filter(
            and_(
                Player.id == stats.player_id,
                Player.season == game.season
            )
        ).first()
        
        # If not found, try to find any active player with the same name in the current season
        if not player:
            # First get the original player to get their name
            original_player = db.query(Player).filter(Player.id == stats.player_id).first()
            if not original_player:
                raise HTTPException(status_code=404, detail=f"Player with id '{stats.player_id}' not found")
                
            # Try to find the current season's version of this player
            current_player = db.query(Player).filter(
                and_(
                    Player.name == original_player.name,
                    Player.season == game.season,
                    Player.is_active == True,
                    Player.is_deleted == False
                )
            ).first()
            
            if current_player:
                player = current_player
            else:
                raise HTTPException(
                    status_code=404, 
                    detail=f"No active player record found for '{original_player.name}' in season {game.season}"
                )
        
        # Check if PlayerStats already exists for this player and game
        db_stats = db.query(PlayerStats).filter(
            PlayerStats.player_id == player.id,
            PlayerStats.game_id == game.id,
            PlayerStats.is_deleted == False
        ).first()
        
        if db_stats:
            # Only update fields present in the request
            update_data = stats.dict(exclude_unset=True)
            for key, value in update_data.items():
                if key not in ['player_id', 'game_id']:
                    setattr(db_stats, key, value)
            db_stats.version += 1
            db.commit()
            db.refresh(db_stats)
        else:
            # Create new stats row
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
                def_td=stats.def_td,
                sacks=stats.sacks
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
            qb_rushing_tds=db_stats.qb_rushing_tds,
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
            sacks=db_stats.sacks,
            version=db_stats.version,
            created_at=db_stats.created_at,
            updated_at=db_stats.updated_at,
            is_deleted=db_stats.is_deleted,
            deleted_at=db_stats.deleted_at
        )
        
        return PlayerStatsResponse(
            success=True,
            data=stats_data,
            message="Stats updated successfully" if db_stats else "Stats created successfully"
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
    # Manually construct PlayerStatsOut for each stat
    return [
        PlayerStatsOut(
            id=stat.id,
            player_id=stat.player_id,
            player_name=stat.player.name if stat.player else "",
            game_id=stat.game_id,
            game_week=stat.game.week if stat.game else 0,
            game_season=stat.game.season if stat.game else 0,
            league=stat.game.league if stat.game else "",
            team1_name=stat.game.team1.name if stat.game and stat.game.team1 else "",
            team2_name=stat.game.team2.name if stat.game and stat.game.team2 else "",
            passing_tds=stat.passing_tds,
            passes_completed=stat.passes_completed,
            passes_attempted=stat.passes_attempted,
            interceptions_thrown=stat.interceptions_thrown,
            receptions=stat.receptions,
            targets=stat.targets,
            receiving_tds=stat.receiving_tds,
            drops=stat.drops,
            first_downs=stat.first_downs,
            rushing_tds=stat.rushing_tds,
            rush_attempts=stat.rush_attempts,
            flag_pulls=stat.flag_pulls,
            interceptions=stat.interceptions,
            pass_breakups=stat.pass_breakups,
            def_td=stat.def_td,
            sacks=stat.sacks,
            version=stat.version,
            created_at=stat.created_at,
            updated_at=stat.updated_at,
            is_deleted=stat.is_deleted,
            deleted_at=stat.deleted_at
        )
        for stat in stats
    ]

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
        if key not in ['player_id', 'game_id']:
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

@router.get("/by_player_game/", response_model=PlayerStatsOut)
def get_stats_by_player_game(
    player_id: int,
    game_id: int,
    db: Session = Depends(get_db)
):
    stats = db.query(PlayerStats).filter(
        PlayerStats.player_id == player_id,
        PlayerStats.game_id == game_id,
        PlayerStats.is_deleted == False
    ).first()
    if not stats:
        raise HTTPException(status_code=404, detail="Stats not found")
    # Populate extra fields from relationships
    return PlayerStatsOut(
        id=stats.id,
        player_id=stats.player_id,
        player_name=stats.player.name if stats.player else "",
        game_id=stats.game_id,
        game_week=stats.game.week if stats.game else 0,
        game_season=stats.game.season if stats.game else 0,
        league=stats.game.league if stats.game else "",
        team1_name=stats.game.team1.name if stats.game and stats.game.team1 else "",
        team2_name=stats.game.team2.name if stats.game and stats.game.team2 else "",
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
        def_td=stats.def_td,
        sacks=stats.sacks,
        version=stats.version,
        created_at=stats.created_at,
        updated_at=stats.updated_at,
        is_deleted=stats.is_deleted,
        deleted_at=stats.deleted_at
    )

@router.get("/batch/", response_model=List[PlayerStatsOut])
def get_stats_batch(
    week: int = None,
    season: int = None,
    game_id: int = None,
    db: Session = Depends(get_db)
):
    # At least one filter must be provided
    if week is None and season is None and game_id is None:
        raise HTTPException(status_code=400, detail="At least one of week, season, or game_id must be provided.")
    query = db.query(PlayerStats)
    if game_id is not None:
        query = query.filter(PlayerStats.game_id == game_id)
    if week is not None:
        query = query.join(PlayerStats.game).filter(Game.week == week)
    if season is not None:
        query = query.join(PlayerStats.game).filter(Game.season == season)
    query = query.filter(PlayerStats.is_deleted == False)
    stats = query.all()
    # Manually construct PlayerStatsOut for each stat
    return [
        PlayerStatsOut(
            id=stat.id,
            player_id=stat.player_id,
            player_name=stat.player.name if stat.player else "",
            game_id=stat.game_id,
            game_week=stat.game.week if stat.game else 0,
            game_season=stat.game.season if stat.game else 0,
            league=stat.game.league if stat.game else "",
            team1_name=stat.game.team1.name if stat.game and stat.game.team1 else "",
            team2_name=stat.game.team2.name if stat.game and stat.game.team2 else "",
            passing_tds=stat.passing_tds,
            passes_completed=stat.passes_completed,
            passes_attempted=stat.passes_attempted,
            interceptions_thrown=stat.interceptions_thrown,
            qb_rushing_tds=stat.qb_rushing_tds,
            receptions=stat.receptions,
            targets=stat.targets,
            receiving_tds=stat.receiving_tds,
            drops=stat.drops,
            first_downs=stat.first_downs,
            rushing_tds=stat.rushing_tds,
            rush_attempts=stat.rush_attempts,
            flag_pulls=stat.flag_pulls,
            interceptions=stat.interceptions,
            pass_breakups=stat.pass_breakups,
            def_td=stat.def_td,
            sacks=stat.sacks,
            version=stat.version,
            created_at=stat.created_at,
            updated_at=stat.updated_at,
            is_deleted=stat.is_deleted,
            deleted_at=stat.deleted_at
        )
        for stat in stats
    ] 