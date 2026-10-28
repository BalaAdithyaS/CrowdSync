from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.models.entities import QueueSession, User
from app.models.enums import QueueStatus
from app.schemas.queue import QueueJoinRequest, QueueLeaveRequest, QueueSessionOut
from app.services.queue_service import queue_service, ACTIVE_STATUSES
from app.api.deps import get_current_user

router = APIRouter(prefix="/queues", tags=["Queues"])

@router.post("/join", response_model=QueueSessionOut, status_code=status.HTTP_201_CREATED)
def join_queue(
    payload: QueueJoinRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = queue_service.join_queue(
        db=db,
        user_id=current_user.id,
        counter_id=payload.counter_id
    )
    details = queue_service.get_session_details(db, session.id)
    return QueueSessionOut(**details)

@router.get("/me", response_model=List[QueueSessionOut])
def get_my_active_queues(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(QueueSession.id).where(
        QueueSession.user_id == current_user.id,
        QueueSession.status.in_(ACTIVE_STATUSES)
    ).order_by(QueueSession.joined_at.desc())
    
    session_ids = list(db.execute(query).scalars().all())
    results = []
    for sid in session_ids:
        details = queue_service.get_session_details(db, sid)
        results.append(QueueSessionOut(**details))
    return results

@router.get("/history", response_model=List[QueueSessionOut])
def get_my_queue_history(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(QueueSession.id).where(
        QueueSession.user_id == current_user.id,
        QueueSession.status.notin_(ACTIVE_STATUSES)
    ).order_by(QueueSession.joined_at.desc()).limit(limit)

    session_ids = list(db.execute(query).scalars().all())
    results = []
    for sid in session_ids:
        details = queue_service.get_session_details(db, sid)
        results.append(QueueSessionOut(**details))
    return results

@router.get("/{queue_id}", response_model=QueueSessionOut)
def get_queue_session(
    queue_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.execute(select(QueueSession).where(QueueSession.id == queue_id)).scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Queue session not found")

    if session.user_id != current_user.id and current_user.role not in ["LOCATION_ADMIN", "ORGANIZATION_ADMIN", "PLATFORM_ADMIN"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this queue ticket")

    details = queue_service.get_session_details(db, queue_id)
    return QueueSessionOut(**details)

@router.post("/{queue_id}/leave", response_model=QueueSessionOut)
def leave_queue(
    queue_id: str,
    payload: QueueLeaveRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reason = payload.reason if payload and payload.reason else "Left voluntarily"
    session = queue_service.leave_queue(
        db=db,
        user_id=current_user.id,
        session_id=queue_id,
        reason=reason
    )
    details = queue_service.get_session_details(db, session.id)
    return QueueSessionOut(**details)
