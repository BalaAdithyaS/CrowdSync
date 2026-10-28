from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.enums import CounterStatus, CrowdLevel

class CounterBase(BaseModel):
    name: str
    code: str
    status: CounterStatus = CounterStatus.OPEN
    average_service_seconds: int = 180
    queue_capacity: int = 50

class CounterCreate(CounterBase):
    location_id: str

class CounterUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    status: Optional[CounterStatus] = None
    average_service_seconds: Optional[int] = None
    queue_capacity: Optional[int] = None

class CounterOut(CounterBase):
    id: str
    location_id: str
    active_queue_count: int = 0
    estimated_wait_minutes: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

class LocationBase(BaseModel):
    name: str
    slug: str
    description: str
    category: str
    address: str
    latitude: float
    longitude: float
    image_url: Optional[str] = None
    opening_hours: str = "08:00 AM - 09:00 PM"
    is_active: bool = True
    low_threshold: int = 15
    mod_threshold: int = 35
    crowd_capacity: int = 100

class LocationCreate(LocationBase):
    organization_id: Optional[str] = None

class LocationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    opening_hours: Optional[str] = None
    is_active: Optional[bool] = None
    low_threshold: Optional[int] = None
    mod_threshold: Optional[int] = None
    crowd_capacity: Optional[int] = None

class LocationOut(LocationBase):
    id: str
    organization_id: str
    created_at: datetime
    crowd_status: CrowdLevel = CrowdLevel.LOW
    current_wait_minutes: int = 0
    total_waiting: int = 0
    active_counters_count: int = 0
    is_favorite: bool = False
    counters: List[CounterOut] = []

    class Config:
        from_attributes = True
