const prisma = require('../config/prisma');

/**
 * Create a new borrowing request
 * POST /api/borrowings
 */
const createBorrowing = async (req, res) => {
  try {
    const { bookId, borrowDays = 14 } = req.body;
    const userId = req.user.id; // From auth middleware

    // Validate borrowDays
    if (borrowDays < 7 || borrowDays > 30) {
      return res.status(400).json({
        success: false,
        message: 'Thời hạn mượn phải từ 7 đến 30 ngày'
      });
    }

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId }
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }

    // Check if book is available
    if (book.availableQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Sách đã hết, vui lòng quay lại sau'
      });
    }

    // Check if user has reached borrowing limit (5 books)
    const activeBorrowings = await prisma.borrowing.count({
      where: {
        userId,
        status: {
          in: ['pending', 'borrowed', 'overdue']
        }
      }
    });

    if (activeBorrowings >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đạt giới hạn mượn tối đa 5 cuốn'
      });
    }

    // Check if user has unpaid fines
    const unpaidFines = await prisma.fine.count({
      where: {
        userId,
        status: {
          in: ['unpaid', 'pending']
        }
      }
    });

    if (unpaidFines > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bạn có khoản phạt chưa thanh toán. Vui lòng thanh toán trước khi mượn sách.'
      });
    }

    // Check if user already has a pending borrowing for this book
    const existingPendingBorrowing = await prisma.borrowing.findFirst({
      where: {
        userId,
        bookId,
        status: 'pending'
      }
    });

    if (existingPendingBorrowing) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã có yêu cầu mượn sách này đang chờ xác nhận'
      });
    }

    // Calculate dates
    const borrowDate = new Date();
    borrowDate.setHours(0, 0, 0, 0);
    
    const dueDate = new Date(borrowDate);
    dueDate.setDate(dueDate.getDate() + borrowDays);

    // Create borrowing request
    const borrowing = await prisma.borrowing.create({
      data: {
        userId,
        bookId,
        borrowDate,
        dueDate,
        status: 'pending'
      },
      include: {
        book: {
          select: {
            id: true,
            name: true,
            author: true
          }
        },
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Yêu cầu mượn sách đã được gửi! Vui lòng chờ nhân viên xác nhận.',
      data: {
        id: borrowing.id,
        book: borrowing.book,
        borrowDate: borrowing.borrowDate.toISOString().split('T')[0],
        dueDate: borrowing.dueDate.toISOString().split('T')[0],
        status: borrowing.status
      }
    });
  } catch (error) {
    console.error('Create borrowing error:', error);
    
    // Handle foreign key constraint violation
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Sách hoặc người dùng không tồn tại'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo yêu cầu mượn sách'
    });
  }
};

/**
 * Get list of pending borrowing requests
 * GET /api/borrowings/pending
 */
