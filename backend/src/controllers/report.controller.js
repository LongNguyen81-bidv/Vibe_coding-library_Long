const prisma = require('../config/prisma');

/**
 * Helper function to calculate date range based on period
 */
const getDateRange = (period) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  switch (period) {
    case 'today':
      return { startDate, endDate: today };
    
    case 'thisWeek':
      const dayOfWeek = startDate.getDay();
      const diff = startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
      startDate.setDate(diff);
      return { startDate, endDate: today };
    
    case 'thisMonth':
      startDate.setDate(1);
      return { startDate, endDate: today };
    
    case 'thisQuarter':
      const quarter = Math.floor(startDate.getMonth() / 3);
      startDate.setMonth(quarter * 3, 1);
      return { startDate, endDate: today };
    
    case 'thisYear':
      startDate.setMonth(0, 1);
      return { startDate, endDate: today };
    
    default:
      return { startDate: null, endDate: null };
  }
};

/**
 * Get Books Report
 * GET /api/reports/books
 */
const getBooksReport = async (req, res) => {
  try {
    const { period, startDate: startDateParam, endDate: endDateParam } = req.query;
    
    let startDate, endDate;
    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    } else if (period) {
      const range = getDateRange(period);
      startDate = range.startDate;
      endDate = range.endDate;
    } else {
      // Default: all time
      startDate = null;
      endDate = null;
    }

    // Get all books with borrowings count
    const books = await prisma.book.findMany({
      include: {
        category: {
          select: {
            name: true
          }
        },
        borrowings: {
          where: startDate && endDate ? {
            borrowDate: {
              gte: startDate,
              lte: endDate
            }
          } : {},
          select: {
            id: true
          }
        }
      }
    });

    // Calculate statistics
    const booksData = books.map(book => ({
      id: book.id,
      name: book.name,
      author: book.author,
      category: book.category.name,
      status: book.availableQuantity > 0 ? 'Có sẵn' : 
              book.borrowedQuantity > 0 ? 'Đang mượn' : 'Không có sẵn',
      totalQuantity: book.totalQuantity,
      availableQuantity: book.availableQuantity,
      borrowedQuantity: book.borrowedQuantity,
      borrowCount: book.borrowings.length
    }));

    // Group by category
    const categoryStats = {};
    books.forEach(book => {
      const categoryName = book.category.name;
      if (!categoryStats[categoryName]) {
        categoryStats[categoryName] = 0;
      }
      categoryStats[categoryName] += 1;
    });

    const categoryChartData = Object.entries(categoryStats).map(([name, value]) => ({
      name,
      value
    }));

    // Status overview
    const statusStats = {
      available: books.filter(b => b.availableQuantity > 0).length,
      borrowed: books.filter(b => b.borrowedQuantity > 0).length,
      unavailable: books.filter(b => b.availableQuantity === 0 && b.borrowedQuantity === 0).length
    };

    const statusChartData = [
      { name: 'Có sẵn', value: statusStats.available },
      { name: 'Đang mượn', value: statusStats.borrowed },
      { name: 'Không có sẵn', value: statusStats.unavailable }
    ].filter(item => item.value > 0);

    res.json({
      success: true,
      data: {
        books: booksData,
        categoryChart: categoryChartData,
        statusChart: statusChartData,
        summary: {
          totalBooks: books.length,
          totalCategories: Object.keys(categoryStats).length,
          totalBorrows: books.reduce((sum, book) => sum + book.borrowings.length, 0)
        }
      }
    });
  } catch (error) {
    console.error('Get books report error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy báo cáo sách'
    });
  }
};

/**
 * Get Borrow/Return Report
 * GET /api/reports/borrowings
 */
