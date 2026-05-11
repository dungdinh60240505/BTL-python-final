from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.schemas.category import (
    CategoryCreate,
    CategoryDetailResponse,
    CategoryNeedUpdate,
    CategoryResponse,
    CategoryUpdate,
)
from app.services.category_service import (
    create_category,
    delete_category,
    get_category_need_or_404,
    get_category_or_404,
    list_categories,
    update_category,
    update_category_need,
    upsert_category_need,
)

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=list[CategoryResponse])
def read_categories(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    category_type: str | None = Query(default=None, pattern="^(supply|asset)$"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    return list_categories(db=db, skip=skip, limit=limit, category_type=category_type)


@router.get("/{category_id}", response_model=CategoryDetailResponse)
def read_category(
    category_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    return get_category_or_404(db=db, category_id=category_id)


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    return create_category(db=db, payload=payload)


@router.put("/{category_id}", response_model=CategoryResponse)
def update_existing_category(
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    category = get_category_or_404(db=db, category_id=category_id)
    return update_category(db=db, category=category, payload=payload)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_category(
    category_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    category = get_category_or_404(db=db, category_id=category_id)
    delete_category(db=db, category=category)


@router.patch(
    "/{category_id}/require-quantity",
    response_model=CategoryDetailResponse,
)
def upsert_category_require_quantity(
    category_id: int,
    payload: CategoryNeedUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    category = get_category_or_404(db=db, category_id=category_id)
    upsert_category_need(db=db, category_id=category.id, department_id=payload.department_id, payload=payload)
    return get_category_or_404(db=db, category_id=category.id)
