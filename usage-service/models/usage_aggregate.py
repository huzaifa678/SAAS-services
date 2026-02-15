from sqlalchemy import Column, String, Numeric, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import UUID
from . import Base

class UsageAggregate(Base):
    __tablename__ = "usage_aggregates"

    customer_id = Column(UUID(as_uuid=True), primary_key=True)
    metric = Column(String(64), primary_key=True)
    daily_total = Column(Numeric(19,4), nullable=False, default=0)
    monthly_total = Column(Numeric(19,4), nullable=False, default=0)
    rolling_avg = Column(Numeric(19,4), nullable=False, default=0)
    last_updated = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
