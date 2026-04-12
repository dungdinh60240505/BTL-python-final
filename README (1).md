# 🏛️ PTIT Asset Management

Hệ thống quản lý tài sản được xây dựng bằng Python và React, phục vụ cho việc quản lý, theo dõi và thống kê tài sản trong tổ chức.

---

## 🚀 Giới thiệu

Dự án giúp:
- Quản lý tài sản (thêm, sửa, xóa)
- Quản lý danh mục tài sản
- Theo dõi tình trạng sử dụng
- Thống kê & báo cáo

---

## 🛠️ Công nghệ sử dụng

### Backend
- Python
- SQLite / MySQL

### Frontend
- ReactJS
- Chakra UI

---

## 📂 Cấu trúc project

BTLPython/
├── backend/
│   ├── app/
│   │   ├── services/
│   │   ├── models/
│   │   ├── routes/
│   │   └── main.py
│   └── requirements.txt
│
├── horizon-ui-chakra/
│   ├── src/
│   └── package.json
│
└── README.md

---

## ⚙️ Cài đặt

### 1. Clone project

git clone https://github.com/dungdinh60240505/BTL-python-final.git
cd BTL-python-final

---

### 2. Backend

cd BTLPython/backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt

Chạy server:

python app/main.py

---

### 3. Frontend

cd horizon-ui-chakra
npm install
npm start

---

## 📌 Chức năng chính

- ✅ Đăng nhập / xác thực
- ✅ Quản lý tài sản
- ✅ Quản lý danh mục
- ✅ Tìm kiếm
- ✅ Thống kê

---

## 🧑‍💻 Tác giả

- Dung Dinh
- PTIT - Học viện Công nghệ Bưu chính Viễn thông

---

## 📄 License

MIT License
