# Database Schema - Hệ Thống Quản Lý Thư Viện

## Tổng quan

Database được thiết kế cho PostgreSQL trên Supabase, sử dụng Supabase Auth với email/password.

## Entity-Relationship Diagram

```mermaid
erDiagram
    %% ==================== AUTH (Supabase Managed) ====================
    auth_users {
        uuid id PK
        varchar email UK
        timestamptz created_at
        timestamptz updated_at
    }

    %% ==================== PROFILES ====================
    profiles {
        uuid id PK_FK "references auth.users(id)"
        varchar_50 name "NOT NULL"
        varchar_15 phone
        varchar_255 address
        user_role role "NOT NULL DEFAULT reader"
        user_status status "NOT NULL DEFAULT pending"
        text rejection_reason
        integer borrow_count "NOT NULL DEFAULT 0"
        decimal_12_2 total_fine_amount "NOT NULL DEFAULT 0"
        timestamptz created_at "NOT NULL DEFAULT now()"
        timestamptz updated_at "NOT NULL DEFAULT now()"
    }

    %% ==================== CATEGORIES ====================
    categories {
        uuid id PK "DEFAULT gen_random_uuid()"
        varchar_50 name "NOT NULL UNIQUE"
        timestamptz created_at "NOT NULL DEFAULT now()"
        timestamptz updated_at "NOT NULL DEFAULT now()"
    }

    %% ==================== BOOKS ====================
    books {
        uuid id PK "DEFAULT gen_random_uuid()"
        varchar_100 name "NOT NULL"
        varchar_100 author "NOT NULL"
        varchar_17 isbn "UNIQUE"
        integer publish_year "NOT NULL CHECK 1900-current"
        uuid category_id FK "NOT NULL"
        varchar_255 description "NOT NULL"
        integer total_quantity "NOT NULL CHECK > 0"
        integer available_quantity "NOT NULL CHECK >= 0"
        integer borrowed_quantity "NOT NULL DEFAULT 0 CHECK >= 0"
        timestamptz created_at "NOT NULL DEFAULT now()"
        timestamptz updated_at "NOT NULL DEFAULT now()"
    }

    %% ==================== BORROWINGS ====================
    borrowings {
        uuid id PK "DEFAULT gen_random_uuid()"
        uuid user_id FK "NOT NULL references profiles(id)"
        uuid book_id FK "NOT NULL references books(id)"
        date borrow_date "NOT NULL DEFAULT CURRENT_DATE"
        date due_date "NOT NULL"
        date return_date
        borrowing_status status "NOT NULL DEFAULT pending"
        book_condition book_condition
        integer extended_count "NOT NULL DEFAULT 0 CHECK 0-1"
        text rejection_reason
        uuid confirmed_by FK "references profiles(id)"
        timestamptz confirmed_at
        uuid rejected_by FK "references profiles(id)"
        timestamptz rejected_at
        timestamptz created_at "NOT NULL DEFAULT now()"
        timestamptz updated_at "NOT NULL DEFAULT now()"
    }

    %% ==================== RETURN_REQUESTS ====================
    return_requests {
        uuid id PK "DEFAULT gen_random_uuid()"
        uuid borrowing_id FK "NOT NULL references borrowings(id)"
        date request_date "NOT NULL DEFAULT CURRENT_DATE"
        return_request_status status "NOT NULL DEFAULT pending"
        uuid confirmed_by FK "references profiles(id)"
        timestamptz confirmed_at
        timestamptz created_at "NOT NULL DEFAULT now()"
        timestamptz updated_at "NOT NULL DEFAULT now()"
    }

    %% ==================== FINE_LEVELS ====================
    fine_levels {
        uuid id PK "DEFAULT gen_random_uuid()"
        varchar_25 name "NOT NULL UNIQUE"
        decimal_10_2 amount "NOT NULL CHECK > 0"
        text description
        timestamptz created_at "NOT NULL DEFAULT now()"
        timestamptz updated_at "NOT NULL DEFAULT now()"
    }

    %% ==================== FINES ====================
    fines {
        uuid id PK "DEFAULT gen_random_uuid()"
        uuid user_id FK "NOT NULL references profiles(id)"
        uuid borrowing_id FK "NOT NULL references borrowings(id)"
        uuid fine_level_id FK "NOT NULL references fine_levels(id)"
        fine_reason reason "NOT NULL"
        decimal_10_2 amount "NOT NULL CHECK > 0"
        fine_status status "NOT NULL DEFAULT unpaid"
        text payment_proof
        text rejection_reason
        varchar_500 note
        date fine_date "NOT NULL DEFAULT CURRENT_DATE"
        uuid confirmed_by FK "references profiles(id)"
        timestamptz confirmed_at
        uuid rejected_by FK "references profiles(id)"
        timestamptz rejected_at
        timestamptz created_at "NOT NULL DEFAULT now()"
        timestamptz updated_at "NOT NULL DEFAULT now()"
    }

    %% ==================== RELATIONSHIPS ====================
    auth_users ||--|| profiles : "has profile"
    
    categories ||--o{ books : "contains"
    
    profiles ||--o{ borrowings : "user_id - borrows"
    books ||--o{ borrowings : "book_id - is borrowed"
    profiles ||--o{ borrowings : "confirmed_by - confirms"
    profiles ||--o{ borrowings : "rejected_by - rejects"
    
    borrowings ||--o| return_requests : "borrowing_id - has request"
    profiles ||--o{ return_requests : "confirmed_by - confirms"
    
    profiles ||--o{ fines : "user_id - receives"
    borrowings ||--o{ fines : "borrowing_id - generates"
    fine_levels ||--o{ fines : "fine_level_id - applies"
    profiles ||--o{ fines : "confirmed_by - confirms"
    profiles ||--o{ fines : "rejected_by - rejects"
```

