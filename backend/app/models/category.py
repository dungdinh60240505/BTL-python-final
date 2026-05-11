from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.models.department import Department

from app.core.database import Base


class CategoryType(str, Enum):
    SUPPLY = "supply"
    ASSET = "asset"


class Category(Base):
    """Danh mục phân loại tài sản hoặc vật tư."""

    __tablename__ = "category"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    category_code: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    category_type: Mapped[CategoryType] = mapped_column(
        String(20),
        default=CategoryType.SUPPLY,
        nullable=False,
    )
    category_name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    needs: Mapped[list["CategoryNeed"]] = relationship(
        "CategoryNeed", back_populates="category", cascade="all, delete-orphan"
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

    __table_args__ = (
        CheckConstraint(
            "category_type IN ('supply', 'asset')",
            name="category_type_check",
        ),
    )

    def __repr__(self) -> str:
        return (
            f"Category(id={self.id!r}, code={self.category_code!r}, "
            f"type={self.category_type!r}, name={self.category_name!r})"
        )


class CategoryNeed(Base):
    """Nhu cầu số lượng cho mỗi danh mục theo phòng ban."""

    __tablename__ = "category_need"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("category.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    require_quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    detail: Mapped[str] = mapped_column(String(255), index=False, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    category: Mapped[Category] = relationship("Category", back_populates="needs")
    department: Mapped["Department"] = relationship("Department")

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

    __table_args__ = (
        CheckConstraint("require_quantity >= 0", name="require_quantity_check"),
    )

    def __repr__(self) -> str:
        return (
            f"CategoryNeed(id={self.id!r}, category_id={self.category_id!r}, "
            f"department_id={self.department_id!r}, require_quantity={self.require_quantity!r})"
        )
