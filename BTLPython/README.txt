# BTL Python - Quản lý tài sản vật tư PTIT

## Giới thiệu
Dự án xây dựng hệ thống quản lý tài sản và vật tư cho Học viện Công nghệ Bưu chính Viễn thông.

## Chức năng chính
- Đăng nhập, xác thực JWT
- Quản lý phòng ban
- Quản lý người dùng
- Quản lý tài sản
- Quản lý vật tư
- Quản lý cấp phát
- Quản lý bảo trì
- Báo cáo thống kê

## Công nghệ sử dụng
- FastAPI
- SQLAlchemy
- SQLite
- Pytest

## Cách chạy backend
```bash
cd backend
uvicorn app.main:app --reload