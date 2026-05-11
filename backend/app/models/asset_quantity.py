from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Enum as SqlEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.asset import AssetCondition, AssetStatus

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.department import Department
    from app.models.location_quantity_asset import LocationQuantityAsset
    from app.models.user import User


class QuantityAssetApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class AssetQuantity(Base):
    """Asset managed by quantity (bulk items such as chairs, desks, computers)."""

    __tablename__ = "quantity_assets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    code: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    available_quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    serial_number: Mapped[str | None] = mapped_column(
        String(100), unique=True, nullable=True
    )
    specification: Mapped[str | None] = mapped_column(Text, nullable=True)
    purchase_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    useful_life: Mapped[int | None] = mapped_column(Integer, nullable=True)
    purchase_cost: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)

    status: Mapped[AssetStatus] = mapped_column(
        SqlEnum(
            AssetStatus,
            name="asset_quantity_status",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
            native_enum=False,
            validate_strings=True,
        ),
        default=AssetStatus.AVAILABLE,
        nullable=False,
    )

    condition: Mapped[AssetCondition] = mapped_column(
        SqlEnum(
            AssetCondition,
            name="asset_quantity_condition",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
            native_enum=False,
            validate_strings=True,
        ),
        default=AssetCondition.GOOD,
        nullable=False,
    )

    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    approval_status: Mapped[QuantityAssetApprovalStatus] = mapped_column(
        SqlEnum(
            QuantityAssetApprovalStatus,
            name="quantity_asset_approval_status",
            values_callable=lambda enum_cls: [e.value for e in enum_cls],
            native_enum=False,
            validate_strings=True,
        ),
        default=QuantityAssetApprovalStatus.PENDING,
        nullable=False,
    )
    required_quantity_category: Mapped[int] = mapped_column(
        Integer, default=200, nullable=False
    )

    assigned_department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
    )
    assigned_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("category.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    assigned_department: Mapped["Department | None"] = relationship("Department")
    assigned_user: Mapped["User | None"] = relationship("User")
    category: Mapped["Category | None"] = relationship("Category")
    locations: Mapped[list["LocationQuantityAsset"]] = relationship(
        "LocationQuantityAsset", back_populates="quantity_asset", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint(
            "available_quantity >= 0 AND available_quantity <= quantity",
            name="available_quantity_check",
        ),
        CheckConstraint("required_quantity_category >= 0", name="required_quantity_category_check"),
    )

    def __repr__(self) -> str:
        return (
            f"AssetQuantity(id={self.id!r}, name={self.name!r}, "
            f"code={self.code!r}, quantity={self.quantity!r}, "
            f"available_quantity={self.available_quantity!r})"
        )
