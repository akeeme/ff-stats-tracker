from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from models.base_model import BaseModel


class Team(BaseModel):
    __tablename__ = "teams"
    id = Column(Integer, primary_key=True, index=True, nullable=False, autoincrement=True)
    name = Column(String, index=True)
    season = Column(Integer, index=True)
    league = Column(String)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    ties = Column(Integer, default=0)
    is_active = Column(Integer, default=1)  # To track if team is active in current season

    # Define relationship
    players = relationship("Player", back_populates="team", cascade="all, delete-orphan")

    # Add unique constraint for name, season, and league combination
    __table_args__ = (
        UniqueConstraint('name', 'season', 'league', name='unique_team_season'),
    )

    @property
    def display_name(self):
        """Return a formatted display name including the season"""
        return f"{self.name} ({self.season})"
