import { apiRequest, buildQueryString } from "./http";

export function getDashboardSummary() {
  return apiRequest("/reports/dashboard-summary", {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được tổng quan dashboard.",
  });
}

export function getMyDashboardSummary() {
  return apiRequest("/reports/my-dashboard-summary", {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được dashboard của bạn.",
  });
}

export function getAssetStatusSummary() {
  return apiRequest("/reports/asset-status-summary", {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được trạng thái tài sản.",
  });
}

export function getAllocationStatusSummary() {
  return apiRequest("/reports/allocation-status-summary", {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được trạng thái cấp phát.",
  });
}

export function getMaintenanceStatusSummary() {
  return apiRequest("/reports/maintenance-status-summary", {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được trạng thái bảo trì.",
  });
}

export function getLowStockSupplies(params = {}) {
  const query = buildQueryString(params);
  return apiRequest(`/reports/low-stock-supplies${query}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được danh sách vật tư tồn kho thấp.",
  });
}

export function getRecentActivity(params = {}) {
  const query = buildQueryString(params);
  return apiRequest(`/reports/recent-activity${query}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được hoạt động gần đây.",
  });
}

export async function getDashboardData(currentUserRole = "") {
  const normalizedRole = String(currentUserRole || "").trim().toLowerCase();

  // Staff chỉ gọi dashboard rút gọn
  if (normalizedRole === "staff") {
    const summary = await getMyDashboardSummary();

    return {
      summary,
      assetStatusSummary: [],
      lowStockSupplies: [],
      allocationStatusSummary: [],
      maintenanceStatusSummary: [],
      recentActivity: [],
      dashboardMode: "staff",
    };
  }

  // Admin / Manager giữ dashboard đầy đủ như cũ
  const [
    summary,
    assetStatusSummary,
    lowStockSupplies,
    allocationStatusSummary,
    maintenanceStatusSummary,
    recentActivity,
  ] = await Promise.all([
    getDashboardSummary(),
    getAssetStatusSummary(),
    getLowStockSupplies(),
    getAllocationStatusSummary(),
    getMaintenanceStatusSummary(),
    getRecentActivity({ limit: 8 }),
  ]);

  return {
    summary,
    assetStatusSummary,
    lowStockSupplies,
    allocationStatusSummary,
    maintenanceStatusSummary,
    recentActivity,
    dashboardMode: "full",
  };
}