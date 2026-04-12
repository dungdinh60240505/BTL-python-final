PRAGMA foreign_keys = ON;

INSERT INTO departments (code, name, description, is_active)
VALUES
    ('HCQT', 'Phong Hanh chinh Quan tri', 'Quan ly tai san va vat tu toan hoc vien', 1),
    ('CNTT', 'Trung tam Cong nghe thong tin', 'Quan tri ha tang va thiet bi cong nghe', 1),
    ('LAB', 'Phong Thi nghiem', 'Quan ly vat tu va thiet bi phong lab', 1),
    ('DT', 'Phong Dao tao', 'Quan ly giang duong va lich hoc', 1),
    ('KT', 'Phong Ke toan', 'Theo doi tai chinh va mua sam', 1);

INSERT INTO users (username, email, full_name, hashed_password, phone_number, role, is_active, department_id)
VALUES
    ('admin', 'admin@ptit.edu.vn', 'System Administrator', '$argon2id$v=19$m=65536,t=3,p=4$7yoyWi3UxMnwCf5SkoyevQ$UZcoFT0rMMP/IVQPYAZ+LHZa6f3+FKhCyxu3mamydKM', '0901000001', 'admin', 1, 1),
    ('manager', 'manager@ptit.edu.vn', 'Asset Manager', '$argon2id$v=19$m=65536,t=3,p=4$EdabqWNfg0rbakPxLXNDKQ$oG9Wn0lu46Vb5M/STuqlZz4FGWo30xErY/pPYfzfOPg', '0901000002', 'manager', 1, 2),
    ('staff01', 'staff01@ptit.edu.vn', 'Nguyen Van A', '$argon2id$v=19$m=65536,t=3,p=4$EdabqWNfg0rbakPxLXNDKQ$oG9Wn0lu46Vb5M/STuqlZz4FGWo30xErY/pPYfzfOPg', '0901000003', 'staff', 1, 4);

INSERT INTO assets (
    asset_code, name, category, serial_number, specification, purchase_date, purchase_cost,
    status, condition, location, note, is_active, assigned_department_id, assigned_user_id
)
VALUES
    ('TS001', 'Dell Latitude 5440', 'Laptop', 'DL5440PTIT001', 'Core i7, 16GB RAM, 512GB SSD', '2025-01-15', 23500000, 'available', 'new', 'Kho CNTT', 'San sang cap phat', 1, 2, 2),
    ('TS002', 'May chieu Epson EB-X06', 'Projector', 'EPSONX06002', 'XGA, 3600 lumens', '2024-09-01', 12500000, 'available', 'good', 'Giang duong A2', 'Se duoc cap phat cho phong dao tao', 1, 4, 3),
    ('TS003', 'May in HP LaserJet Pro', 'Printer', 'HPLJPRO003', 'In den trang, ket noi LAN', '2024-06-20', 6800000, 'available', 'fair', 'Phong Hanh chinh Quan tri', 'Cho lap lich bao tri', 1, 1, 1);

INSERT INTO supplies (
    supply_code, name, category, unit, quantity_in_stock, minimum_stock_level, unit_price, location, description, note, managed_department_id, is_active
)
VALUES
    ('VT001', 'Giay A4 Double A', 'Van phong pham', 'ream', 25, 10, 78000, 'Kho van phong', 'Giay in A4 80gsm', NULL, 1, 1),
    ('VT002', 'Muc in HP 05A', 'Muc in', 'cartridge', 2, 5, 1850000, 'Kho vat tu CNTT', 'Muc in dung cho HP LaserJet P2035', 'Can theo doi muc ton', 2, 1),
    ('VT003', 'Day mang Cat6', 'Vat tu mang', 'box', 12, 4, 950000, 'Kho CNTT', 'Day mang Cat6 hop 305m', NULL, 2, 1);

INSERT INTO allocations (
    allocation_code, allocation_type, status, asset_id, supply_id, quantity,
    allocated_department_id, allocated_user_id, allocated_by_user_id,
    allocated_at, expected_return_date, returned_at, purpose, note, is_active
)
VALUES
    ('CP001', 'asset', 'active', 2, NULL, 1, 4, 3, 1, '2026-03-20 08:00:00', '2026-09-20', NULL, 'Phuc vu giang day tai giang duong A2', 'Ban giao kem remote', 1),
    ('CP002', 'supply', 'completed', NULL, 1, 10, 5, NULL, 1, '2026-03-15 09:30:00', NULL, NULL, 'Cap giay in cho phong ke toan', NULL, 1);

INSERT INTO maintenances (
    maintenance_code, asset_id, maintenance_type, status, priority, title,
    description, scheduled_date, started_at, completed_at, next_maintenance_date,
    cost, vendor_name, resolution_note, reported_by_user_id, assigned_to_user_id, is_active
)
VALUES
    ('BT001', 3, 'corrective', 'in_progress', 'high', 'Sua loi ket giay may in HP', 'May in bi ket giay lien tuc khi in so luong lon', '2026-03-25', '2026-03-26 08:30:00', NULL, '2026-06-25', 350000, 'Cong ty Dich vu Van phong ABC', NULL, 1, 2, 1),
    ('BT002', 2, 'preventive', 'completed', 'medium', 'Bao tri dinh ky may chieu', 'Ve sinh bo loc va kiem tra bong den', '2026-02-20', '2026-02-20 09:00:00', '2026-02-20 11:00:00', '2026-08-20', 200000, 'Trung tam Bao hanh Epson', 'Hoan tat bao tri dinh ky', 2, 2, 1);

-- Keep current business state consistent after inserting history records.
UPDATE assets SET status = 'in_use' WHERE id = 2;
UPDATE assets SET status = 'under_maintenance' WHERE id = 3;
