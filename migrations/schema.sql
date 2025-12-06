-- ============================================================================
-- HỆ THỐNG QUẢN LÝ THƯ VIỆN - DATABASE SCHEMA
-- PostgreSQL / Supabase
-- Version: 1.0.0
-- ============================================================================

-- ============================================================================
-- SECTION 1: ENUM TYPES
-- ============================================================================

-- Vai trò người dùng
CREATE TYPE user_role AS ENUM ('reader', 'librarian', 'admin');

-- Trạng thái tài khoản
CREATE TYPE user_status AS ENUM ('pending', 'active', 'disabled', 'rejected');

-- Trạng thái đơn mượn
CREATE TYPE borrowing_status AS ENUM ('pending', 'borrowed', 'returned', 'rejected', 'overdue');

-- Tình trạng sách khi trả
CREATE TYPE book_condition AS ENUM ('normal', 'damaged', 'lost');

-- Trạng thái yêu cầu trả sách
CREATE TYPE return_request_status AS ENUM ('pending', 'confirmed', 'cancelled');

-- Lý do phạt
CREATE TYPE fine_reason AS ENUM ('late_return', 'damaged', 'lost');

-- Trạng thái phiếu phạt
CREATE TYPE fine_status AS ENUM ('unpaid', 'pending', 'rejected', 'paid');


-- ============================================================================
-- SECTION 2: TABLES (in dependency order)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 PROFILES - Mở rộng thông tin từ auth.users
-- ----------------------------------------------------------------------------
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(15),
    address VARCHAR(255),
    role user_role NOT NULL DEFAULT 'reader',
    status user_status NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    borrow_count INTEGER NOT NULL DEFAULT 0,
    total_fine_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_profiles_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT chk_profiles_phone_format CHECK (
        phone IS NULL OR phone ~ '^\+?[0-9]{9,15}$'
    ),
    CONSTRAINT chk_profiles_borrow_count_non_negative CHECK (borrow_count >= 0),
    CONSTRAINT chk_profiles_total_fine_non_negative CHECK (total_fine_amount >= 0)
);

COMMENT ON TABLE profiles IS 'Thông tin mở rộng của người dùng, liên kết với auth.users';
COMMENT ON COLUMN profiles.id IS 'UUID tham chiếu đến auth.users.id';
COMMENT ON COLUMN profiles.role IS 'Vai trò: reader (độc giả), librarian (nhân viên), admin (quản lý)';
COMMENT ON COLUMN profiles.status IS 'Trạng thái: pending (chờ duyệt), active (hoạt động), disabled (vô hiệu hóa), rejected (bị từ chối)';
COMMENT ON COLUMN profiles.borrow_count IS 'Tổng số lần mượn sách';
COMMENT ON COLUMN profiles.total_fine_amount IS 'Tổng số tiền phạt đã trả (VNĐ)';


-- ----------------------------------------------------------------------------
-- 2.2 CATEGORIES - Thể loại sách
-- ----------------------------------------------------------------------------
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT uq_categories_name UNIQUE (name),
    CONSTRAINT chk_categories_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

COMMENT ON TABLE categories IS 'Danh mục thể loại sách';


-- ----------------------------------------------------------------------------
-- 2.3 BOOKS - Sách
-- ----------------------------------------------------------------------------
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    author VARCHAR(100) NOT NULL,
    isbn VARCHAR(17),
    publish_year INTEGER NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    description VARCHAR(255) NOT NULL,
    total_quantity INTEGER NOT NULL,
    available_quantity INTEGER NOT NULL,
    borrowed_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT uq_books_isbn UNIQUE (isbn),
    CONSTRAINT chk_books_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT chk_books_author_not_empty CHECK (LENGTH(TRIM(author)) > 0),
    CONSTRAINT chk_books_description_not_empty CHECK (LENGTH(TRIM(description)) > 0),
    CONSTRAINT chk_books_publish_year CHECK (
        publish_year >= 1900 AND publish_year <= EXTRACT(YEAR FROM CURRENT_DATE)
    ),
    CONSTRAINT chk_books_isbn_format CHECK (
        isbn IS NULL OR 
        isbn ~ '^[0-9]{10}$' OR 
        isbn ~ '^[0-9]{13}$' OR 
        isbn ~ '^[0-9]{1,5}-[0-9]{1,7}-[0-9]{1,7}-[0-9X]$' OR
        isbn ~ '^[0-9]{3}-[0-9]{1,5}-[0-9]{1,7}-[0-9]{1,7}-[0-9]$'
    ),
    CONSTRAINT chk_books_total_quantity_positive CHECK (total_quantity > 0),
    CONSTRAINT chk_books_available_quantity_non_negative CHECK (available_quantity >= 0),
    CONSTRAINT chk_books_borrowed_quantity_non_negative CHECK (borrowed_quantity >= 0),
    CONSTRAINT chk_books_quantity_balance CHECK (
        total_quantity >= available_quantity + borrowed_quantity
    )
);

