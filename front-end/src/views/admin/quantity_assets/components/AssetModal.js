import React from "react";
import {
  Badge,
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Stack,
  Switch,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, CheckIcon} from "@chakra-ui/icons";
import {
  createLocation,
  deleteLocation,
  updateLocation,
  approveLocation,
  listLocations,
} from "api/quantityAssetsApi";
import { getCurrentUser } from "api/authApi";

const STATUS_OPTIONS = [
  { value: "available", label: "Sẵn sàng" },
  { value: "in_use", label: "Đang sử dụng" },
  { value: "under_maintenance", label: "Đang bảo trì" },
  { value: "damaged", label: "Bị hỏng" },
  { value: "liquidated", label: "Đã thanh lý" },
];

const CONDITION_OPTIONS = [
  { value: "new", label: "Mới" },
  { value: "good", label: "Tốt" },
  { value: "fair", label: "Khá" },
  { value: "poor", label: "Kém" },
  { value: "broken", label: "Hỏng" },
];

const initialFormData = {
  code: "",
  name: "",
  category: "",
  quantity: 0,
  available_quantity: 0,
  specification: "",
  purchase_date: "",
  purchase_cost: "",
  status: "available",
  condition: "good",
  location: "",
  note: "",
  assigned_department_id: "",
  assigned_user_id: "",
  is_active: true,
};

const APPROVAL_COLOR = { approved: "green", pending: "yellow", rejected: "red" };
const APPROVAL_LABEL = { approved: "Đã duyệt", pending: "Chờ duyệt", rejected: "Không duyệt" };
const LOC_APPROVAL_COLOR = { approval: "green", pending: "yellow", not_approval: "red" };
const LOC_APPROVAL_LABEL = { approval: "Đã duyệt", pending: "Chờ duyệt", not_approval: "Không duyệt" };

const valueMap = {
  new: "Mới", good: "Tốt", fair: "Khá", poor: "Kém", broken: "Hỏng",
  available: "Sẵn sàng", in_use: "Đang sử dụng",
  under_maintenance: "Đang bảo trì", damaged: "Bị hỏng", liquidated: "Đã thanh lý",
};

