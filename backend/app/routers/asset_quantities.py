from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_roles
from app.models.asset import AssetCondition, AssetStatus
from app.models.user import User, UserRole
from app.schemas.asset_quantity import (
    AssetQuantityCreate,
    AssetQuantityResponse,
    AssetQuantityStatusUpdate,
    AssetQuantityUpdate,
)
from app.services.asset_quantity_service import (
    create_asset_quantity,
    deactivate_asset_quantity,
    get_asset_quantity_or_404,
    list_asset_quantities,
    update_asset_quantity,
    update_asset_quantity_status,
)

router = APIRouter(prefix="/asset-quantities", tags=["Asset Quantities"])


@router.get("", response_model=list[AssetQuantityResponse])
def read_asset_quantities(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    keyword: str | None = Query(default=None, min_length=1, max_length=255),
    category: str | None = Query(default=None, min_length=1, max_length=100),
    status_filter: AssetStatus | None = Query(default=None, alias="status"),
    condition_filter: AssetCondition | None = Query(default=None, alias="condition"),
    assigned_department_id: int | None = Query(default=None, ge=1),
    assigned_user_id: int | None = Query(default=None, ge=1),
    is_active: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
    ),
):
    return list_asset_quantities(
        db=db,
        skip=skip,
        limit=limit,
        keyword=keyword,
        category=category,
        status_filter=status_filter.value if status_filter is not None else None,
        condition_filter=condition_filter.value if condition_filter is not None else None,
        assigned_department_id=assigned_department_id,
        assigned_user_id=assigned_user_id,
        is_active=is_active,
        current_user=current_user,
    )


@router.get("/{asset_quantity_id}", response_model=AssetQuantityResponse)
def read_asset_quantity(
    asset_quantity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
    ),
):
    return get_asset_quantity_or_404(
        db=db,
        asset_quantity_id=asset_quantity_id,
        current_user=current_user,
    )


@router.post(
    "",
    response_model=AssetQuantityResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_asset_quantity(
    payload: AssetQuantityCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    return create_asset_quantity(db=db, payload=payload)


@router.put("/{asset_quantity_id}", response_model=AssetQuantityResponse)
def update_existing_asset_quantity(
    asset_quantity_id: int,
    payload: AssetQuantityUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    asset_quantity = get_asset_quantity_or_404(db=db, asset_quantity_id=asset_quantity_id)
    return update_asset_quantity(db=db, asset_quantity=asset_quantity, payload=payload)


@router.patch("/{asset_quantity_id}/status", response_model=AssetQuantityResponse)
def update_existing_asset_quantity_status(
    asset_quantity_id: int,
    payload: AssetQuantityStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    asset_quantity = get_asset_quantity_or_404(db=db, asset_quantity_id=asset_quantity_id)
    return update_asset_quantity_status(
        db=db,
        asset_quantity=asset_quantity,
        payload=payload,
    )


@router.patch("/{asset_quantity_id}/deactivate", response_model=AssetQuantityResponse)
def deactivate_existing_asset_quantity(
    asset_quantity_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    asset_quantity = get_asset_quantity_or_404(db=db, asset_quantity_id=asset_quantity_id)
    return deactivate_asset_quantity(db=db, asset_quantity=asset_quantity)