const getPendingBorrowings = async (req, res) => {
  try {
    const borrowings = await prisma.borrowing.findMany({
      where: {
        status: 'pending'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            authUser: {
              select: {
                email: true
              }
            }
          }
        },
        book: {
          select: {
            id: true,
            name: true,
            author: true,
            availableQuantity: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Format response
    const formattedBorrowings = borrowings.map(borrowing => {
      const borrowDate = new Date(borrowing.borrowDate);
      const dueDate = new Date(borrowing.dueDate);
      const daysDiff = Math.ceil((dueDate - borrowDate) / (1000 * 60 * 60 * 24));

      return {
        id: borrowing.id,
        bookId: borrowing.bookId,
        bookName: borrowing.book.name,
        bookAuthor: borrowing.book.author,
        availableQuantity: borrowing.book.availableQuantity,
        userId: borrowing.userId,
        userName: borrowing.user.name,
        userEmail: borrowing.user.authUser.email,
        borrowDate: borrowing.borrowDate.toISOString().split('T')[0],
        dueDate: borrowing.dueDate.toISOString().split('T')[0],
        borrowDays: daysDiff,
        createdAt: borrowing.createdAt.toISOString()
      };
    });

    res.json({
      success: true,
      data: formattedBorrowings
    });
  } catch (error) {
    console.error('Get pending borrowings error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách đơn mượn chờ xác nhận'
    });
  }
};

/**
 * Confirm a borrowing request
 * PATCH /api/borrowings/:id/confirm
 */
const confirmBorrowing = async (req, res) => {
  try {
    const { id } = req.params;
    const librarianId = req.user.id;

    // Find borrowing
    const borrowing = await prisma.borrowing.findUnique({
      where: { id },
      include: {
        book: true
      }
    });

    if (!borrowing) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn mượn'
      });
    }

    // Check if already processed
    if (borrowing.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Đơn mượn đã được xử lý'
      });
    }

    // Check if book is available
    if (borrowing.book.availableQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Sách đã hết, không thể xác nhận'
      });
    }

    // Update borrowing and book in a transaction
    await prisma.$transaction(async (tx) => {
      // Update borrowing status
      await tx.borrowing.update({
        where: { id },
        data: {
          status: 'borrowed',
          confirmedBy: librarianId,
          confirmedAt: new Date()
        }
      });

      // Update book quantities
      await tx.book.update({
        where: { id: borrowing.bookId },
        data: {
          availableQuantity: {
            decrement: 1
          },
          borrowedQuantity: {
            increment: 1
          }
        }
      });
    });

    res.json({
      success: true,
      message: 'Xác nhận mượn sách thành công!'
    });
  } catch (error) {
    console.error('Confirm borrowing error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xác nhận mượn sách'
    });
  }
};

/**
 * Reject a borrowing request
 * PATCH /api/borrowings/:id/reject
 */
const rejectBorrowing = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const librarianId = req.user.id;

    // Find borrowing
    const borrowing = await prisma.borrowing.findUnique({
      where: { id }
    });

    if (!borrowing) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn mượn'
      });
    }

    // Check if already processed
    if (borrowing.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Đơn mượn đã được xử lý'
      });
    }

    // Update borrowing status
    await prisma.borrowing.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectionReason,
        rejectedBy: librarianId,
        rejectedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Đã từ chối yêu cầu mượn sách'
    });
  } catch (error) {
    console.error('Reject borrowing error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi từ chối yêu cầu mượn sách'
    });
  }
};

/**
 * Get borrowing history for current user
 * GET /api/borrowings/history
 */
const getBorrowingHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query; // Optional filter: 'borrowing', 'returned', 'pending', 'rejected'

    // Build where clause
    const where = { userId };
    
    if (status === 'borrowing') {
      // Đang mượn: borrowed hoặc overdue
      where.status = { in: ['borrowed', 'overdue'] };
    } else if (status === 'returned') {
      where.status = 'returned';
    } else if (status === 'pending') {
      where.status = 'pending';
    } else if (status === 'rejected') {
      where.status = 'rejected';
    }

    const borrowings = await prisma.borrowing.findMany({
      where,
      include: {
        book: {
          select: {
            id: true,
            name: true,
            author: true
          }
        },
        returnRequests: {
          where: {
            status: 'pending'
          },
          select: {
            id: true,
            status: true
          }
        },
        fines: {
          where: {
            status: { in: ['unpaid', 'pending'] }
          },
          select: {
            id: true,
            status: true,
            amount: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get all fines for returned borrowings in one query (to avoid N+1)
    const returnedBorrowingIds = borrowings
      .filter(b => b.status === 'returned' || status === 'returned')
      .map(b => b.id);
    
    const allFinesMap = {};
    if (returnedBorrowingIds.length > 0) {
      const allFines = await prisma.fine.findMany({
        where: {
          borrowingId: { in: returnedBorrowingIds }
        },
        select: {
          borrowingId: true,
          amount: true,
          status: true
        }
      });
      
      // Group fines by borrowingId
      allFines.forEach(fine => {
        if (!allFinesMap[fine.borrowingId]) {
          allFinesMap[fine.borrowingId] = [];
        }
        allFinesMap[fine.borrowingId].push(fine);
      });
    }

    // Format response based on status
    const formattedBorrowings = borrowings.map(borrowing => {
      const borrowDate = new Date(borrowing.borrowDate);
      const dueDate = new Date(borrowing.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      const isOverdue = borrowing.status === 'overdue' || (borrowing.status === 'borrowed' && daysDiff < 0);
      
      // Check if has pending return request
      const hasPendingReturnRequest = borrowing.returnRequests.length > 0;
      
      // Check if has unpaid fines
      const hasUnpaidFines = borrowing.fines.length > 0;

      const baseData = {
        id: borrowing.id,
        bookId: borrowing.bookId,
        bookTitle: borrowing.book.name,
        author: borrowing.book.author,
        borrowDate: borrowing.borrowDate.toISOString().split('T')[0],
        dueDate: borrowing.dueDate.toISOString().split('T')[0],
        status: borrowing.status,
        extendedCount: borrowing.extendedCount,
        createdAt: borrowing.createdAt.toISOString()
      };

      // Add status-specific fields
      if (status === 'borrowing' || borrowing.status === 'borrowed' || borrowing.status === 'overdue') {
        return {
          ...baseData,
          daysRemaining: daysDiff,
          isOverdue,
          canExtend: !isOverdue && borrowing.extendedCount === 0 && !hasUnpaidFines,
          canReturn: !hasPendingReturnRequest,
          hasPendingReturnRequest
        };
      }

      if (status === 'returned' || borrowing.status === 'returned') {
        const returnDate = borrowing.returnDate ? new Date(borrowing.returnDate) : null;
        const daysBorrowed = returnDate 
          ? Math.ceil((returnDate - borrowDate) / (1000 * 60 * 60 * 24))
          : null;
        const wasLate = returnDate && returnDate > dueDate;

        // Get all fines for this borrowing from pre-fetched map
        const allFines = allFinesMap[borrowing.id] || [];
        const fineAmount = allFines.length > 0 
          ? Number(allFines.reduce((sum, fine) => sum + Number(fine.amount), 0))
          : null;

        return {
          ...baseData,
          returnDate: returnDate ? returnDate.toISOString().split('T')[0] : null,
          daysBorrowed,
          wasLate,
          bookCondition: borrowing.bookCondition,
          fineAmount
        };
      }

      if (status === 'pending' || borrowing.status === 'pending') {
        return {
          ...baseData,
          expectedDueDate: borrowing.dueDate.toISOString().split('T')[0],
          canCancel: true
        };
      }

      if (status === 'rejected' || borrowing.status === 'rejected') {
        return {
          ...baseData,
          rejectionReason: borrowing.rejectionReason,
          rejectedAt: borrowing.rejectedAt ? borrowing.rejectedAt.toISOString() : null
        };
      }

      return baseData;
    });

    // Get counts for tabs
    const counts = {
      borrowing: await prisma.borrowing.count({
        where: {
          userId,
          status: { in: ['borrowed', 'overdue'] }
        }
      }),
      returned: await prisma.borrowing.count({
        where: {
          userId,
          status: 'returned'
        }
      }),
      pending: await prisma.borrowing.count({
        where: {
          userId,
          status: 'pending'
        }
      }),
      rejected: await prisma.borrowing.count({
        where: {
          userId,
          status: 'rejected'
        }
      })
    };

    res.json({
      success: true,
      data: formattedBorrowings,
      counts
    });
  } catch (error) {
    console.error('Get borrowing history error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy lịch sử mượn sách'
    });
  }
};

/**
 * Create return request
 * POST /api/borrowings/:id/return-request
 */
const createReturnRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find borrowing
    const borrowing = await prisma.borrowing.findUnique({
      where: { id },
      include: {
        returnRequests: {
          where: {
            status: 'pending'
          }
        }
      }
    });

    if (!borrowing) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn mượn'
      });
    }

    // Check if user owns this borrowing
    if (borrowing.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện thao tác này'
      });
    }

    // Check if borrowing is in valid status
    if (borrowing.status !== 'borrowed' && borrowing.status !== 'overdue') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể tạo yêu cầu trả sách cho sách đang mượn'
      });
    }

    // Check if already has pending return request
    if (borrowing.returnRequests.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã gửi yêu cầu trả sách này rồi. Vui lòng chờ xác nhận.'
      });
    }

    // Create return request
    const returnRequest = await prisma.returnRequest.create({
      data: {
        borrowingId: id,
        status: 'pending'
      },
      include: {
        borrowing: {
          include: {
            book: {
              select: {
                id: true,
                name: true,
                author: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Yêu cầu trả sách đã được gửi! Vui lòng mang sách đến thư viện.',
      data: {
        id: returnRequest.id,
        book: returnRequest.borrowing.book,
        requestDate: returnRequest.requestDate.toISOString().split('T')[0],
        status: returnRequest.status
      }
    });
  } catch (error) {
    console.error('Create return request error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo yêu cầu trả sách'
    });
  }
};

/**
 * Extend borrowing
 * PATCH /api/borrowings/:id/extend
 */
const extendBorrowing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find borrowing
    const borrowing = await prisma.borrowing.findUnique({
      where: { id },
      include: {
        fines: {
          where: {
            status: { in: ['unpaid', 'pending'] }
          }
        }
      }
    });

    if (!borrowing) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn mượn'
      });
    }

    // Check if user owns this borrowing
    if (borrowing.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện thao tác này'
      });
    }

    // Check if already extended
    if (borrowing.extendedCount >= 1) {
      return res.status(400).json({
        success: false,
        message: 'Sách này đã được gia hạn. Tối đa 1 lần.'
      });
    }

    // Check if overdue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(borrowing.dueDate);
    const isOverdue = today > dueDate;

    if (isOverdue) {
      return res.status(400).json({
        success: false,
        message: 'Không thể gia hạn sách quá hạn. Vui lòng trả sách.'
      });
    }

    // Check if has unpaid fines
    if (borrowing.fines.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng thanh toán phạt trước khi gia hạn'
      });
    }

    // Extend by 7 days
    const newDueDate = new Date(dueDate);
    newDueDate.setDate(newDueDate.getDate() + 7);

    // Update borrowing
    const updatedBorrowing = await prisma.borrowing.update({
      where: { id },
      data: {
        dueDate: newDueDate,
        extendedCount: 1
      },
      include: {
        book: {
          select: {
            id: true,
            name: true,
            author: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Gia hạn thành công!',
      data: {
        id: updatedBorrowing.id,
        book: updatedBorrowing.book,
        newDueDate: newDueDate.toISOString().split('T')[0],
        extendedCount: updatedBorrowing.extendedCount
      }
    });
  } catch (error) {
    console.error('Extend borrowing error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi gia hạn sách'
    });
  }
};

