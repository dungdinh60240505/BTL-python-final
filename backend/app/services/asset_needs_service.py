from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.asset_quantity import AssetQuantity


def get_asset_needs(db: Session, department_id: int) -> list[dict]:
    # Assets grouped by LOWER(category)
    asset_rows = db.execute(
        select(
            func.lower(Asset.category).label("category"),
            func.count(Asset.id).label("current_qty"),
            func.max(Asset.required_quantity_category).label("required_qty"),
        )
        .where(
            Asset.assigned_department_id == department_id,
            Asset.is_active == True,
        )
        .group_by(func.lower(Asset.category))
    ).all()

    # Quantity assets grouped by LOWER(category)
    qty_rows = db.execute(
        select(
            func.lower(AssetQuantity.category).label("category"),
            func.sum(AssetQuantity.available_quantity).label("current_qty"),
            func.max(AssetQuantity.required_quantity_category).label("required_qty"),
        )
        .where(
            AssetQuantity.assigned_department_id == department_id,
            AssetQuantity.is_active == True,
        )
        .group_by(func.lower(AssetQuantity.category))
    ).all()

    results = []
    for row in asset_rows:
        current = row.current_qty or 0
        required = row.required_qty or 5
        results.append({
            "category": row.category,
            "asset_type": "asset",
            "required_quantity_category": required,
            "current_quantity": current,
            "status": _calc_status(current, required),
        })

    for row in qty_rows:
        current = row.current_qty or 0
        required = row.required_qty or 200
        results.append({
            "category": row.category,
            "asset_type": "quantity_asset",
            "required_quantity_category": required,
            "current_quantity": current,
            "status": _calc_status(current, required),
        })

    return sorted(results, key=lambda r: (r["asset_type"], r["category"]))


def _calc_status(current: int, required: int) -> str:
    if current < required:
        return "shortage"
    if current == required:
        return "sufficient"
    return "surplus"


def update_required_quantity_category(
    db: Session,
    department_id: int,
    asset_type: str,
    category: str,
    required_quantity_category: int,
) -> int:
    normalized_category = category.strip().lower()

    if asset_type == "asset":
        result = db.execute(
            update(Asset)
            .where(
                func.lower(Asset.category) == normalized_category,
                Asset.assigned_department_id == department_id,
            )
            .values(required_quantity_category=required_quantity_category)
        )
    elif asset_type == "quantity_asset":
        result = db.execute(
            update(AssetQuantity)
            .where(
                func.lower(AssetQuantity.category) == normalized_category,
                AssetQuantity.assigned_department_id == department_id,
            )
            .values(required_quantity_category=required_quantity_category)
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="asset_type phải là 'asset' hoặc 'quantity_asset'.",
        )

    db.commit()
    return result.rowcount