COMMENT ON TABLE books IS 'Danh sách sách trong thư viện';
COMMENT ON COLUMN books.isbn IS 'Mã ISBN-10 hoặc ISBN-13 (tùy chọn)';
COMMENT ON COLUMN books.total_quantity IS 'Tổng số bản sách ban đầu';
COMMENT ON COLUMN books.available_quantity IS 'Số sách có sẵn để mượn';
COMMENT ON COLUMN books.borrowed_quantity IS 'Số sách đang được mượn';


-- ----------------------------------------------------------------------------
-- 2.4 BORROWINGS - Đơn mượn sách
-- ----------------------------------------------------------------------------
CREATE TABLE borrowings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
    borrow_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE,
    status borrowing_status NOT NULL DEFAULT 'pending',
    book_condition book_condition,
    extended_count INTEGER NOT NULL DEFAULT 0,
    rejection_reason TEXT,
    confirmed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    rejected_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    rejected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_borrowings_due_date CHECK (due_date >= borrow_date),
    CONSTRAINT chk_borrowings_due_date_max CHECK (due_date <= borrow_date + INTERVAL '30 days'),
    CONSTRAINT chk_borrowings_return_date CHECK (
        return_date IS NULL OR return_date >= borrow_date
    ),
    CONSTRAINT chk_borrowings_extended_count CHECK (extended_count >= 0 AND extended_count <= 1),
    CONSTRAINT chk_borrowings_rejection_reason CHECK (
        (status = 'rejected' AND rejection_reason IS NOT NULL) OR
        (status != 'rejected')
    ),
    CONSTRAINT chk_borrowings_book_condition CHECK (
        (status = 'returned' AND book_condition IS NOT NULL) OR
        (status != 'returned')
    )
);

COMMENT ON TABLE borrowings IS 'Lịch sử và trạng thái mượn sách';
COMMENT ON COLUMN borrowings.extended_count IS 'Số lần gia hạn (tối đa 1 lần, mỗi lần +7 ngày)';
COMMENT ON COLUMN borrowings.book_condition IS 'Tình trạng sách khi trả: normal, damaged, lost';
COMMENT ON COLUMN borrowings.status IS 'Trạng thái: pending (chờ xác nhận), borrowed (đang mượn), returned (đã trả), rejected (từ chối), overdue (quá hạn)';


-- ----------------------------------------------------------------------------
-- 2.5 RETURN_REQUESTS - Yêu cầu trả sách
-- ----------------------------------------------------------------------------
CREATE TABLE return_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    borrowing_id UUID NOT NULL REFERENCES borrowings(id) ON DELETE CASCADE,
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status return_request_status NOT NULL DEFAULT 'pending',
    confirmed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE return_requests IS 'Yêu cầu trả sách từ độc giả';
COMMENT ON COLUMN return_requests.status IS 'Trạng thái: pending (chờ xác nhận), confirmed (đã xác nhận), cancelled (đã hủy)';


-- ----------------------------------------------------------------------------
-- 2.6 FINE_LEVELS - Mức phạt
-- ----------------------------------------------------------------------------
CREATE TABLE fine_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(25) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT uq_fine_levels_name UNIQUE (name),
    CONSTRAINT chk_fine_levels_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT chk_fine_levels_amount_positive CHECK (amount > 0)
);

COMMENT ON TABLE fine_levels IS 'Danh sách các mức phạt được cấu hình bởi Admin';
COMMENT ON COLUMN fine_levels.amount IS 'Số tiền phạt (VNĐ)';


