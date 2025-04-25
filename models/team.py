from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from models.base_model import BaseModel


class Team(BaseModel):
    __tablename__ = "teams"
    id = Column(Integer, primary_key=True, index=True, nullable=False, autoincrement=True)
    name = Column(String, index=True)
    season = Column(Integer)
    league = Column(String)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    ties = Column(Integer, default=0)

    # Define relationship
    players = relationship("Player", back_populates="team", cascade="all, delete-orphan")
