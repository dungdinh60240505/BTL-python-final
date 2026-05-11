/*! =========================================================
* Horizon UI - v1.1.0
========================================================= */

import React from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Text,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
  VStack,
  Switch,
  FormControl,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalFooter,
  useDisclosure,
  Stack,
} from "@chakra-ui/react";
import { SearchIcon, AddIcon, DeleteIcon, EditIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";

import Card from "components/card/Card";
import { getCurrentUser, logout } from "api/authApi";
import { isUnauthorizedError } from "api/http";
import { listCategoryNeeds, createCategoryNeed, updateCategoryNeed, deleteCategoryNeed } from "api/categoryNeedsApi";
import { listCategories } from "api/categoriesApi";
import { listDepartments } from "api/departmentsApi";

const PAGE_SIZE = 10;

const TYPE_BADGE_COLOR = {
  supply: "blue",
  asset: "purple",
};

const TYPE_LABEL = {
  supply: "Vật tư",
  asset: "Tài sản",
};

function TypeBadge({ type }) {
  return (
    <Badge
      colorScheme={TYPE_BADGE_COLOR[type] || "gray"}
      borderRadius="999px"
      px="10px"
      py="4px"
    >
      {TYPE_LABEL[type] || type}
    </Badge>
  );
}

function StatusBadge({ isActive }) {
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

const initialForm = {
  category_id: "",
  department_id: "",
  require_quantity: "",
  detail: "",
  is_active: true,
};

export default function AssetNeeds() {
  const navigate = useNavigate();
  const toast = useToast();

  const [needs, setNeeds] = React.useState([]);
  const [departments, setDepartments] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [currentUserRole, setCurrentUserRole] = React.useState("");

  const [keyword, setKeyword] = React.useState("");
  const [deptFilter, setDeptFilter] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("");
  const [showAll, setShowAll] = React.useState(false);

  const [pageIndex, setPageIndex] = React.useState(0);

  const [savingId, setSavingId] = React.useState(null);
  const [deletingId, setDeletingId] = React.useState(null);
  const [creating, setCreating] = React.useState(false);

  const [editingNeed, setEditingNeed] = React.useState(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState("create");
  const [formData, setFormData] = React.useState(initialForm);

  const canManage = currentUserRole === "admin" || currentUserRole === "manager";

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const rowHoverBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const searchIconColor = useColorModeValue("gray.400", "gray.300");
  const searchInputBg = useColorModeValue("secondaryGray.300", "navy.900");
  const searchInputColor = useColorModeValue("gray.700", "gray.100");

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

  const fetchDepartments = React.useCallback(async () => {
    const depts = await listDepartments({ limit: 200, is_active: true });
    return Array.isArray(depts) ? depts : [];
  }, []);

  const fetchCategories = React.useCallback(async () => {
    const cats = await listCategories({ limit: 200 });
    return Array.isArray(cats) ? cats : [];
  }, []);

  const fetchNeeds = React.useCallback(async (params = {}) => {
    const data = await listCategoryNeeds(params);
    return Array.isArray(data) ? data : [];
  }, []);

  const loadPageData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [profile, depts, cats] = await Promise.all([
        getCurrentUser(),
        fetchDepartments(),
        fetchCategories(),
      ]);
      setCurrentUserRole(profile?.role || "");
      setDepartments(depts);
      setCategories(cats);
    } catch (error) {
      console.error("Load page failed:", error);
      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }
      toast({
        title: "Không tải được dữ liệu",
        description: error.message || "Có lỗi xảy ra.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [fetchDepartments, fetchCategories, handleUnauthorized, toast]);

  React.useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  React.useEffect(() => {
    setLoading(true);
    setPageIndex(0);
    const params = {};
    if (!showAll && deptFilter) {
      params.department_id = parseInt(deptFilter, 10);
    }
    if (categoryFilter) {
      params.category_id = parseInt(categoryFilter, 10);
    }

    (async () => {
      try {
        const data = await fetchNeeds(params);
        setNeeds(data);
      } catch (error) {
        console.error("Load needs failed:", error);
        if (isUnauthorizedError(error)) {
          handleUnauthorized();
          return;
        }
        toast({
          title: "Không tải được dữ liệu nhu cầu",
          description: error.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [showAll, deptFilter, categoryFilter, fetchNeeds, handleUnauthorized, toast]);

  const filteredData = React.useMemo(() => {
    if (!keyword.trim()) return needs;
    const kw = keyword.trim().toLowerCase();
    return (needs || []).filter((row) =>
      [
        row.category_name,
        row.category_code,
        row.department_name,
        row.department_code,
      ].some((v) => v && String(v).toLowerCase().includes(kw))
    );
  }, [needs, keyword]);

  React.useEffect(() => {
    setPageIndex(0);
  }, [keyword, needs]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const paginatedRows = filteredData.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE
  );
  const startRow = filteredData.length === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const endRow = Math.min((currentPage + 1) * PAGE_SIZE, filteredData.length);

  const handleOpenCreate = () => {
    setFormData({ ...initialForm, department_id: deptFilter || "" });
    setEditingNeed(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (need) => {
    setFormData({
      id: String(need.id),
      category_id: String(need.category_id),
      department_id: need.department_id ? String(need.department_id) : "",
      require_quantity: String(need.require_quantity),
      detail: String(need.detail ?? null),
      is_active: need.is_active ?? true,
    });
    setEditingNeed(need);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (savingId || creating) return;
    setIsModalOpen(false);
    setEditingNeed(null);
    setFormData(initialForm);
  };

  const handleSaveEdit = async () => {
    const qty = parseInt(formData.require_quantity, 10);
    if (!formData.category_id) {
      toast({ title: "Vui lòng chọn danh mục.", status: "warning", duration: 2000, isClosable: true });
      return;
    }
    if (isNaN(qty) || qty < 0) {
      toast({ title: "Số lượng cần phải là số nguyên không âm.", status: "warning", duration: 2000, isClosable: true });
      return;
    }

    try {
      setSavingId(editingNeed.id);
      console.log("id nhu cầu: ", editingNeed.id);
      console.log("payload edit: ", formData);
      const res_edit = await updateCategoryNeed(editingNeed.id, {
        department_id: formData.department_id ? parseInt(formData.department_id, 10) : null,
        require_quantity: qty,
        detail: formData.detail ?? null,
        is_active: formData.is_active,
      });
      console.log("sau edit: ", res_edit)
      const params = {};
      if (!showAll && deptFilter) params.department_id = parseInt(deptFilter, 10);
      if (categoryFilter) params.category_id = parseInt(categoryFilter, 10);
      const data = await fetchNeeds(params);
      setNeeds(data);

      toast({ title: "Cập nhật thành công", status: "success", duration: 2500, isClosable: true });
      handleCloseModal();
    } catch (error) {
      console.error("Update failed:", error);
      toast({ title: "Cập nhật thất bại", description: error.message, status: "error", duration: 3000, isClosable: true });
    } finally {
      setSavingId(null);
    }
  };

  const handleCreate = async () => {
    const qty = parseInt(formData.require_quantity, 10);
    if (!formData.category_id) {
      toast({ title: "Vui lòng chọn danh mục.", status: "warning", duration: 2000, isClosable: true });
      return;
    }
    if (isNaN(qty) || qty < 0) {
      toast({ title: "Số lượng cần phải là số nguyên không âm.", status: "warning", duration: 2000, isClosable: true });
      return;
    }

    try {
      setCreating(true);
      await createCategoryNeed({
        category_id: parseInt(formData.category_id, 10),
        department_id: formData.department_id ? parseInt(formData.department_id, 10) : null,
        require_quantity: qty,
        detail: formData.detail
      });

      const params = {};
      if (!showAll && deptFilter) params.department_id = parseInt(deptFilter, 10);
      if (categoryFilter) params.category_id = parseInt(categoryFilter, 10);
      console.log("param get nhu cầu: ",params)
      const data = await fetchNeeds(params);
      setNeeds(data);
      toast({ title: "Tạo thành công", status: "success", duration: 2500, isClosable: true });
      handleCloseModal();
    } catch (error) {
      console.error("Create failed:", error);
      toast({ title: "Tạo thất bại", description: error.message, status: "error", duration: 3000, isClosable: true });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (need) => {
    try {
      setDeletingId(need.id);
      await deleteCategoryNeed(need.id);

      const params = {};
      if (!showAll && deptFilter) params.department_id = parseInt(deptFilter, 10);
      if (categoryFilter) params.category_id = parseInt(categoryFilter, 10);
      const data = await fetchNeeds(params);
      setNeeds(data);

      toast({ title: "Xóa thành công", status: "success", duration: 2500, isClosable: true });
      handleCloseModal();
    } catch (error) {
      console.error("Delete failed:", error);
      toast({ title: "Xóa thất bại", description: error.message, status: "error", duration: 3000, isClosable: true });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
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
              Nhu cầu tài sản
            </Text>
            <Text mt="4px" color="gray.500" fontSize="sm">
              {canManage
                ? "Quản lý nhu cầu số lượng theo danh mục và phòng ban."
                : "Bạn đang ở chế độ chỉ xem nhu cầu tài sản."}
            </Text>
          </Box>

          {canManage && (
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              borderRadius="12px"
              onClick={handleOpenCreate}
            >
              Thêm nhu cầu
            </Button>
          )}
        </Flex>

        <Flex
          px="25px"
          pb="18px"
          gap="12px"
          wrap="wrap"
          align="center"
        >
          <HStack spacing="12px" wrap="wrap">
            <FormControl display="flex" alignItems="center" w="auto" whiteSpace="nowrap">
              <Switch
                id="show-all"
                colorScheme="blue"
                isChecked={showAll}
                onChange={(e) => {
                  setShowAll(e.target.checked);
                  setDeptFilter("");
                  setPageIndex(0);
                }}
                mr="8px"
              />
              <FormLabel htmlFor="show-all" mb="0" fontSize="sm" color="gray.500" cursor="pointer">
                Tất cả phòng ban
              </FormLabel>
            </FormControl>

            <Select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setPageIndex(0);
              }}
              maxW={{ base: "100%", md: "260px" }}
              borderRadius="16px"
              placeholder="-- Chọn phòng ban --"
              isDisabled={showAll || loading}
            >
              {departments.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.code} - {d.name}
                </option>
              ))}
            </Select>

            <Select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPageIndex(0);
              }}
              maxW={{ base: "100%", md: "200px" }}
              borderRadius="16px"
              placeholder="Tất cả danh mục"
              isDisabled={loading}
            >
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.category_name}
                </option>
              ))}
            </Select>
          </HStack>

          <InputGroup maxW={{ base: "100%", md: "280px" }} ml="auto">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color={searchIconColor} />
            </InputLeftElement>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm danh mục, phòng ban..."
              bg={searchInputBg}
              color={searchInputColor}
              borderRadius="16px"
              _placeholder={{ color: "gray.400" }}
            />
          </InputGroup>
        </Flex>

        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th borderColor={borderColor}>STT</Th>
                <Th borderColor={borderColor}>Phòng ban</Th>
                <Th borderColor={borderColor}>Danh mục</Th>
                <Th borderColor={borderColor}>Chi tiết</Th>
                <Th borderColor={borderColor}>Loại</Th>
                <Th borderColor={borderColor} isNumeric>Hiện có</Th>
                <Th borderColor={borderColor} isNumeric>Số lượng cần</Th>
                <Th borderColor={borderColor}>Trạng thái</Th>
                {canManage && <Th borderColor={borderColor}>Thao tác</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={8} borderColor={borderColor} textAlign="center" py="20px" color="gray.500">
                    Đang tải dữ liệu...
                  </Td>
                </Tr>
              ) : !showAll && !deptFilter ? (
                <Tr>
                  <Td colSpan={8} borderColor={borderColor} textAlign="center" py="20px" color="gray.500">
                    Vui lòng chọn phòng ban hoặc bật "Tất cả phòng ban" để xem dữ liệu.
                  </Td>
                </Tr>
              ) : paginatedRows.length === 0 ? (
                <Tr>
                  <Td colSpan={8} borderColor={borderColor} textAlign="center" py="20px" color="gray.500">
                    Không có nhu cầu nào.
                  </Td>
                </Tr>
              ) : (
                paginatedRows.map((row, index) => (
                  <Tr key={row.id} _hover={{ bg: rowHoverBg }}>
                    <Td borderColor={borderColor}>{index + 1}</Td>
                    <Td borderColor={borderColor}>
                      {row.department_name ? (
                        <Text fontWeight="600">
                          {row.department_code} — {row.department_name}
                        </Text>
                      ) : (
                        <Text color="gray.400" fontStyle="italic">—</Text>
                      )}
                    </Td>
                    <Td borderColor={borderColor}>{row.category_name || row.category_id}</Td>
                    <Td borderColor={borderColor}>{row.detail || ""}</Td>
                    <Td borderColor={borderColor}>
                      <TypeBadge type={row.category_type} />
                    </Td>
                    <Td borderColor={borderColor} isNumeric>
                      {row.current_quantity ?? 0}
                    </Td>
                    <Td borderColor={borderColor} isNumeric fontWeight="600">
                      {row.require_quantity}
                    </Td>
                    <Td borderColor={borderColor}>
                      <StatusBadge isActive={row.is_active} />
                    </Td>
                    {canManage && (
                      <Td borderColor={borderColor}>
                        <HStack spacing="8px">
                          <Button
                            size="xs"
                            colorScheme="blue"
                            variant="ghost"
                            leftIcon={<EditIcon />}
                            onClick={() => handleOpenEdit(row)}
                          >
                            Sửa
                          </Button>
                          <Button
                            size="xs"
                            colorScheme="red"
                            variant="ghost"
                            leftIcon={<DeleteIcon />}
                            isLoading={deletingId === row.id}
                            onClick={() => handleDelete(row)}
                          >
                            Xóa
                          </Button>
                        </HStack>
                      </Td>
                    )}
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
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
              onClick={() => setPageIndex((p) => Math.max(p - 1, 0))}
              isDisabled={currentPage === 0}
            >
              Trước
            </Button>
            <Button variant="ghost" isDisabled>
              Trang {currentPage + 1} / {totalPages}
            </Button>
            <Button
              variant="outline"
              onClick={() => setPageIndex((p) => Math.min(p + 1, totalPages - 1))}
              isDisabled={currentPage >= totalPages - 1}
            >
              Tiếp
            </Button>
          </Flex>
        </Flex>
      </Card>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} size="md" isCentered scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent bg={useColorModeValue("white", "navy.800")} borderRadius="20px">
          <ModalHeader>{modalMode === "create" ? "Thêm nhu cầu" : "Sửa nhu cầu"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing="16px">
              <FormControl isRequired>
                <FormLabel>Danh mục</FormLabel>
                <Select
                  value={formData.category_id}
                  onChange={(e) => setFormData((p) => ({ ...p, category_id: e.target.value }))}
                  placeholder="-- Chọn danh mục --"
                  borderRadius="12px"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.category_code} — {c.category_name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Phòng ban</FormLabel>
                <Select
                  value={formData.department_id}
                  onChange={(e) => setFormData((p) => ({ ...p, department_id: e.target.value }))}
                  placeholder="-- Chọn phòng ban (tùy chọn) --"
                  borderRadius="12px"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      {d.code} — {d.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Số lượng cần</FormLabel>
                <Input
                  type="number"
                  min="0"
                  value={formData.require_quantity}
                  onChange={(e) => setFormData((p) => ({ ...p, require_quantity: e.target.value }))}
                  placeholder="VD: 10"
                  borderRadius="12px"
                />
              </FormControl>

              <FormControl >
                <FormLabel>Chi tiết</FormLabel>
                <Input
                  type="text"
                  value={formData.detail ?? ""}
                  onChange={(e) => setFormData((p) => ({ ...p, detail: e.target.value }))}
                  placeholder="VD: chi tiết"
                  borderRadius="12px"
                />
              </FormControl>

              {modalMode === "edit" && (
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Hoạt động</FormLabel>
                  <Switch
                    colorScheme="green"
                    isChecked={formData.is_active}
                    onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.checked }))}
                  />
                </FormControl>
              )}
            </Stack>
          </ModalBody>
          <ModalFooter gap="12px">
            {modalMode === "edit" && canManage && (
              <Button
                colorScheme="red"
                variant="outline"
                leftIcon={<DeleteIcon />}
                isLoading={deletingId !== null}
                onClick={() => handleDelete(editingNeed)}
              >
                Xóa
              </Button>
            )}
            <Button variant="outline" onClick={handleCloseModal}>Hủy</Button>
            <Button
              colorScheme="blue"
              isLoading={modalMode === "create" ? creating : savingId !== null}
              onClick={modalMode === "create" ? handleCreate : handleSaveEdit}
            >
              Lưu
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
