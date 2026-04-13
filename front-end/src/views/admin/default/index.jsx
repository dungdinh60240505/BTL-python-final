import React, {useState} from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Icon,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import {
  MdApartment,
  MdBuild,
  MdInventory2,
  MdPeople,
  MdRefresh,
  MdSettings,
  MdWarningAmber,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";

import Card from "components/card/Card.js";
import { getDashboardData } from "api/reportsApi";
import { isUnauthorizedError } from "api/http";
import { getCurrentUser, logout } from "api/authApi";

function StatCard({ title, value, icon, helpText }) {
  const textColorPrimary = useColorModeValue("secondaryGray.900", "white");
  const textColorSecondary = useColorModeValue("gray.500", "gray.400");
  const iconBg = useColorModeValue("brand.50", "whiteAlpha.100");
  const iconColor = useColorModeValue("brand.500", "white");

  return (
    <Card p="20px">
      <Flex align="center" justify="space-between" gap="12px">
        <Box flex="1" minW="0">
          <Text color={textColorSecondary} fontSize="sm" fontWeight="500">
            {title}
          </Text>
          <Text mt="6px" color={textColorPrimary} fontSize="2xl" fontWeight="700">
            {value}
          </Text>
          {helpText ? (
            <Text mt="6px" color={textColorSecondary} fontSize="xs">
              {helpText}
            </Text>
          ) : null}
        </Box>

        <Flex
          align="center"
          justify="center"
          borderRadius="16px"
          w="52px"
          h="52px"
          bg={iconBg}
          flexShrink={0}
        >
          <Icon as={icon} w="26px" h="26px" color={iconColor} />
        </Flex>
      </Flex>
    </Card>
  );
}

function SummaryListCard({ title, items, emptyText }) {
  const textColorPrimary = useColorModeValue("secondaryGray.900", "white");
  const textColorSecondary = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");

  return (
    <Card p="20px" h="100%">
      <Text color={textColorPrimary} fontSize="lg" fontWeight="700" mb="16px">
        {title}
      </Text>

      {items.length === 0 ? (
        <Text color={textColorSecondary} fontSize="sm">
          {emptyText}
        </Text>
      ) : (
        <Stack spacing="12px">
          {items.map((item, index) => (
            <Flex
              key={`${item.label}-${index}`}
              align="center"
              justify="space-between"
              border="1px solid"
              borderColor={borderColor}
              borderRadius="14px"
              p="12px 14px"
              gap="12px"
            >
              <Text
                color={textColorPrimary}
                fontSize="sm"
                fontWeight="600"
                textTransform="capitalize"
              >
                {item.label}
              </Text>
              <Badge
                colorScheme={item.colorScheme || "blue"}
                borderRadius="999px"
                px="10px"
                py="4px"
              >
                {item.value}
              </Badge>
            </Flex>
          ))}
        </Stack>
      )}
    </Card>
  );
}

function formatNumber(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num.toLocaleString("vi-VN") : "0";
}

function normalizeStatusLabel(value) {
  const labels = {
    available: "Sẵn sàng",
    in_use: "Đang sử dụng",
    under_maintenance: "Đang bảo trì",
    damaged: "Hỏng",
    liquidated: "Thanh lý",
    requested: "Chờ duyệt",
    active: "Đang hoạt động",
    completed: "Hoàn tất",
    returned: "Đã trả",
    cancelled: "Đã hủy",
    scheduled: "Đã lên lịch",
    in_progress: "Đang xử lý",
    approved: "Đã duyệt",
    received: "Đã nhận",
    draft: "Nháp",
    sent: "Đã gửi",
    processing: "Đang xử lý",
  };

  if (!value) return "Unknown";
  return labels[value] || String(value).replaceAll("_", " ");
}

function getStatusColor(status) {
  const map = {
    available: "green",
    in_use: "blue",
    under_maintenance: "orange",
    damaged: "red",
    liquidated: "gray",
    requested: "orange",
    active: "green",
    completed: "blue",
    returned: "purple",
    cancelled: "red",
    scheduled: "orange",
    in_progress: "yellow",
    approved: "blue",
    received: "teal",
    draft: "gray",
    sent: "orange",
    processing: "yellow",
  };

  return map[status] || "gray";
}

function normalizeSummaryArray(raw) {
  if (Array.isArray(raw)) {
    return raw.map((item) => ({
      label: normalizeStatusLabel(
        item?.status || item?.name || item?.label || item?.key
      ),
      value: formatNumber(item?.count ?? item?.value ?? 0),
      colorScheme: getStatusColor(item?.status || item?.key),
    }));
  }

  if (raw && typeof raw === "object") {
    return Object.entries(raw).map(([key, value]) => ({
      label: normalizeStatusLabel(key),
      value: formatNumber(value),
      colorScheme: getStatusColor(key),
    }));
  }

  return [];
}

function formatDateTime(value) {
  if (!value) return "Không rõ thời gian";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("vi-VN");
}

function normalizeRecentActivities(raw) {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.items)
      ? raw.items
      : Array.isArray(raw?.data)
        ? raw.data
        : [];

  return list.map((item, index) => ({
    id: item?.id || index,
    title:
      item?.title ||
      item?.description ||
      item?.message ||
      item?.action ||
      "Hoạt động hệ thống",
    subtitle:
      item?.entity_type ||
      item?.module ||
      item?.type ||
      item?.status ||
      "",
    time:
      item?.created_at ||
      item?.updated_at ||
      item?.timestamp ||
      item?.occurred_at ||
      item?.activity_date ||
      "",
  }));
}