-- ----------------------------------------------------------------------------
-- 2.7 FINES - Phiếu phạt
-- ----------------------------------------------------------------------------
CREATE TABLE fines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    borrowing_id UUID NOT NULL REFERENCES borrowings(id) ON DELETE RESTRICT,
    fine_level_id UUID NOT NULL REFERENCES fine_levels(id) ON DELETE RESTRICT,
    reason fine_reason NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status fine_status NOT NULL DEFAULT 'unpaid',
    payment_proof TEXT,
    rejection_reason TEXT,
    note VARCHAR(500),
    fine_date DATE NOT NULL DEFAULT CURRENT_DATE,
    confirmed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    rejected_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    rejected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_fines_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_fines_rejection_reason CHECK (
        (status = 'rejected' AND rejection_reason IS NOT NULL) OR
        (status != 'rejected')
    ),
    CONSTRAINT chk_fines_note_length CHECK (
        note IS NULL OR LENGTH(note) <= 500
    )
);

COMMENT ON TABLE fines IS 'Phiếu phạt khi trả sách muộn/hư hỏng/mất';
COMMENT ON COLUMN fines.reason IS 'Lý do phạt: late_return (trả muộn), damaged (hư hỏng), lost (mất)';
COMMENT ON COLUMN fines.payment_proof IS 'Bằng chứng thanh toán (ảnh chuyển khoản/mã giao dịch)';
COMMENT ON COLUMN fines.status IS 'Trạng thái: unpaid (chưa TT), pending (chờ xác nhận), rejected (từ chối), paid (đã TT)';


-- ============================================================================
-- SECTION 3: INDEXES
-- ============================================================================

-- Profiles indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);

-- Categories indexes
CREATE INDEX idx_categories_name ON categories(name);

-- Books indexes
CREATE INDEX idx_books_category_id ON books(category_id);
CREATE INDEX idx_books_name ON books(name);
CREATE INDEX idx_books_author ON books(author);
CREATE INDEX idx_books_name_author ON books(name, author);
CREATE INDEX idx_books_publish_year ON books(publish_year DESC);
CREATE INDEX idx_books_available_quantity ON books(available_quantity) WHERE available_quantity > 0;

-- Borrowings indexes
CREATE INDEX idx_borrowings_user_id ON borrowings(user_id);
CREATE INDEX idx_borrowings_book_id ON borrowings(book_id);
CREATE INDEX idx_borrowings_status ON borrowings(status);
CREATE INDEX idx_borrowings_due_date ON borrowings(due_date);
CREATE INDEX idx_borrowings_user_status ON borrowings(user_id, status);
CREATE INDEX idx_borrowings_overdue ON borrowings(due_date) 
    WHERE status IN ('borrowed', 'overdue') AND return_date IS NULL;

-- Return requests indexes
CREATE INDEX idx_return_requests_borrowing_id ON return_requests(borrowing_id);
CREATE INDEX idx_return_requests_status ON return_requests(status);
-- Partial unique index: chỉ 1 pending request cho mỗi borrowing
CREATE UNIQUE INDEX idx_return_requests_pending_unique 
    ON return_requests (borrowing_id) 
    WHERE status = 'pending';

-- Fine levels indexes
CREATE INDEX idx_fine_levels_name ON fine_levels(name);

-- Fines indexes
CREATE INDEX idx_fines_user_id ON fines(user_id);
CREATE INDEX idx_fines_borrowing_id ON fines(borrowing_id);
CREATE INDEX idx_fines_fine_level_id ON fines(fine_level_id);
CREATE INDEX idx_fines_status ON fines(status);
CREATE INDEX idx_fines_user_status ON fines(user_id, status);
CREATE INDEX idx_fines_unpaid ON fines(user_id) WHERE status IN ('unpaid', 'pending', 'rejected');


-- ============================================================================
-- SECTION 4: FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 4.1 Trigger function để tự động cập nhật updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Tự động cập nhật cột updated_at khi có UPDATE';


-- ----------------------------------------------------------------------------
-- 4.2 Function kiểm tra user có phải librarian/admin không
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_librarian_or_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = check_user_id 
        AND role IN ('librarian', 'admin')
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_librarian_or_admin(UUID) IS 'Kiểm tra user có phải Librarian hoặc Admin active không';


