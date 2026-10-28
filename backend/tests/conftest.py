import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Add backend directory to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, backend_path)

from app.core.database import Base, get_db
from app.core.security import hash_password, create_access_token
from app.models.entities import User, Organization, Location, ServiceCounter, QueueSession
from app.models.enums import UserRole, CounterStatus, QueueStatus
from app.main import app

# In-memory SQLite with StaticPool so all threads share the memory DB
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(autouse=True)
def setup_tables():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def client():
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app, raise_server_exceptions=True)
    app.dependency_overrides.clear()

@pytest.fixture
def test_user(db_session) -> User:
    user = User(
        name="Test Student",
        email="student.test@vitcampus.edu",
        password_hash=hash_password("Password123!"),
        role=UserRole.USER.value,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_admin(db_session) -> User:
    admin = User(
        name="Test Administrator",
        email="admin.test@vitcampus.edu",
        password_hash=hash_password("AdminPass123!"),
        role=UserRole.PLATFORM_ADMIN.value,
        is_active=True
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin

@pytest.fixture
def user_token(test_user) -> str:
    return create_access_token(subject=test_user.id)

@pytest.fixture
def admin_token(test_admin) -> str:
    return create_access_token(subject=test_admin.id)

@pytest.fixture
def user_headers(user_token) -> dict:
    return {"Authorization": f"Bearer {user_token}"}

@pytest.fixture
def admin_headers(admin_token) -> dict:
    return {"Authorization": f"Bearer {admin_token}"}

@pytest.fixture
def sample_location(db_session) -> Location:
    org = Organization(name="Test Org", slug="test-org")
    db_session.add(org)
    db_session.flush()

    loc = Location(
        organization_id=org.id,
        name="Test Dining Hall",
        slug="test-dining-hall",
        description="A great place to eat on campus.",
        category="cafeteria",
        address="Building 4, Room 101",
        latitude=12.9700,
        longitude=79.1600,
        opening_hours="08:00 AM - 08:00 PM",
        low_threshold=10,
        mod_threshold=25,
        crowd_capacity=80,
        is_active=True
    )
    db_session.add(loc)
    db_session.flush()

    counter = ServiceCounter(
        location_id=loc.id,
        name="Counter 1 - Bowls",
        code="B1",
        status=CounterStatus.OPEN.value,
        average_service_seconds=120,
        queue_capacity=30
    )
    db_session.add(counter)
    db_session.commit()
    db_session.refresh(loc)
    return loc