const getBorrowingsReport = async (req, res) => {
  try {
    const { period, startDate: startDateParam, endDate: endDateParam } = req.query;
    
    let startDate, endDate;
    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    } else if (period) {
      const range = getDateRange(period);
      startDate = range.startDate;
      endDate = range.endDate;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn khoảng thời gian'
      });
    }

    // Get borrowings in date range
    const borrowings = await prisma.borrowing.findMany({
      where: {
        borrowDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        book: {
          select: {
            name: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      }
    });

    // Group by date
    const dailyStats = {};
    const today = new Date();
    
    borrowings.forEach(borrowing => {
      const dateKey = borrowing.borrowDate.toISOString().split('T')[0];
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = {
          date: dateKey,
          borrows: 0,
          returns: 0,
          overdue: 0
        };
      }
      
      if (borrowing.status === 'borrowed' || borrowing.status === 'returned') {
        dailyStats[dateKey].borrows += 1;
      }
      
      if (borrowing.status === 'returned') {
        dailyStats[dateKey].returns += 1;
      }
      
      if (borrowing.status === 'overdue' || 
          (borrowing.status === 'borrowed' && new Date(borrowing.dueDate) < today)) {
        dailyStats[dateKey].overdue += 1;
      }
    });

    const dailyData = Object.values(dailyStats).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Calculate summary
    const totalBorrows = borrowings.filter(b => 
      b.status === 'borrowed' || b.status === 'returned'
    ).length;
    
    const totalReturns = borrowings.filter(b => 
      b.status === 'returned'
    ).length;
    
    const totalOverdue = borrowings.filter(b => 
      b.status === 'overdue' || 
      (b.status === 'borrowed' && new Date(b.dueDate) < today)
    ).length;

    const onTimeReturns = borrowings.filter(b => 
      b.status === 'returned' && 
      b.returnDate && 
      new Date(b.returnDate) <= new Date(b.dueDate)
    ).length;

    const onTimeRate = totalReturns > 0 
      ? ((onTimeReturns / totalReturns) * 100).toFixed(1) 
      : 0;

    // Prepare chart data
    const trendChartData = dailyData.map(item => ({
      date: item.date,
      borrows: item.borrows,
      returns: item.returns,
      overdue: item.overdue
    }));

    res.json({
      success: true,
      data: {
        dailyData,
        trendChart: trendChartData,
        summary: {
          totalBorrows,
          totalReturns,
          totalOverdue,
          onTimeRate: `${onTimeRate}%`
        }
      }
    });
  } catch (error) {
    console.error('Get borrowings report error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy báo cáo mượn trả'
    });
  }
};

/**
 * Get Fines Report
 * GET /api/reports/fines
 */
const getFinesReport = async (req, res) => {
  try {
    const { period, startDate: startDateParam, endDate: endDateParam } = req.query;
    
    let startDate, endDate;
    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    } else if (period) {
      const range = getDateRange(period);
      startDate = range.startDate;
      endDate = range.endDate;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn khoảng thời gian'
      });
    }

    // Get fines in date range
    const fines = await prisma.fine.findMany({
      where: {
        fineDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        user: {
          select: {
            name: true,
            authUser: {
              select: {
                email: true
              }
            }
          }
        },
        fineLevel: {
          select: {
            name: true
          }
        }
      }
    });

    // Calculate summary
    const totalRevenue = fines
      .filter(f => f.status === 'paid')
      .reduce((sum, fine) => sum + Number(fine.amount), 0);

    const paidCount = fines.filter(f => f.status === 'paid').length;
    const unpaidCount = fines.filter(f => f.status === 'unpaid').length;
    const pendingCount = fines.filter(f => f.status === 'pending').length;
    
    const totalUnpaid = fines
      .filter(f => f.status === 'unpaid' || f.status === 'pending')
      .reduce((sum, fine) => sum + Number(fine.amount), 0);

    // Group by reason
    const reasonStats = {};
    fines.forEach(fine => {
      const reason = fine.reason === 'late_return' ? 'Trả muộn' :
                     fine.reason === 'damaged' ? 'Hư hỏng' : 'Mất sách';
      if (!reasonStats[reason]) {
        reasonStats[reason] = 0;
      }
      reasonStats[reason] += Number(fine.amount);
    });

    const reasonChartData = Object.entries(reasonStats).map(([name, value]) => ({
      name,
      value: Number(value)
    }));

    // Fines detail
    const finesDetail = fines.map(fine => ({
      id: fine.id,
      reader: fine.user.name,
      email: fine.user.authUser.email,
      reason: fine.reason === 'late_return' ? 'Trả muộn' :
              fine.reason === 'damaged' ? 'Hư hỏng' : 'Mất sách',
      amount: Number(fine.amount),
      status: fine.status === 'paid' ? 'Đã thanh toán' :
              fine.status === 'pending' ? 'Chờ xác nhận' :
              fine.status === 'rejected' ? 'Từ chối' : 'Chưa thanh toán',
      fineDate: fine.fineDate
    }));

    // Overdue debtors
    const overdueBorrowings = await prisma.borrowing.findMany({
      where: {
        status: {
          in: ['borrowed', 'overdue']
        },
        dueDate: {
          lt: new Date()
        }
      },
      include: {
        user: {
          select: {
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

    const debtorsMap = new Map();
    overdueBorrowings.forEach(borrowing => {
      const userId = borrowing.userId;
      if (!debtorsMap.has(userId)) {
        debtorsMap.set(userId, {
          name: borrowing.user.name,
          email: borrowing.user.authUser.email,
          totalDebt: 0
        });
      }
      const debtor = debtorsMap.get(userId);
      const fineAmount = borrowing.fines.reduce((sum, fine) => 
        sum + Number(fine.amount), 0
      );
      debtor.totalDebt += fineAmount;
    });

    const overdueDebtors = Array.from(debtorsMap.values())
      .filter(d => d.totalDebt > 0)
      .sort((a, b) => b.totalDebt - a.totalDebt);

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          paidCount,
          unpaidCount,
          pendingCount,
          totalUnpaid
        },
        finesDetail,
        reasonChart: reasonChartData,
        overdueDebtors
      }
    });
  } catch (error) {
    console.error('Get fines report error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy báo cáo phạt'
    });
  }
};

