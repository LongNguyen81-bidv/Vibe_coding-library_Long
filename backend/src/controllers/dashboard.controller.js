const prisma = require('../config/prisma');

/**
 * Get dashboard statistics
 * GET /api/dashboard
 */
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // Widget 1: Thống kê sách
    const totalBooks = await prisma.book.count();
    
    const booksStats = await prisma.book.aggregate({
      _sum: {
        availableQuantity: true,
        borrowedQuantity: true,
      }
    });

    // Đếm sách bị mất và hư hỏng từ borrowings đã trả
    const lostBooks = await prisma.borrowing.count({
      where: {
        status: 'returned',
        bookCondition: 'lost'
      }
    });

    const damagedBooks = await prisma.borrowing.count({
      where: {
        status: 'returned',
        bookCondition: 'damaged'
      }
    });

    // Widget 2: Thống kê độc giả
    const readersStats = await prisma.profile.groupBy({
      by: ['status'],
      where: {
        role: 'reader'
      },
      _count: {
        id: true
      }
    });

    const totalReaders = await prisma.profile.count({
      where: {
        role: 'reader'
      }
    });

    const activeReaders = readersStats.find(s => s.status === 'active')?._count.id || 0;
    const disabledReaders = readersStats.find(s => s.status === 'disabled')?._count.id || 0;
    const pendingReaders = readersStats.find(s => s.status === 'pending')?._count.id || 0;

    // Widget 3: Đơn mượn hôm nay
    const todayBorrowings = await prisma.borrowing.findMany({
      where: {
        borrowDate: {
          gte: today,
          lte: todayEnd
        }
      },
      select: {
        status: true
      }
    });

    const todayTotal = todayBorrowings.length;
    const todayConfirmed = todayBorrowings.filter(b => b.status === 'borrowed').length;
    const todayPending = todayBorrowings.filter(b => b.status === 'pending').length;
    const todayRejected = todayBorrowings.filter(b => b.status === 'rejected').length;

    // Widget 4: Top 5 sách phổ biến (sách được mượn nhiều nhất)
    const topBooks = await prisma.book.findMany({
      include: {
        borrowings: {
          where: {
            status: {
              in: ['borrowed', 'returned']
            }
          }
        }
      },
      take: 5
    });

    const topBooksWithCount = topBooks
      .map(book => ({
        rank: 0, // Will be set after sorting
        id: book.id,
        name: book.name,
        author: book.author,
        borrowCount: book.borrowings.length
      }))
      .sort((a, b) => b.borrowCount - a.borrowCount)
      .map((book, index) => ({
        ...book,
        rank: index + 1
      }));

    // Widget 5: Độc giả nợ quá hạn
    const overdueBorrowings = await prisma.borrowing.findMany({
      where: {
        status: {
          in: ['borrowed', 'overdue']
        },
        dueDate: {
          lt: today
        }
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
        fines: {
          where: {
            status: {
              in: ['unpaid', 'pending']
            }
          },
          select: {
            amount: true
          }
        }
      }
    });

    // Nhóm theo user và tính toán
    const overdueReadersMap = new Map();
    
    overdueBorrowings.forEach(borrowing => {
      const userId = borrowing.userId;
      const daysOverdue = Math.floor((today - new Date(borrowing.dueDate)) / (1000 * 60 * 60 * 24));
      
      if (!overdueReadersMap.has(userId)) {
        overdueReadersMap.set(userId, {
          name: borrowing.user.name,
          email: borrowing.user.authUser.email,
          overdueBooks: 0,
          maxOverdueDays: 0,
          totalFine: 0
        });
      }
      
      const reader = overdueReadersMap.get(userId);
      reader.overdueBooks += 1;
      reader.maxOverdueDays = Math.max(reader.maxOverdueDays, daysOverdue);
      
      // Tính tổng tiền phạt chưa thanh toán
      const fineAmount = borrowing.fines.reduce((sum, fine) => {
        return sum + Number(fine.amount);
      }, 0);
      reader.totalFine += fineAmount;
    });

    const overdueReaders = Array.from(overdueReadersMap.values())
      .sort((a, b) => b.maxOverdueDays - a.maxOverdueDays)
      .slice(0, 10); // Lấy top 10 độc giả nợ quá hạn nhiều nhất

    res.json({
      success: true,
      data: {
        books: {
          total: totalBooks,
          available: booksStats._sum.availableQuantity || 0,
          borrowed: booksStats._sum.borrowedQuantity || 0,
          lost: lostBooks,
          damaged: damagedBooks
        },
        readers: {
          total: totalReaders,
          active: activeReaders,
          disabled: disabledReaders,
          pending: pendingReaders
        },
        todayBorrowings: {
          total: todayTotal,
          confirmed: todayConfirmed,
          pending: todayPending,
          rejected: todayRejected
        },
        topBooks: topBooksWithCount,
        overdueReaders: overdueReaders
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy dữ liệu thống kê'
    });
  }
};

module.exports = {
  getDashboardStats
};

