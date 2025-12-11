const prisma = require('../config/prisma');

/**
 * Get all books with pagination, search, filter, and sort
 * GET /api/books
 */
const getAllBooks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      keyword,
      categoryId,
      sortBy = 'name',
      order = 'ASC'
    } = req.query;

    // Parse pagination params
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Validate pagination
    if (pageNum < 1 || limitNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'Số trang và số lượng sách phải lớn hơn 0'
      });
    }

    // Build where clause
    const where = {};
    
    // Search by keyword (name or author)
    if (keyword && keyword.trim() !== '') {
      where.OR = [
        { name: { contains: keyword.trim(), mode: 'insensitive' } },
        { author: { contains: keyword.trim(), mode: 'insensitive' } }
      ];
    }

    // Filter by category
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Validate sortBy
    const validSortFields = ['name', 'publishYear', 'borrowCount'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'desc' : 'asc';

    // Get total count
    const total = await prisma.book.count({ where });

    // If sorting by borrowCount, we need to fetch all books first, then sort and paginate
    const needMemorySort = sortBy === 'borrowCount';
    
    // Build orderBy (only for database sorting)
    let orderBy = {};
    if (sortField === 'name') {
      orderBy = { name: sortOrder };
    } else if (sortField === 'publishYear') {
      orderBy = { publishYear: sortOrder };
    }
    // For borrowCount, we'll sort in memory, so no orderBy needed

    // Fetch books
    let booksQuery = {
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        borrowings: {
          select: {
            id: true,
            status: true
          }
        }
      }
    };

    // If not sorting by borrowCount, apply pagination and orderBy at database level
    if (!needMemorySort) {
      booksQuery.skip = skip;
      booksQuery.take = limitNum;
      booksQuery.orderBy = orderBy;
    }

    let books = await prisma.book.findMany(booksQuery);

    // Calculate borrowCount for each book (count borrowings with status 'borrowed' or 'returned')
    books = books.map(book => {
      const borrowCount = book.borrowings.filter(
        b => b.status === 'borrowed' || b.status === 'returned'
      ).length;
      
      return {
        id: book.id,
        name: book.name,
        author: book.author,
        publishYear: book.publishYear,
        category: book.category,
        availableQuantity: book.availableQuantity,
        borrowedQuantity: book.borrowedQuantity,
        borrowCount
      };
    });

    // If sortBy is borrowCount, sort in memory then paginate
    if (needMemorySort) {
      books.sort((a, b) => {
        if (order.toUpperCase() === 'DESC') {
          return b.borrowCount - a.borrowCount;
        }
        return a.borrowCount - b.borrowCount;
      });
      
      // Apply pagination after sorting
      books = books.slice(skip, skip + limitNum);
    }

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: books,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách sách'
    });
  }
};

/**
 * Create a new book
 * POST /api/books
 */
const createBook = async (req, res) => {
  try {
    const {
      name,
      author,
      publishYear,
      isbn,
      categoryId,
      description,
      totalQuantity
    } = req.body;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Thể loại không tồn tại',
        errors: [{ field: 'categoryId', message: 'Thể loại không tồn tại' }]
      });
    }

    // Check if ISBN already exists (if provided)
    if (isbn && isbn.trim() !== '') {
      const cleanedISBN = isbn.replace(/[-\s]/g, '');
      const existingBook = await prisma.book.findFirst({
        where: {
          OR: [
            { isbn: cleanedISBN },
            { isbn: isbn }
          ]
        }
      });

      if (existingBook) {
        return res.status(400).json({
          success: false,
          message: 'ISBN này đã được sử dụng',
          errors: [{ field: 'isbn', message: 'ISBN này đã được sử dụng' }]
        });
      }
    }

    // Create book
    const book = await prisma.book.create({
      data: {
        name,
        author,
        publishYear,
        isbn: isbn && isbn.trim() !== '' ? isbn.replace(/[-\s]/g, '') : null,
        categoryId,
        description,
        totalQuantity,
        availableQuantity: totalQuantity,
        borrowedQuantity: 0
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Thêm sách thành công!',
      data: book
    });
  } catch (error) {
    console.error('Create book error:', error);
    
    // Handle unique constraint violation (ISBN)
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'ISBN này đã được sử dụng',
        errors: [{ field: 'isbn', message: 'ISBN này đã được sử dụng' }]
      });
    }

    // Handle foreign key constraint violation (category)
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Thể loại không tồn tại',
        errors: [{ field: 'categoryId', message: 'Thể loại không tồn tại' }]
      });
    }

    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm sách'
    });
  }
};

