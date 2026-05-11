/* eslint-disable */
import React from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Select,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { AddIcon, SearchIcon } from "@chakra-ui/icons";

import Card from "components/card/Card";
import AssetModal from "./AssetModal";

const PAGE_SIZE = 10;

function StatusBadge({ status }) {
  const colorMap = {
    available: "green",
    in_use: "blue",
    under_maintenance: "orange",
    damaged: "red",
    liquidated: "gray",
  };
  const valueMap = {
    available: "Có sẵn",
    in_use: "Đang sử dụng",
    under_maintenance: "Đang bảo trì",
    damaged: "Hỏng",
    liquidated: "Đã thanh lý",
  };

  return (
    <Badge
      colorScheme={colorMap[status] || "gray"}
      borderRadius="999px"
      px="10px"
      py="4px"
    >
      {valueMap[status] || "unknown"}
    </Badge>
  );
}

function ActiveBadge({ isActive }) {
  return (
    <Badge
      colorScheme={isActive ? "green" : "red"}
      borderRadius="999px"
      px="10px"
      py="4px"
    >
      {isActive ? "Hoạt động" : "Không hoạt động"}
    </Badge>
  );
}

function ApprovalBadge({ status }) {
  const colorMap = { approved: "green", pending: "yellow", rejected: "red" };
  const labelMap = { approved: "Đã duyệt", pending: "Chờ duyệt", rejected: "Không duyệt" };
  return (
    <Badge colorScheme={colorMap[status] || "gray"} borderRadius="999px" px="10px" py="4px">
      {labelMap[status] || status}
    </Badge>
  );
}

function UseFulLifeBadge({ purchaseDate, usefulLifeMonths }) {
  const calcDepreciationPercent = () => {
    if (!purchaseDate || !usefulLifeMonths) return 0;

    const start = new Date(purchaseDate);
    const now = new Date();

    let months =
      (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth());

    if (now.getDate() < start.getDate()) {
      months--;
    }

    const percent = (months / usefulLifeMonths) * 100;

    return Math.min(Math.max(percent, 0), 100); // clamp 0–100
  };

  const percent = calcDepreciationPercent();

  const getColor = () => {
    if (percent < 25) return "green";
    if (percent < 50) return "yellow";
    if (percent < 75) return "orange";
    return "red";
  };

  return (
    <Badge
      colorScheme={getColor()}
      borderRadius="999px"
      px="10px"
      py="4px"
    >
      KH:{percent.toFixed(0)}%
    </Badge>
  );
}

