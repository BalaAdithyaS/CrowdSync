import os
import sys
from datetime import datetime, timedelta, timezone

# Add backend directory to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_path)

from app.core.database import SessionLocal, engine, Base
from app.core.security import hash_password
from app.models.entities import (
    User, Organization, OrganizationMembership, Location, ServiceCounter,
    QueueSession, ServiceObservation, CrowdObservation, Notification, AuditLog
)
from app.models.enums import UserRole, CounterStatus, QueueStatus, NotificationType

def seed():
    print("Initializing database tables...", flush=True)
    Base.metadata.create_all(bind=engine)

    session = SessionLocal()
    try:
        print("Checking existing data...", flush=True)
        from sqlalchemy import select
        res = session.execute(select(Organization).where(Organization.slug == "vit-campus-demo"))
        if res.scalar_one_or_none():
            print("VIT Campus Demo organization already seeded! Re-seeding skipped.", flush=True)
            return

        print("Seeding Users...", flush=True)
        admin_user = User(
            name="Campus Administrator",
            email="admin@vitcampus.edu",
            password_hash=hash_password("AdminPass123!"),
            role=UserRole.PLATFORM_ADMIN.value,
            is_active=True,
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
        )
        staff_user = User(
            name="Counter Operator Sarah",
            email="staff@vitcampus.edu",
            password_hash=hash_password("StaffPass123!"),
            role=UserRole.LOCATION_ADMIN.value,
            is_active=True,
            avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
        )
        student_user = User(
            name="Alex Rivera",
            email="student@vitcampus.edu",
            password_hash=hash_password("StudentPass123!"),
            role=UserRole.USER.value,
            is_active=True,
            avatar_url="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"
        )
        peer_user_1 = User(
            name="Jordan Lee",
            email="jordan.lee@vitcampus.edu",
            password_hash=hash_password("UserPass123!"),
            role=UserRole.USER.value,
            is_active=True
        )
        peer_user_2 = User(
            name="Taylor Chen",
            email="taylor.chen@vitcampus.edu",
            password_hash=hash_password("UserPass123!"),
            role=UserRole.USER.value,
            is_active=True
        )
        session.add_all([admin_user, staff_user, student_user, peer_user_1, peer_user_2])
        session.flush()

        print("Seeding Organization...", flush=True)
        org = Organization(
            name="VIT Campus Demo",
            slug="vit-campus-demo",
            description="Demonstration organization for VIT University Campus smart crowd monitoring and queue management."
        )
        session.add(org)
        session.flush()

        # Memberships
        session.add(OrganizationMembership(
            organization_id=org.id,
            user_id=admin_user.id,
            role=UserRole.PLATFORM_ADMIN.value
        ))
        session.add(OrganizationMembership(
            organization_id=org.id,
            user_id=staff_user.id,
            role=UserRole.LOCATION_ADMIN.value
        ))

        print("Seeding Campus Locations...", flush=True)
        now = datetime.now(timezone.utc)
        
        locations_data = [
            {
                "name": "Central Food Park & Cafeteria",
                "slug": "central-cafeteria",
                "description": "Multi-cuisine dining hall featuring express hot lunch counters, healthy salad bars, and beverage stations.",
                "category": "cafeteria",
                "address": "Student Activity Center, Level 1",
                "latitude": 12.9698,
                "longitude": 79.1559,
                "image_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
                "opening_hours": "07:30 AM - 09:30 PM",
                "low_threshold": 12,
                "mod_threshold": 30,
                "crowd_capacity": 150,
                "counters": [
                    {"name": "Counter A - Express Lunch Meals", "code": "A", "avg_sec": 120, "cap": 40},
                    {"name": "Counter B - Special Thali & Grills", "code": "B", "avg_sec": 240, "cap": 30},
                    {"name": "Counter C - Fresh Juices & Desserts", "code": "C", "avg_sec": 90, "cap": 25},
                ]
            },
            {
                "name": "Periyar Central Library",
                "slug": "central-library",
                "description": "Four-floor academic sanctuary with borrowing desks, quiet study reserves, digital media pods, and archive returns.",
                "category": "library",
                "address": "Academic Block East, Ground Floor",
                "latitude": 12.9712,
                "longitude": 79.1585,
                "image_url": "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&auto=format&fit=crop&q=80",
                "opening_hours": "08:00 AM - 11:00 PM",
                "low_threshold": 8,
                "mod_threshold": 22,
                "crowd_capacity": 80,
                "counters": [
                    {"name": "Circulation & Book Issue", "code": "CIR", "avg_sec": 150, "cap": 30},
                    {"name": "Research Reserves & Query Desk", "code": "RES", "avg_sec": 300, "cap": 20},
                ]
            },
            {
                "name": "Student Care & Registrar Center",
                "slug": "student-service-center",
                "description": "Single-window student administration for official transcripts, scholarship verification, fee clearance, and ID cards.",
                "category": "service_counter",
                "address": "Administrative Complex, Hall B",
                "latitude": 12.9705,
                "longitude": 79.1572,
                "image_url": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80",
                "opening_hours": "09:00 AM - 05:00 PM",
                "low_threshold": 10,
                "mod_threshold": 25,
                "crowd_capacity": 100,
                "counters": [
                    {"name": "Desk 1 - Transcripts & Certificates", "code": "TR1", "avg_sec": 210, "cap": 40},
                    {"name": "Desk 2 - Financial Aid & Billing", "code": "FA2", "avg_sec": 300, "cap": 30},
                    {"name": "Desk 3 - General Inquiries & Campus ID", "code": "ID3", "avg_sec": 120, "cap": 25},
                ]
            },
            {
                "name": "Artisan Coffee Corner & Bakery",
                "slug": "coffee-corner",
                "description": "Quick-brew specialty coffee, freshly baked croissants, and cold refreshments for students on the move.",
                "category": "food_court",
                "address": "Technology Tower Atrium",
                "latitude": 12.9721,
                "longitude": 79.1598,
                "image_url": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80",
                "opening_hours": "07:00 AM - 10:00 PM",
                "low_threshold": 6,
                "mod_threshold": 18,
                "crowd_capacity": 60,
                "counters": [
                    {"name": "Barista Station 1 - Hot Brews", "code": "B1", "avg_sec": 110, "cap": 25},
                    {"name": "Grab & Go - Bakery & Cold Drinks", "code": "GG", "avg_sec": 60, "cap": 20},
                ]
            },
            {
                "name": "Campus Health & Wellness Clinic",
                "slug": "campus-health-clinic",
                "description": "Outpatient clinic providing rapid triage, physician consultations, first aid, and prescription dispensaries.",
                "category": "clinic",
                "address": "Health Pavilion, Block C",
                "latitude": 12.9687,
                "longitude": 79.1542,
                "image_url": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80",
                "opening_hours": "08:00 AM - 08:00 PM",
                "low_threshold": 5,
                "mod_threshold": 15,
                "crowd_capacity": 50,
                "counters": [
                    {"name": "Triage & Vitals Check", "code": "TRG", "avg_sec": 180, "cap": 20},
                    {"name": "Pharmacy & Prescription Dispense", "code": "RX", "avg_sec": 150, "cap": 25},
                ]
            }
        ]

        seeded_counters = []
        first_counter = None

        for loc_info in locations_data:
            loc = Location(
                organization_id=org.id,
                name=loc_info["name"],
                slug=loc_info["slug"],
                description=loc_info["description"],
                category=loc_info["category"],
                address=loc_info["address"],
                latitude=loc_info["latitude"],
                longitude=loc_info["longitude"],
                image_url=loc_info["image_url"],
                opening_hours=loc_info["opening_hours"],
                low_threshold=loc_info["low_threshold"],
                mod_threshold=loc_info["mod_threshold"],
                crowd_capacity=loc_info["crowd_capacity"],
                is_active=True,
                created_at=now - timedelta(days=30)
            )
            session.add(loc)
            session.flush()

            for c_info in loc_info["counters"]:
                counter = ServiceCounter(
                    location_id=loc.id,
                    name=c_info["name"],
                    code=c_info["code"],
                    status=CounterStatus.OPEN.value,
                    average_service_seconds=c_info["avg_sec"],
                    queue_capacity=c_info["cap"],
                    created_at=now - timedelta(days=30)
                )
                session.add(counter)
                session.flush()
                seeded_counters.append((loc, counter))
                if first_counter is None:
                    first_counter = (loc, counter)

                for i in range(12):
                    dur = c_info["avg_sec"] + ((-25 if i % 2 == 0 else 35) + (i * 3))
                    obs = ServiceObservation(
                        counter_id=counter.id,
                        queue_session_id=f"hist-{counter.id[:8]}-{i}",
                        service_duration_seconds=max(45, dur),
                        recorded_at=now - timedelta(hours=i*2, minutes=15)
                    )
                    session.add(obs)

                session.add(CrowdObservation(
                    location_id=loc.id,
                    observed_count=c_info["cap"] // 3,
                    source="SIMULATED",
                    observed_at=now - timedelta(minutes=10)
                ))

        print("Seeding Queue Sessions...", flush=True)
        caf_loc, caf_counter = first_counter
        student_session = QueueSession(
            user_id=student_user.id,
            counter_id=caf_counter.id,
            location_id=caf_loc.id,
            ticket_number="CEN-A-003",
            sequence_number=3,
            status=QueueStatus.WAITING.value,
            joined_at=now - timedelta(minutes=4),
            estimated_wait_seconds=240
        )
        session.add(student_session)

        peer_session_1 = QueueSession(
            user_id=peer_user_1.id,
            counter_id=caf_counter.id,
            location_id=caf_loc.id,
            ticket_number="CEN-A-002",
            sequence_number=2,
            status=QueueStatus.APPROACHING.value,
            joined_at=now - timedelta(minutes=7),
            estimated_wait_seconds=120
        )
        session.add(peer_session_1)

        peer_session_2 = QueueSession(
            user_id=peer_user_2.id,
            counter_id=caf_counter.id,
            location_id=caf_loc.id,
            ticket_number="CEN-A-001",
            sequence_number=1,
            status=QueueStatus.SERVING.value,
            joined_at=now - timedelta(minutes=12),
            called_at=now - timedelta(minutes=3),
            service_started_at=now - timedelta(minutes=2),
            actual_wait_seconds=540
        )
        session.add(peer_session_2)

        for idx in range(15):
            comp_time = now - timedelta(hours=idx % 8, minutes=20 + idx)
            join_time = comp_time - timedelta(minutes=6 + (idx % 4))
            call_time = comp_time - timedelta(minutes=2 + (idx % 2))
            hist_sess = QueueSession(
                user_id=student_user.id if idx == 0 else peer_user_1.id,
                counter_id=caf_counter.id,
                location_id=caf_loc.id,
                ticket_number=f"CEN-A-{100 + idx}",
                sequence_number=100 + idx,
                status=QueueStatus.COMPLETED.value,
                joined_at=join_time,
                called_at=call_time,
                service_started_at=call_time + timedelta(seconds=20),
                completed_at=comp_time,
                actual_wait_seconds=int((call_time - join_time).total_seconds()),
                actual_service_seconds=int((comp_time - call_time).total_seconds())
            )
            session.add(hist_sess)

        print("Seeding Initial Notifications...", flush=True)
        session.add(Notification(
            user_id=student_user.id,
            type=NotificationType.QUEUE_JOINED.value,
            title="Joined Central Food Park Queue",
            message="You received ticket CEN-A-003 for Counter A - Express Lunch Meals. 2 people ahead of you.",
            related_queue_id=student_session.id,
            is_read=False,
            created_at=now - timedelta(minutes=4)
        ))
        session.add(Notification(
            user_id=student_user.id,
            type=NotificationType.POSITION_UPDATED.value,
            title="Queue Position Update",
            message="Ticket CEN-A-001 called to counter. You moved up to position 2.",
            related_queue_id=student_session.id,
            is_read=False,
            created_at=now - timedelta(minutes=2)
        ))

        session.add(AuditLog(
            organization_id=org.id,
            actor_user_id=admin_user.id,
            action="INITIAL_SEED",
            target_type="SYSTEM",
            details="Seeded initial VIT Campus Demo platform data and locations.",
            created_at=now
        ))

        session.commit()
        print("\n=== VIT Campus Demo Seed Completed Successfully! ===", flush=True)
        print("Demo Accounts:", flush=True)
        print("1. Admin: admin@vitcampus.edu / AdminPass123! (PLATFORM_ADMIN)", flush=True)
        print("2. Staff: staff@vitcampus.edu / StaffPass123! (LOCATION_ADMIN)", flush=True)
        print("3. Student: student@vitcampus.edu / StudentPass123! (USER)", flush=True)
        print("Locations seeded: 5 (Cafeteria, Library, Student Services, Coffee Corner, Health Clinic)", flush=True)
        print("===================================================\n", flush=True)
    finally:
        session.close()

if __name__ == "__main__":
    seed()
