import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Boolean, Integer, Float, DateTime, ForeignKey, Text, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.enums import UserRole, CounterStatus, QueueStatus

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.USER.value, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    memberships = relationship("OrganizationMembership", back_populates="user", cascade="all, delete-orphan")
    queue_sessions = relationship("QueueSession", back_populates="user")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship("UserFavorite", back_populates="user", cascade="all, delete-orphan")

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(150), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    memberships = relationship("OrganizationMembership", back_populates="organization", cascade="all, delete-orphan")
    locations = relationship("Location", back_populates="organization", cascade="all, delete-orphan")

class OrganizationMembership(Base):
    __tablename__ = "organization_memberships"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), default=UserRole.LOCATION_ADMIN.value, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("organization_id", "user_id", name="uq_org_user_membership"),
    )

    organization = relationship("Organization", back_populates="memberships")
    user = relationship("User", back_populates="memberships")

class Location(Base):
    __tablename__ = "locations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(150), nullable=False)
    slug = Column(String(100), index=True, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)  # cafeteria, library, service_counter, event, clinic, food_court
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    image_url = Column(String(500), nullable=True)
    opening_hours = Column(String(100), default="08:00 AM - 09:00 PM", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Thresholds for crowd levels
    low_threshold = Column(Integer, default=15, nullable=False)
    mod_threshold = Column(Integer, default=35, nullable=False)
    crowd_capacity = Column(Integer, default=100, nullable=False)
    
    created_at = Column(DateTime, default=utc_now, nullable=False)

    organization = relationship("Organization", back_populates="locations")
    counters = relationship("ServiceCounter", back_populates="location", cascade="all, delete-orphan")
    queue_sessions = relationship("QueueSession", back_populates="location")
    crowd_observations = relationship("CrowdObservation", back_populates="location", cascade="all, delete-orphan")
    favorites = relationship("UserFavorite", back_populates="location", cascade="all, delete-orphan")

class ServiceCounter(Base):
    __tablename__ = "service_counters"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    location_id = Column(String(36), ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    code = Column(String(20), nullable=False)  # e.g., 'A', 'B', 'EXP'
    status = Column(String(20), default=CounterStatus.OPEN.value, nullable=False)
    average_service_seconds = Column(Integer, default=180, nullable=False)  # 3 minutes default
    queue_capacity = Column(Integer, default=50, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    location = relationship("Location", back_populates="counters")
    queue_sessions = relationship("QueueSession", back_populates="counter", cascade="all, delete-orphan")
    service_observations = relationship("ServiceObservation", back_populates="counter", cascade="all, delete-orphan")

class QueueSession(Base):
    __tablename__ = "queue_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    counter_id = Column(String(36), ForeignKey("service_counters.id", ondelete="CASCADE"), nullable=False)
    location_id = Column(String(36), ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    
    ticket_number = Column(String(30), nullable=False)  # e.g., 'CAF-A-042'
    sequence_number = Column(Integer, nullable=False)
    status = Column(String(30), default=QueueStatus.WAITING.value, index=True, nullable=False)
    
    joined_at = Column(DateTime, default=utc_now, nullable=False)
    called_at = Column(DateTime, nullable=True)
    service_started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    cancellation_reason = Column(String(255), nullable=True)
    
    estimated_wait_seconds = Column(Integer, nullable=True)
    actual_wait_seconds = Column(Integer, nullable=True)
    actual_service_seconds = Column(Integer, nullable=True)

    __table_args__ = (
        Index("idx_counter_status", "counter_id", "status"),
        Index("idx_user_status", "user_id", "status"),
    )

    user = relationship("User", back_populates="queue_sessions")
    counter = relationship("ServiceCounter", back_populates="queue_sessions")
    location = relationship("Location", back_populates="queue_sessions")
    events = relationship("QueueEvent", back_populates="queue_session", cascade="all, delete-orphan")

class QueueEvent(Base):
    __tablename__ = "queue_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    queue_session_id = Column(String(36), ForeignKey("queue_sessions.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(50), nullable=False)
    payload = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    queue_session = relationship("QueueSession", back_populates="events")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    related_queue_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    __table_args__ = (
        Index("idx_notif_user_read", "user_id", "is_read"),
    )

    user = relationship("User", back_populates="notifications")

class CrowdObservation(Base):
    __tablename__ = "crowd_observations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    location_id = Column(String(36), ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    observed_count = Column(Integer, nullable=False)
    source = Column(String(50), default="QUEUE_INFERRED", nullable=False)
    observed_at = Column(DateTime, default=utc_now, nullable=False)

    __table_args__ = (
        Index("idx_crowd_loc_time", "location_id", "observed_at"),
    )

    location = relationship("Location", back_populates="crowd_observations")

class ServiceObservation(Base):
    __tablename__ = "service_observations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    counter_id = Column(String(36), ForeignKey("service_counters.id", ondelete="CASCADE"), nullable=False)
    queue_session_id = Column(String(36), nullable=False)
    service_duration_seconds = Column(Integer, nullable=False)
    recorded_at = Column(DateTime, default=utc_now, nullable=False)

    __table_args__ = (
        Index("idx_serv_counter_time", "counter_id", "recorded_at"),
    )

    counter = relationship("ServiceCounter", back_populates="service_observations")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), nullable=True)
    actor_user_id = Column(String(36), nullable=True)
    action = Column(String(100), nullable=False)
    target_type = Column(String(50), nullable=False)
    target_id = Column(String(36), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    __table_args__ = (
        Index("idx_audit_org_time", "organization_id", "created_at"),
    )

class UserFavorite(Base):
    __tablename__ = "user_favorites"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    location_id = Column(String(36), ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "location_id", name="uq_user_favorite_location"),
    )

    user = relationship("User", back_populates="favorites")
    location = relationship("Location", back_populates="favorites")
