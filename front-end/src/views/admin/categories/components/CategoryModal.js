import React from "react";
import {
  Badge,
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

const TYPE_OPTIONS = [
  { value: "supply", label: "Vật tư (supply)" },
  { value: "asset", label: "Tài sản (asset)" },
];

const TYPE_BADGE_COLOR = {
  supply: "blue",
  asset: "purple",
};

const initialFormData = {
  category_code: "",
  category_name: "",
  category_type: "supply",
};

export default function CategoryModal(props) {
  const {
    category,
    isOpen,
    isSubmitting,
    isDeleting,
    onClose,
    onDelete,
    onSave,
    mode = "edit",
    canManageCategories = false,
    canDeleteCategoryByRole = false,
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

    if (isCreateMode) {
      setFormData(initialFormData);
      setIsEditing(true);
      return;
    }

    if (!category) return;

    setFormData({
      category_code: category.category_code || "",
      category_name: category.category_name || "",
      category_type: category.category_type || "supply",
    });

    setIsEditing(false);
  }, [category, isCreateMode, isOpen]);

  if (!isCreateMode && !category) return null;

  const isReadOnly = !isCreateMode && (!isEditing || !canManageCategories);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    await onSave?.({
      ...(isCreateMode ? {} : { id: category.id }),
      category_code: formData.category_code.trim(),
      category_name: formData.category_name.trim(),
      category_type: formData.category_type,
    });

    if (!isCreateMode) {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    await onDelete?.(category);
  };

  const readOnlyFieldProps = {
    isReadOnly: true,
    variant: "main",
    color: readOnlyTextColor,
    borderColor: readOnlyBorderColor,
    bg: readOnlyBg,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered>
      <ModalOverlay />
      <ModalContent bg={modalBg} borderRadius="20px">
        <ModalHeader>
          {isCreateMode ? "Thêm danh mục" : "Chi tiết danh mục"}
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          {isReadOnly ? (
            <Stack spacing="16px">
              <FormControl>
                <FormLabel>ID</FormLabel>
                <Input value={category?.id || ""} {...readOnlyFieldProps} />
              </FormControl>

              <FormControl>
                <FormLabel>Mã danh mục</FormLabel>
                <Input value={category?.category_code || ""} {...readOnlyFieldProps} />
              </FormControl>

              <FormControl>
                <FormLabel>Tên danh mục</FormLabel>
                <Input value={category?.category_name || ""} {...readOnlyFieldProps} />
              </FormControl>

              <FormControl>
                <FormLabel>Loại</FormLabel>
                <Input
                  value={
                    category?.category_type === "supply" ? "Vật tư (supply)" : "Tài sản (asset)"
                  }
                  {...readOnlyFieldProps}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Thời gian tạo</FormLabel>
                <Input value={category?.created_at || ""} {...readOnlyFieldProps} />
              </FormControl>

              <FormControl>
                <FormLabel>Thời gian cập nhật gần nhất</FormLabel>
                <Input value={category?.updated_at || ""} {...readOnlyFieldProps} />
              </FormControl>

              {!canManageCategories ? (
                <Text fontSize="sm" color="gray.500">
                  Tài khoản của bạn chỉ có quyền xem danh mục.
                </Text>
              ) : null}
            </Stack>
          ) : (
            <Stack spacing="16px">
              <FormControl isRequired>
                <FormLabel>Mã danh mục</FormLabel>
                <Input
                  value={formData.category_code}
                  onChange={(e) => handleChange("category_code", e.target.value)}
                  placeholder="VD: CAT001, LAPTOP, PEN"
                  maxLength={50}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Tên danh mục</FormLabel>
                <Input
                  value={formData.category_name}
                  onChange={(e) => handleChange("category_name", e.target.value)}
                  placeholder="VD: Laptop, Bút, Giấy"
                  maxLength={20}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Loại danh mục</FormLabel>
                <Stack direction="row" spacing="12px" pt="4px">
                  {TYPE_OPTIONS.map((opt) => (
                    <Badge
                      key={opt.value}
                      colorScheme={TYPE_BADGE_COLOR[opt.value]}
                      borderRadius="999px"
                      px="16px"
                      py="8px"
                      fontSize="sm"
                      cursor="pointer"
                      opacity={formData.category_type === opt.value ? 1 : 0.5}
                      onClick={() => handleChange("category_type", opt.value)}
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </Stack>
              </FormControl>
            </Stack>
          )}
        </ModalBody>

        <ModalFooter gap="12px" flexWrap="wrap">
          {isCreateMode ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button colorScheme="blue" onClick={handleSubmit} isLoading={isSubmitting}>
                Lưu
              </Button>
            </>
          ) : isReadOnly ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Đóng
              </Button>
              {canManageCategories ? (
                <Button colorScheme="blue" onClick={() => setIsEditing(true)}>
                  Sửa
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Hủy
              </Button>

              {canDeleteCategoryByRole ? (
                <Button
                  colorScheme="red"
                  variant="outline"
                  onClick={handleDelete}
                  isLoading={isDeleting}
                >
                  Xóa danh mục
                </Button>
              ) : null}

              <Button colorScheme="blue" onClick={handleSubmit} isLoading={isSubmitting}>
                Lưu
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
