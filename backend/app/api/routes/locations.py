from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_

from app.core.database import get_db
from app.models.entities import Location, ServiceCounter, QueueSession, UserFavorite, User
from app.models.enums import CrowdLevel, CounterStatus, QueueStatus
from app.schemas.location import LocationOut, CounterOut
from app.api.deps import get_optional_current_user

router = APIRouter(prefix="/locations", tags=["Locations"])

WAITING_OR_APPROACHING = [QueueStatus.WAITING.value, QueueStatus.APPROACHING.value]

@router.get("", response_model=List[LocationOut])
def list_locations(
    category: Optional[str] = None,
    crowd_status: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "name",
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    query = select(Location).where(Location.is_active == True)

    if category and category != "all":
        query = query.where(Location.category == category.lower())

    if search:
        search_filter = f"%{search.lower()}%"
        query = query.where(
            or_(
                func.lower(Location.name).like(search_filter),
                func.lower(Location.category).like(search_filter),
                func.lower(Location.description).like(search_filter)
            )
        )

    locations = list(db.execute(query).scalars().all())

    user_fav_ids = set()
    if current_user and isinstance(current_user, User):
        fav_res = db.execute(
            select(UserFavorite.location_id).where(UserFavorite.user_id == current_user.id)
        )
        user_fav_ids = set(fav_res.scalars().all())

    output: List[LocationOut] = []

    for loc in locations:
        counters = list(db.execute(
            select(ServiceCounter).where(ServiceCounter.location_id == loc.id)
        ).scalars().all())

        counter_outs: List[CounterOut] = []
        total_loc_waiting = 0
        total_loc_wait_sec = 0
        active_counters_count = 0

        for c in counters:
            waiting_count = db.execute(
                select(func.count(QueueSession.id)).where(
                    QueueSession.counter_id == c.id,
                    QueueSession.status.in_(WAITING_OR_APPROACHING)
                )
            ).scalar() or 0

            if c.status == CounterStatus.OPEN.value:
                active_counters_count += 1
                total_loc_waiting += waiting_count
                total_loc_wait_sec += waiting_count * c.average_service_seconds

            est_minutes = round((waiting_count * c.average_service_seconds) / 60)

            counter_outs.append(CounterOut(
                id=c.id,
                location_id=c.location_id,
                name=c.name,
                code=c.code,
                status=c.status,
                average_service_seconds=c.average_service_seconds,
                queue_capacity=c.queue_capacity,
                active_queue_count=waiting_count,
                estimated_wait_minutes=est_minutes,
                created_at=c.created_at
            ))

        if total_loc_waiting < loc.low_threshold:
            loc_crowd = CrowdLevel.LOW
        elif total_loc_waiting < loc.mod_threshold:
            loc_crowd = CrowdLevel.MODERATE
        else:
            loc_crowd = CrowdLevel.HIGH

        if crowd_status and crowd_status.upper() != "ALL" and loc_crowd.value != crowd_status.upper():
            continue

        avg_loc_wait_min = round((total_loc_wait_sec / max(1, active_counters_count)) / 60) if active_counters_count > 0 else 0

        loc_out = LocationOut(
            id=loc.id,
            organization_id=loc.organization_id,
            name=loc.name,
            slug=loc.slug,
            description=loc.description,
            category=loc.category,
            address=loc.address,
            latitude=loc.latitude,
            longitude=loc.longitude,
            image_url=loc.image_url,
            opening_hours=loc.opening_hours,
            is_active=loc.is_active,
            low_threshold=loc.low_threshold,
            mod_threshold=loc.mod_threshold,
            crowd_capacity=loc.crowd_capacity,
            created_at=loc.created_at,
            crowd_status=loc_crowd,
            current_wait_minutes=avg_loc_wait_min,
            total_waiting=total_loc_waiting,
            active_counters_count=active_counters_count,
            is_favorite=(loc.id in user_fav_ids),
            counters=counter_outs
        )
        output.append(loc_out)

    if sort_by == "shortest_wait":
        output.sort(key=lambda x: (x.current_wait_minutes, x.total_waiting))
    elif sort_by == "popularity":
        output.sort(key=lambda x: x.total_waiting, reverse=True)
    else:
        output.sort(key=lambda x: x.name)

    return output

@router.get("/{location_id}", response_model=LocationOut)
def get_location(
    location_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    loc = db.execute(select(Location).where(Location.id == location_id)).scalar_one_or_none()
    if not loc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")

    counters = list(db.execute(
        select(ServiceCounter).where(ServiceCounter.location_id == loc.id)
    ).scalars().all())

    counter_outs: List[CounterOut] = []
    total_loc_waiting = 0
    total_loc_wait_sec = 0
    active_counters_count = 0

    for c in counters:
        waiting_count = db.execute(
            select(func.count(QueueSession.id)).where(
                QueueSession.counter_id == c.id,
                QueueSession.status.in_(WAITING_OR_APPROACHING)
            )
        ).scalar() or 0

        if c.status == CounterStatus.OPEN.value:
            active_counters_count += 1
            total_loc_waiting += waiting_count
            total_loc_wait_sec += waiting_count * c.average_service_seconds

        est_minutes = round((waiting_count * c.average_service_seconds) / 60)

        counter_outs.append(CounterOut(
            id=c.id,
            location_id=c.location_id,
            name=c.name,
            code=c.code,
            status=c.status,
            average_service_seconds=c.average_service_seconds,
            queue_capacity=c.queue_capacity,
            active_queue_count=waiting_count,
            estimated_wait_minutes=est_minutes,
            created_at=c.created_at
        ))

    if total_loc_waiting < loc.low_threshold:
        loc_crowd = CrowdLevel.LOW
    elif total_loc_waiting < loc.mod_threshold:
        loc_crowd = CrowdLevel.MODERATE
    else:
        loc_crowd = CrowdLevel.HIGH

    avg_loc_wait_min = round((total_loc_wait_sec / max(1, active_counters_count)) / 60) if active_counters_count > 0 else 0

    is_fav = False
    if current_user and isinstance(current_user, User):
        fav = db.execute(
            select(UserFavorite).where(
                UserFavorite.user_id == current_user.id,
                UserFavorite.location_id == loc.id
            )
        ).scalar_one_or_none()
        is_fav = fav is not None

    return LocationOut(
        id=loc.id,
        organization_id=loc.organization_id,
        name=loc.name,
        slug=loc.slug,
        description=loc.description,
        category=loc.category,
        address=loc.address,
        latitude=loc.latitude,
        longitude=loc.longitude,
        image_url=loc.image_url,
        opening_hours=loc.opening_hours,
        is_active=loc.is_active,
        low_threshold=loc.low_threshold,
        mod_threshold=loc.mod_threshold,
        crowd_capacity=loc.crowd_capacity,
        created_at=loc.created_at,
        crowd_status=loc_crowd,
        current_wait_minutes=avg_loc_wait_min,
        total_waiting=total_loc_waiting,
        active_counters_count=active_counters_count,
        is_favorite=is_fav,
        counters=counter_outs
    )

@router.get("/{location_id}/counters", response_model=List[CounterOut])
def list_counters_for_location(location_id: str, db: Session = Depends(get_db)):
    counters = list(db.execute(
        select(ServiceCounter).where(ServiceCounter.location_id == location_id)
    ).scalars().all())
    counter_outs: List[CounterOut] = []

    for c in counters:
        waiting_count = db.execute(
            select(func.count(QueueSession.id)).where(
                QueueSession.counter_id == c.id,
                QueueSession.status.in_(WAITING_OR_APPROACHING)
            )
        ).scalar() or 0
        est_minutes = round((waiting_count * c.average_service_seconds) / 60)

        counter_outs.append(CounterOut(
            id=c.id,
            location_id=c.location_id,
            name=c.name,
            code=c.code,
            status=c.status,
            average_service_seconds=c.average_service_seconds,
            queue_capacity=c.queue_capacity,
            active_queue_count=waiting_count,
            estimated_wait_minutes=est_minutes,
            created_at=c.created_at
        ))
    return counter_outs
