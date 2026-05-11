from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.schemas.category import CategoryNeedCreate, CategoryNeedUpdate
from app.services.category_needs_service import (
    create_category_need,
    delete_category_need,
    get_category_need_or_404,
    list_category_needs,
    update_category_need
)


router = APIRouter(prefix="/category-needs", tags=["Category Needs"])


class CategoryNeedDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category_id: int
    department_id: int | None = None
    require_quantity: int
    detail: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    current_quantity: int = 0

    category_name: str | None = None
    category_code: str | None = None
    category_type: str | None = None
    department_name: str | None = None
    department_code: str | None = None


def _map_to_response(need, current_quantity: int) -> CategoryNeedDetailResponse:
    return CategoryNeedDetailResponse(
        id=need.id,
        category_id=need.category_id,
        department_id=need.department_id,
        require_quantity=need.require_quantity,
        detail=need.detail if need.category else None,
        is_active=need.is_active,
        created_at=need.created_at,
        updated_at=need.updated_at,
        current_quantity=current_quantity,
        category_name=need.category.category_name if need.category else None,
        category_code=need.category.category_code if need.category else None,
        category_type=need.category.category_type if need.category else None,
        department_name=need.department.name if need.department else None,
        department_code=need.department.code if need.department else None,
    )


@router.get("", response_model=list[CategoryNeedDetailResponse])
def read_category_needs(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=200, ge=1, le=500),
    department_id: int | None = Query(default=None, ge=1),
    category_id: int | None = Query(default=None, ge=1),
    is_active: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    results = list_category_needs(
        db=db,
        skip=skip,
        limit=limit,
        department_id=department_id,
        category_id=category_id,
        is_active=is_active,
    )
    return [_map_to_response(r["need"], r["current_quantity"]) for r in results]


@router.post(
    "",
    response_model=CategoryNeedDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_category_need(
    payload: CategoryNeedCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    need, current_qty = create_category_need(db=db, payload=payload)
    need = get_category_need_or_404(db=db, category_need_id=need.id)
    return _map_to_response(need, current_qty)


@router.patch(
    "/{category_need_id}",
    response_model=CategoryNeedDetailResponse,
)
def update_existing_category_need(
    category_need_id: int,
    payload: CategoryNeedUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    
    need = get_category_need_or_404(db=db, category_need_id=category_need_id)
    #bị lỗi ở đây, không tìm thấy id
    need, current_qty = update_category_need(db=db, category_need=need, payload=payload)
    return _map_to_response(need, current_qty)


@router.delete("/{category_need_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_category_need(
    category_need_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    need = get_category_need_or_404(db=db, category_need_id=category_need_id)
    delete_category_need(db=db, category_need=need)