-- ----------------------------------------------------------------------------
-- 4.3 Function kiểm tra user có phải admin không
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = check_user_id 
        AND role = 'admin'
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_admin(UUID) IS 'Kiểm tra user có phải Admin active không';


-- ----------------------------------------------------------------------------
-- 4.4 Function lấy role của current user
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
DECLARE
    current_role user_role;
BEGIN
    SELECT role INTO current_role 
    FROM profiles 
    WHERE id = auth.uid();
    
    RETURN current_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_current_user_role() IS 'Lấy role của user đang đăng nhập';


-- ----------------------------------------------------------------------------
-- 4.5 Function kiểm tra user có unpaid fines không
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION has_unpaid_fines(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM fines 
        WHERE fines.user_id = check_user_id 
        AND status IN ('unpaid', 'rejected')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION has_unpaid_fines(UUID) IS 'Kiểm tra user có khoản phạt chưa thanh toán không';


-- ----------------------------------------------------------------------------
-- 4.6 Function đếm số sách đang mượn của user
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION count_active_borrowings(check_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    active_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO active_count 
    FROM borrowings 
    WHERE borrowings.user_id = check_user_id 
    AND status IN ('pending', 'borrowed', 'overdue');
    
    RETURN active_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION count_active_borrowings(UUID) IS 'Đếm số sách user đang mượn (pending + borrowed + overdue)';


-- ----------------------------------------------------------------------------
-- 4.7 Trigger function để tạo profile khi user đăng ký
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, name, role, status)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
        'reader',
        'pending'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_new_user() IS 'Tự động tạo profile khi user mới đăng ký qua Supabase Auth';


-- ----------------------------------------------------------------------------
-- 4.8 Function cập nhật trạng thái quá hạn cho borrowings
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_overdue_borrowings()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE borrowings
    SET status = 'overdue',
        updated_at = NOW()
    WHERE status = 'borrowed'
    AND due_date < CURRENT_DATE
    AND return_date IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_overdue_borrowings() IS 'Cập nhật trạng thái quá hạn cho các đơn mượn (nên chạy daily bằng pg_cron)';


-- ============================================================================
-- SECTION 5: TRIGGERS
-- ============================================================================

-- Updated_at triggers cho tất cả các bảng
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_borrowings_updated_at
    BEFORE UPDATE ON borrowings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_return_requests_updated_at
    BEFORE UPDATE ON return_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fine_levels_updated_at
    BEFORE UPDATE ON fine_levels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fines_updated_at
    BEFORE UPDATE ON fines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger tạo profile khi user mới đăng ký
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();


-- ============================================================================
-- SECTION 6: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowings ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE fine_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 6.1 PROFILES Policies
-- ----------------------------------------------------------------------------

-- Mọi người có thể xem profile cơ bản (cho hiển thị tên, kiểm tra role)
CREATE POLICY "profiles_select_all" ON profiles
    FOR SELECT
    USING (true);

-- User có thể update profile của mình (trừ role và status)
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        -- Không cho phép tự đổi role và status
        role = (SELECT role FROM profiles WHERE id = auth.uid()) AND
        status = (SELECT status FROM profiles WHERE id = auth.uid())
    );

-- Admin có thể update tất cả profiles (bao gồm role và status)
CREATE POLICY "profiles_update_admin" ON profiles
    FOR UPDATE
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- 6.2 CATEGORIES Policies
-- ----------------------------------------------------------------------------

-- Mọi người có thể xem categories (kể cả không đăng nhập)
CREATE POLICY "categories_select_all" ON categories
    FOR SELECT
    USING (true);

-- Librarian/Admin có thể thêm categories
CREATE POLICY "categories_insert_staff" ON categories
    FOR INSERT
    WITH CHECK (is_librarian_or_admin(auth.uid()));

-- Librarian/Admin có thể sửa categories
CREATE POLICY "categories_update_staff" ON categories
    FOR UPDATE
    USING (is_librarian_or_admin(auth.uid()))
    WITH CHECK (is_librarian_or_admin(auth.uid()));

