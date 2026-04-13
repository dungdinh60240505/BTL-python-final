from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_password_ready_user
from app.dependencies.permissions import require_manager_or_admin
from app.models.user import User, UserRole
from app.schemas.report import (
    AllocationStatusSummaryItem,
    AssetStatusSummaryItem,
    DashboardSummary,
    LowStockSupplyItem,
    MaintenanceStatusSummaryItem,
    RecentActivityItem,
)
from app.services.report_service import (
    get_allocation_status_summary,
    get_asset_status_summary,
    get_dashboard_summary,
    get_department_dashboard_summary,
    get_low_stock_supplies,
    get_maintenance_status_summary,
    get_recent_activity,
)

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/dashboard-summary", response_model=DashboardSummary)
def read_dashboard_summary(
    db: Session = Depends(get_db),
    _: User = Depends(require_manager_or_admin),
):
    return get_dashboard_summary(db=db)


@router.get("/my-dashboard-summary", response_model=DashboardSummary)
def read_my_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_password_ready_user),
):
    if current_user.role in {UserRole.ADMIN, UserRole.MANAGER}:
        return get_dashboard_summary(db=db)

    return get_department_dashboard_summary(
        db=db,
        department_id=current_user.department_id,
        user_id=current_user.id,
    )


@router.get("/asset-status-summary", response_model=list[AssetStatusSummaryItem])
def read_asset_status_summary(
    db: Session = Depends(get_db),
    _: User = Depends(require_manager_or_admin),
):
    return get_asset_status_summary(db=db)


@router.get("/low-stock-supplies", response_model=list[LowStockSupplyItem])
def read_low_stock_supplies(
    db: Session = Depends(get_db),
    _: User = Depends(require_manager_or_admin),
):
    return get_low_stock_supplies(db=db)


@router.get(
    "/allocation-status-summary",
    response_model=list[AllocationStatusSummaryItem],
)
def read_allocation_status_summary(
    db: Session = Depends(get_db),
    _: User = Depends(require_manager_or_admin),
):
    return get_allocation_status_summary(db=db)


@router.get(
    "/maintenance-status-summary",
    response_model=list[MaintenanceStatusSummaryItem],
)
def read_maintenance_status_summary(
    db: Session = Depends(get_db),
    _: User = Depends(require_manager_or_admin),
):
    return get_maintenance_status_summary(db=db)


@router.get("/recent-activity", response_model=list[RecentActivityItem])
def read_recent_activity(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    _: User = Depends(require_manager_or_admin),
):
    return get_recent_activity(db=db, limit=limit)