function LocationTable({ assetId, canManage, currentUserRole }) {
  const toast = useToast();
  const [locations, setLocations] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [newRoomCode, setNewRoomCode] = React.useState("");
  const [newQuantity, setNewQuantity] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState(null);
  const [approvingId, setApprovingId] = React.useState(null);

  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const khoRowBg = useColorModeValue("purple.50", "purple.900");

  const fetchLocations = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await listLocations(assetId);
      setLocations(data);
    } catch {
      toast({ title: "Không tải được vị trí", status: "error", duration: 2500, isClosable: true });
    } finally {
      setLoading(false);
    }
  }, [assetId, toast]);

  React.useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleAdd = async () => {
    const qty = parseInt(newQuantity, 10);
    if (!newRoomCode.trim() || isNaN(qty) || qty <= 0) {
      toast({ title: "Mã phòng và số lượng không hợp lệ", status: "warning", duration: 2000, isClosable: true });
      return;
    }
    try {
      setAdding(true);
      await createLocation(assetId, { room_code: newRoomCode.trim(), quantity: qty });
      setNewRoomCode("");
      setNewQuantity("");
      await fetchLocations();
      toast({ title: "Đã thêm vị trí", status: "success", duration: 2000, isClosable: true });
    } catch (err) {
      toast({ title: "Thêm thất bại", description: err.message, status: "error", duration: 3000, isClosable: true });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (locId) => {
    try {
      setDeletingId(locId);
      await deleteLocation(assetId, locId);
      await fetchLocations();
      toast({ title: "Đã xóa vị trí", status: "success", duration: 2000, isClosable: true });
    } catch (err) {
      toast({ title: "Xóa thất bại", description: err.message, status: "error", duration: 3000, isClosable: true });
    } finally {
      setDeletingId(null);
    }
  };

  const handleApproval = async (locId) => {
    try {
      setApprovingId(locId);
      await approveLocation(assetId, locId);
      await fetchLocations();
      toast({ title: "(Admin) đã xác nhận vị trí", status: "success", duration: 2000, isClosable: true });
    } catch (err) {
      toast({ title: "(Admin) xác nhận thất bại", description: err.message, status: "error", duration: 3000, isClosable: true });
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) return <Spinner size="sm" />;

  return (
    <Box>
      <Box overflowX="auto">
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>Mã phòng</Th>
              <Th isNumeric>Số lượng</Th>
              {/* <Th isNumeric>Sử dụng</Th> */}
              <Th>Trạng thái</Th>
              {canManage && <Th />}
            </Tr>
          </Thead>
          <Tbody>
            {locations.map((loc) => {
              const isKho = loc.room_code === "KHO";
              return (
                <Tr key={loc.id} bg={isKho ? khoRowBg : undefined}>
                  <Td fontWeight={isKho ? "700" : "normal"}>{loc.room_code}</Td>
                  <Td isNumeric>{loc.quantity}</Td>
                  {/* <Td isNumeric>{loc.used}</Td> */}
                  <Td>
                    <Badge colorScheme={LOC_APPROVAL_COLOR[loc.status_approval] || "gray"} borderRadius="999px" px="8px">
                      {LOC_APPROVAL_LABEL[loc.status_approval] || loc.status_approval}
                    </Badge>
                  </Td>
                  {canManage && (
                    <Td>
                      {!isKho && (
                        <IconButton
                          size="xs"
                          colorScheme="red"
                          variant="ghost"
                          icon={<DeleteIcon />}
                          isLoading={deletingId === loc.id}
                          onClick={() => handleDelete(loc.id)}
                          aria-label="Xóa vị trí"
                        />)}
                        {!isKho && (loc.status_approval !== "approval") && (currentUserRole === "admin") && (
                        <IconButton
                          size="xs"
                          colorScheme="red"
                          variant="ghost"
                          icon={<CheckIcon />}
                          isLoading={deletingId === loc.id}
                          onClick={() => handleApproval(loc.id)}
                          aria-label="Xóa vị trí"
                        />
                      )}
                    </Td>
                  )}
                </Tr>
              );
            })}
            {locations.length === 0 && (
              <Tr>
                <Td colSpan={5} textAlign="center" color="gray.500">Chưa có vị trí nào</Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>

      {canManage && (
        <HStack mt="12px" spacing="8px">
          <Input
            size="sm"
            placeholder="Mã phòng (VD: P101)"
            value={newRoomCode}
            onChange={(e) => setNewRoomCode(e.target.value)}
            maxW="140px"
          />
          <Input
            size="sm"
            type="number"
            min="1"
            placeholder="Số lượng"
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
            maxW="110px"
          />
          <Button size="sm" colorScheme="blue" leftIcon={<AddIcon />} isLoading={adding} onClick={handleAdd}>
            Thêm
          </Button>
        </HStack>
      )}
    </Box>
  );
}

export default function AssetModal(props) {
  const {
    asset,
    departmentOptions = [],
    userOptions = [],
    isOpen,
    isSubmitting,
    isDeactivating,
    isApproving,
    isRejecting,
    onClose,
    onDeactivate,
    onApprove,
    onReject,
    onSave,
    mode = "edit",
    canManageAssets = false,
    canDeactivateAssetByRole = false,
    currentUserRole = "",
  } = props;

  const isCreateMode = mode === "create";
  const [isEditing, setIsEditing] = React.useState(isCreateMode);

  const modalBg = useColorModeValue("white", "navy.800");
  const readOnlyTextColor = useColorModeValue("secondaryGray.900", "white");
  const readOnlyBorderColor = useColorModeValue("secondaryGray.100", "whiteAlpha.100");
  const readOnlyBg = useColorModeValue("secondaryGray.300", "navy.700");

  const [formData, setFormData] = React.useState(initialFormData);

  React.useEffect(() => {
    if (!isOpen) return;
    if (isCreateMode) { setFormData(initialFormData); setIsEditing(true); return; }
    if (!asset) return;
    setFormData({
      code: asset.code || "",
      name: asset.name || "",
      quantity: asset.quantity || 0,
      available_quantity: asset.available_quantity || 0,
      category: asset.category || "",
      specification: asset.specification || "",
      purchase_date: asset.purchase_date || "",
      useful_life: asset.useful_life || 0,
      purchase_cost: asset.purchase_cost || "",
      status: asset.status || "available",
      condition: asset.condition || "good",
      location: asset.location || "",
      note: asset.note || "",
      assigned_department_id: asset.assigned_department_id ?? "",
      assigned_user_id: asset.assigned_user_id ?? "",
      is_active: asset.is_active ?? true,
    });
    setIsEditing(false);
  }, [asset, isCreateMode, isOpen]);

  if (!isCreateMode && !asset) return null;

  const isReadOnly = !isCreateMode && (!isEditing || !canManageAssets);
  const approvalStatus = asset?.approval_status || "pending";
  const isApproved = approvalStatus === "approved";
  const isPending = approvalStatus === "pending";
  const canApproveReject = canDeactivateAssetByRole && isPending && !isCreateMode;

  const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    await onSave?.({
      ...(isCreateMode ? {} : { id: asset.id }),
      code: formData.code,
      name: formData.name,
      quantity: formData.quantity,
      available_quantity: formData.available_quantity,
      category: formData.category,
      specification: formData.specification,
      purchase_date: formData.purchase_date,
      useful_life: formData.useful_life,
      purchase_cost: formData.purchase_cost,
      status: formData.status,
      condition: formData.condition,
      location: formData.location,
      note: formData.note,
      assigned_department_id: formData.assigned_department_id,
      assigned_user_id: formData.assigned_user_id,
      is_active: formData.is_active,
    });
    if (!isCreateMode) setIsEditing(false);
  };

  const readOnlyFieldProps = {
    isReadOnly: true,
    variant: "main",
    color: readOnlyTextColor,
    borderColor: readOnlyBorderColor,
    bg: readOnlyBg,
  };

  const modalTitle = isCreateMode
    ? currentUserRole === "manager" ? "Yêu cầu thêm lô tài sản" : "Thêm lô tài sản"
    : "Chi tiết lô tài sản";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg={modalBg} borderRadius="20px">
        <ModalHeader>{modalTitle}</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          {isReadOnly ? (
            <Stack spacing="16px">
              {/* Approval status badge */}
              <HStack>
                <Badge colorScheme={APPROVAL_COLOR[approvalStatus]} borderRadius="999px" px="12px" py="6px">
                  {APPROVAL_LABEL[approvalStatus]}
                </Badge>
                {!asset?.is_active && isApproved === false && (
                  <Badge colorScheme="red" borderRadius="999px" px="12px" py="6px">Không hoạt động</Badge>
                )}
              </HStack>

              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="16px">
                <GridItem><FormControl><FormLabel>ID</FormLabel><Input value={asset?.id || ""} {...readOnlyFieldProps} /></FormControl></GridItem>
                <GridItem><FormControl><FormLabel>Trạng thái hoạt động</FormLabel><Input value={asset?.is_active ? "Hoạt động" : "Không hoạt động"} {...readOnlyFieldProps} /></FormControl></GridItem>
                <GridItem><FormControl><FormLabel>Mã lô</FormLabel><Input value={asset?.code || "không có code"} {...readOnlyFieldProps} /></FormControl></GridItem>
                <GridItem><FormControl><FormLabel>Tên</FormLabel><Input value={asset?.name || ""} {...readOnlyFieldProps} /></FormControl></GridItem>
                <GridItem><FormControl><FormLabel>Danh mục</FormLabel><Input value={asset?.category || ""} {...readOnlyFieldProps} /></FormControl></GridItem>
                <GridItem><FormControl><FormLabel>Trạng thái</FormLabel><Input value={valueMap[asset.status] || "Không xác định"} {...readOnlyFieldProps} /></FormControl></GridItem>
                <GridItem><FormControl><FormLabel>Số lượng</FormLabel><Input value={asset?.quantity || 0} {...readOnlyFieldProps} /></FormControl></GridItem>
                <GridItem><FormControl><FormLabel>Có sẵn</FormLabel><Input value={asset?.available_quantity || 0} {...readOnlyFieldProps} /></FormControl></GridItem>
                <GridItem><FormControl><FormLabel>Ngày mua</FormLabel><Input value={asset?.purchase_date || ""} {...readOnlyFieldProps} /></FormControl></GridItem>
                <GridItem><FormControl><FormLabel>Thời gian khấu hao (Tháng)</FormLabel><Input value={asset?.useful_life || 0} {...readOnlyFieldProps} /></FormControl></GridItem>
                <GridItem><FormControl><FormLabel>Giá mua</FormLabel><Input value={asset?.purchase_cost || ""} {...readOnlyFieldProps} /></FormControl></GridItem>
                <GridItem><FormControl><FormLabel>Tình trạng</FormLabel><Input value={valueMap[asset.condition] || "Không xác định"} {...readOnlyFieldProps} /></FormControl></GridItem>
                <GridItem><FormControl><FormLabel>Vị trí lưu kho</FormLabel><Input value={asset?.location || ""} {...readOnlyFieldProps} /></FormControl></GridItem>
                <GridItem><FormControl><FormLabel>Phòng ban phụ trách</FormLabel><Input value={asset?.assigned_department || "-"} {...readOnlyFieldProps} /></FormControl></GridItem>
                <GridItem><FormControl><FormLabel>Người phụ trách</FormLabel><Input value={asset?.assigned_user || "-"} {...readOnlyFieldProps} /></FormControl></GridItem>
                <GridItem><FormControl><FormLabel>Thời gian tạo</FormLabel><Input value={asset?.created_at || ""} {...readOnlyFieldProps} /></FormControl></GridItem>
                <GridItem><FormControl><FormLabel>Cập nhật gần nhất</FormLabel><Input value={asset?.updated_at || ""} {...readOnlyFieldProps} /></FormControl></GridItem>
              </Grid>

              <FormControl><FormLabel>Thông số</FormLabel><Textarea value={asset?.specification || ""} resize="vertical" {...readOnlyFieldProps} /></FormControl>
              <FormControl><FormLabel>Ghi chú</FormLabel><Textarea value={asset?.note || ""} resize="vertical" {...readOnlyFieldProps} /></FormControl>

              {/* Location table — chỉ hiện khi đã duyệt */}
              {isApproved && (
                <>
                  <Divider />
                  <Box>
                    <Text fontWeight="700" fontSize="md" mb="10px">Phân bổ vị trí</Text>
                    {currentUserRole==="admin" && <Text fontWeight="300" fontSize="md" mb="4px">Admin có toàn quyền quản lí vị trí của tài sản.</Text>}
                    {currentUserRole==="manager" && <Text fontWeight="300" fontSize="md" mb="4px">Quản lí chỉ được yêu cầu, cần chờ admin duyệt.</Text>}
                    {currentUserRole==="staff" && <Text fontWeight="300" fontSize="md" mb="4px">Nhân viên chỉ được phép xem danh sách.</Text>}
                    <LocationTable
                      assetId={asset?.id}
                      canManage={canManageAssets}
                      currentUserRole={currentUserRole}
                    />
                  </Box>
                </>
              )}

              {!canManageAssets && (
                <Text fontSize="sm" color="gray.500">Tài khoản của bạn chỉ có quyền xem tài sản.</Text>
              )}
            </Stack>
          ) : (
            <Stack spacing="16px">
              {!asset?.is_active && !isCreateMode && (
                <Badge colorScheme="red" borderRadius="999px" px="12px" py="6px" w="fit-content">
                  Tài sản này đang ở trạng thái không hoạt động
                </Badge>
              )}
              {isCreateMode && currentUserRole === "manager" && (
                <Badge colorScheme="yellow" borderRadius="999px" px="12px" py="6px" w="fit-content">
                  Yêu cầu sẽ chờ admin duyệt
                </Badge>
              )}

              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="16px">
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Mã lô</FormLabel>
                    <Input value={formData.code} onChange={(e) => handleChange("code", e.target.value)} placeholder="VD: AS-001"  />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Tên</FormLabel>
                    <Input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Nhập tên tài sản"  />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Danh mục</FormLabel>
                    <Input value={formData.category} onChange={(e) => handleChange("category", e.target.value)} placeholder="VD: Laptop, Printer"  />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl>
                    <FormLabel>Trạng thái</FormLabel>
                    <Select value={formData.status} onChange={(e) => handleChange("status", e.target.value)}>
                      {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Số lượng</FormLabel>
                    <Input type="number" min="0" value={formData.quantity} onChange={(e) => handleChange("quantity", e.target.value)}  />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Có sẵn</FormLabel>
                    <Input type="number" min="0" value={formData.available_quantity} onChange={(e) => handleChange("available_quantity", e.target.value)}  />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl>
                    <FormLabel>Ngày mua</FormLabel>
                    <Input type="date" value={formData.purchase_date} onChange={(e) => handleChange("purchase_date", e.target.value)}  />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Thời gian khấu hao (Tháng)</FormLabel>
                    <Input 
                      type="number" 
                      min="0" 
                      step="1" 
                      value={formData.useful_life} 
                      onChange={(e) => handleChange("useful_life", e.target.value)}  
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Giá mua/chiếc</FormLabel>
                    <Input type="number" min="0" step="0.01" value={formData.purchase_cost} onChange={(e) => handleChange("purchase_cost", e.target.value)} />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl>
                    <FormLabel>Tình trạng</FormLabel>
                    <Select value={formData.condition} onChange={(e) => handleChange("condition", e.target.value)}>
                      {CONDITION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl>
                    <FormLabel>Vị trí lưu kho</FormLabel>
                    <Input value={formData.location} onChange={(e) => handleChange("location", e.target.value)} />
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl>
                    <FormLabel>Phòng ban phụ trách</FormLabel>
                    <Select value={formData.assigned_department_id} onChange={(e) => handleChange("assigned_department_id", e.target.value)}>
                      <option value="">Chưa giao phòng ban</option>
                      {departmentOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                  </FormControl>
                </GridItem>
                <GridItem>
                  <FormControl>
                    <FormLabel>Người phụ trách</FormLabel>
                    <Select value={formData.assigned_user_id} onChange={(e) => handleChange("assigned_user_id", e.target.value)}>
                      <option value="">Chưa giao người dùng</option>
                      {userOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                  </FormControl>
                </GridItem>
                {!isCreateMode && (
                  <GridItem>
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">Hoạt động</FormLabel>
                      <Switch isChecked={formData.is_active} onChange={(e) => handleChange("is_active", e.target.checked)}  />
                    </FormControl>
                  </GridItem>
                )}
              </Grid>

              <FormControl>
                <FormLabel>Thông số</FormLabel>
                <Textarea value={formData.specification} onChange={(e) => handleChange("specification", e.target.value)} placeholder="Thông số kỹ thuật" resize="vertical" />
              </FormControl>
              <FormControl>
                <FormLabel>Ghi chú</FormLabel>
                <Textarea value={formData.note} onChange={(e) => handleChange("note", e.target.value)} placeholder="Ghi chú thêm" resize="vertical" />
              </FormControl>
            </Stack>
          )}
        </ModalBody>

        <ModalFooter gap="12px" flexWrap="wrap">
          {isCreateMode ? (
            <>
              <Button variant="outline" onClick={onClose}>Hủy</Button>
              <Button colorScheme="blue" onClick={handleSubmit} isLoading={isSubmitting}>
                {currentUserRole === "manager" ? "Gửi yêu cầu" : "Lưu"}
              </Button>
            </>
          ) : isReadOnly ? (
            <>
              <Button variant="outline" onClick={onClose}>Đóng</Button>
              {canApproveReject && (
                <>
                  <Button colorScheme="red" variant="outline" onClick={() => onReject?.(asset)} isLoading={isRejecting}>
                    Không duyệt
                  </Button>
                  <Button colorScheme="green" onClick={() => onApprove?.(asset)} isLoading={isApproving}>
                    Duyệt
                  </Button>
                </>
              )}
              {canManageAssets && (
                <Button colorScheme="blue" onClick={() => setIsEditing(true)}>Sửa</Button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Hủy</Button>
              {canDeactivateAssetByRole && asset?.is_active && (
                <Button colorScheme="red" variant="outline" onClick={() => onDeactivate?.(asset)} isLoading={isDeactivating}>
                  Vô hiệu hóa
                </Button>
              )}
              <Button colorScheme="blue" onClick={handleSubmit} isLoading={isSubmitting}>Lưu</Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