-- Librarian/Admin có thể xóa categories
CREATE POLICY "categories_delete_staff" ON categories
    FOR DELETE
    USING (is_librarian_or_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- 6.3 BOOKS Policies
-- ----------------------------------------------------------------------------

-- Mọi người có thể xem books (kể cả không đăng nhập)
CREATE POLICY "books_select_all" ON books
    FOR SELECT
    USING (true);

-- Librarian/Admin có thể thêm books
CREATE POLICY "books_insert_staff" ON books
    FOR INSERT
    WITH CHECK (is_librarian_or_admin(auth.uid()));

-- Librarian/Admin có thể sửa books
CREATE POLICY "books_update_staff" ON books
    FOR UPDATE
    USING (is_librarian_or_admin(auth.uid()))
    WITH CHECK (is_librarian_or_admin(auth.uid()));

-- Librarian/Admin có thể xóa books (nếu không có đơn mượn active)
CREATE POLICY "books_delete_staff" ON books
    FOR DELETE
    USING (
        is_librarian_or_admin(auth.uid()) AND
        NOT EXISTS (
            SELECT 1 FROM borrowings 
            WHERE book_id = books.id 
            AND status IN ('pending', 'borrowed', 'overdue')
        )
    );

-- ----------------------------------------------------------------------------
-- 6.4 BORROWINGS Policies
-- ----------------------------------------------------------------------------

-- User xem borrowings của mình, Librarian/Admin xem tất cả
CREATE POLICY "borrowings_select" ON borrowings
    FOR SELECT
    USING (
        user_id = auth.uid() OR 
        is_librarian_or_admin(auth.uid())
    );

-- Reader có thể tạo borrowing (mượn sách) với điều kiện
CREATE POLICY "borrowings_insert_reader" ON borrowings
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        -- Kiểm tra user là reader active
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'reader' 
            AND status = 'active'
        ) AND
        -- Không có phạt chưa thanh toán
        NOT has_unpaid_fines(auth.uid()) AND
        -- Chưa đạt giới hạn mượn (5 cuốn)
        count_active_borrowings(auth.uid()) < 5
    );

-- Librarian/Admin có thể update borrowings (xác nhận/từ chối/cập nhật tình trạng)
CREATE POLICY "borrowings_update_staff" ON borrowings
    FOR UPDATE
    USING (is_librarian_or_admin(auth.uid()))
    WITH CHECK (is_librarian_or_admin(auth.uid()));

-- Reader có thể update borrowing của mình (gia hạn)
CREATE POLICY "borrowings_update_reader" ON borrowings
    FOR UPDATE
    USING (
        user_id = auth.uid() AND
        status = 'borrowed' AND
        extended_count = 0 AND
        due_date >= CURRENT_DATE
    )
    WITH CHECK (
        user_id = auth.uid() AND
        status = 'borrowed'
    );

-- ----------------------------------------------------------------------------
-- 6.5 RETURN_REQUESTS Policies
-- ----------------------------------------------------------------------------

-- User xem return_requests của mình, Librarian/Admin xem tất cả
CREATE POLICY "return_requests_select" ON return_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM borrowings 
            WHERE borrowings.id = return_requests.borrowing_id 
            AND borrowings.user_id = auth.uid()
        ) OR 
        is_librarian_or_admin(auth.uid())
    );

-- Reader có thể tạo return request cho đơn mượn của mình
CREATE POLICY "return_requests_insert_reader" ON return_requests
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM borrowings 
            WHERE borrowings.id = borrowing_id 
            AND borrowings.user_id = auth.uid()
            AND borrowings.status IN ('borrowed', 'overdue')
        )
    );

-- Librarian/Admin có thể update return requests (xác nhận/hủy)
CREATE POLICY "return_requests_update_staff" ON return_requests
    FOR UPDATE
    USING (is_librarian_or_admin(auth.uid()))
    WITH CHECK (is_librarian_or_admin(auth.uid()));

-- Reader có thể hủy return request của mình (status = cancelled)
CREATE POLICY "return_requests_update_reader" ON return_requests
    FOR UPDATE
    USING (
        status = 'pending' AND
        EXISTS (
            SELECT 1 FROM borrowings 
            WHERE borrowings.id = return_requests.borrowing_id 
            AND borrowings.user_id = auth.uid()
        )
    )
    WITH CHECK (
        status = 'cancelled'
    );