export default function ColumnsTable(props) {
  const {
    tableData = [],
    title,
    departmentOptions = [],
    categoryOptions = [],
    userOptions = [],
    onSaveAsset,
    onDeactivateAsset,
    onActivateAsset,
    onCreateAsset,
    onApproveAsset,
    onRejectAsset,
    canManageAssets = false,
    canDeactivateAssetByRole = false,
    currentUserRole = "",
    loading = false,
  } = props;

  const addLabel = currentUserRole === "manager" ? "Yêu cầu thêm tài sản" : "Thêm tài sản";
  const [keyword, setKeyword] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [conditionFilter, setConditionFilter] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState("");
  const [pageIndex, setPageIndex] = React.useState(0);

  const [selectedAsset, setSelectedAsset] = React.useState(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState("edit");

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const cardBg = useColorModeValue("white", "navy.800");
  const searchIconColor = useColorModeValue("gray.400", "gray.300");
  const searchInputBg = useColorModeValue("secondaryGray.300", "navy.900");
  const searchInputColor = useColorModeValue("gray.700", "gray.100");
  const hoverShadow = useColorModeValue(
    "xl",
    "0 12px 30px rgba(0, 0, 0, 0.5)"
  );

  // const categoryOptions = React.useMemo(() => {
  //   const unique = new Set(
  //     tableData
  //       .map((item) => String(item.category || "").trim())
  //       .filter(Boolean)
  //   );
  //   return Array.from(unique).sort();
  // }, [tableData]);

  const filteredData = React.useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return (tableData || []).filter((row) => {
      const matchesKeyword =
        !normalizedKeyword ||
        [
          row.name,
          row.category,
          row.serial_number,
          row.location,
          row.assigned_department,
          row.assigned_user,
          row.status,
          row.condition,
        ].some(
          (value) =>
            value != null &&
            String(value).toLowerCase().includes(normalizedKeyword)
        );

      const matchesCategory =
        !categoryFilter ||
        String(row.category_id ?? "") === categoryFilter;

      const matchesStatus =
        !statusFilter || String(row.status || "") === statusFilter;

      const matchesCondition =
        !conditionFilter || String(row.condition || "") === conditionFilter;

      const matchesActive =
        !activeFilter ||
        (activeFilter === "active" && Boolean(row.is_active)) ||
        (activeFilter === "inactive" && !Boolean(row.is_active));

      return (
        matchesKeyword &&
        matchesCategory &&
        matchesStatus &&
        matchesCondition &&
        matchesActive
      );
    });
  }, [
    activeFilter,
    categoryFilter,
    conditionFilter,
    keyword,
    statusFilter,
    tableData,
  ]);

  React.useEffect(() => {
    setPageIndex(0);
  }, [keyword, categoryFilter, statusFilter, conditionFilter, activeFilter, tableData]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const paginatedRows = filteredData.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE
  );

  const handleRowClick = (asset) => {
    setSelectedAsset(asset);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (
      selectedAsset?.id === onSaveAsset?.loadingId ||
      selectedAsset?.id === onDeactivateAsset?.loadingId ||
      onCreateAsset?.loading
    ) {
      return;
    }

    setSelectedAsset(null);
    setIsModalOpen(false);
  };

  const handleSave = async (asset) => {
    await onSaveAsset?.handler?.(asset);
    handleCloseModal();
  };

  const handleDeactivate = async (asset) => {
    await onDeactivateAsset?.handler?.(asset);
    handleCloseModal();
  };

  const handleCreate = async (asset) => {
    await onCreateAsset?.handler?.(asset);
    handleCloseModal();
  };

  const handleApprove = async (asset) => {
    await onApproveAsset?.handler?.(asset);
    handleCloseModal();
  };

  const handleReject = async (asset) => {
    await onRejectAsset?.handler?.(asset);
    handleCloseModal();
  };

  const handleActivate = async (asset) => {
    await onActivateAsset?.handler?.(asset);
    handleCloseModal();
  };

  function getMonthDiff(fromDate) {
    const start = new Date(fromDate);
    const end = new Date();

    let months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());

    // Nếu ngày hiện tại chưa tới ngày trong tháng → trừ 1 tháng
    if (end.getDate() < start.getDate()) {
      months--;
    }

    return months;
  }

  const startRow = filteredData.length === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const endRow = Math.min((currentPage + 1) * PAGE_SIZE, filteredData.length);

  return (
    <>
      <Card flexDirection="column" w="100%" px="0px" overflowX="auto">
        <Flex
          px="25px"
          pt="20px"
          pb="16px"
          justify="space-between"
          align={{ base: "stretch", md: "center" }}
          direction={{ base: "column", md: "row" }}
          gap="12px"
        >
          <Box>
            <Text color={textColor} fontSize="22px" fontWeight="700">
              {title || "Quản lý tài sản số lượng"}
            </Text>
            <Text mt="4px" color="gray.500" fontSize="sm">
              {canManageAssets
                ? "Admin và manager có thể tạo hoặc sửa. Chỉ admin mới được vô hiệu hóa. Việc phân bổ vị trí tài sản số lượng lớn là của phòng ban phụ trách tài sản đó. Việc quản lí nhập/xuất tài sản là của admin."
                : "Bạn đang ở chế độ chỉ xem."}
            </Text>
          </Box>

          {canManageAssets ? (
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              borderRadius="12px"
              onClick={() => {
                setSelectedAsset(null);
                setModalMode("create");
                setIsModalOpen(true);
              }}
            >
              {addLabel}
            </Button>
          ) : null}
        </Flex>

        <Flex px="25px" pb="18px" gap="12px" wrap="wrap" align="center">
          <InputGroup maxW={{ base: "100%", md: "280px" }}>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color={searchIconColor} />
            </InputLeftElement>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tên, danh mục, vị trí..."
              bg={searchInputBg}
              color={searchInputColor}
              borderRadius="16px"
              _placeholder={{ color: "gray.400" }}
            />
          </InputGroup>

          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            maxW={{ base: "100%", md: "190px" }}
            borderRadius="16px"
          >
            <option value="">Tất cả danh mục</option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            maxW={{ base: "100%", md: "190px" }}
            borderRadius="16px"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="available">Có sẵn</option>
            <option value="in_use">Đang sử dụng</option>
            <option value="under_maintenance">Đang bảo trì</option>
            <option value="damaged">Hỏng</option>
            <option value="liquidated">Đã thanh lý</option>
          </Select>

          <Select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            maxW={{ base: "100%", md: "180px" }}
            borderRadius="16px"
          >
            <option value="">Tất cả tình trạng</option>
            <option value="new">Mới</option>
            <option value="good">Tốt</option>
            <option value="fair">Trung bình</option>
            <option value="poor">Kém</option>
            <option value="broken">Hỏng</option>
          </Select>

          <Select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            maxW={{ base: "100%", md: "180px" }}
            borderRadius="16px"
          >
            <option value="">Trạng thái hoạt động</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
          </Select>
        </Flex>

        <Box px="25px" pb="10px">
          {loading ? (
            <Text py="20px" textAlign="center" color="gray.500">
              Đang tải dữ liệu...
            </Text>
          ) : paginatedRows.length === 0 ? (
            <Text py="20px" textAlign="center" color="gray.500">
              Không có tài sản phù hợp.
            </Text>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing="16px">
              {paginatedRows.map((row) => (
                <Card
                  key={row.id}
                  role="group"
                  bg={cardBg}
                  border="1px solid"
                  borderColor={borderColor}
                  p="16px"
                  cursor="pointer"
                  position="relative"
                  overflow="hidden"
                  transition="all 0.2s ease"
                  _hover={{
                    transform: "scale(1.02)",
                    boxShadow: hoverShadow,
                    zIndex: 1,
                  }}
                  onClick={() => handleRowClick(row)}
                >
                  <Flex justify="space-between" align="flex-start" gap="12px">
                    <Box minW="0">
                      <Text color={textColor} fontWeight="700" noOfLines={2}>
                        {row.name || "-"}
                      </Text>
                      <Text mt="4px" fontSize="sm" color="gray.500" noOfLines={1}>
                        {row.category || "-"}
                      </Text>
                    </Box>
                    <Box flexShrink={0}>
                      <StatusBadge status={row.status} />
                    </Box>
                  </Flex>

                  <Flex mt="12px" gap="10px" wrap="wrap" align="center">
                    <Badge borderRadius="999px" px="10px" py="4px" colorScheme="purple">
                      SL: {row.quantity ?? 0}
                    </Badge>
                    <UseFulLifeBadge purchaseDate={row.purchase_date} usefulLifeMonths={row.useful_life} />
                    <ApprovalBadge status={row.approval_status} />
                    <ActiveBadge isActive={row.is_active} />
                  </Flex>

                  <Flex mt="12px" justify="space-between" gap="10px" wrap="wrap">
                    <Text fontSize="sm" color="gray.600" noOfLines={1}>
                      PB: {row.assigned_department || "-"}
                    </Text>
                    <Text fontSize="sm" color="gray.600" noOfLines={1}>
                      ND: {row.assigned_user || "-"}
                    </Text>
                  </Flex>

                  <Box
                    mt="10px"
                    pt="10px"
                    borderTop="1px solid"
                    borderColor={borderColor}
                    opacity={0}
                    maxH="0px"
                    transition="all 0.2s ease"
                    _groupHover={{
                      opacity: 1,
                      maxH: "220px",
                    }}
                  >
                    <Text fontSize="sm" color="gray.600" noOfLines={1}>
                      Vị trí: {row.location || "-"}
                    </Text>
                    <Text mt="6px" fontSize="sm" color="gray.600" noOfLines={2}>
                      Thông số: {row.specification || "-"}
                    </Text>
                    <Text mt="6px" fontSize="sm" color="gray.600" noOfLines={2}>
                      Ghi chú: {row.note || "-"}
                    </Text>
                    <Text mt="8px" fontSize="xs" color="gray.500">
                      Cập nhật: {row.updated_at || "-"}
                    </Text>
                  </Box>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Box>

        <Flex
          px="25px"
          py="18px"
          align="center"
          justify="space-between"
          wrap="wrap"
          gap="12px"
        >
          <Text fontSize="sm" color="gray.500">
            {filteredData.length === 0
              ? "Không có bản ghi"
              : `Hiển thị ${startRow}-${endRow} trong ${filteredData.length} bản ghi`}
          </Text>

          <Flex gap="10px">
            <Button
              variant="outline"
              onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
              isDisabled={currentPage === 0}
            >
              Trước
            </Button>
            <Button variant="ghost" isDisabled>
              Trang {currentPage + 1} / {totalPages}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setPageIndex((prev) => Math.min(prev + 1, totalPages - 1))
              }
              isDisabled={currentPage >= totalPages - 1}
            >
              Tiếp
            </Button>
          </Flex>
        </Flex>
      </Card>

      <AssetModal
        asset={selectedAsset}
        departmentOptions={departmentOptions}
        categoryOptions={categoryOptions}
        userOptions={userOptions}
        isOpen={isModalOpen}
        isSubmitting={
          modalMode === "create"
            ? Boolean(onCreateAsset?.loading)
            : Boolean(selectedAsset && selectedAsset.id === onSaveAsset?.loadingId)
        }
        isDeactivating={Boolean(selectedAsset && selectedAsset.id === onDeactivateAsset?.loadingId)}
        isApproving={Boolean(selectedAsset && selectedAsset.id === onApproveAsset?.loadingId)}
        isRejecting={Boolean(selectedAsset && selectedAsset.id === onRejectAsset?.loadingId)}
        isActivating={Boolean(selectedAsset && selectedAsset.id === onActivateAsset?.loadingId)}
        onClose={handleCloseModal}
        onSave={modalMode === "create" ? handleCreate : handleSave}
        onDeactivate={handleDeactivate}
        onApprove={handleApprove}
        onReject={handleReject}
        onActivate={handleActivate}
        mode={modalMode}
        canManageAssets={canManageAssets}
        canDeactivateAssetByRole={canDeactivateAssetByRole}
        currentUserRole={currentUserRole}
      />
    </>
  );
}

