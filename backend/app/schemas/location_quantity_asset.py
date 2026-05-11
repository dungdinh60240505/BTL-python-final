from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from app.models.location_quantity_asset import LocationApprovalStatus


class LocationQuantityAssetBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    room_code: str = Field(min_length=1, max_length=50, default="KHO")
    quantity: int = Field(default=0, ge=0)
    used: int = Field(default=0, ge=0)
    status_approval: LocationApprovalStatus = LocationApprovalStatus.PENDING


class LocationQuantityAssetCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    room_code: str = Field(min_length=1, max_length=50)
    quantity: int = Field(ge=1)


class LocationQuantityAssetUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    quantity: int = Field(ge=0)
    used: int | None = Field(default=None, ge=0)
    status_approval: LocationApprovalStatus | None = None


class LocationQuantityAssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    room_code: str
    quantity: int
    used: int
    status_approval: LocationApprovalStatus
    quantity_assets_id: int | None = None