-- ----------------------------------------------------------------------------
-- 6.6 FINE_LEVELS Policies
-- ----------------------------------------------------------------------------

-- Mọi người có thể xem fine_levels
CREATE POLICY "fine_levels_select_all" ON fine_levels
    FOR SELECT
    USING (true);

-- Admin có thể thêm fine_levels
CREATE POLICY "fine_levels_insert_admin" ON fine_levels
    FOR INSERT
    WITH CHECK (is_admin(auth.uid()));

-- Admin có thể sửa fine_levels
CREATE POLICY "fine_levels_update_admin" ON fine_levels
    FOR UPDATE
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- Admin có thể xóa fine_levels (nếu không có fines đang dùng)
CREATE POLICY "fine_levels_delete_admin" ON fine_levels
    FOR DELETE
    USING (
        is_admin(auth.uid()) AND
        NOT EXISTS (
            SELECT 1 FROM fines 
            WHERE fine_level_id = fine_levels.id
        )
    );

-- ----------------------------------------------------------------------------
-- 6.7 FINES Policies
-- ----------------------------------------------------------------------------

-- User xem fines của mình, Librarian/Admin xem tất cả
CREATE POLICY "fines_select" ON fines
    FOR SELECT
    USING (
        user_id = auth.uid() OR 
        is_librarian_or_admin(auth.uid())
    );

-- Librarian/Admin có thể tạo fines
CREATE POLICY "fines_insert_staff" ON fines
    FOR INSERT
    WITH CHECK (is_librarian_or_admin(auth.uid()));

-- Reader có thể update fines của mình (gửi payment proof, chuyển status thành pending)
CREATE POLICY "fines_update_reader" ON fines
    FOR UPDATE
    USING (
        user_id = auth.uid() AND
        status IN ('unpaid', 'rejected')
    )
    WITH CHECK (
        user_id = auth.uid() AND
        status = 'pending'
    );

-- Librarian/Admin có thể update fines (xác nhận/từ chối thanh toán)
CREATE POLICY "fines_update_staff" ON fines
    FOR UPDATE
    USING (is_librarian_or_admin(auth.uid()))
    WITH CHECK (is_librarian_or_admin(auth.uid()));


-- ============================================================================
-- SECTION 7: VIEWS (Useful for reporting)
-- ============================================================================

-- View: Sách quá hạn
CREATE OR REPLACE VIEW v_overdue_borrowings AS
SELECT 
    b.id,
    b.user_id,
    p.name AS user_name,
    au.email AS user_email,
    b.book_id,
    bk.name AS book_name,
    bk.author AS book_author,
    b.borrow_date,
    b.due_date,
    CURRENT_DATE - b.due_date AS overdue_days
FROM borrowings b
JOIN profiles p ON b.user_id = p.id
JOIN auth.users au ON p.id = au.id
JOIN books bk ON b.book_id = bk.id
WHERE b.status IN ('borrowed', 'overdue')
AND b.due_date < CURRENT_DATE
AND b.return_date IS NULL;

COMMENT ON VIEW v_overdue_borrowings IS 'Danh sách sách quá hạn chưa trả';


-- View: Thống kê sách theo thể loại
CREATE OR REPLACE VIEW v_book_statistics AS
SELECT 
    c.id AS category_id,
    c.name AS category_name,
    COUNT(b.id) AS total_books,
    COALESCE(SUM(b.total_quantity), 0) AS total_copies,
    COALESCE(SUM(b.available_quantity), 0) AS available_copies,
    COALESCE(SUM(b.borrowed_quantity), 0) AS borrowed_copies
FROM categories c
LEFT JOIN books b ON c.id = b.category_id
GROUP BY c.id, c.name
ORDER BY c.name;

COMMENT ON VIEW v_book_statistics IS 'Thống kê số lượng sách theo thể loại';


-- View: Top sách được mượn nhiều nhất
CREATE OR REPLACE VIEW v_popular_books AS
SELECT 
    b.id,
    b.name,
    b.author,
    b.isbn,
    c.name AS category_name,
    b.available_quantity,
    b.borrowed_quantity,
    COUNT(br.id) AS total_borrow_count
