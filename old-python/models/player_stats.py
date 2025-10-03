from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from models.base_model import BaseModel


class PlayerStats(BaseModel):
    # general
    __tablename__ = "player_stats"
    id = Column(Integer, primary_key=True, index=True, nullable=False, autoincrement=True)
    player_id = Column(Integer, ForeignKey("players.id", ondelete="CASCADE"))
    game_id = Column(Integer, ForeignKey("games.id", ondelete="CASCADE"))

    
    # qb
    passing_tds = Column(Integer, default=0)
    passes_completed = Column(Integer, default=0)
    passes_attempted = Column(Integer, default=0)
    interceptions_thrown = Column(Integer, default=0)
    
    # wr
    receptions = Column(Integer, default=0)
    targets = Column(Integer, default=0)
    receiving_tds = Column(Integer, default=0)
    drops = Column(Integer, default=0)
    first_downs = Column(Integer, default=0)
    
    # rb
    rushing_tds = Column(Integer, default=0)
    rush_attempts = Column(Integer, default=0)
    
    # defense
    flag_pulls = Column(Integer, default=0)
    interceptions = Column(Integer, default=0)
    pass_breakups = Column(Integer, default=0)
    def_td = Column(Integer, default=0)
    
    # Define relationships
    player = relationship("Player", back_populates="stats")
    game = relationship("Game", back_populates="stats")

