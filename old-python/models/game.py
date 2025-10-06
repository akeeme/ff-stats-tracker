from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from models.base_model import BaseModel


class Game(BaseModel):
    __tablename__ = "games"
    id = Column(Integer, primary_key=True, index=True, nullable=False, autoincrement=True)
    week = Column(Integer)
    league = Column(String)
    season = Column(Integer)
    team1_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    team1_score = Column(Integer, default=0)
    team2_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    team2_score = Column(Integer, default=0)
    winning_team_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    completed = Column(Boolean, default=False)
    
    # Define relationships
    team1 = relationship("Team", foreign_keys=[team1_id])
    team2 = relationship("Team", foreign_keys=[team2_id])
    winning_team = relationship("Team", foreign_keys=[winning_team_id])
    stats = relationship("PlayerStats", back_populates="game", cascade="all, delete-orphan")