/**
 * Get Lost/Damaged Books Report
 * GET /api/reports/lost-damaged
 */
const getLostDamagedReport = async (req, res) => {
  try {
    const { period, startDate: startDateParam, endDate: endDateParam } = req.query;
    
    let startDate, endDate;
    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    } else if (period) {
      const range = getDateRange(period);
      startDate = range.startDate;
      endDate = range.endDate;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn khoảng thời gian'
      });
    }

    // Get lost/damaged books from borrowings
    const borrowings = await prisma.borrowing.findMany({
      where: {
        status: 'returned',
        bookCondition: {
          in: ['lost', 'damaged']
        },
        returnDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        book: {
          select: {
            id: true,
            name: true,
            author: true,
            category: {
              select: {
                name: true
              }
            }
          }
        },
        user: {
          select: {
            name: true,
            authUser: {
              select: {
                email: true
              }
            }
          }
        }
      }
    });

    const lostBooks = borrowings.filter(b => b.bookCondition === 'lost');
    const damagedBooks = borrowings.filter(b => b.bookCondition === 'damaged');

    // Calculate total damage value (estimate based on fines)
    const lostFines = await prisma.fine.findMany({
      where: {
        reason: 'lost',
        fineDate: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        amount: true
      }
    });

    const damagedFines = await prisma.fine.findMany({
      where: {
        reason: 'damaged',
        fineDate: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        amount: true
      }
    });

    const totalLostValue = lostFines.reduce((sum, fine) => sum + Number(fine.amount), 0);
    const totalDamagedValue = damagedFines.reduce((sum, fine) => sum + Number(fine.amount), 0);
    const totalDamageValue = totalLostValue + totalDamagedValue;

    // Books to replace
    const booksToReplace = borrowings.map(borrowing => ({
      id: borrowing.book.id,
      name: borrowing.book.name,
      author: borrowing.book.author,
      category: borrowing.book.category.name,
      condition: borrowing.bookCondition === 'lost' ? 'Mất' : 'Hư hỏng',
      recordedDate: borrowing.returnDate,
      reader: borrowing.user.name,
      readerEmail: borrowing.user.authUser.email
    }));

    // Trend data (group by date)
    const trendData = {};
    borrowings.forEach(borrowing => {
      const dateKey = borrowing.returnDate.toISOString().split('T')[0];
      if (!trendData[dateKey]) {
        trendData[dateKey] = {
          date: dateKey,
          lost: 0,
          damaged: 0
        };
      }
      if (borrowing.bookCondition === 'lost') {
        trendData[dateKey].lost += 1;
      } else {
        trendData[dateKey].damaged += 1;
      }
    });

    const trendChartData = Object.values(trendData)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      data: {
        summary: {
          totalLost: lostBooks.length,
          totalDamaged: damagedBooks.length,
          totalDamageValue
        },
        booksToReplace,
        trendChart: trendChartData
      }
    });
  } catch (error) {
    console.error('Get lost/damaged report error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy báo cáo sách mất/hư'
    });
  }
};

/**
 * Export CSV
 * POST /api/reports/export
 */
