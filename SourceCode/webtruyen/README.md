# MeTruyen - Nền tảng đọc truyện tranh online

## Giới thiệu

MeTruyen là một nền tảng web đọc truyện tranh online được xây dựng trên MERN Stack (MongoDB, Express.js, React, Node.js). Hệ thống cung cấp trải nghiệm đọc truyện mượt mà với giao diện dark theme, hỗ trợ đầy đủ các tính năng tương tác: bình luận ở cấp truyện và chapter, bookmark, lịch sử đọc, quản lý thư viện cá nhân. Phía admin có thể quản lý truyện, chapter (upload drag-drop folder), user, thể loại và thanh toán.

**Mục tiêu:** Xây dựng một hệ thống web hoàn chỉnh, áp dụng kiến trúc RESTful API, thực hành các công nghệ web hiện đại và quy trình phát triển phần mềm.

## Công nghệ sử dụng

### Backend
| Công nghệ | Mục đích |
|---|---|
| Node.js + Express.js | Server & RESTful API |
| MongoDB + Mongoose | Cơ sở dữ liệu NoSQL |
| JWT (jsonwebtoken) | Xác thực người dùng |
| Cloudinary | Lưu trữ ảnh (cover, avatar, chapter pages) |
| Multer | Upload file (memory storage → Cloudinary) |

### Frontend
| Công nghệ | Mục đích |
|---|---|
| React 18 | UI Library |
| Vite 5 | Build tool & dev server |
| Tailwind CSS 3 | Utility-first styling |
| Zustand | State management (auth store) |
| React Router 6 | Điều hướng SPA |
| Axios | HTTP client (interceptor, Bearer token) |
| react-dropzone | Kéo thả ảnh / thư mục upload |

## Tính năng chính

- **Xem truyện:** danh sách truyện mới, đề xuất, yêu thích; lọc theo thể loại, trạng thái, sắp xếp
- **Đọc chapter:** yêu cầu đăng nhập; kiểm tra VIP; hiển thị ảnh dạng vertical scroll; điều hướng chapter trước/sau
- **Bình luận:** bình luận ở cấp truyện và cấp chapter; phân trang; xóa bình luận (user sở hữu hoặc admin)
- **Bookmark:** lưu truyện vào tủ cá nhân; toggle một click
- **Lịch sử đọc:** tự động ghi chapter đã đọc; đồng bộ server
- **Profile:** đổi tên hiển thị, bio, avatar (upload Cloudinary); đổi mật khẩu
- **M-Point & VIP:** nạp điểm; nâng cấp VIP để đọc chapter độc quyền
- **Admin Dashboard:** thống kê (user, truyện, lượt xem); quản lý user, truyện, chapter, thể loại, thanh toán
- **Upload chapter drag-drop:** kéo thả cả thư mục ảnh, sắp xếp tự động theo thứ tự file

## Yêu cầu hệ thống

- Node.js >= 18
- MongoDB >= 6.0 (local hoặc MongoDB Atlas)
- npm >= 9
- Tài khoản Cloudinary (miễn phí tại https://cloudinary.com)

## Hướng dẫn cài đặt

### 1. Clone project

```bash
git clone <repo-url>
cd webtruyen
```

### 2. Cấu hình Backend

```bash
cd backend
npm install
```

Tạo file `.env` trong `backend/`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/webtruyen
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRE=7d

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 3. Seed dữ liệu mẫu

```bash
cd backend
npm run seed
hoặc node seed.js cũng được
```

### 4. Chạy Backend

```bash
npm run dev  
```
Backend chạy tại `http://localhost:5000`.

### 5. Cấu hình và chạy Frontend

Mở terminal mới:

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy tại `http://localhost:3000`. API được proxy qua Vite (xem `vite.config.js`).