## ENUM Types

### user_role
| Value | Mô tả |
|-------|-------|
| reader | Độc giả - có thể mượn sách, xem lịch sử cá nhân |
| librarian | Nhân viên - quản lý sách, xác nhận mượn/trả, theo dõi phạt |
| admin | Quản lý viên - toàn quyền, quản lý tài khoản, báo cáo |

### user_status
| Value | Mô tả |
|-------|-------|
| pending | Chờ xác nhận (sau khi đăng ký) |
| active | Đang hoạt động |
| disabled | Đã vô hiệu hóa |
| rejected | Bị từ chối |

### borrowing_status
| Value | Mô tả |
|-------|-------|
| pending | Chờ xác nhận từ nhân viên |
| borrowed | Đang mượn |
| returned | Đã trả |
| rejected | Bị từ chối (kèm rejection_reason) |
| overdue | Quá hạn (tự động cập nhật) |

### book_condition
| Value | Mô tả |
|-------|-------|
| normal | Bình thường |
| damaged | Hư hỏng |
| lost | Mất |

### return_request_status
| Value | Mô tả |
|-------|-------|
| pending | Chờ xác nhận |
| confirmed | Đã xác nhận |
| cancelled | Đã hủy |

### fine_reason
| Value | Mô tả |
|-------|-------|
| late_return | Trả muộn |
| damaged | Sách hư hỏng |
| lost | Mất sách |

### fine_status
| Value | Mô tả |
|-------|-------|
| unpaid | Chưa thanh toán |
| pending | Chờ xác nhận thanh toán |
| rejected | Bị từ chối (kèm rejection_reason) |
| paid | Đã thanh toán |

## Mô tả các bảng

### 1. `profiles`
Mở rộng thông tin từ `auth.users` của Supabase.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid (PK, FK) | Tham chiếu đến auth.users.id |
| name | varchar(50) | Tên người dùng (bắt buộc) |
| phone | varchar(15) | Số điện thoại (định dạng quốc tế) |
| address | varchar(255) | Địa chỉ |
| role | user_role | Vai trò: reader, librarian, admin |
| status | user_status | Trạng thái: pending, active, disabled, rejected |
| rejection_reason | text | Lý do từ chối (nếu status = rejected) |
| borrow_count | integer | Tổng số lần mượn sách |
| total_fine_amount | decimal(12,2) | Tổng số tiền phạt đã trả |

### 2. `categories`
Thể loại sách.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid (PK) | ID thể loại |
| name | varchar(50) | Tên thể loại (unique, bắt buộc) |