export default function MainDashboard() {
  const navigate = useNavigate();
  const toast = useToast();

  const textColorPrimary = useColorModeValue("secondaryGray.900", "white");
  const textColorSecondary = useColorModeValue("gray.500", "gray.400");
  const tableBorderColor = useColorModeValue("gray.200", "whiteAlpha.100");

  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [currentUserRole, setCurrentUserRole] = React.useState("");
  const [dashboardMode, setDashboardMode] = React.useState("full");

  const [summary, setSummary] = React.useState({
    total_departments: 0,
    total_users: 0,
    total_assets: 0,
    total_supplies: 0,
    active_allocations: 0,
    active_maintenances: 0,
    low_stock_supplies: 0,
  });

  const [assetStatusSummary, setAssetStatusSummary] = React.useState([]);
  const [allocationStatusSummary, setAllocationStatusSummary] = React.useState([]);
  const [maintenanceStatusSummary, setMaintenanceStatusSummary] = React.useState([]);
  const [lowStockSupplies, setLowStockSupplies] = React.useState([]);
  const [recentActivities, setRecentActivities] = React.useState([]);

  //phân trang recent activities
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3; // số item mỗi trang

  const handleUnauthorized = React.useCallback(() => {
    logout();

    toast({
      title: "Phiên đăng nhập đã hết hạn",
      description: "Vui lòng đăng nhập lại.",
      status: "warning",
      duration: 2500,
      isClosable: true,
    });

    navigate("/auth/sign-in", { replace: true });
  }, [navigate, toast]);

  const loadDashboard = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const profile = await getCurrentUser();
      const role = String(profile?.role || "").trim().toLowerCase();
      setCurrentUserRole(role);

      const data = await getDashboardData(role);

      setSummary({
        total_departments: data?.summary?.total_departments ?? 0,
        total_users: data?.summary?.total_users ?? 0,
        total_assets: data?.summary?.total_assets ?? 0,
        total_supplies: data?.summary?.total_supplies ?? 0,
        active_allocations: data?.summary?.active_allocations ?? 0,
        active_maintenances: data?.summary?.active_maintenances ?? 0,
        low_stock_supplies: data?.summary?.low_stock_supplies ?? 0,
      });

      setDashboardMode(data?.dashboardMode || "full");
      setAssetStatusSummary(normalizeSummaryArray(data?.assetStatusSummary));
      setAllocationStatusSummary(
        normalizeSummaryArray(data?.allocationStatusSummary)
      );
      setMaintenanceStatusSummary(
        normalizeSummaryArray(data?.maintenanceStatusSummary)
      );
      setLowStockSupplies(
        Array.isArray(data?.lowStockSupplies) ? data.lowStockSupplies : []
      );
      setRecentActivities(normalizeRecentActivities(data?.recentActivity));
    } catch (error) {
      console.error("Tải bảng điều khiển không thành công:", error);

      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }

      setErrorMessage(error.message || "Không tải được dữ liệu bảng điều khiển.");

      toast({
        title: "Tải bảng điều khiển thất bại",
        description: error.message || "Có lỗi xảy ra khi lấy dữ liệu.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [handleUnauthorized, toast]);

  React.useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const isStaffDashboard = dashboardMode === "staff" || currentUserRole === "staff";

  const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;

const currentActivities = recentActivities.slice(
  indexOfFirstItem,
  indexOfLastItem
);

const totalPages = Math.ceil(recentActivities.length / itemsPerPage);

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Flex
        justify="space-between"
        align={{ base: "flex-start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap="12px"
        mb="20px"
      >
        <Box>
          <Text color={textColorPrimary} fontSize="2xl" fontWeight="700">
            Bảng Điều Khiển
          </Text>
          <Text color={textColorSecondary} fontSize="sm" mt="4px">
            {isStaffDashboard
              ? "Tổng quan nhanh theo phạm vi tài khoản hoặc phòng ban của bạn."
              : "Tổng quan nhanh tình hình tài sản, vật tư, cấp phát và bảo trì."}
          </Text>
        </Box>

        <Button
          leftIcon={<Icon as={MdRefresh} />}
          onClick={loadDashboard}
          isLoading={isLoading}
          borderRadius="14px"
        >
          Làm mới
        </Button>
      </Flex>

      {errorMessage ? (
        <Alert status="error" borderRadius="16px" mb="20px">
          <AlertIcon />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {isStaffDashboard ? (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing="20px" mb="20px">
          <StatCard
            title="Người dùng"
            value={formatNumber(summary.total_users)}
            icon={MdPeople}
            helpText="Số người dùng trong phạm vi phòng ban của bạn"
          />
          <StatCard
            title="Tài sản"
            value={formatNumber(summary.total_assets)}
            icon={MdInventory2}
            helpText="Tài sản thuộc phạm vi được phép xem"
          />
          <StatCard
            title="Vật tư"
            value={formatNumber(summary.total_supplies)}
            icon={MdBuild}
            helpText="Vật tư thuộc phạm vi được phép xem"
          />
          <StatCard
            title="Cấp phát đang hoạt động"
            value={formatNumber(summary.active_allocations)}
            icon={MdSettings}
            helpText="Các phiếu cấp phát đang xử lý"
          />
          <StatCard
            title="Bảo trì đang hoạt động"
            value={formatNumber(summary.active_maintenances)}
            icon={MdSettings}
            helpText="Các yêu cầu bảo trì đang xử lý"
          />
          <StatCard
            title="Vật tư sắp hết"
            value={formatNumber(summary.low_stock_supplies)}
            icon={MdWarningAmber}
            helpText="Số vật tư đang dưới ngưỡng tối thiểu"
          />
        </SimpleGrid>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing="20px" mb="20px">
          <StatCard
            title="Phòng ban"
            value={formatNumber(summary.total_departments)}
            icon={MdApartment}
            helpText="Tổng số phòng ban trong hệ thống"
          />
          <StatCard
            title="Người dùng"
            value={formatNumber(summary.total_users)}
            icon={MdPeople}
            helpText="Tổng số tài khoản"
          />
          <StatCard
            title="Tài sản"
            value={formatNumber(summary.total_assets)}
            icon={MdInventory2}
            helpText="Tổng số tài sản cố định"
          />
          <StatCard
            title="Vật tư"
            value={formatNumber(summary.total_supplies)}
            icon={MdBuild}
            helpText="Tổng số vật tư tiêu hao"
          />
          <StatCard
            title="Cấp phát đang hoạt động"
            value={formatNumber(summary.active_allocations)}
            icon={MdSettings}
            helpText="Số phiếu cấp phát đang hoạt động"
          />
          <StatCard
            title="Bảo trì đang hoạt động"
            value={formatNumber(summary.active_maintenances)}
            icon={MdSettings}
            helpText="Số phiếu bảo trì đang xử lý"
          />
          <StatCard
            title="Vật tư sắp hết"
            value={formatNumber(summary.low_stock_supplies)}
            icon={MdWarningAmber}
            helpText="Các vật tư dưới ngưỡng tối thiểu"
          />
        </SimpleGrid>
      )}

      {isLoading ? (
        <Flex align="center" justify="center" py="48px">
          <Spinner thickness="4px" speed="0.65s" size="lg" />
        </Flex>
      ) : null}

      {!isLoading && !isStaffDashboard ? (
        <>
          <Grid
            templateColumns={{ base: "1fr", xl: "1fr 1fr 1fr" }}
            gap="20px"
            mb="20px"
          >
            <GridItem>
              <SummaryListCard
                title="Trạng thái tài sản"
                items={assetStatusSummary}
                emptyText="Chưa có dữ liệu trạng thái tài sản."
              />
            </GridItem>
            <GridItem>
              <SummaryListCard
                title="Trạng thái cấp phát"
                items={allocationStatusSummary}
                emptyText="Chưa có dữ liệu trạng thái cấp phát."
              />
            </GridItem>
            <GridItem>
              <SummaryListCard
                title="Trạng thái bảo trì"
                items={maintenanceStatusSummary}
                emptyText="Chưa có dữ liệu trạng thái bảo trì."
              />
            </GridItem>
          </Grid>

          <Grid templateColumns={{ base: "1fr", xl: "1.4fr 1fr" }} gap="20px">
            <GridItem>
              <Card p="20px" h="100%">
                <Text
                  color={textColorPrimary}
                  fontSize="lg"
                  fontWeight="700"
                  mb="16px"
                >
                  Vật tư tồn kho thấp
                </Text>

                {lowStockSupplies.length === 0 ? (
                  <Text color={textColorSecondary} fontSize="sm">
                    Hiện chưa có vật tư nào dưới mức tồn kho tối thiểu.
                  </Text>
                ) : (
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th borderColor={tableBorderColor}>Mã</Th>
                          <Th borderColor={tableBorderColor}>Tên vật tư</Th>
                          <Th borderColor={tableBorderColor}>Tồn kho</Th>
                          <Th borderColor={tableBorderColor}>Mức tối thiểu</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {lowStockSupplies.map((item, index) => (
                          <Tr key={item?.id || index}>
                            <Td borderColor={tableBorderColor}>
                              {item?.supply_code || "-"}
                            </Td>
                            <Td borderColor={tableBorderColor}>
                              {item?.name || "-"}
                            </Td>
                            <Td borderColor={tableBorderColor}>
                              <Badge
                                colorScheme="red"
                                borderRadius="999px"
                                px="10px"
                                py="4px"
                              >
                                {formatNumber(item?.quantity_in_stock)}
                              </Badge>
                            </Td>
                            <Td borderColor={tableBorderColor}>
                              {formatNumber(item?.minimum_stock_level)}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </Card>
            </GridItem>

            <GridItem>
              <Card p="20px" h="100%">
                <Text
                  color={textColorPrimary}
                  fontSize="lg"
                  fontWeight="700"
                  mb="16px"
                >
                  Hoạt động gần đây
                </Text>

                {recentActivities.length === 0 ? (
                  <Text color={textColorSecondary} fontSize="sm">
                    Chưa có dữ liệu hoạt động gần đây.
                  </Text>
                ) : (
                  <Stack spacing="12px">
                    {currentActivities.map((activity) => (
                      <Box
                        key={activity.id}
                        p="12px 14px"
                        borderRadius="14px"
                        border="1px solid"
                        borderColor={tableBorderColor}
                      >
                        <Text
                          color={textColorPrimary}
                          fontSize="sm"
                          fontWeight="700"
                        >
                          {activity.title}
                        </Text>

                        {activity.subtitle ? (
                          <Text color={textColorSecondary} fontSize="xs" mt="4px">
                            {activity.subtitle}
                          </Text>
                        ) : null}

                        <Text color={textColorSecondary} fontSize="xs" mt="6px">
                          {formatDateTime(activity.time)}
                        </Text>
                      </Box>
                    ))}
                  </Stack>
                )}
                {Array.from({ length: totalPages }).map((_, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={currentPage === index + 1 ? "solid" : "outline"}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </Button>
                ))}
              </Card>
            </GridItem>
          </Grid>
        </>
      ) : null}

      {!isLoading && isStaffDashboard ? (
        <Card p="20px">
          <Text color={textColorPrimary} fontSize="lg" fontWeight="700" mb="10px">
            Ghi chú
          </Text>
          <Text color={textColorSecondary} fontSize="sm">
            Dashboard của Staff đang dùng chế độ rút gọn theo phạm vi tài khoản hoặc
            phòng ban. Các biểu đồ trạng thái tổng hệ thống và hoạt động toàn cục chỉ
            hiển thị cho admin hoặc manager.
          </Text>
        </Card>
      ) : null}
    </Box>
  );
}