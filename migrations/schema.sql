-- ============================================
-- DATABASE SCHEMA - Hệ Thống Quản Lý Thư Viện
-- PostgreSQL / Supabase
-- ============================================

-- ==================== ENUM TYPES ====================

-- Vai trò người dùng
CREATE TYPE user_role AS ENUM ('reader', 'librarian', 'admin');

-- Trạng thái tài khoản
CREATE TYPE user_status AS ENUM ('pending', 'active', 'disabled', 'rejected');

-- Trạng thái đơn mượn
CREATE TYPE borrowing_status AS ENUM ('pending', 'borrowed', 'returned', 'rejected', 'overdue');

-- Tình trạng sách
CREATE TYPE book_condition AS ENUM ('normal', 'damaged', 'lost');

-- Trạng thái yêu cầu trả
CREATE TYPE return_request_status AS ENUM ('pending', 'confirmed', 'cancelled');

-- Lý do phạt
CREATE TYPE fine_reason AS ENUM ('late_return', 'damaged', 'lost');

-- Trạng thái phạt
CREATE TYPE fine_status AS ENUM ('unpaid', 'pending', 'rejected', 'paid');

-- ==================== TABLES ====================

-- 1. PROFILES - Mở rộng từ auth.users của Supabase
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(15),
    address VARCHAR(255),
    role user_role NOT NULL DEFAULT 'reader',
    status user_status NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    borrow_count INTEGER NOT NULL DEFAULT 0,
    total_fine_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CATEGORIES - Thể loại sách
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. BOOKS - Thông tin sách
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    author VARCHAR(100) NOT NULL,
    isbn VARCHAR(17) UNIQUE,
    publish_year INTEGER NOT NULL CHECK (publish_year >= 1900 AND publish_year <= EXTRACT(YEAR FROM CURRENT_DATE)),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    description VARCHAR(255) NOT NULL,
    total_quantity INTEGER NOT NULL CHECK (total_quantity > 0),
    available_quantity INTEGER NOT NULL CHECK (available_quantity >= 0),
    borrowed_quantity INTEGER NOT NULL DEFAULT 0 CHECK (borrowed_quantity >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_quantity_balance CHECK (total_quantity >= available_quantity + borrowed_quantity)
);

-- 4. BORROWINGS - Đơn mượn sách
CREATE TABLE IF NOT EXISTS borrowings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
    borrow_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE,
    status borrowing_status NOT NULL DEFAULT 'pending',
    book_condition book_condition,
    extended_count INTEGER NOT NULL DEFAULT 0 CHECK (extended_count >= 0 AND extended_count <= 1),
    rejection_reason TEXT,
    confirmed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    confirmed_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    rejected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_due_date CHECK (due_date >= borrow_date AND due_date <= borrow_date + INTERVAL '30 days'),
    CONSTRAINT check_return_date CHECK (return_date IS NULL OR return_date >= borrow_date)
);

-- 5. RETURN_REQUESTS - Yêu cầu trả sách
CREATE TABLE IF NOT EXISTS return_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    borrowing_id UUID NOT NULL REFERENCES borrowings(id) ON DELETE CASCADE,
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status return_request_status NOT NULL DEFAULT 'pending',
    confirmed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. FINE_LEVELS - Mức phạt (cấu hình bởi Admin)
CREATE TABLE IF NOT EXISTS fine_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(25) NOT NULL UNIQUE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. FINES - Phiếu phạt
CREATE TABLE IF NOT EXISTS fines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    borrowing_id UUID NOT NULL REFERENCES borrowings(id) ON DELETE CASCADE,
    fine_level_id UUID NOT NULL REFERENCES fine_levels(id) ON DELETE RESTRICT,
    reason fine_reason NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    status fine_status NOT NULL DEFAULT 'unpaid',
    payment_proof TEXT,
    rejection_reason TEXT,
    note VARCHAR(500),
    fine_date DATE NOT NULL DEFAULT CURRENT_DATE,
    confirmed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    confirmed_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    rejected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== INDEXES ====================

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
CREATE INDEX idx_books_available ON books(available_quantity) WHERE available_quantity > 0;

-- Borrowings indexes
CREATE INDEX idx_borrowings_user_id ON borrowings(user_id);
CREATE INDEX idx_borrowings_book_id ON borrowings(book_id);
CREATE INDEX idx_borrowings_status ON borrowings(status);
CREATE INDEX idx_borrowings_due_date ON borrowings(due_date);
CREATE INDEX idx_borrowings_user_status ON borrowings(user_id, status);
CREATE INDEX idx_borrowings_overdue ON borrowings(due_date) 
    WHERE status = 'borrowed' AND return_date IS NULL;

-- Return requests indexes
CREATE INDEX idx_return_requests_borrowing_id ON return_requests(borrowing_id);
CREATE INDEX idx_return_requests_status ON return_requests(status);
CREATE UNIQUE INDEX idx_return_requests_pending_unique ON return_requests(borrowing_id) 
    WHERE status = 'pending';

-- Fine levels indexes
CREATE INDEX idx_fine_levels_name ON fine_levels(name);

