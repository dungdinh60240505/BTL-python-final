import { apiRequest, buildQueryString } from "./http";

export function listCategoryNeeds(params = {}) {
  const query = buildQueryString(params);
  return apiRequest(`/category-needs${query}`, {
    method: "GET",
    auth: true,
    fallbackErrorMessage: "Không tải được nhu cầu danh mục.",
  });
}

export function createCategoryNeed(payload) {
  return apiRequest("/category-needs", {
    method: "POST",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Tạo nhu cầu thất bại.",
  });
}

export function updateCategoryRequireQuantity(categoryId, payload) {
  return apiRequest(`/categories/${categoryId}/require-quantity`, {
    method: "PATCH",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Cập nhật nhu cầu thất bại.",
  });
}

export function updateCategoryNeed(categoryNeedId, payload) {
  return apiRequest(`/category-needs/${categoryNeedId}`, {
    method: "PATCH",
    auth: true,
    body: payload,
    fallbackErrorMessage: "Cập nhật nhu cầu thất bại.",
  });
}

export function deleteCategoryNeed(categoryNeedId) {
  return apiRequest(`/category-needs/${categoryNeedId}`, {
    method: "DELETE",
    auth: true,
    fallbackErrorMessage: "Xóa nhu cầu thất bại.",
  });
}
