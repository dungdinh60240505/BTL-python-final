from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CategoryBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category_code: str = Field(min_length=2, max_length=50)
    category_name: str = Field(min_length=1, max_length=100)
    category_type: str = Field(
        pattern="^(supply|asset)$",
        description="Loại danh mục: 'supply' hoặc 'asset'",
    )
    description: str | None = Field(default=None, max_length=2000)
    note: str | None = Field(default=None, max_length=2000)


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category_code: str | None = Field(default=None, min_length=2, max_length=50)
    category_name: str | None = Field(default=None, min_length=1, max_length=100)
    category_type: str | None = Field(
        default=None,
        pattern="^(supply|asset)$",
    )
    description: str | None = Field(default=None, max_length=2000)
    note: str | None = Field(default=None, max_length=2000)
    is_active: bool | None = None


class CategoryNeedBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category_id: int = Field(ge=1)
    department_id: int | None = Field(default=None, ge=1)
    require_quantity: int = Field(ge=0)


class CategoryNeedCreate(CategoryNeedBase):
    pass


class CategoryNeedUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    department_id: int | None = Field(default=None, ge=1)
    require_quantity: int = Field(ge=0)
    is_active: bool | None = None


class CategoryNeedResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category_id: int
    department_id: int | None = None
    require_quantity: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CategorySimple(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    category_code: str
    category_name: str


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category_code: str
    category_name: str
    category_type: str
    description: str | None = None
    note: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CategoryDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category_code: str
    category_name: str
    category_type: str
    description: str | None = None
    note: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    needs: list[CategoryNeedResponse] = []