/**
 * Cancel borrowing request
 * PATCH /api/borrowings/:id/cancel
 */
const cancelBorrowing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find borrowing
    const borrowing = await prisma.borrowing.findUnique({
      where: { id }
    });

    if (!borrowing) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn mượn'
      });
    }

    // Check if user owns this borrowing
    if (borrowing.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện thao tác này'
      });
    }

    // Check if status is pending
    if (borrowing.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể hủy đơn mượn ở trạng thái chờ xác nhận'
      });
    }

    // Update status to cancelled (we'll use rejected status with a note, or create a new status)
    // For now, we'll delete the borrowing since it's still pending
    await prisma.borrowing.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Đã hủy đơn mượn'
    });
  } catch (error) {
    console.error('Cancel borrowing error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi hủy đơn mượn'
    });
  }
};

/**
 * Get all fine levels
 * GET /api/borrowings/fine-levels
 */
const getFineLevels = async (req, res) => {
  try {
    const fineLevels = await prisma.fineLevel.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: fineLevels.map(level => ({
        id: level.id,
        name: level.name,
        amount: Number(level.amount),
        description: level.description
      }))
    });
  } catch (error) {
    console.error('Get fine levels error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách mức phạt'
    });
  }
};

/**
 * Get list of pending return requests
 * GET /api/borrowings/return-requests/pending
 */