const exportCSV = async (req, res) => {
  try {
    const { reportType, period, startDate, endDate } = req.body;

    if (!reportType) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn loại báo cáo'
      });
    }

    if (!period && (!startDate || !endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn khoảng thời gian'
      });
    }

    // Create a mock request object with query params
    const mockReq = {
      query: { period, startDate, endDate }
    };

    let csvData = '';
    let filename = '';

    switch (reportType) {
      case 'books': {
        const result = await getBooksReportData(mockReq);
        csvData = convertBooksToCSV(result);
        filename = `bao-cao-sach-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }
      
      case 'borrowings': {
        const result = await getBorrowingsReportData(mockReq);
        csvData = convertBorrowingsToCSV(result);
        filename = `bao-cao-muon-tra-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }
      
      case 'fines': {
        const result = await getFinesReportData(mockReq);
        csvData = convertFinesToCSV(result);
        filename = `bao-cao-phat-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }
      
      case 'lost-damaged': {
        const result = await getLostDamagedReportData(mockReq);
        csvData = convertLostDamagedToCSV(result);
        filename = `bao-cao-sach-mat-hu-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Loại báo cáo không hợp lệ'
        });
    }

    // Add UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    csvData = BOM + csvData;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvData);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xuất báo cáo'
    });
  }
};

// Helper functions for CSV export - reuse existing logic
const getBooksReportData = async (req) => {
  const { period, startDate: startDateParam, endDate: endDateParam } = req.query;
  
  let startDate, endDate;
  if (startDateParam && endDateParam) {
    startDate = new Date(startDateParam);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(endDateParam);
    endDate.setHours(23, 59, 59, 999);
  } else if (period) {
    const range = getDateRange(period);
    startDate = range.startDate;
    endDate = range.endDate;
  } else {
    startDate = null;
    endDate = null;
  }

  const books = await prisma.book.findMany({
    include: {
      category: { select: { name: true } },
      borrowings: {
        where: startDate && endDate ? {
          borrowDate: { gte: startDate, lte: endDate }
        } : {},
        select: { id: true }
      }
    }
  });

  return {
    books: books.map(book => ({
      name: book.name,
      author: book.author,
      category: book.category.name,
      status: book.availableQuantity > 0 ? 'Có sẵn' : 
              book.borrowedQuantity > 0 ? 'Đang mượn' : 'Không có sẵn',
      totalQuantity: book.totalQuantity,
      borrowCount: book.borrowings.length
    }))
  };
};

const getBorrowingsReportData = async (req) => {
  const { period, startDate: startDateParam, endDate: endDateParam } = req.query;
  
  let startDate, endDate;
  if (startDateParam && endDateParam) {
    startDate = new Date(startDateParam);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(endDateParam);
    endDate.setHours(23, 59, 59, 999);
  } else if (period) {
    const range = getDateRange(period);
    startDate = range.startDate;
    endDate = range.endDate;
  } else {
    return { dailyData: [] };
  }

  const borrowings = await prisma.borrowing.findMany({
    where: {
      borrowDate: { gte: startDate, lte: endDate }
    }
  });

  const dailyStats = {};
  const today = new Date();
  
  borrowings.forEach(borrowing => {
    const dateKey = borrowing.borrowDate.toISOString().split('T')[0];
    if (!dailyStats[dateKey]) {
      dailyStats[dateKey] = {
        date: dateKey,
        borrows: 0,
        returns: 0,
        overdue: 0
      };
    }
    
    if (borrowing.status === 'borrowed' || borrowing.status === 'returned') {
      dailyStats[dateKey].borrows += 1;
    }
    if (borrowing.status === 'returned') {
      dailyStats[dateKey].returns += 1;
    }
    if (borrowing.status === 'overdue' || 
        (borrowing.status === 'borrowed' && new Date(borrowing.dueDate) < today)) {
      dailyStats[dateKey].overdue += 1;
    }
  });

  return {
    dailyData: Object.values(dailyStats).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    )
  };
};

