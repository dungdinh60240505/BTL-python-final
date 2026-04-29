from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.user import User, UserRole
from app.services.asset_needs_service import get_asset_needs, update_required_quantity_category

router = APIRouter(prefix="/asset-needs", tags=["Asset Needs"])


class AssetNeedsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=False)
    category: str
    asset_type: str
    required_quantity_category: int
    current_quantity: int
    status: str


class CategoryRequirementUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    department_id: int = Field(ge=1)
    asset_type: str
    category: str = Field(min_length=1)
    required_quantity_category: int = Field(ge=0)


@router.get("", response_model=list[AssetNeedsResponse])
def read_asset_needs(
    department_id: int = Query(ge=1),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    return get_asset_needs(db=db, department_id=department_id)


@router.patch("/category-requirement")
def patch_category_requirement(
    payload: CategoryRequirementUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    updated = update_required_quantity_category(
        db=db,
        department_id=payload.department_id,
        asset_type=payload.asset_type,
        category=payload.category,
        required_quantity_category=payload.required_quantity_category,
    )
    return {"updated_rows": updated}
