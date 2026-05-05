import React from "react";
import {
  Badge,
  Box,
  Input,
  Select,
  Spinner,
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
import { useNavigate } from "react-router-dom";

import Card from "components/card/Card";
import { getCurrentUser, logout } from "api/authApi";
import { isUnauthorizedError } from "api/http";
import { getAssetNeeds, updateCategoryRequirement } from "api/assetNeedsApi";
import { listDepartments } from "api/departmentsApi";

const STATUS_COLOR = { shortage: "red", sufficient: "green", surplus: "blue" };
const STATUS_LABEL = { shortage: "Thiếu", sufficient: "Đủ", surplus: "Thừa" };
const TYPE_LABEL = { asset: "Tài sản cố định", quantity_asset: "Tài sản số lượng" };

export default function AssetNeeds() {
  const navigate = useNavigate();
  const toast = useToast();

  const [departments, setDepartments] = React.useState([]);
  const [selectedDeptId, setSelectedDeptId] = React.useState("");
  const [needs, setNeeds] = React.useState([]);
  const [loadingDepts, setLoadingDepts] = React.useState(true);
  const [loadingNeeds, setLoadingNeeds] = React.useState(false);
  const [editingKey, setEditingKey] = React.useState(null);
  const [editValue, setEditValue] = React.useState("");

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");

  const handleUnauthorized = React.useCallback(() => {
    logout();
    toast({ title: "Phiên đăng nhập đã hết hạn", status: "warning", duration: 2500, isClosable: true });
    navigate("/auth/sign-in", { replace: true });
  }, [navigate, toast]);

  React.useEffect(() => {
    (async () => {
      try {
        await getCurrentUser();
        const depts = await listDepartments({ limit: 200 });
        setDepartments(Array.isArray(depts) ? depts : []);
      } catch (err) {
        if (isUnauthorizedError(err)) { handleUnauthorized(); return; }
        toast({ title: "Không tải được phòng ban", status: "error", duration: 3000, isClosable: true });
      } finally {
        setLoadingDepts(false);
      }
    })();
  }, [handleUnauthorized, toast]);

  React.useEffect(() => {
    if (!selectedDeptId) { setNeeds([]); return; }
    (async () => {
      try {
        setLoadingNeeds(true);
        const data = await getAssetNeeds(selectedDeptId);
        console.log("Dữ liệu GET: ", data)
        setNeeds(Array.isArray(data) ? data : []);
      } catch (err) {
        if (isUnauthorizedError(err)) { handleUnauthorized(); return; }
        toast({ title: "Không tải được nhu cầu tài sản", status: "error", duration: 3000, isClosable: true });
      } finally {
        setLoadingNeeds(false);
      }
    })();
  }, [selectedDeptId, handleUnauthorized, toast]);

  const rowKey = (row) => `${row.asset_type}::${row.category}`;

  const handleStartEdit = (row) => {
    setEditingKey(rowKey(row));
    setEditValue(String(row.required_quantity_category));
  };

  const handleSaveEdit = async (row) => {
    const val = parseInt(editValue, 10);
    if (isNaN(val) || val < 0) {
      toast({ title: "Giá trị không hợp lệ", status: "warning", duration: 2000, isClosable: true });
      return;
    }
    try {
      await updateCategoryRequirement({
        department_id: parseInt(selectedDeptId, 10),
        asset_type: row.asset_type,
        category: row.category,
        required_quantity_category: val,
      });
      setNeeds((prev) =>
        prev.map((r) =>
          rowKey(r) === rowKey(row)
            ? { ...r, required_quantity_category: val, status: calcStatus(r.current_quantity, val) }
            : r
        )
      );
      toast({ title: "Đã cập nhật", status: "success", duration: 2000, isClosable: true });
    } catch (err) {
      toast({ title: "Cập nhật thất bại", description: err.message, status: "error", duration: 3000, isClosable: true });
    } finally {
      setEditingKey(null);
    }
  };

  const calcStatus = (current, required) => {
    if (current < required) return "shortage";
    if (current === required) return "sufficient";
    return "surplus";
  };

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Card flexDirection="column" w="100%" px="0px">
        <Box px="25px" pt="20px" pb="16px">
          <Text color={textColor} fontSize="22px" fontWeight="700">Nhu cầu tài sản</Text>
          <Text mt="4px" color="gray.500" fontSize="sm">Theo dõi số lượng tài sản cần thiết theo phòng ban. Nhấn vào số lượng cần để thay đổi (admin)</Text>
        </Box>

        <Box px="25px" pb="20px" maxW="360px">
          {loadingDepts ? (
            <Spinner size="sm" />
          ) : (
            <Select
              placeholder="-- Chọn phòng ban --"
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              borderRadius="16px"
            >
              {departments.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.code} - {d.name}
                </option>
              ))}
            </Select>
          )}
        </Box>

        {selectedDeptId && (
          <Box px="25px" pb="25px" overflowX="auto">
            {loadingNeeds ? (
              <Spinner />
            ) : needs.length === 0 ? (
              <Text color="gray.500" py="20px" textAlign="center">
                Phòng ban này chưa có tài sản nào.
              </Text>
            ) : (
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Danh mục</Th>
                    <Th>Loại</Th>
                    <Th isNumeric>Số lượng cần</Th>
                    <Th isNumeric>Hiện có</Th>
                    <Th>Trạng thái</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {needs.map((row) => {
                    const key = rowKey(row);
                    const isEditing = editingKey === key;
                    return (
                      <Tr key={key} borderBottom="1px solid" borderColor={borderColor}>
                        <Td fontWeight="600" textTransform="capitalize">{row.category}</Td>
                        <Td>
                          <Badge colorScheme={row.asset_type === "asset" ? "purple" : "teal"} borderRadius="999px" px="8px">
                            {TYPE_LABEL[row.asset_type] || row.asset_type}
                          </Badge>
                        </Td>
                        <Td isNumeric>
                          {isEditing ? (
                            <Input
                              size="xs"
                              type="number"
                              min="0"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => handleSaveEdit(row)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit(row);
                                if (e.key === "Escape") setEditingKey(null);
                              }}
                              autoFocus
                              w="80px"
                              textAlign="right"
                            />
                          ) : (
                            <Text
                              cursor="pointer"
                              _hover={{ textDecoration: "underline", color: "blue.400" }}
                              onClick={() => handleStartEdit(row)}
                              textAlign="right"
                            >
                              {row.required_quantity_category}
                            </Text>
                          )}
                        </Td>
                        <Td isNumeric>{row.current_quantity}</Td>
                        <Td>
                          <Badge
                            colorScheme={STATUS_COLOR[row.status] || "gray"}
                            borderRadius="999px"
                            px="10px"
                            py="4px"
                          >
                            {STATUS_LABEL[row.status] || row.status}
                          </Badge>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            )}
          </Box>
        )}
      </Card>
    </Box>
  );
}
