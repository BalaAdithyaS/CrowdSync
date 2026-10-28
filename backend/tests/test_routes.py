import pytest
from fastapi import HTTPException
from app.models.entities import User, Location, ServiceCounter, QueueSession
from app.models.enums import UserRole, CounterStatus, QueueStatus, NotificationType
from app.schemas.auth import UserRegister, UserLogin, UserProfileUpdate
from app.schemas.queue import QueueJoinRequest, QueueLeaveRequest, AdminQueueActionRequest
from app.schemas.location import LocationCreate, LocationUpdate, CounterCreate, CounterUpdate

from app.api.routes import auth, locations, queues, admin, notifications, analytics

def test_auth_route_cycle(db_session):
    # 1. Register
    reg_data = UserRegister(
        name="Samantha Smith",
        email="samantha@vitcampus.edu",
        password="PassWord123!"
    )
    token_resp = auth.register(payload=reg_data, db=db_session)
    assert token_resp.access_token is not None
    assert token_resp.user.email == "samantha@vitcampus.edu"

    # 2. Duplicate registration throws 400
    with pytest.raises(HTTPException) as exc_info:
        auth.register(payload=reg_data, db=db_session)
    assert exc_info.value.status_code == 400

    # 3. Login
    login_data = UserLogin(email="samantha@vitcampus.edu", password="PassWord123!")
    login_resp = auth.login(payload=login_data, db=db_session)
    assert login_resp.access_token is not None

    # 4. Login wrong password throws 401
    bad_login = UserLogin(email="samantha@vitcampus.edu", password="WrongPassword!")
    with pytest.raises(HTTPException) as exc_info:
        auth.login(payload=bad_login, db=db_session)
    assert exc_info.value.status_code == 401

def test_location_routes(db_session, sample_location):
    # 1. List locations
    locs = locations.list_locations(category="cafeteria", db=db_session)
    assert len(locs) >= 1
    assert locs[0].name == "Test Dining Hall"
    assert locs[0].crowd_status.value == "LOW"

    # 2. Search match
    found = locations.list_locations(search="Dining", db=db_session)
    assert len(found) >= 1

    # 3. Search non-match
    none_found = locations.list_locations(search="NonExistentBuildingXYZ", db=db_session)
    assert len(none_found) == 0

    # 4. Detail endpoint
    detail = locations.get_location(location_id=sample_location.id, db=db_session)
    assert detail.id == sample_location.id
    assert len(detail.counters) == 1

def test_queue_and_admin_lifecycle(db_session, test_user, test_admin, sample_location):
    counter = sample_location.counters[0]

    # 1. User joins queue
    join_req = QueueJoinRequest(counter_id=counter.id)
    ticket = queues.join_queue(payload=join_req, db=db_session, current_user=test_user)
    assert ticket.ticket_number is not None
    assert ticket.queue_position == 1
    assert ticket.counter_id == counter.id

    # 2. Duplicate join by same user at same counter raises 409 Conflict
    with pytest.raises(HTTPException) as exc_info:
        queues.join_queue(payload=join_req, db=db_session, current_user=test_user)
    assert exc_info.value.status_code == 409

    # 3. View my active queues
    my_queues = queues.get_my_active_queues(db=db_session, current_user=test_user)
    assert len(my_queues) == 1
    assert my_queues[0].id == ticket.id

    # 4. Admin calls next ticket
    call_result = admin.call_next_ticket(counter_id=counter.id, db=db_session, current_user=test_admin)
    assert call_result["called"] is True
    assert call_result["session_id"] == ticket.id

    # 5. Admin starts service
    start_result = admin.start_service(queue_id=ticket.id, db=db_session, current_user=test_admin)
    assert "commenced" in start_result["message"]

    # 6. Admin completes service
    comp_result = admin.complete_service(queue_id=ticket.id, db=db_session, current_user=test_admin)
    assert "completed" in comp_result["message"]

    # 7. Check ticket state is now COMPLETED
    updated_ticket = queues.get_queue_session(queue_id=ticket.id, db=db_session, current_user=test_user)
    assert updated_ticket.status.value == "COMPLETED"

    # 8. User queue history has 1 completed session
    history = queues.get_my_queue_history(limit=10, db=db_session, current_user=test_user)
    assert len(history) == 1
    assert history[0].id == ticket.id

def test_user_leaves_queue(db_session, test_user, sample_location):
    counter = sample_location.counters[0]
    join_req = QueueJoinRequest(counter_id=counter.id)
    ticket = queues.join_queue(payload=join_req, db=db_session, current_user=test_user)

    # Leave voluntarily
    leave_req = QueueLeaveRequest(reason="Class starting now")
    cancelled = queues.leave_queue(queue_id=ticket.id, payload=leave_req, db=db_session, current_user=test_user)
    assert cancelled.status.value == "CANCELLED"
    assert cancelled.cancellation_reason == "Class starting now"

def test_notifications_flow(db_session, test_user):
    from app.services.notification_service import notification_service

    # Create notifications
    notification_service.create_notification(
        db=db_session,
        user_id=test_user.id,
        type=NotificationType.QUEUE_JOINED,
        title="Joined Queue",
        message="Ticket CEN-A-001 assigned."
    )
    notification_service.create_notification(
        db=db_session,
        user_id=test_user.id,
        type=NotificationType.TICKET_CALLED,
        title="Your Turn",
        message="Please proceed to counter."
    )

    notifs = notifications.list_notifications(db=db_session, current_user=test_user)
    assert len(notifs) == 2
    assert notifications.get_unread_count(db=db_session, current_user=test_user)["unread_count"] == 2

    # Mark single read
    notifications.mark_notification_read(notification_id=notifs[0].id, db=db_session, current_user=test_user)
    assert notifications.get_unread_count(db=db_session, current_user=test_user)["unread_count"] == 1

    # Mark all read
    notifications.mark_all_notifications_read(db=db_session, current_user=test_user)
    assert notifications.get_unread_count(db=db_session, current_user=test_user)["unread_count"] == 0

def test_analytics_endpoints(db_session, sample_location):
    overview = analytics.get_analytics_overview(db=db_session)
    assert overview.total_locations >= 1

    trends = analytics.get_crowd_trends(db=db_session)
    assert len(trends) == 12

    accuracy = analytics.get_wait_time_accuracy(db=db_session)
    assert len(accuracy) == 7

    counter_perf = analytics.get_counter_performance(db=db_session)
    assert len(counter_perf) >= 1
