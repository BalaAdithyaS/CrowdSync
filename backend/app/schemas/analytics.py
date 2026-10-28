from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.schemas.location import LocationOut, CounterOut
from app.schemas.queue import QueueSessionOut
from app.models.enums import QueueStatus

class AnalyticsOverview(BaseModel):
    total_locations: int
    active_counters: int
    current_waiting: int
    avg_wait_minutes: float
    completed_today: int
    cancelled_today: int
    no_show_today: int
    longest_queue_count: int
    longest_queue_location: str
    is_demo_data: bool = False

AdminOverviewOut = AnalyticsOverview

class VolumeTrendPoint(BaseModel):
    hour: str
    volume: int
    completed: int

class WaitTimeAccuracyPoint(BaseModel):
    time_label: str
    estimated_minutes: float
    actual_minutes: float

class PeakCrowdPoint(BaseModel):
    day: str
    hour: str
    occupancy_rate: float

class CounterPerformancePoint(BaseModel):
    counter_name: str
    location_name: str
    served_count: int
    avg_service_minutes: float
    utilization_percent: float

class LocationComparisonPoint(BaseModel):
    location_name: str
    category: str
    current_waiting: int
    avg_wait_minutes: float
    crowd_status: str

class AdminQueueSessionOut(BaseModel):
    id: str
    ticket_number: str
    location_id: str
    location_name: str
    counter_id: str
    counter_name: str
    user_name: str
    user_email: str
    queue_position: int
    status: QueueStatus
    estimated_wait_seconds: int
    joined_at: datetime
    called_at: Optional[datetime] = None
    service_started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None

class AuditLogOut(BaseModel):
    id: str
    actor_user_id: Optional[str] = None
    actor_name: Optional[str] = None
    action: str
    target_type: str
    target_id: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
