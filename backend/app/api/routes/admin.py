from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select, update, func, desc

from app.core.database import get_db
from app.models.entities import (
    Location, ServiceCounter, QueueSession, User, AuditLog, Organization
)
from app.models.enums import CounterStatus, QueueStatus
from app.schemas.location import LocationCreate, LocationUpdate, LocationOut, CounterCreate, CounterUpdate, CounterOut
from app.schemas.analytics import AdminOverviewOut, AdminQueueSessionOut, AuditLogOut
from app.schemas.queue import AdminQueueActionRequest
from app.services.analytics_service import analytics_service
from app.services.queue_service import queue_service, ACTIVE_STATUSES
from app.websocket.connection_manager import ws_manager
from app.api.deps import require_admin

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_admin)])

@router.get("/overview")
def get_admin_overview(
    location_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    overview = analytics_service.get_overview(db, location_id)
    return overview

@router.get("/queues", response_model=List[AdminQueueSessionOut])
def list_admin_queues(
    status_filter: Optional[str] = None,
    location_id: Optional[str] = None,
    counter_id: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = select(
        QueueSession, User.name.label("user_name"), User.email.label("user_email"),
        Location.name.label("location_name"), ServiceCounter.name.label("counter_name")
    ).join(User, QueueSession.user_id == User.id)\
     .join(Location, QueueSession.location_id == Location.id)\
     .join(ServiceCounter, QueueSession.counter_id == ServiceCounter.id)

    if status_filter and status_filter.upper() != "ALL":
        query = query.where(QueueSession.status == status_filter.upper())
    else:
        query = query.where(QueueSession.status.in_(ACTIVE_STATUSES))

    if location_id:
        query = query.where(QueueSession.location_id == location_id)
    if counter_id:
        query = query.where(QueueSession.counter_id == counter_id)

    query = query.order_by(QueueSession.sequence_number.asc(), QueueSession.joined_at.asc()).limit(limit)
    rows = db.execute(query).all()

    output = []
    for row in rows:
        session = row.QueueSession
        pos = 1
        if session.status in ["WAITING", "APPROACHING"]:
            ahead = db.execute(
                select(func.count(QueueSession.id)).where(
                    QueueSession.counter_id == session.counter_id,
                    QueueSession.status.in_(["WAITING", "APPROACHING"]),
                    QueueSession.sequence_number < session.sequence_number
                )
            ).scalar() or 0
            pos = ahead + 1

        output.append(AdminQueueSessionOut(
            id=session.id,
            ticket_number=session.ticket_number,
            location_id=session.location_id,
            location_name=row.location_name,
            counter_id=session.counter_id,
            counter_name=row.counter_name,
            user_name=row.user_name,
            user_email=row.user_email,
            queue_position=pos,
            status=session.status,
            estimated_wait_seconds=session.estimated_wait_seconds or 0,
            joined_at=session.joined_at,
            called_at=session.called_at,
            service_started_at=session.service_started_at,
            completed_at=session.completed_at,
            cancelled_at=session.cancelled_at
        ))
    return output

@router.post("/locations", status_code=status.HTTP_201_CREATED)
def create_location(
    payload: LocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    org_id = payload.organization_id
    if not org_id:
        org = db.execute(select(Organization).limit(1)).scalar_one_or_none()
        if not org:
            org = Organization(name="VIT Campus Demo", slug="vit-campus-demo")
            db.add(org)
            db.flush()
        org_id = org.id

    loc = Location(
        organization_id=org_id,
        name=payload.name.strip(),
        slug=payload.slug.lower().strip(),
        description=payload.description.strip(),
        category=payload.category.lower().strip(),
        address=payload.address.strip(),
        latitude=payload.latitude,
        longitude=payload.longitude,
        image_url=payload.image_url,
        opening_hours=payload.opening_hours,
        is_active=payload.is_active,
        low_threshold=payload.low_threshold,
        mod_threshold=payload.mod_threshold,
        crowd_capacity=payload.crowd_capacity,
        created_at=datetime.now(timezone.utc)
    )
    db.add(loc)
    
    db.add(AuditLog(
        organization_id=org_id,
        actor_user_id=current_user.id,
        action="CREATE_LOCATION",
        target_type="LOCATION",
        details=f"Created location {loc.name}",
        created_at=datetime.now(timezone.utc)
    ))

    db.commit()
    db.refresh(loc)
    return {"message": "Location created successfully", "id": loc.id}

@router.patch("/locations/{location_id}")
def update_location(
    location_id: str,
    payload: LocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    loc = db.execute(select(Location).where(Location.id == location_id)).scalar_one_or_none()
    if not loc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")

    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(loc, k, v)

    db.add(AuditLog(
        organization_id=loc.organization_id,
        actor_user_id=current_user.id,
        action="UPDATE_LOCATION",
        target_type="LOCATION",
        target_id=loc.id,
        details=f"Updated location attributes: {', '.join(update_data.keys())}",
        created_at=datetime.now(timezone.utc)
    ))

    db.commit()
    db.refresh(loc)
    return {"message": "Location updated successfully"}

@router.post("/counters", status_code=status.HTTP_201_CREATED)
def create_counter(
    payload: CounterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    counter = ServiceCounter(
        location_id=payload.location_id,
        name=payload.name.strip(),
        code=payload.code.strip().upper(),
        status=payload.status.value if hasattr(payload.status, "value") else payload.status,
        average_service_seconds=payload.average_service_seconds,
        queue_capacity=payload.queue_capacity,
        created_at=datetime.now(timezone.utc)
    )
    db.add(counter)

    db.add(AuditLog(
        actor_user_id=current_user.id,
        action="CREATE_COUNTER",
        target_type="SERVICE_COUNTER",
        details=f"Created service counter {counter.name} (Code: {counter.code})",
        created_at=datetime.now(timezone.utc)
    ))

    db.commit()
    db.refresh(counter)
    return {"message": "Service counter created successfully", "id": counter.id}

@router.patch("/counters/{counter_id}")
def update_counter(
    counter_id: str,
    payload: CounterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    counter = db.execute(select(ServiceCounter).where(ServiceCounter.id == counter_id)).scalar_one_or_none()
    if not counter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Counter not found")

    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        if k == "status" and hasattr(v, "value"):
            setattr(counter, k, v.value)
        else:
            setattr(counter, k, v)

    db.add(AuditLog(
        actor_user_id=current_user.id,
        action="UPDATE_COUNTER",
        target_type="SERVICE_COUNTER",
        target_id=counter.id,
        details=f"Updated counter: {update_data}",
        created_at=datetime.now(timezone.utc)
    ))

    db.commit()
    db.refresh(counter)

    try:
        import asyncio
        loop = asyncio.get_running_loop()
        loop.create_task(ws_manager.broadcast_location_update(counter.location_id, {
            "counter_id": counter.id,
            "status": counter.status,
            "action": "COUNTER_UPDATED"
        }))
    except RuntimeError:
        pass

    return {"message": "Counter updated successfully"}

@router.post("/counters/{counter_id}/call-next")
def call_next_ticket(
    counter_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    session = queue_service.call_next_ticket(
        db=db,
        counter_id=counter_id,
        actor_user_id=current_user.id
    )
    if not session:
        return {"called": False, "message": "No tickets currently waiting in this queue."}
    return {
        "called": True,
        "session_id": session.id,
        "ticket_number": session.ticket_number,
        "message": f"Successfully called ticket {session.ticket_number}."
    }

@router.post("/queues/{queue_id}/start-service")
def start_service(
    queue_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    session = queue_service.start_service(
        db=db,
        session_id=queue_id,
        actor_user_id=current_user.id
    )
    return {"message": f"Service commenced for ticket {session.ticket_number}"}

@router.post("/queues/{queue_id}/complete")
def complete_service(
    queue_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    session = queue_service.complete_service(
        db=db,
        session_id=queue_id,
        actor_user_id=current_user.id
    )
    return {"message": f"Service completed for ticket {session.ticket_number}"}

@router.post("/queues/{queue_id}/no-show")
def mark_no_show(
    queue_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    session = queue_service.mark_no_show(
        db=db,
        session_id=queue_id,
        actor_user_id=current_user.id
    )
    return {"message": f"Ticket {session.ticket_number} marked as no-show."}

@router.post("/queues/{queue_id}/cancel")
def cancel_queue_ticket(
    queue_id: str,
    payload: AdminQueueActionRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    reason = payload.reason if payload and payload.reason else "Cancelled by administrator"
    session = queue_service.cancel_ticket_admin(
        db=db,
        session_id=queue_id,
        reason=reason,
        actor_user_id=current_user.id
    )
    return {"message": f"Ticket {session.ticket_number} cancelled: {reason}"}

@router.get("/audit-logs", response_model=List[AuditLogOut])
def list_audit_logs(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = select(AuditLog, User.name.label("actor_name")).outerjoin(
        User, AuditLog.actor_user_id == User.id
    ).order_by(desc(AuditLog.created_at)).limit(limit)

    rows = db.execute(query).all()
    logs = []
    for row in rows:
        log = row.AuditLog
        logs.append(AuditLogOut(
            id=log.id,
            actor_user_id=log.actor_user_id,
            actor_name=row.actor_name or "System",
            action=log.action,
            target_type=log.target_type,
            target_id=log.target_id,
            details=log.details,
            created_at=log.created_at
        ))
    return logs
