from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.analytics_service import analytics_service
from app.schemas.analytics import (
    AnalyticsOverview, VolumeTrendPoint, WaitTimeAccuracyPoint,
    CounterPerformancePoint, LocationComparisonPoint
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview", response_model=AnalyticsOverview)
def get_analytics_overview(location_id: Optional[str] = None, db: Session = Depends(get_db)):
    return analytics_service.get_overview(db, location_id)

@router.get("/wait-times", response_model=List[WaitTimeAccuracyPoint])
def get_wait_time_accuracy(location_id: Optional[str] = None, db: Session = Depends(get_db)):
    return analytics_service.get_wait_time_accuracy(db, location_id)

@router.get("/crowd-trends", response_model=List[VolumeTrendPoint])
def get_crowd_trends(location_id: Optional[str] = None, db: Session = Depends(get_db)):
    return analytics_service.get_volume_trends(db, location_id)

@router.get("/counter-performance", response_model=List[CounterPerformancePoint])
def get_counter_performance(location_id: Optional[str] = None, db: Session = Depends(get_db)):
    return analytics_service.get_counter_performance(db, location_id)

@router.get("/location-comparisons", response_model=List[LocationComparisonPoint])
def get_location_comparisons(db: Session = Depends(get_db)):
    return analytics_service.get_location_comparisons(db)
