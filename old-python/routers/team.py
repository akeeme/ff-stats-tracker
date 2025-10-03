from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from sqlalchemy import and_

from database.database import get_db
from models.team import Team
from schemas.teams import TeamCreate, TeamOut, TeamUpdate, TeamResponse, PlayerOut

router = APIRouter(
    prefix="/teams",
    tags=["teams"]
)

@router.post("/", response_model=TeamResponse)
def create_team(team: TeamCreate, db: Session = Depends(get_db)):
    now = datetime.utcnow()
    db_team = Team(
        name=team.name,
        season=team.season,
        league=team.league,
        wins=team.wins,
        losses=team.losses,
        ties=team.ties,
        version=1,
        is_deleted=False,
        created_at=now,
        updated_at=now
    )
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    
    return TeamResponse(
        success=True,
        data=TeamOut.model_validate(db_team),
        message="Team created successfully"
    )

@router.get("/", response_model=List[TeamOut])
def get_teams(skip: int = 0, limit: int = 100, include_deleted: bool = False, db: Session = Depends(get_db)):
    query = db.query(Team)
    if not include_deleted:
        query = query.filter(Team.is_deleted == False)
    teams = query.options(
        joinedload(Team.players)
    ).offset(skip).limit(limit).all()
    
    # Create response with proper team information for players
    return [
        TeamOut(
            id=team.id,
            name=team.name,
            season=team.season,
            league=team.league,
            wins=team.wins,
            losses=team.losses,
            ties=team.ties,
            version=team.version,
            is_deleted=team.is_deleted,
            created_at=team.created_at,
            updated_at=team.updated_at,
            deleted_at=team.deleted_at,
            display_name=f"{team.name} (Season {team.season})",
            players=[
                PlayerOut(
                    id=player.id,
                    name=player.name,
                    team_id=team.id,
                    team_name=team.name,
                    season=player.season,
                    display_name=f"#{player.jersey_number} {player.name}" if player.jersey_number else player.name,
                    is_active=player.is_active,
                    jersey_number=player.jersey_number,
                    version=player.version,
                    is_deleted=player.is_deleted,
                    created_at=player.created_at,
                    updated_at=player.updated_at,
                    deleted_at=player.deleted_at
                ) for player in team.players
            ]
        ) for team in teams
    ]

@router.get("/{team_id}", response_model=TeamResponse)
def get_team(team_id: int, include_deleted: bool = False, db: Session = Depends(get_db)):
    query = db.query(Team).filter(Team.id == team_id)
    if not include_deleted:
        query = query.filter(Team.is_deleted == False)
    team = query.options(
        joinedload(Team.players)
    ).first()
    
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team_data = TeamOut(
        id=team.id,
        name=team.name,
        season=team.season,
        league=team.league,
        wins=team.wins,
        losses=team.losses,
        ties=team.ties,
        version=team.version,
        is_deleted=team.is_deleted,
        created_at=team.created_at,
        updated_at=team.updated_at,
        deleted_at=team.deleted_at,
        players=[
            PlayerOut(
                id=player.id,
                name=player.name,
                team_id=team.id,
                team_name=team.name,
                version=player.version,
                is_deleted=player.is_deleted,
                created_at=player.created_at,
                updated_at=player.updated_at,
                deleted_at=player.deleted_at
            ) for player in team.players
        ]
    )
    
    return TeamResponse(
        success=True,
        data=team_data,
        message="Team retrieved successfully"
    )

@router.put("/{team_id}", response_model=TeamResponse)
def update_team(team_id: int, team_update: TeamUpdate, version: int, db: Session = Depends(get_db)):
    db_team = db.query(Team).filter(
        and_(
            Team.id == team_id,
            Team.is_deleted == False
        )
    ).first()
    
    if not db_team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Check version for optimistic locking
    if db_team.version != version:
        raise HTTPException(status_code=409, detail="Record has been modified. Please refresh and try again.")
    
    # Increment version
    db_team.version += 1
    
    # Update fields
    update_data = team_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_team, key, value)
    
    db.commit()
    db.refresh(db_team)
    
    return TeamResponse(
        success=True,
        data=TeamOut.model_validate(db_team),
        message="Team updated successfully"
    )

@router.delete("/{team_id}", response_model=TeamResponse)
def delete_team(team_id: int, version: int, db: Session = Depends(get_db)):
    db_team = db.query(Team).filter(
        and_(
            Team.id == team_id,
            Team.is_deleted == False
        )
    ).first()
    
    if not db_team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Check version for optimistic locking
    if db_team.version != version:
        raise HTTPException(status_code=409, detail="Record has been modified. Please refresh and try again.")
    
    # Soft delete
    db_team.is_deleted = True
    db_team.deleted_at = datetime.utcnow()
    db_team.version += 1
    
    db.commit()
    db.refresh(db_team)
    
    return TeamResponse(
        success=True,
        message="Team deleted successfully"
    )

@router.post("/teams/end-season/{season}")
def end_season(
    season: int,
    db: Session = Depends(get_db)
):
    """
    Mark all teams from the specified season as inactive.
    This should be called when transitioning to a new season.
    """
    try:
        # Get all active teams from the specified season
        teams = db.query(Team).filter(
            and_(
                Team.season == season,
                Team.is_active == 1
            )
        ).all()
        
        # Mark each team as inactive
        for team in teams:
            team.is_active = 0
        
        db.commit()
        return {
            "message": f"Successfully marked all teams from season {season} as inactive",
            "teams_updated": len(teams)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/copy-to-season")
def copy_teams_to_season(
    from_season: int,
    to_season: int,
    db: Session = Depends(get_db)
):
    """
    Copy selected teams from one season to another.
    The teams will be created as new entries with:
    - Same name and league
    - Reset records (0 wins, 0 losses, 0 ties)
    - Active status
    """
    try:
        # Get all teams from the source season
        source_teams = db.query(Team).filter(Team.season == from_season).all()
        
        # Create new teams for the target season
        new_teams = []
        now = datetime.utcnow()
        
        for old_team in source_teams:
            # Create new team with same name but reset records
            new_team = Team(
                name=old_team.name,
                season=to_season,
                league=old_team.league,
                wins=0,
                losses=0,
                ties=0,
                is_active=1,
                version=1,
                is_deleted=False,
                created_at=now,
                updated_at=now
            )
            new_teams.append(new_team)
            db.add(new_team)
        
        db.commit()
        
        return {
            "message": f"Successfully copied {len(new_teams)} teams from season {from_season} to season {to_season}",
            "teams_copied": len(new_teams)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) 