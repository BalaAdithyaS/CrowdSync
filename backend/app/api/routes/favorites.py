from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.models.entities import UserFavorite, Location, User
from app.schemas.location import LocationOut
from app.api.deps import get_current_user
from app.api.routes.locations import get_location

router = APIRouter(prefix="/favorites", tags=["Favorites"])

@router.get("", response_model=List[LocationOut])
def list_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    favs = list(db.execute(
        select(UserFavorite.location_id).where(UserFavorite.user_id == current_user.id)
    ).scalars().all())

    results = []
    for loc_id in favs:
        try:
            loc_out = get_location(location_id=loc_id, db=db, current_user=current_user)
            results.append(loc_out)
        except HTTPException:
            continue
    return results

@router.post("/{location_id}", status_code=status.HTTP_201_CREATED)
def add_favorite(
    location_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    loc = db.execute(select(Location).where(Location.id == location_id)).scalar_one_or_none()
    if not loc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")

    existing = db.execute(
        select(UserFavorite).where(
            UserFavorite.user_id == current_user.id,
            UserFavorite.location_id == location_id
        )
    ).scalar_one_or_none()
    if existing:
        return {"message": "Already favorited", "location_id": location_id}

    fav = UserFavorite(user_id=current_user.id, location_id=location_id)
    db.add(fav)
    db.commit()
    return {"message": "Added to favorites", "location_id": location_id}

@router.delete("/{location_id}")
def remove_favorite(
    location_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    fav = db.execute(
        select(UserFavorite).where(
            UserFavorite.user_id == current_user.id,
            UserFavorite.location_id == location_id
        )
    ).scalar_one_or_none()
    if fav:
        db.delete(fav)
        db.commit()
    return {"message": "Removed from favorites", "location_id": location_id}
