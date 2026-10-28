import asyncio
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import select, update, func, and_, or_
from fastapi import HTTPException, status

from app.models.entities import (
    QueueSession, ServiceCounter, Location, QueueEvent, User, ServiceObservation, AuditLog
)
from app.models.enums import QueueStatus, CounterStatus, NotificationType
from app.services.estimation import estimation_service
from app.services.notification_service import notification_service
from app.websocket.connection_manager import ws_manager

ACTIVE_STATUSES = [
    QueueStatus.WAITING.value,
    QueueStatus.APPROACHING.value,
    QueueStatus.CALLED.value,
    QueueStatus.SERVING.value,
]

WAITING_OR_APPROACHING = [
    QueueStatus.WAITING.value,
    QueueStatus.APPROACHING.value,
]

def safe_broadcast(coro):
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(coro)
    except RuntimeError:
        pass

class QueueService:
    @staticmethod
    def join_queue(
        db: Session,
        user_id: str,
        counter_id: str
    ) -> QueueSession:
        # 1. Fetch Counter & Location
        counter = db.execute(select(ServiceCounter).where(ServiceCounter.id == counter_id)).scalar_one_or_none()
        if not counter:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service counter not found")

        if counter.status != CounterStatus.OPEN.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Counter is currently {counter.status.lower()} and not accepting new queue tickets."
            )

        location = db.execute(select(Location).where(Location.id == counter.location_id)).scalar_one_or_none()
        if not location or not location.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Location is inactive or closed")

        # 2. Check for existing active ticket for this user at this counter
        existing = db.execute(
            select(QueueSession).where(
                QueueSession.user_id == user_id,
                QueueSession.counter_id == counter_id,
                QueueSession.status.in_(ACTIVE_STATUSES)
            )
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You already have an active ticket in this queue."
            )

        # 3. Check counter queue capacity
        current_waiting_count = db.execute(
            select(func.count(QueueSession.id)).where(
                QueueSession.counter_id == counter_id,
                QueueSession.status.in_(WAITING_OR_APPROACHING)
            )
        ).scalar() or 0
        if current_waiting_count >= counter.queue_capacity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Queue capacity reached. Please check back shortly or choose another counter."
            )

        # 4. Generate next sequence number for this counter
        max_seq = db.execute(
            select(func.coalesce(func.max(QueueSession.sequence_number), 0)).where(
                QueueSession.counter_id == counter_id
            )
        ).scalar() or 0
        next_seq = max_seq + 1
        
        # Format ticket number: e.g., "CEN-A-014" or "LIB-CIR-023"
        loc_prefix = "".join([c for c in location.name.upper() if c.isalnum()][:3]) or "Q"
        ticket_number = f"{loc_prefix}-{counter.code}-{next_seq:03d}"

        # 5. Fetch recent service observations for estimation
        obs_res = db.execute(
            select(ServiceObservation.service_duration_seconds).where(
                ServiceObservation.counter_id == counter_id
            ).order_by(ServiceObservation.recorded_at.desc()).limit(10)
        )
        recent_durations = list(obs_res.scalars().all())

        people_ahead = current_waiting_count
        est_result = estimation_service.calculate_estimated_wait(
            people_ahead=people_ahead,
            base_service_seconds=counter.average_service_seconds,
            recent_durations=recent_durations,
            is_active=True
        )

        initial_status = QueueStatus.APPROACHING.value if people_ahead <= 1 else QueueStatus.WAITING.value

        session = QueueSession(
            user_id=user_id,
            counter_id=counter_id,
            location_id=location.id,
            ticket_number=ticket_number,
            sequence_number=next_seq,
            status=initial_status,
            joined_at=datetime.now(timezone.utc),
            estimated_wait_seconds=est_result.estimated_seconds
        )
        db.add(session)
        db.flush()

        # Add QueueEvent
        event = QueueEvent(
            queue_session_id=session.id,
            event_type="JOINED",
            payload=f"Joined queue at position {people_ahead + 1} with ticket {ticket_number}",
            created_at=datetime.now(timezone.utc)
        )
        db.add(event)

        # Create persistent notification
        notification_service.create_notification(
            db=db,
            user_id=user_id,
            type=NotificationType.QUEUE_JOINED,
            title=f"Joined Queue: {ticket_number}",
            message=f"You joined {location.name} ({counter.name}). Ticket: {ticket_number}. Your position: {people_ahead + 1}.",
            related_queue_id=session.id
        )

        db.commit()
        db.refresh(session)

        # Broadcast live updates
        safe_broadcast(ws_manager.broadcast_location_update(location.id, {
            "counter_id": counter.id,
            "total_waiting": people_ahead + 1,
            "action": "JOINED"
        }))

        return session

    @staticmethod
    def leave_queue(
        db: Session,
        user_id: str,
        session_id: str,
        reason: str = "Left voluntarily"
    ) -> QueueSession:
        session = db.execute(
            select(QueueSession).where(
                QueueSession.id == session_id,
                QueueSession.user_id == user_id
            )
        ).scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Queue session not found")

        if session.status not in ACTIVE_STATUSES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot leave queue in status {session.status}")

        session.status = QueueStatus.CANCELLED.value
        session.cancelled_at = datetime.now(timezone.utc)
        session.cancellation_reason = reason

        db.add(QueueEvent(
            queue_session_id=session.id,
            event_type="CANCELLED_BY_USER",
            payload=reason,
            created_at=datetime.now(timezone.utc)
        ))

        notification_service.create_notification(
            db=db,
            user_id=user_id,
            type=NotificationType.QUEUE_CANCELLED,
            title="Queue Session Cancelled",
            message=f"Your ticket {session.ticket_number} has been cancelled ({reason}).",
            related_queue_id=session.id
        )

        db.commit()
        db.refresh(session)

        QueueService.notify_and_recalculate_counter(db, session.counter_id, session.location_id)
        return session

    @staticmethod
    def call_next_ticket(
        db: Session,
        counter_id: str,
        actor_user_id: Optional[str] = None
    ) -> Optional[QueueSession]:
        counter = db.execute(select(ServiceCounter).where(ServiceCounter.id == counter_id)).scalar_one_or_none()
        if not counter:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Counter not found")

        query = select(QueueSession).where(
            QueueSession.counter_id == counter_id,
            QueueSession.status.in_(WAITING_OR_APPROACHING)
        ).order_by(QueueSession.sequence_number.asc()).limit(1)

        session = db.execute(query).scalar_one_or_none()
        if not session:
            return None

        now = datetime.now(timezone.utc)
        session.status = QueueStatus.CALLED.value
        session.called_at = now
        if session.joined_at:
            joined_at = session.joined_at if session.joined_at.tzinfo else session.joined_at.replace(tzinfo=timezone.utc)
            session.actual_wait_seconds = int((now - joined_at).total_seconds())

        db.add(QueueEvent(
            queue_session_id=session.id,
            event_type="CALLED",
            payload="Ticket called by service operator",
            created_at=now
        ))

        db.add(AuditLog(
            actor_user_id=actor_user_id,
            action="CALL_NEXT_TICKET",
            target_type="QUEUE_SESSION",
            target_id=session.id,
            details=f"Called ticket {session.ticket_number} at counter {counter.name}",
            created_at=now
        ))

        notification_service.create_notification(
            db=db,
            user_id=session.user_id,
            type=NotificationType.TICKET_CALLED,
            title="It's Your Turn!",
            message=f"Ticket {session.ticket_number} called to {counter.name}. Please proceed to the counter immediately.",
            related_queue_id=session.id
        )

        db.commit()
        db.refresh(session)

        safe_broadcast(ws_manager.broadcast_queue_update(session.id, {
            "status": session.status,
            "called_at": session.called_at.isoformat()
        }))
        QueueService.notify_and_recalculate_counter(db, counter_id, counter.location_id)
        return session

    @staticmethod
    def start_service(
        db: Session,
        session_id: str,
        actor_user_id: Optional[str] = None
    ) -> QueueSession:
        session = db.execute(select(QueueSession).where(QueueSession.id == session_id)).scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Queue session not found")

        if session.status not in [QueueStatus.CALLED.value, QueueStatus.WAITING.value, QueueStatus.APPROACHING.value]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot start service from status {session.status}")

        now = datetime.now(timezone.utc)
        session.status = QueueStatus.SERVING.value
        session.service_started_at = now

        db.add(QueueEvent(
            queue_session_id=session.id,
            event_type="SERVICE_STARTED",
            payload="Customer arrived at counter, service commenced",
            created_at=now
        ))
        
        db.commit()
        db.refresh(session)

        safe_broadcast(ws_manager.broadcast_queue_update(session.id, {
            "status": session.status,
            "service_started_at": session.service_started_at.isoformat()
        }))
        return session

    @staticmethod
    def complete_service(
        db: Session,
        session_id: str,
        actor_user_id: Optional[str] = None
    ) -> QueueSession:
        session = db.execute(select(QueueSession).where(QueueSession.id == session_id)).scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Queue session not found")

        now = datetime.now(timezone.utc)
        session.status = QueueStatus.COMPLETED.value
        session.completed_at = now

        started = session.service_started_at or session.called_at or session.joined_at
        if started:
            started_tz = started if started.tzinfo else started.replace(tzinfo=timezone.utc)
            duration = max(30, int((now - started_tz).total_seconds()))
        else:
            duration = 180
        session.actual_service_seconds = duration

        obs = ServiceObservation(
            counter_id=session.counter_id,
            queue_session_id=session.id,
            service_duration_seconds=duration,
            recorded_at=now
        )
        db.add(obs)

        db.add(QueueEvent(
            queue_session_id=session.id,
            event_type="COMPLETED",
            payload=f"Service successfully completed in {duration} seconds",
            created_at=now
        ))

        notification_service.create_notification(
            db=db,
            user_id=session.user_id,
            type=NotificationType.QUEUE_COMPLETED,
            title="Service Completed",
            message=f"Your session for ticket {session.ticket_number} is complete. Thank you!",
            related_queue_id=session.id
        )

        db.commit()
        db.refresh(session)

        safe_broadcast(ws_manager.broadcast_queue_update(session.id, {
            "status": session.status,
            "completed_at": session.completed_at.isoformat()
        }))
        QueueService.notify_and_recalculate_counter(db, session.counter_id, session.location_id)
        return session

    @staticmethod
    def mark_no_show(
        db: Session,
        session_id: str,
        actor_user_id: Optional[str] = None
    ) -> QueueSession:
        session = db.execute(select(QueueSession).where(QueueSession.id == session_id)).scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Queue session not found")

        now = datetime.now(timezone.utc)
        session.status = QueueStatus.NO_SHOW.value
        session.cancelled_at = now
        session.cancellation_reason = "Customer did not report to counter after being called"

        db.add(QueueEvent(
            queue_session_id=session.id,
            event_type="NO_SHOW",
            payload="Marked as no-show by operator",
            created_at=now
        ))

        notification_service.create_notification(
            db=db,
            user_id=session.user_id,
            type=NotificationType.QUEUE_CANCELLED,
            title="Marked as No-Show",
            message=f"Ticket {session.ticket_number} expired because you did not arrive when called.",
            related_queue_id=session.id
        )

        db.commit()
        db.refresh(session)

        safe_broadcast(ws_manager.broadcast_queue_update(session.id, {
            "status": session.status,
            "cancelled_at": session.cancelled_at.isoformat()
        }))
        QueueService.notify_and_recalculate_counter(db, session.counter_id, session.location_id)
        return session

    @staticmethod
    def cancel_ticket_admin(
        db: Session,
        session_id: str,
        reason: str = "Cancelled by administrator",
        actor_user_id: Optional[str] = None
    ) -> QueueSession:
        session = db.execute(select(QueueSession).where(QueueSession.id == session_id)).scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Queue session not found")

        now = datetime.now(timezone.utc)
        session.status = QueueStatus.CANCELLED.value
        session.cancelled_at = now
        session.cancellation_reason = reason

        db.add(QueueEvent(
            queue_session_id=session.id,
            event_type="CANCELLED_BY_ADMIN",
            payload=reason,
            created_at=now
        ))

        notification_service.create_notification(
            db=db,
            user_id=session.user_id,
            type=NotificationType.QUEUE_CANCELLED,
            title="Ticket Cancelled by Staff",
            message=f"Ticket {session.ticket_number} was cancelled: {reason}.",
            related_queue_id=session.id
        )

        db.commit()
        db.refresh(session)

        safe_broadcast(ws_manager.broadcast_queue_update(session.id, {
            "status": session.status,
            "cancelled_at": session.cancelled_at.isoformat()
        }))
        QueueService.notify_and_recalculate_counter(db, session.counter_id, session.location_id)
        return session

    @staticmethod
    def notify_and_recalculate_counter(
        db: Session,
        counter_id: str,
        location_id: str
    ):
        query = select(QueueSession).where(
            QueueSession.counter_id == counter_id,
            QueueSession.status.in_(WAITING_OR_APPROACHING)
        ).order_by(QueueSession.sequence_number.asc())

        sessions = list(db.execute(query).scalars().all())
        counter = db.execute(select(ServiceCounter).where(ServiceCounter.id == counter_id)).scalar_one_or_none()
        base_service_sec = counter.average_service_seconds if counter else 180

        obs_res = db.execute(
            select(ServiceObservation.service_duration_seconds).where(
                ServiceObservation.counter_id == counter_id
            ).order_by(ServiceObservation.recorded_at.desc()).limit(10)
        )
        recent_durations = list(obs_res.scalars().all())

        for idx, s in enumerate(sessions):
            people_ahead = idx
            pos = idx + 1
            est = estimation_service.calculate_estimated_wait(
                people_ahead=people_ahead,
                base_service_seconds=base_service_sec,
                recent_durations=recent_durations,
                is_active=True
            )
            s.estimated_wait_seconds = est.estimated_seconds

            if people_ahead <= 1 and s.status == QueueStatus.WAITING.value:
                s.status = QueueStatus.APPROACHING.value
                notification_service.create_notification(
                    db=db,
                    user_id=s.user_id,
                    type=NotificationType.APPROACHING_TURN,
                    title="Almost Your Turn!",
                    message=f"You are next in line for ticket {s.ticket_number}! Please stand near {counter.name if counter else 'the counter'}.",
                    related_queue_id=s.id
                )

            safe_broadcast(ws_manager.broadcast_queue_update(s.id, {
                "queue_position": pos,
                "people_ahead": people_ahead,
                "status": s.status,
                "estimated_wait_seconds": est.estimated_seconds,
                "range_min": est.range_min_seconds,
                "range_max": est.range_max_seconds,
                "explanation": est.explanation
            }))

        db.commit()

        safe_broadcast(ws_manager.broadcast_location_update(location_id, {
            "counter_id": counter_id,
            "total_waiting": len(sessions)
        }))

    @staticmethod
    def get_session_details(
        db: Session,
        session_id: str
    ) -> Dict[str, Any]:
        session = db.execute(select(QueueSession).where(QueueSession.id == session_id)).scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Queue session not found")

        counter = db.execute(select(ServiceCounter).where(ServiceCounter.id == session.counter_id)).scalar_one_or_none()
        location = db.execute(select(Location).where(Location.id == session.location_id)).scalar_one_or_none()

        position = 0
        people_ahead = 0
        if session.status in WAITING_OR_APPROACHING:
            count_ahead = db.execute(
                select(func.count(QueueSession.id)).where(
                    QueueSession.counter_id == session.counter_id,
                    QueueSession.status.in_(WAITING_OR_APPROACHING),
                    QueueSession.sequence_number < session.sequence_number
                )
            ).scalar() or 0
            people_ahead = count_ahead
            position = people_ahead + 1

        obs_res = db.execute(
            select(ServiceObservation.service_duration_seconds).where(
                ServiceObservation.counter_id == session.counter_id
            ).order_by(ServiceObservation.recorded_at.desc()).limit(10)
        )
        recent_durations = list(obs_res.scalars().all())

        est = estimation_service.calculate_estimated_wait(
            people_ahead=people_ahead,
            base_service_seconds=counter.average_service_seconds if counter else 180,
            recent_durations=recent_durations,
            is_active=counter.status == CounterStatus.OPEN.value if counter else True
        )

        return {
            "id": session.id,
            "user_id": session.user_id,
            "counter_id": session.counter_id,
            "location_id": session.location_id,
            "location_name": location.name if location else "Unknown Location",
            "counter_name": counter.name if counter else "Counter",
            "counter_code": counter.code if counter else "A",
            "ticket_number": session.ticket_number,
            "sequence_number": session.sequence_number,
            "queue_position": position,
            "people_ahead": people_ahead,
            "status": session.status,
            "joined_at": session.joined_at,
            "called_at": session.called_at,
            "service_started_at": session.service_started_at,
            "completed_at": session.completed_at,
            "cancelled_at": session.cancelled_at,
            "cancellation_reason": session.cancellation_reason,
            "estimated_wait_seconds": est.estimated_seconds,
            "estimated_wait_range_min": est.range_min_seconds,
            "estimated_wait_range_max": est.range_max_seconds,
            "estimation_explanation": est.explanation,
            "is_approximate": est.is_approximate,
        }

queue_service = QueueService()