const getPendingReturnRequests = async (req, res) => {
  try {
    const returnRequests = await prisma.returnRequest.findMany({
      where: {
        status: 'pending'
      },
      include: {
        borrowing: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                authUser: {
                  select: {
                    email: true
                  }
                }
              }
            },
            book: {
              select: {
                id: true,
                name: true,
                author: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Format response
    const formattedRequests = returnRequests.map(request => {
      const borrowDate = new Date(request.borrowing.borrowDate);
      const dueDate = new Date(request.borrowing.dueDate);
      const requestDate = new Date(request.requestDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
      const isOverdue = daysOverdue > 0;

      return {
        id: request.id,
        borrowingId: request.borrowingId,
        userId: request.borrowing.userId,
        userName: request.borrowing.user.name,
        userEmail: request.borrowing.user.authUser.email,
        bookId: request.borrowing.bookId,
        bookName: request.borrowing.book.name,
        bookAuthor: request.borrowing.book.author,
        borrowDate: borrowDate.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        requestDate: requestDate.toISOString().split('T')[0],
        isOverdue,
        daysOverdue: isOverdue ? daysOverdue : 0,
        status: isOverdue ? 'Quá hạn' : 'Đúng hạn'
      };
    });

    res.json({
      success: true,
      data: formattedRequests
    });
  } catch (error) {
    console.error('Get pending return requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách yêu cầu trả sách'
    });
  }
};

/**
 * Confirm return request
 * PATCH /api/borrowings/return-requests/:id/confirm
 */
const confirmReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { bookCondition, fineLevelId, lateFineLevelId, note } = req.body;
    const librarianId = req.user.id;

    // Validate required fields
    if (!bookCondition) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn tình trạng sách'
      });
    }

    // Find return request
    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id },
      include: {
        borrowing: {
          include: {
            book: true,
            user: true
          }
        }
      }
    });

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu trả sách'
      });
    }

    if (returnRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Yêu cầu trả sách đã được xử lý'
      });
    }

    const borrowing = returnRequest.borrowing;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(borrowing.dueDate);
    const isOverdue = today > dueDate;
    const daysOverdue = isOverdue ? Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24)) : 0;

    // Validate based on condition
    if (bookCondition === 'damaged' || bookCondition === 'lost') {
      if (!fineLevelId) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn mức phạt'
        });
      }
      if (!note || note.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập ghi chú'
        });
      }
      if (note.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Ghi chú không được vượt quá 500 ký tự'
        });
      }
    }

    // If normal condition but overdue, require fine level
    if (bookCondition === 'normal' && isOverdue && !fineLevelId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn mức phạt trả muộn'
      });
    }

    // Check if fine levels exist (if provided)
    let fineLevel = null;
    let lateFineLevel = null;
    
    if (fineLevelId) {
      fineLevel = await prisma.fineLevel.findUnique({
        where: { id: fineLevelId }
      });
      if (!fineLevel) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy mức phạt'
        });
      }
    }

    // For damaged + overdue, check late fine level
    if (bookCondition === 'damaged' && isOverdue) {
      if (lateFineLevelId) {
        lateFineLevel = await prisma.fineLevel.findUnique({
          where: { id: lateFineLevelId }
        });
        if (!lateFineLevel) {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy mức phạt trả muộn'
          });
        }
      } else {
        // If no late fine level provided, use the same fine level
        lateFineLevel = fineLevel;
      }
    }

    // Process return in transaction
    await prisma.$transaction(async (tx) => {
      const returnDate = today;
      // Map bookCondition to enum values (normal, damaged, lost)
      const bookConditionMap = {
        'normal': 'normal',
        'damaged': 'damaged',
        'lost': 'lost'
      };
      const updateData = {
        status: 'returned',
        returnDate,
        bookCondition: bookConditionMap[bookCondition.toLowerCase()] || bookCondition.toLowerCase(),
        confirmedBy: librarianId,
        confirmedAt: new Date()
      };

      // Update borrowing
      await tx.borrowing.update({
        where: { id: borrowing.id },
        data: updateData
      });

      // Update book quantities (only if not lost)
      if (bookCondition !== 'lost') {
        await tx.book.update({
          where: { id: borrowing.bookId },
          data: {
            availableQuantity: {
              increment: 1
            },
            borrowedQuantity: {
              decrement: 1
            }
          }
        });
      } else {
        // Lost: only decrease borrowed quantity
        await tx.book.update({
          where: { id: borrowing.bookId },
          data: {
            borrowedQuantity: {
              decrement: 1
            }
          }
        });
      }

      // Create fines if needed
      const finesToCreate = [];

      // Fine for damaged or lost
      if ((bookCondition === 'damaged' || bookCondition === 'lost') && fineLevel) {
        finesToCreate.push({
          userId: borrowing.userId,
          borrowingId: borrowing.id,
          fineLevelId: fineLevel.id,
          reason: bookCondition === 'damaged' ? 'damaged' : 'lost',
          amount: fineLevel.amount,
          note: note || null
        });
      }

      // Fine for late return (if overdue)
      if (isOverdue) {
        let lateFine = null;
        
        if (bookCondition === 'normal') {
          // Normal + overdue: use fineLevelId
          lateFine = fineLevel;
        } else if (bookCondition === 'damaged') {
          // Damaged + overdue: use lateFineLevel (or fineLevel if not provided)
          lateFine = lateFineLevel || fineLevel;
        }
        // Lost + overdue: no late fine (only lost fine)
        
        if (lateFine) {
          finesToCreate.push({
            userId: borrowing.userId,
            borrowingId: borrowing.id,
            fineLevelId: lateFine.id,
            reason: 'late_return',
            amount: lateFine.amount,
            note: `Trả muộn ${daysOverdue} ngày`
          });
        }
      }

      // Create all fines
      if (finesToCreate.length > 0) {
        await tx.fine.createMany({
          data: finesToCreate
        });
      }

      // Update return request status
      await tx.returnRequest.update({
        where: { id },
        data: {
          status: 'confirmed',
          confirmedBy: librarianId,
          confirmedAt: new Date()
        }
      });
    });

    // Build success message
    let message = 'Xác nhận trả sách thành công!';
    const fineMessages = [];
    
    if (bookCondition === 'damaged') {
      fineMessages.push('đã tạo phiếu phạt hư hỏng');
    } else if (bookCondition === 'lost') {
      fineMessages.push('đã tạo phiếu phạt mất sách');
    }
    
    if (isOverdue) {
      fineMessages.push('đã tạo phiếu phạt trả muộn');
    }
    
    if (fineMessages.length > 0) {
      message += ' ' + fineMessages.join(' và ') + '.';
    }

    res.json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Confirm return error:', error);
    
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xác nhận trả sách'
    });
  }
};

module.exports = {
  createBorrowing,
  getPendingBorrowings,
  confirmBorrowing,
  rejectBorrowing,
  getBorrowingHistory,
  createReturnRequest,
  extendBorrowing,
  cancelBorrowing,
  getFineLevels,
  getPendingReturnRequests,
  confirmReturn
};

