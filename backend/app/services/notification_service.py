import asyncio
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select, update, func
from app.models.entities import Notification
from app.models.enums import NotificationType
from app.websocket.connection_manager import ws_manager

class NotificationService:
    @staticmethod
    def create_notification(
        db: Session,
        user_id: str,
        type: NotificationType,
        title: str,
        message: str,
        related_queue_id: Optional[str] = None
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            type=type.value if hasattr(type, "value") else type,
            title=title,
            message=message,
            related_queue_id=related_queue_id,
            is_read=False,
            created_at=datetime.now(timezone.utc)
        )
        db.add(notif)
        db.flush()
        
        # Real-time WebSocket delivery (schedule non-blocking on active event loop)
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(ws_manager.send_user_notification(user_id, {
                "id": notif.id,
                "type": notif.type,
                "title": notif.title,
                "message": notif.message,
                "related_queue_id": notif.related_queue_id,
                "created_at": notif.created_at.isoformat(),
                "is_read": False
            }))
        except RuntimeError:
            pass # No event loop running (e.g. standalone script)

        return notif

    @staticmethod
    def get_user_notifications(
        db: Session,
        user_id: str,
        limit: int = 50,
        unread_only: bool = False
    ) -> List[Notification]:
        query = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            query = query.where(Notification.is_read == False)
        query = query.order_by(Notification.created_at.desc()).limit(limit)
        return list(db.execute(query).scalars().all())

    @staticmethod
    def mark_read(db: Session, user_id: str, notification_id: str) -> bool:
        query = select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user_id
        )
        notif = db.execute(query).scalar_one_or_none()
        if notif:
            notif.is_read = True
            db.commit()
            return True
        return False

    @staticmethod
    def mark_all_read(db: Session, user_id: str) -> int:
        query = update(Notification).where(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).values(is_read=True)
        res = db.execute(query)
        db.commit()
        return res.rowcount

    @staticmethod
    def get_unread_count(db: Session, user_id: str) -> int:
        query = select(func.count(Notification.id)).where(
            Notification.user_id == user_id,
            Notification.is_read == False
        )
        return db.execute(query).scalar() or 0

notification_service = NotificationService()
