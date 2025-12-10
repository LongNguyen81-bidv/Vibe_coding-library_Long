# Prisma Setup - Library Management System

## Cấu hình Environment Variables

Tạo file `.env` trong thư mục `backend/` với các biến sau:

```env
# Database Configuration (Prisma)
# Connection pooling URL (Transaction mode) - dùng cho operations thông thường
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct connection URL - dùng cho migrations
DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

### Lấy Connection String từ Supabase

1. Vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **Settings** → **Database**
4. Copy **Connection string** (URI format)
5. Thay `[YOUR-PASSWORD]` bằng database password của bạn

## Các lệnh Prisma

### 1. Generate Prisma Client

Sau khi cập nhật schema, chạy lệnh này để generate client:

```bash
npm run prisma:generate
# hoặc
npx prisma generate
```

### 2. Introspect Database (Pull schema từ database)

Nếu database đã tồn tại và bạn muốn pull schema:

```bash
npx prisma db pull
```

### 3. Push Schema (Development only)

Push schema lên database mà không tạo migration:

```bash
npx prisma db push
```

### 4. Migrate (Production)

Tạo và chạy migration:

```bash
npm run prisma:migrate
# hoặc
npx prisma migrate dev --name <migration-name>
```

### 5. Prisma Studio

Mở GUI để xem và chỉnh sửa data:

```bash
npm run prisma:studio
# hoặc
npx prisma studio
```

## Lưu ý với Supabase

1. **KHÔNG dùng Prisma để tạo schema** - Schema đã được tạo qua SQL migration trong `migrations/schema.sql`

2. **Chỉ dùng Prisma Client để query** - Prisma Client được dùng như ORM để tương tác với database

3. **Sử dụng `db pull`** sau khi chạy SQL migration để sync schema:
   ```bash
   npx prisma db pull
   npx prisma generate
   ```

4. **Multi-schema support** - Schema này hỗ trợ cả `public` và `auth` schema của Supabase

## Sử dụng Prisma Client

```javascript
const prisma = require('./src/config/prisma');

// Ví dụ: Lấy tất cả books
const books = await prisma.book.findMany({
  include: {
    category: true
  }
});

// Ví dụ: Tạo borrowing mới
const borrowing = await prisma.borrowing.create({
  data: {
    userId: 'user-uuid',
    bookId: 'book-uuid',
    dueDate: new Date('2024-01-15')
  }
});
```