-- Fines indexes
CREATE INDEX idx_fines_user_id ON fines(user_id);
CREATE INDEX idx_fines_borrowing_id ON fines(borrowing_id);
CREATE INDEX idx_fines_fine_level_id ON fines(fine_level_id);
CREATE INDEX idx_fines_status ON fines(status);
CREATE INDEX idx_fines_user_status ON fines(user_id, status);
CREATE INDEX idx_fines_unpaid ON fines(user_id) WHERE status = 'unpaid';

-- ==================== FUNCTIONS ====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create profile on user signup
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

-- ==================== TRIGGERS ====================

-- Updated_at triggers for all tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_borrowings_updated_at
    BEFORE UPDATE ON borrowings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_return_requests_updated_at
    BEFORE UPDATE ON return_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fine_levels_updated_at
    BEFORE UPDATE ON fine_levels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fines_updated_at
    BEFORE UPDATE ON fines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to create profile when new user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowings ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE fine_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is staff (librarian or admin)
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() IN ('librarian', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== RLS POLICIES ====================

-- PROFILES policies
CREATE POLICY "Anyone can view basic profile info"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id 
        AND role = (SELECT role FROM profiles WHERE id = auth.uid())
        AND status = (SELECT status FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Admin can update all profiles"
    ON profiles FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

-- CATEGORIES policies
CREATE POLICY "Anyone can view categories"
    ON categories FOR SELECT
    USING (true);

CREATE POLICY "Staff can manage categories"
    ON categories FOR ALL
    USING (is_staff())
    WITH CHECK (is_staff());

-- BOOKS policies
CREATE POLICY "Anyone can view books"
    ON books FOR SELECT
    USING (true);

CREATE POLICY "Staff can manage books"
    ON books FOR ALL
    USING (is_staff())
    WITH CHECK (is_staff());

-- BORROWINGS policies
CREATE POLICY "Users can view own borrowings"
    ON borrowings FOR SELECT
    USING (auth.uid() = user_id OR is_staff());

CREATE POLICY "Active readers can create borrowings"
    ON borrowings FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        AND (SELECT status FROM profiles WHERE id = auth.uid()) = 'active'
    );

CREATE POLICY "Staff can update borrowings"
    ON borrowings FOR UPDATE
    USING (is_staff())
    WITH CHECK (is_staff());

CREATE POLICY "Readers can extend own borrowings"
    ON borrowings FOR UPDATE
    USING (auth.uid() = user_id AND status = 'borrowed')
    WITH CHECK (auth.uid() = user_id);

-- RETURN_REQUESTS policies
CREATE POLICY "Users can view own return requests"
    ON return_requests FOR SELECT
    USING (
        (SELECT user_id FROM borrowings WHERE id = borrowing_id) = auth.uid()
        OR is_staff()
    );

CREATE POLICY "Readers can create return requests"
    ON return_requests FOR INSERT
    WITH CHECK (
        (SELECT user_id FROM borrowings WHERE id = borrowing_id) = auth.uid()
    );

CREATE POLICY "Staff can update return requests"
    ON return_requests FOR UPDATE
    USING (is_staff())
    WITH CHECK (is_staff());

-- FINE_LEVELS policies
CREATE POLICY "Anyone can view fine levels"
    ON fine_levels FOR SELECT
    USING (true);

CREATE POLICY "Admin can manage fine levels"
    ON fine_levels FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- FINES policies
CREATE POLICY "Users can view own fines"
    ON fines FOR SELECT
    USING (auth.uid() = user_id OR is_staff());

CREATE POLICY "Staff can create fines"
    ON fines FOR INSERT
    WITH CHECK (is_staff());

CREATE POLICY "Readers can update own fines for payment"
    ON fines FOR UPDATE
    USING (auth.uid() = user_id AND status = 'unpaid')
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can update fines"
    ON fines FOR UPDATE
    USING (is_staff())
    WITH CHECK (is_staff());

-- ==================== SEED DATA ====================

-- Insert default fine levels
INSERT INTO fine_levels (name, amount, description) VALUES
    ('Trả muộn - Nhẹ', 5000, 'Trả muộn 1-3 ngày'),
    ('Trả muộn - Trung bình', 15000, 'Trả muộn 4-7 ngày'),
    ('Trả muộn - Nặng', 30000, 'Trả muộn trên 7 ngày'),
    ('Hư hỏng - Nhẹ', 20000, 'Sách bị rách nhẹ, có thể sửa'),
    ('Hư hỏng - Nặng', 50000, 'Sách bị hư hỏng nghiêm trọng'),
    ('Mất sách', 100000, 'Mất sách hoàn toàn')
ON CONFLICT (name) DO NOTHING;

-- Insert default categories
INSERT INTO categories (name) VALUES
    ('Văn học'),
    ('Khoa học'),
    ('Lịch sử'),
    ('Kinh tế'),
    ('Công nghệ'),
    ('Tâm lý'),
    ('Thiếu nhi'),
    ('Giáo dục'),
    ('Y học'),
    ('Nghệ thuật')
ON CONFLICT (name) DO NOTHING;