/**
 * Get book by ID with borrow history (if user is librarian/admin)
 * GET /api/books/:id
 */
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user; // From auth middleware (if authenticated)

    // Find book with category
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    // Check if user is librarian or admin
    const isStaff = user && (user.role === 'librarian' || user.role === 'admin');

    // Prepare response data
    const bookData = {
      id: book.id,
      name: book.name,
      author: book.author,
      isbn: book.isbn,
      publishYear: book.publishYear,
      category: book.category,
      description: book.description,
      availableQuantity: book.availableQuantity,
      borrowedQuantity: book.borrowedQuantity,
      totalQuantity: book.totalQuantity
    };

    // If user is staff, include borrow history
    if (isStaff) {
      const borrowings = await prisma.borrowing.findMany({
        where: {
          bookId: id,
          status: {
            in: ['borrowed', 'returned', 'overdue']
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          borrowDate: 'desc'
        }
      });

      // Format borrow history
      bookData.borrowHistory = borrowings.map(borrowing => {
        // Determine status
        let status = borrowing.status;
        if (borrowing.status === 'borrowed') {
          const today = new Date();
          const dueDate = new Date(borrowing.dueDate);
          if (dueDate < today) {
            status = 'overdue';
          }
        }

        return {
          readerId: borrowing.userId,
          readerName: borrowing.user.name,
          borrowDate: borrowing.borrowDate.toISOString().split('T')[0],
          dueDate: borrowing.dueDate.toISOString().split('T')[0],
          returnDate: borrowing.returnDate ? borrowing.returnDate.toISOString().split('T')[0] : null,
          status: status.toUpperCase()
        };
      });
    } else {
      bookData.borrowHistory = [];
    }

    res.json({
      success: true,
      data: bookData
    });
  } catch (error) {
    console.error('Get book by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin sách'
    });
  }
};

/**
 * Update a book by ID
 * PUT /api/books/:id
 */
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      author,
      publishYear,
      isbn,
      categoryId,
      description,
      totalQuantity
    } = req.body;

    // Check if book exists
    const existingBook = await prisma.book.findUnique({
      where: { id }
    });

    if (!existingBook) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Thể loại không tồn tại',
        errors: [{ field: 'categoryId', message: 'Thể loại không tồn tại' }]
      });
    }

    // Check if ISBN already exists (if provided and different from current)
    if (isbn && isbn.trim() !== '') {
      const cleanedISBN = isbn.replace(/[-\s]/g, '');
      const currentISBN = existingBook.isbn ? existingBook.isbn.replace(/[-\s]/g, '') : '';
      
      if (cleanedISBN !== currentISBN) {
        const bookWithSameISBN = await prisma.book.findFirst({
          where: {
            id: { not: id },
            OR: [
              { isbn: cleanedISBN },
              { isbn: isbn }
            ]
          }
        });

        if (bookWithSameISBN) {
          return res.status(400).json({
            success: false,
            message: 'ISBN này đã được sử dụng',
            errors: [{ field: 'isbn', message: 'ISBN này đã được sử dụng' }]
          });
        }
      }
    }

    // Check if new totalQuantity is less than borrowedQuantity
    if (totalQuantity < existingBook.borrowedQuantity) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng không thể nhỏ hơn số sách đang mượn',
        errors: [{ 
          field: 'totalQuantity', 
          message: 'Số lượng không thể nhỏ hơn số sách đang mượn' 
        }]
      });
    }

    // Calculate new availableQuantity
    const newAvailableQuantity = totalQuantity - existingBook.borrowedQuantity;

    // Update book
    const updatedBook = await prisma.book.update({
      where: { id },
      data: {
        name,
        author,
        publishYear,
        isbn: isbn && isbn.trim() !== '' ? isbn.replace(/[-\s]/g, '') : null,
        categoryId,
        description,
        totalQuantity,
        availableQuantity: newAvailableQuantity
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Cập nhật sách thành công!',
      data: updatedBook
    });
  } catch (error) {
    console.error('Update book error:', error);
    
    // Handle unique constraint violation (ISBN)
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'ISBN này đã được sử dụng',
        errors: [{ field: 'isbn', message: 'ISBN này đã được sử dụng' }]
      });
    }

    // Handle foreign key constraint violation (category)
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Thể loại không tồn tại',
        errors: [{ field: 'categoryId', message: 'Thể loại không tồn tại' }]
      });
    }

    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật sách'
    });
  }
};

/**
 * Delete a book by ID
 * DELETE /api/books/:id
 */
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if book exists
    const existingBook = await prisma.book.findUnique({
      where: { id },
      include: {
        borrowings: {
          where: {
            status: {
              in: ['pending', 'borrowed', 'overdue']
            }
          }
        }
      }
    });

    if (!existingBook) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    // Check if book has active borrowings
    if (existingBook.borrowings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa sách đang có đơn mượn hoạt động'
      });
    }

    // Delete returned borrowings first (history)
    await prisma.borrowing.deleteMany({
      where: {
        bookId: id,
        status: 'returned'
      }
    });

    // Delete book
    await prisma.book.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Xóa sách thành công!'
    });
  } catch (error) {
    console.error('Delete book error:', error);
    
    // Handle foreign key constraint violation (if there are still active borrowings)
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa sách đang có đơn mượn hoạt động'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa sách'
    });
  }
};

module.exports = {
  getAllBooks,
  createBook,
  getBookById,
  updateBook,
  deleteBook
};