### 3. `books`
Thông tin sách.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid (PK) | ID sách |
| name | varchar(100) | Tên sách (bắt buộc) |
| author | varchar(100) | Tác giả (bắt buộc) |
| isbn | varchar(17) | Mã ISBN-10 hoặc ISBN-13 (unique, tùy chọn) |
| publish_year | integer | Năm xuất bản (1900-current) |
| category_id | uuid (FK) | ID thể loại (bắt buộc) |
| description | varchar(255) | Mô tả sách (bắt buộc) |
| total_quantity | integer | Tổng số lượng bản sách (> 0) |
| available_quantity | integer | Số lượng có sẵn để mượn (>= 0) |
| borrowed_quantity | integer | Số lượng đang được mượn (>= 0) |

### 4. `borrowings`
Đơn mượn sách.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid (PK) | ID đơn mượn |
| user_id | uuid (FK) | ID độc giả |
| book_id | uuid (FK) | ID sách |
| borrow_date | date | Ngày mượn |
| due_date | date | Ngày hết hạn (tối đa 30 ngày từ borrow_date) |
| return_date | date | Ngày trả thực tế |
| status | borrowing_status | Trạng thái đơn |
| book_condition | book_condition | Tình trạng sách khi trả |
| extended_count | integer | Số lần gia hạn (tối đa 1 lần) |
| rejection_reason | text | Lý do từ chối (bắt buộc khi status = rejected) |
| confirmed_by | uuid (FK) | Nhân viên xác nhận |
| confirmed_at | timestamptz | Thời điểm xác nhận |
| rejected_by | uuid (FK) | Nhân viên từ chối |
| rejected_at | timestamptz | Thời điểm từ chối |

### 5. `return_requests`
Yêu cầu trả sách.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid (PK) | ID yêu cầu |
| borrowing_id | uuid (FK) | ID đơn mượn |
| request_date | date | Ngày yêu cầu |
| status | return_request_status | Trạng thái: pending, confirmed, cancelled |
| confirmed_by | uuid (FK) | Nhân viên xác nhận |
| confirmed_at | timestamptz | Thời điểm xác nhận |

**Lưu ý:** Mỗi đơn mượn chỉ có thể có 1 yêu cầu trả ở trạng thái "pending" tại một thời điểm.

### 6. `fine_levels`
Mức phạt được cấu hình bởi Admin.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid (PK) | ID mức phạt |
| name | varchar(25) | Tên mức phạt (unique, bắt buộc) |
| amount | decimal(10,2) | Số tiền (VNĐ, > 0) |
| description | text | Mô tả chi tiết |

### 7. `fines`
Phiếu phạt.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid (PK) | ID phiếu phạt |
| user_id | uuid (FK) | ID độc giả bị phạt |
| borrowing_id | uuid (FK) | ID đơn mượn liên quan |
| fine_level_id | uuid (FK) | ID mức phạt áp dụng |
| reason | fine_reason | Lý do: late_return, damaged, lost |
| amount | decimal(10,2) | Số tiền thực tế |
| status | fine_status | Trạng thái: unpaid, pending, rejected, paid |
| payment_proof | text | Bằng chứng thanh toán (ảnh/mã giao dịch) |
| rejection_reason | text | Lý do từ chối thanh toán |
| note | varchar(500) | Ghi chú từ nhân viên |
| fine_date | date | Ngày lập phiếu phạt |
| confirmed_by | uuid (FK) | Nhân viên xác nhận thanh toán |
| confirmed_at | timestamptz | Thời điểm xác nhận |
| rejected_by | uuid (FK) | Nhân viên từ chối |
| rejected_at | timestamptz | Thời điểm từ chối |

## Indexes

