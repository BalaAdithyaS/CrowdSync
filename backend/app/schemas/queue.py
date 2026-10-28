from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.enums import QueueStatus

class QueueJoinRequest(BaseModel):
    counter_id: str

class QueueLeaveRequest(BaseModel):
    reason: Optional[str] = "Left voluntarily"

class QueueSessionOut(BaseModel):
    id: str
    user_id: str
    counter_id: str
    location_id: str
    location_name: str
    counter_name: str
    counter_code: str
    ticket_number: str
    sequence_number: int
    queue_position: int
    people_ahead: int
    status: QueueStatus
    joined_at: datetime
    called_at: Optional[datetime] = None
    service_started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    
    # Intelligent estimation fields
    estimated_wait_seconds: int
    estimated_wait_range_min: int
    estimated_wait_range_max: int
    estimation_explanation: str
    is_approximate: bool = False

    class Config:
        from_attributes = True

class AdminTicketCallRequest(BaseModel):
    notes: Optional[str] = None

class AdminQueueActionRequest(BaseModel):
    reason: Optional[str] = None
