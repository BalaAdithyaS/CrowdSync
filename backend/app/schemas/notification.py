from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.enums import NotificationType

class NotificationOut(BaseModel):
    id: str
    user_id: str
    type: NotificationType
    title: str
    message: str
    is_read: bool
    related_queue_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationMarkReadRequest(BaseModel):
    notification_ids: Optional[list[str]] = None
