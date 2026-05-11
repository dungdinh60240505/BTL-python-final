from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.asset import Asset
from app.models.asset_quantity import AssetQuantity
from app.models.category import Category, CategoryNeed
from app.models.supply import Supply
from app.schemas.category import CategoryNeedCreate, CategoryNeedUpdate


def get_category_need_by_id(
    db: Session,
    category_need_id: int,
) -> CategoryNeed | None:
    statement = (
        select(CategoryNeed)
        .options(selectinload(CategoryNeed.category), selectinload(CategoryNeed.department))
        .where(CategoryNeed.id == category_need_id)
    )
    return db.scalar(statement)


def get_category_need_or_404(
    db: Session,
    category_need_id: int,
) -> CategoryNeed:
    need = get_category_need_by_id(db, category_need_id)
    if need is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nhu cầu danh mục không tồn tại.",
        )
    return need


def ensure_category_need(db: Session, category_id: int, department_id: int | None) -> CategoryNeed | None:
    """Tạo CategoryNeed nếu chưa tồn tại với category_id và department_id.

    Trả về None nếu category_id hoặc department_id là None (không tạo).
    """
    if category_id is None or department_id is None:
        return None

    existing = db.execute(
        select(CategoryNeed).where(
            CategoryNeed.category_id == category_id,
            CategoryNeed.department_id == department_id,
        )
    ).scalar_one_or_none()

    if existing is not None:
        return existing

    need = CategoryNeed(
        category_id=category_id,
        department_id=department_id,
        require_quantity=0,
        is_active=True,
    )
    db.add(need)
    db.commit()
    db.refresh(need)
    return need


def _get_current_quantity(db: Session, category_id: int, category_type: str, department_id: int | None) -> int:
    """Tính tổng số lượng tài sản thực tế của danh mục trong phòng ban.

    - Loại 'asset'   → đếm bảng Asset (tài sản đơn lẻ)
    - Loại 'supply'  → đếm tổng quantity_in_stock bảng Supply (vật tư)
    """
    if department_id is None:
        return 0

    total = 0

    if category_type == "asset":
        asset_count = db.execute(
            select(func.count(Asset.id)).where(
                Asset.category_id == category_id,
                Asset.assigned_department_id == department_id,
                Asset.is_active == True,
            )
        ).scalar() or 0
        total += asset_count
    elif category_type == "supply":
        qty_sum = db.execute(
            select(func.coalesce(func.sum(Supply.quantity_in_stock), 0)).where(
                Supply.category_id == category_id,
                Supply.managed_department_id == department_id,
                Supply.is_active == True,
            )
        ).scalar() or 0
        total += float(qty_sum)

    return total


def list_category_needs(
    db: Session,
    *,
    skip: int = 0,
    limit: int = 200,
    department_id: int | None = None,
    category_id: int | None = None,
    is_active: bool | None = None,
) -> list[dict]:
    statement = (
        select(CategoryNeed)
        .options(selectinload(CategoryNeed.category), selectinload(CategoryNeed.department))
        .offset(skip)
        .limit(limit)
        .order_by(CategoryNeed.id.desc())
    )

    if department_id is not None:
        statement = statement.where(CategoryNeed.department_id == department_id)
    if category_id is not None:
        statement = statement.where(CategoryNeed.category_id == category_id)
    if is_active is not None:
        statement = statement.where(CategoryNeed.is_active == is_active)

    needs = list(db.scalars(statement).all())
    results = []
    for need in needs:
        current_qty = _get_current_quantity(
            db, need.category_id, need.category.category_type, need.department_id
        )
        results.append({
            "need": need,
            "current_quantity": current_qty,
        })
    return results


def create_category_need(
    db: Session,
    payload: CategoryNeedCreate,
) -> tuple[CategoryNeed, int]:
    need = CategoryNeed(
        category_id=payload.category_id,
        department_id=payload.department_id,
        require_quantity=payload.require_quantity,
        is_active=True,
    )
    db.add(need)
    db.commit()
    db.refresh(need)
    current_qty = _get_current_quantity(db, need.category_id, need.category.category_type, need.department_id)
    return need, current_qty


def update_category_need(
    db: Session,
    category_need: CategoryNeed,
    payload: CategoryNeedUpdate,
) -> tuple[CategoryNeed, int]:
    if payload.department_id is not None:
        category_need.department_id = payload.department_id
    if payload.require_quantity is not None:
        category_need.require_quantity = payload.require_quantity
    if payload.is_active is not None:
        category_need.is_active = payload.is_active
    db.add(category_need)
    db.commit()
    db.refresh(category_need)
    current_qty = _get_current_quantity(db, category_need.category_id, category_need.category.category_type, category_need.department_id)
    return category_need, current_qty


def delete_category_need(
    db: Session,
    category_need: CategoryNeed,
) -> None:
    db.delete(category_need)
    db.commit()
