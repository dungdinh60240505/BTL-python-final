import { apiRequest, buildQueryString } from "./http";

export function listAssets(params = {}) {
  const query = buildQueryString(params);
  return apiRequest(`/asset-quantities${query}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được danh sách tài sản.",
  });
}

export function getAssetById(assetId) {
  return apiRequest(`/asset-quantities/${assetId}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được thông tin tài sản.",
  });
}

export function createAsset(payload) {
  return apiRequest("/asset-quantities", {
    method: "POST",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Tạo tài sản thất bại.",
  });
}

export function updateAsset(assetId, payload) {
  return apiRequest(`/asset-quantities/${assetId}`, {
    method: "PUT",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Cập nhật tài sản thất bại.",
  });
}

export function updateAssetStatus(assetId, payload) {
  return apiRequest(`/asset-quantities/${assetId}/status`, {
    method: "PATCH",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Cập nhật trạng thái tài sản thất bại.",
  });
}

export function approveAsset(assetId) {
  return apiRequest(`/asset-quantities/${assetId}/approve`, {
    method: "PATCH",
    auth: true,
    fallbackErrorMessage: "Duyệt tài sản thất bại.",
  });
}

export function rejectAsset(assetId) {
  return apiRequest(`/asset-quantities/${assetId}/reject`, {
    method: "PATCH",
    auth: true,
    fallbackErrorMessage: "Từ chối tài sản thất bại.",
  });
}

export function deactivateAsset(assetId) {
  return apiRequest(`/asset-quantities/${assetId}/deactivate`, {
    method: "PATCH",
    auth: true,
    fallbackErrorMessage: "Vô hiệu hóa tài sản thất bại.",
  });
}

export function activateAsset(assetId) {
  return apiRequest(`/asset-quantities/${assetId}/activate`, {
    method: "PATCH",
    auth: true,
    fallbackErrorMessage: "Kích hoạt tài sản thất bại.",
  });
}

export function listLocations(assetId) {
  return apiRequest(`/asset-quantities/${assetId}/locations`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được danh sách vị trí.",
  });
}

export function createLocation(assetId, payload) {
  return apiRequest(`/asset-quantities/${assetId}/locations`, {
    method: "POST",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Thêm vị trí thất bại.",
  });
}

export function createLostLocation(assetId, payload) {
  return apiRequest(`/asset-quantities/${assetId}/lost-locations`, {
    method: "POST",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Thêm vị trí báo mất thất bại.",
  });
}

export function updateLocation(assetId, locationId, payload) {
  return apiRequest(`/asset-quantities/${assetId}/locations/${locationId}`, {
    method: "PUT",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Cập nhật vị trí thất bại.",
  });
}

export function approveLocation(assetId, locationId, payload) {
  return apiRequest(`/asset-quantities/${assetId}/locations/${locationId}`, {
    method: "PATCH",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Xác nhận vị trí thất bại.",
  });
}

export function approveLostLocation(assetId, locationId, payload) {
  return apiRequest(`/asset-quantities/${assetId}/lost-locations/${locationId}`, {
    method: "PATCH",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Xác nhận vị trí thất bại.",
  });
}

export function deleteLocation(assetId, locationId) {
  return apiRequest(`/asset-quantities/${assetId}/locations/${locationId}`, {
    method: "DELETE",
    auth: true,
    fallbackErrorMessage: "Xóa vị trí thất bại.",
  });
}