const getFinesReportData = async (req) => {
  const { period, startDate: startDateParam, endDate: endDateParam } = req.query;
  
  let startDate, endDate;
  if (startDateParam && endDateParam) {
    startDate = new Date(startDateParam);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(endDateParam);
    endDate.setHours(23, 59, 59, 999);
  } else if (period) {
    const range = getDateRange(period);
    startDate = range.startDate;
    endDate = range.endDate;
  } else {
    return { finesDetail: [] };
  }

  const fines = await prisma.fine.findMany({
    where: {
      fineDate: { gte: startDate, lte: endDate }
    },
    include: {
      user: {
        select: {
          name: true,
          authUser: { select: { email: true } }
        }
      }
    }
  });

  return {
    finesDetail: fines.map(fine => ({
      id: fine.id,
      reader: fine.user.name,
      email: fine.user.authUser.email,
      reason: fine.reason === 'late_return' ? 'Trả muộn' :
              fine.reason === 'damaged' ? 'Hư hỏng' : 'Mất sách',
      amount: Number(fine.amount),
      status: fine.status === 'paid' ? 'Đã thanh toán' :
              fine.status === 'pending' ? 'Chờ xác nhận' :
              fine.status === 'rejected' ? 'Từ chối' : 'Chưa thanh toán',
      fineDate: fine.fineDate
    }))
  };
};

const getLostDamagedReportData = async (req) => {
  const { period, startDate: startDateParam, endDate: endDateParam } = req.query;
  
  let startDate, endDate;
  if (startDateParam && endDateParam) {
    startDate = new Date(startDateParam);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(endDateParam);
    endDate.setHours(23, 59, 59, 999);
  } else if (period) {
    const range = getDateRange(period);
    startDate = range.startDate;
    endDate = range.endDate;
  } else {
    return { booksToReplace: [] };
  }

  const borrowings = await prisma.borrowing.findMany({
    where: {
      status: 'returned',
      bookCondition: { in: ['lost', 'damaged'] },
      returnDate: { gte: startDate, lte: endDate }
    },
    include: {
      book: {
        select: {
          name: true,
          author: true,
          category: { select: { name: true } }
        }
      },
      user: {
        select: {
          name: true,
          authUser: { select: { email: true } }
        }
      }
    }
  });

  return {
    booksToReplace: borrowings.map(borrowing => ({
      name: borrowing.book.name,
      author: borrowing.book.author,
      category: borrowing.book.category.name,
      condition: borrowing.bookCondition === 'lost' ? 'Mất' : 'Hư hỏng',
      recordedDate: borrowing.returnDate,
      reader: borrowing.user.name,
      readerEmail: borrowing.user.authUser.email
    }))
  };
};

const convertBooksToCSV = (data) => {
  if (!data || !data.books) return '';
  
  const headers = ['STT', 'Tên sách', 'Tác giả', 'Thể loại', 'Tình trạng', 'Số lượng', 'Số lần mượn'];
  const rows = data.books.map((book, index) => [
    index + 1,
    book.name,
    book.author,
    book.category,
    book.status,
    book.totalQuantity,
    book.borrowCount
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
};

const convertBorrowingsToCSV = (data) => {
  if (!data || !data.dailyData) return '';
  
  const headers = ['STT', 'Ngày', 'Số lượt mượn', 'Số lượt trả', 'Số quá hạn', 'Tỷ lệ đúng hạn'];
  const rows = data.dailyData.map((item, index) => {
    const onTimeRate = item.returns > 0 
      ? `${((item.returns - item.overdue) / item.returns * 100).toFixed(0)}%`
      : '0%';
    return [
      index + 1,
      item.date,
      item.borrows,
      item.returns,
      item.overdue,
      onTimeRate
    ];
  });
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
};

const convertFinesToCSV = (data) => {
  if (!data || !data.finesDetail) return '';
  
  const headers = ['STT', 'Mã phiếu', 'Độc giả', 'Email', 'Lý do', 'Số tiền', 'Trạng thái', 'Ngày phạt'];
  const rows = data.finesDetail.map((fine, index) => [
    index + 1,
    fine.id.substring(0, 8).toUpperCase(),
    fine.reader,
    fine.email,
    fine.reason,
    fine.amount,
    fine.status,
    fine.fineDate.toISOString().split('T')[0]
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
};

const convertLostDamagedToCSV = (data) => {
  if (!data || !data.booksToReplace) return '';
  
  const headers = ['STT', 'Tên sách', 'Tác giả', 'Thể loại', 'Tình trạng', 'Ngày ghi nhận', 'Độc giả', 'Email'];
  const rows = data.booksToReplace.map((book, index) => [
    index + 1,
    book.name,
    book.author,
    book.category,
    book.condition,
    book.recordedDate.toISOString().split('T')[0],
    book.reader,
    book.readerEmail
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
};

module.exports = {
  getBooksReport,
  getBorrowingsReport,
  getFinesReport,
  getLostDamagedReport,
  exportCSV
};

