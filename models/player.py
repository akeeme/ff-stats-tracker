from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from models.base_model import BaseModel


class Player(BaseModel):
    __tablename__ = "players"
    id = Column(Integer, primary_key=True, index=True, nullable=False, autoincrement=True)
    name = Column(String, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"))
    
    # Define relationships
    team = relationship("Team", back_populates="players")
    stats = relationship("PlayerStats", back_populates="player", cascade="all, delete-orphan")

