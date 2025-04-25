from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
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
    db_team = Team(
        name=team.name,
        season=team.season,
        league=team.league,
        wins=team.wins,
        losses=team.losses,
        ties=team.ties
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
            players=[
                PlayerOut(
                    id=player.id,
                    name=player.name,
                    team_id=team.id,
                    team_name=team.name
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
        players=[
            PlayerOut(
                id=player.id,
                name=player.name,
                team_id=team.id,
                team_name=team.name
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