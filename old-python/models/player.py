from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from models.base_model import BaseModel


class Player(BaseModel):
    __tablename__ = "players"
    id = Column(Integer, primary_key=True, index=True, nullable=False, autoincrement=True)
    name = Column(String, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"))
    season = Column(Integer, index=True)  # Track which season this roster entry is for
    is_active = Column(Boolean, default=True)  # Track if player is currently active
    jersey_number = Column(String, nullable=True)  # Optional jersey number
    
    # Define relationships
    team = relationship("Team", back_populates="players")
    stats = relationship("PlayerStats", back_populates="player", cascade="all, delete-orphan")

    @property
    def display_name(self):
        """Return a formatted display name including jersey number if available"""
        if self.jersey_number:
            return f"#{self.jersey_number} {self.name}"
        return self.name