FROM books b
LEFT JOIN borrowings br ON b.id = br.book_id AND br.status != 'rejected'
LEFT JOIN categories c ON b.category_id = c.id
GROUP BY b.id, b.name, b.author, b.isbn, c.name, b.available_quantity, b.borrowed_quantity
ORDER BY total_borrow_count DESC;

COMMENT ON VIEW v_popular_books IS 'Danh sách sách phổ biến nhất theo số lượt mượn';


-- View: Độc giả có khoản phạt chưa thanh toán
CREATE OR REPLACE VIEW v_users_with_unpaid_fines AS
SELECT 
    p.id AS user_id,
    p.name AS user_name,
    au.email AS user_email,
    p.phone,
    COUNT(f.id) AS unpaid_fine_count,
    SUM(f.amount) AS total_unpaid_amount
FROM profiles p
JOIN auth.users au ON p.id = au.id
JOIN fines f ON p.id = f.user_id
WHERE f.status IN ('unpaid', 'rejected')
GROUP BY p.id, p.name, au.email, p.phone
ORDER BY total_unpaid_amount DESC;

COMMENT ON VIEW v_users_with_unpaid_fines IS 'Danh sách độc giả có khoản phạt chưa thanh toán';


-- View: Tổng quan dashboard
CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT 
    (SELECT COUNT(*) FROM books) AS total_books,
    (SELECT COALESCE(SUM(total_quantity), 0) FROM books) AS total_copies,
    (SELECT COALESCE(SUM(available_quantity), 0) FROM books) AS available_copies,
    (SELECT COALESCE(SUM(borrowed_quantity), 0) FROM books) AS borrowed_copies,
    (SELECT COUNT(*) FROM profiles WHERE role = 'reader') AS total_readers,
    (SELECT COUNT(*) FROM profiles WHERE role = 'reader' AND status = 'active') AS active_readers,
    (SELECT COUNT(*) FROM borrowings WHERE status = 'pending') AS pending_borrowings,
    (SELECT COUNT(*) FROM borrowings WHERE status IN ('borrowed', 'overdue')) AS active_borrowings,
    (SELECT COUNT(*) FROM borrowings WHERE borrow_date = CURRENT_DATE) AS today_borrowings,
    (SELECT COUNT(*) FROM return_requests WHERE status = 'pending') AS pending_returns,
    (SELECT COUNT(*) FROM fines WHERE status IN ('unpaid', 'pending', 'rejected')) AS unpaid_fines,
    (SELECT COALESCE(SUM(amount), 0) FROM fines WHERE status IN ('unpaid', 'pending', 'rejected')) AS total_unpaid_amount;

COMMENT ON VIEW v_dashboard_summary IS 'Tổng quan cho dashboard báo cáo';


-- ============================================================================
-- SECTION 8: SEED DATA (Optional - Default fine levels and categories)
-- ============================================================================

-- Mức phạt mặc định
INSERT INTO fine_levels (name, amount, description) VALUES
    ('Trả muộn 1-7 ngày', 10000, 'Phạt trả sách muộn từ 1 đến 7 ngày'),
    ('Trả muộn 8-14 ngày', 20000, 'Phạt trả sách muộn từ 8 đến 14 ngày'),
    ('Trả muộn > 14 ngày', 50000, 'Phạt trả sách muộn trên 14 ngày'),
    ('Hư hỏng nhẹ', 30000, 'Sách bị hư hỏng nhẹ (rách nhẹ, bẩn)'),
    ('Hư hỏng nặng', 100000, 'Sách bị hư hỏng nghiêm trọng'),
    ('Mất sách', 200000, 'Mất sách, cần đền bù theo giá trị sách')
ON CONFLICT (name) DO NOTHING;

-- Thể loại sách mặc định
INSERT INTO categories (name) VALUES
    ('Văn học'),
    ('Khoa học'),
    ('Lịch sử'),
    ('Kinh tế'),
    ('Kỹ năng sống'),
    ('Công nghệ'),
    ('Thiếu nhi'),
    ('Ngoại ngữ')
ON CONFLICT (name) DO NOTHING;


-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