| Bảng | Index | Loại | Mục đích |
|------|-------|------|----------|
| profiles | idx_profiles_role | B-tree | Lọc theo vai trò |
| profiles | idx_profiles_status | B-tree | Lọc theo trạng thái |
| profiles | idx_profiles_created_at | B-tree DESC | Sắp xếp theo ngày tạo |
| categories | idx_categories_name | B-tree | Tìm kiếm theo tên |
| books | idx_books_category_id | B-tree | JOIN với categories |
| books | idx_books_name | B-tree | Tìm kiếm theo tên sách |
| books | idx_books_author | B-tree | Tìm kiếm theo tác giả |
| books | idx_books_name_author | Composite | Tìm kiếm kết hợp |
| books | idx_books_publish_year | B-tree DESC | Sắp xếp theo năm |
| books | idx_books_available | Partial | Sách có sẵn (available_quantity > 0) |
| borrowings | idx_borrowings_user_id | B-tree | Lịch sử mượn của user |
| borrowings | idx_borrowings_book_id | B-tree | Lịch sử mượn của sách |
| borrowings | idx_borrowings_status | B-tree | Lọc theo trạng thái |
| borrowings | idx_borrowings_due_date | B-tree | Tìm sách quá hạn |
| borrowings | idx_borrowings_user_status | Composite | Lọc theo user và status |
| borrowings | idx_borrowings_overdue | Partial | Sách quá hạn (borrowed + chưa trả) |
| return_requests | idx_return_requests_borrowing_id | B-tree | JOIN với borrowings |
| return_requests | idx_return_requests_status | B-tree | Lọc theo trạng thái |
| return_requests | idx_return_requests_pending_unique | Partial Unique | Đảm bảo 1 pending/borrowing |
| fine_levels | idx_fine_levels_name | B-tree | Tìm kiếm theo tên |
| fines | idx_fines_user_id | B-tree | Phạt của user |
| fines | idx_fines_borrowing_id | B-tree | JOIN với borrowings |
| fines | idx_fines_fine_level_id | B-tree | JOIN với fine_levels |
| fines | idx_fines_status | B-tree | Lọc theo trạng thái |
| fines | idx_fines_user_status | Composite | Lọc theo user và status |
| fines | idx_fines_unpaid | Partial | Phạt chưa thanh toán |

## Row Level Security (RLS)

Tất cả các bảng đều bật RLS với các policy phù hợp:

### profiles
- **SELECT**: Mọi người có thể xem profile cơ bản (cho hiển thị tên)
- **UPDATE (own)**: User chỉ có thể sửa profile của mình (không thể tự đổi role/status)
- **UPDATE (admin)**: Admin có thể sửa tất cả profiles (bao gồm role/status)

### categories
- **SELECT**: Mọi người có thể xem
- **INSERT/UPDATE/DELETE**: Chỉ Librarian/Admin

### books
- **SELECT**: Mọi người có thể xem
- **INSERT/UPDATE/DELETE**: Chỉ Librarian/Admin

### borrowings
- **SELECT**: User xem của mình, Librarian/Admin xem tất cả
- **INSERT**: Reader active có thể tạo đơn mượn
- **UPDATE (staff)**: Librarian/Admin có thể xác nhận/từ chối
- **UPDATE (reader)**: Reader có thể gia hạn đơn mượn của mình

### return_requests
- **SELECT**: User xem của mình, Librarian/Admin xem tất cả
- **INSERT**: Reader có thể tạo yêu cầu trả cho đơn mượn của mình
- **UPDATE**: Chỉ Librarian/Admin

### fine_levels
- **SELECT**: Mọi người có thể xem
- **INSERT/UPDATE/DELETE**: Chỉ Admin

### fines
- **SELECT**: User xem của mình, Librarian/Admin xem tất cả
- **INSERT**: Chỉ Librarian/Admin
- **UPDATE (reader)**: Reader có thể gửi bằng chứng thanh toán
- **UPDATE (staff)**: Librarian/Admin có thể xác nhận/từ chối

## Business Rules (được thực thi bởi constraints và triggers)

1. **Mượn sách tối đa**: Mỗi độc giả có thể mượn tối đa 5 cuốn sách cùng lúc
2. **Thời hạn mượn**: Tối đa 30 ngày từ ngày mượn
3. **Gia hạn**: Tối đa 1 lần, mỗi lần +7 ngày
4. **Điều kiện mượn**: Không có khoản phạt chưa thanh toán
5. **Yêu cầu trả**: Mỗi đơn mượn chỉ có 1 yêu cầu trả pending tại một thời điểm
6. **Số lượng sách**: total_quantity >= available_quantity + borrowed_quantity
