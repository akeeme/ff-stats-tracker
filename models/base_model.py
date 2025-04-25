from sqlalchemy import Column, Integer, DateTime, Boolean
from sqlalchemy.sql import func
from database.database import Base

class BaseModel(Base):
    __abstract__ = True
    
    # Optimistic locking
    version = Column(Integer, default=1, nullable=False)
    
    # Soft delete
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True) 