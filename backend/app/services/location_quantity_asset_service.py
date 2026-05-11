from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.location_quantity_asset import LocationApprovalStatus, LocationQuantityAsset
from app.schemas.location_quantity_asset import (
    LocationQuantityAssetCreate,
    LocationQuantityAssetUpdate,
)

KHO_ROOM_CODE = "KHO"


def _get_kho_row(db: Session, quantity_assets_id: int) -> LocationQuantityAsset | None:
    return db.scalar(
        select(LocationQuantityAsset).where(
            LocationQuantityAsset.quantity_assets_id == quantity_assets_id,
            LocationQuantityAsset.room_code == KHO_ROOM_CODE,
        )
    )


def list_locations(db: Session, quantity_assets_id: int) -> list[LocationQuantityAsset]:
    rows = db.scalars(
        select(LocationQuantityAsset)
        .where(LocationQuantityAsset.quantity_assets_id == quantity_assets_id)
        .order_by(LocationQuantityAsset.id)
    ).all()
    # KHO luôn đứng đầu
    return sorted(rows, key=lambda r: (0 if r.room_code == KHO_ROOM_CODE else 1, r.id))


def create_kho_location(db: Session, quantity_assets_id: int, lot_quantity: int) -> LocationQuantityAsset:
    existing = _get_kho_row(db, quantity_assets_id)
    if existing:
        return existing

    kho = LocationQuantityAsset(
        room_code=KHO_ROOM_CODE,
        quantity=lot_quantity,
        used=0,
        status_approval=LocationApprovalStatus.APPROVAL,
        quantity_assets_id=quantity_assets_id,
    )
    db.add(kho)
    db.commit()
    db.refresh(kho)
    return kho


def create_location(
    db: Session,
    quantity_assets_id: int,
    payload: LocationQuantityAssetCreate,
) -> LocationQuantityAsset:
    kho = _get_kho_row(db, quantity_assets_id)
    if kho is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lô tài sản chưa được duyệt hoặc chưa có kho.",
        )

    if kho.quantity - payload.quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Số lượng KHO không đủ. Hiện còn {kho.quantity}.",
        )

    kho.quantity -= payload.quantity
    db.add(kho)

    location = LocationQuantityAsset(
        room_code=payload.room_code.strip().upper(),
        quantity=payload.quantity,
        used=0,
        status_approval=LocationApprovalStatus.PENDING,
        quantity_assets_id=quantity_assets_id,
    )
    db.add(location)
    db.commit()
    db.refresh(location)
    return location


def update_location(
    db: Session,
    quantity_assets_id: int,
    location_id: int,
    payload: LocationQuantityAssetUpdate,
) -> LocationQuantityAsset:
    location = db.scalar(
        select(LocationQuantityAsset).where(
            LocationQuantityAsset.id == location_id,
            LocationQuantityAsset.quantity_assets_id == quantity_assets_id,
        )
    )
    if location is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vị trí không tìm thấy.")
    if location.room_code == KHO_ROOM_CODE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể sửa hàng KHO.")

    kho = _get_kho_row(db, quantity_assets_id)
    if kho is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không tìm thấy KHO.")

    delta = payload.quantity - location.quantity
    if kho.quantity - delta < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Số lượng KHO không đủ. Hiện còn {kho.quantity}.",
        )

    kho.quantity -= delta
    location.quantity = payload.quantity
    db.add(kho)
    db.add(location)
    db.commit()
    db.refresh(location)
    return location


def approve_location_service(
    db: Session,
    quantity_assets_id: int,
    location_id: int,
) -> None:
    location = db.scalar(
        select(LocationQuantityAsset).where(
            LocationQuantityAsset.id == location_id,
            LocationQuantityAsset.quantity_assets_id == quantity_assets_id,
        )
    )
    if location is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vị trí không tìm thấy.")
    if location.room_code == KHO_ROOM_CODE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể sửa hàng KHO.")

    if location.status_approval == LocationApprovalStatus.APPROVAL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Đã approve trước đó.",
        )

    location.status_approval = LocationApprovalStatus.APPROVAL

    db.add(location)
    db.commit()
    db.refresh(location)
    return location


def delete_location(db: Session, quantity_assets_id: int, location_id: int) -> None:
    location = db.scalar(
        select(LocationQuantityAsset).where(
            LocationQuantityAsset.id == location_id,
            LocationQuantityAsset.quantity_assets_id == quantity_assets_id,
        )
    )
    if location is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vị trí không tìm thấy.")
    if location.room_code == KHO_ROOM_CODE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể xóa hàng KHO.")

    kho = _get_kho_row(db, quantity_assets_id)
    if kho is not None:
        kho.quantity += location.quantity
        db.add(kho)

    db.delete(location)
    db.commit()
