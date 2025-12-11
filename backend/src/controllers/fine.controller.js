const prisma = require('../config/prisma');

/**
 * Get list of fines for current user (reader)
 * GET /api/fines/my
 */
const getMyFines = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query; // Optional filter: 'unpaid', 'pending', 'rejected', 'paid'

    // Build where clause
    const where = { userId };
    
    if (status === 'unpaid') {
      where.status = 'unpaid';
    } else if (status === 'pending') {
      where.status = 'pending';
    } else if (status === 'rejected') {
      where.status = 'rejected';
    } else if (status === 'paid') {
      where.status = 'paid';
    }

    const fines = await prisma.fine.findMany({
      where,
      include: {
        book: {
          select: {
            id: true,
            name: true,
            author: true
          }
        },
        fineLevel: {
          select: {
            id: true,
            name: true,
            amount: true
          }
        },
        borrowing: {
          select: {
            id: true,
            borrowDate: true,
            dueDate: true,
            returnDate: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format response
    const formattedFines = fines.map(fine => {
      const reasonMap = {
        'late_return': 'Trả muộn',
        'damaged': 'Hư hỏng',
        'lost': 'Mất sách'
      };

      const statusMap = {
        'unpaid': { label: 'Chưa thanh toán', color: 'red' },
        'pending': { label: 'Chờ xác nhận', color: 'yellow' },
        'rejected': { label: 'Từ chối', color: 'orange' },
        'paid': { label: 'Đã thanh toán', color: 'green' }
      };

      return {
        id: fine.id,
        bookId: fine.borrowing.book.id,
        bookName: fine.book.name,
        bookAuthor: fine.book.author,
        reason: fine.reason,
        reasonLabel: reasonMap[fine.reason] || fine.reason,
        amount: Number(fine.amount),
        status: fine.status,
        statusLabel: statusMap[fine.status]?.label || fine.status,
        statusColor: statusMap[fine.status]?.color || 'gray',
        fineDate: fine.fineDate.toISOString().split('T')[0],
        paymentProof: fine.paymentProof,
        rejectionReason: fine.rejectionReason,
        note: fine.note,
        createdAt: fine.createdAt.toISOString(),
        canPay: fine.status === 'unpaid' || fine.status === 'rejected',
        canRetry: fine.status === 'rejected'
      };
    });

    // Get counts for tabs
    const counts = {
      unpaid: await prisma.fine.count({
        where: {
          userId,
          status: 'unpaid'
        }
      }),
      pending: await prisma.fine.count({
        where: {
          userId,
          status: 'pending'
        }
      }),
      rejected: await prisma.fine.count({
        where: {
          userId,
          status: 'rejected'
        }
      }),
      paid: await prisma.fine.count({
        where: {
          userId,
          status: 'paid'
        }
      })
    };

    res.json({
      success: true,
      data: formattedFines,
      counts
    });
  } catch (error) {
    console.error('Get my fines error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách khoản phạt'
    });
  }
};

/**
 * Pay fine (submit payment proof)
 * PATCH /api/fines/:id/pay
 */
const payFine = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentProof } = req.body;
    const userId = req.user.id;

    // Validate payment proof
    if (!paymentProof || paymentProof.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp thông tin thanh toán (ảnh chứng từ hoặc mã giao dịch)'
      });
    }

    // Find fine
    const fine = await prisma.fine.findUnique({
      where: { id }
    });

    if (!fine) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu phạt'
      });
    }

    // Check if user owns this fine
    if (fine.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện thao tác này'
      });
    }

    // Check if fine can be paid
    if (fine.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Phiếu phạt đã được thanh toán'
      });
    }

    if (fine.status === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Phiếu phạt đang chờ xác nhận thanh toán'
      });
    }

    // Update fine status to pending
    const updatedFine = await prisma.fine.update({
      where: { id },
      data: {
        status: 'pending',
        paymentProof: paymentProof.trim()
      }
    });

    res.json({
      success: true,
      message: 'Đã gửi yêu cầu xác nhận! Vui lòng chờ nhân viên xác nhận thanh toán.',
      data: {
        id: updatedFine.id,
        status: updatedFine.status,
        paymentProof: updatedFine.paymentProof
      }
    });
  } catch (error) {
    console.error('Pay fine error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi gửi yêu cầu thanh toán'
    });
  }
};

/**
 * Get fine detail by ID
 * GET /api/fines/:id
 */
const getFineDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const fine = await prisma.fine.findUnique({
      where: { id },
      include: {
        fineLevel: {
          select: {
            id: true,
            name: true,
            amount: true,
            description: true
          }
        },
        borrowing: {
          select: {
            id: true,
            borrowDate: true,
            dueDate: true,
            returnDate: true,
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

    if (!fine) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu phạt'
      });
    }

    // Check if user owns this fine (reader) or is staff
    if (fine.userId !== userId && req.user.role !== 'librarian' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem phiếu phạt này'
      });
    }

    const reasonMap = {
      'late_return': 'Trả muộn',
      'damaged': 'Hư hỏng',
      'lost': 'Mất sách'
    };

    const statusMap = {
      'unpaid': { label: 'Chưa thanh toán', color: 'red' },
      'pending': { label: 'Chờ xác nhận', color: 'yellow' },
      'rejected': { label: 'Từ chối', color: 'orange' },
      'paid': { label: 'Đã thanh toán', color: 'green' }
    };

    res.json({
      success: true,
      data: {
        id: fine.id,
        bookId: fine.borrowing.book.id,
        bookName: fine.borrowing.book.name,
        bookAuthor: fine.borrowing.book.author,
        reason: fine.reason,
        reasonLabel: reasonMap[fine.reason] || fine.reason,
        amount: Number(fine.amount),
        status: fine.status,
        statusLabel: statusMap[fine.status]?.label || fine.status,
        statusColor: statusMap[fine.status]?.color || 'gray',
        fineDate: fine.fineDate.toISOString().split('T')[0],
        paymentProof: fine.paymentProof,
        rejectionReason: fine.rejectionReason,
        note: fine.note,
        fineLevel: {
          id: fine.fineLevel.id,
          name: fine.fineLevel.name,
          amount: Number(fine.fineLevel.amount),
          description: fine.fineLevel.description
        },
        borrowing: {
          id: fine.borrowing.id,
          borrowDate: fine.borrowing.borrowDate.toISOString().split('T')[0],
          dueDate: fine.borrowing.dueDate.toISOString().split('T')[0],
          returnDate: fine.borrowing.returnDate ? fine.borrowing.returnDate.toISOString().split('T')[0] : null
        },
        createdAt: fine.createdAt.toISOString(),
        canPay: fine.status === 'unpaid' || fine.status === 'rejected'
      }
    });
  } catch (error) {
    console.error('Get fine detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin phiếu phạt'
    });
  }
};

/**
 * Get all fines (for librarian/admin)
 * GET /api/fines
 */
const getAllFines = async (req, res) => {
  try {
    const { status } = req.query; // Optional filter: 'unpaid', 'pending', 'rejected', 'paid', or 'all'

    // Build where clause
    const where = {};
    
    if (status && status !== 'all') {
      if (['unpaid', 'pending', 'rejected', 'paid'].includes(status)) {
        where.status = status;
      }
    }

    const fines = await prisma.fine.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        borrowing: {
          select: {
            id: true,
            borrowDate: true,
            dueDate: true,
            returnDate: true,
            book: {
              select: {
                id: true,
                name: true,
                author: true,
                isbn: true
              }
            }
          }
        },
        fineLevel: {
          select: {
            id: true,
            name: true,
            amount: true
          }
        },
        confirmedByUser: {
          select: {
            id: true,
            name: true
          }
        },
        rejectedByUser: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format response
    const formattedFines = fines.map(fine => {
      const reasonMap = {
        'late_return': 'Trả muộn',
        'damaged': 'Hư hỏng',
        'lost': 'Mất'
      };

      const statusMap = {
        'unpaid': { label: 'Chưa thanh toán', color: 'red' },
        'pending': { label: 'Chờ xác nhận', color: 'yellow' },
        'rejected': { label: 'Từ chối', color: 'orange' },
        'paid': { label: 'Đã thanh toán', color: 'green' }
      };

      return {
        id: fine.id,
        userId: fine.userId,
        userName: fine.user.name,
        userEmail: fine.user.email,
        userPhone: fine.user.phone,
        bookId: fine.borrowing.book.id,
        bookName: fine.borrowing.book.name,
        bookAuthor: fine.borrowing.book.author,
        bookIsbn: fine.borrowing.book.isbn,
        reason: fine.reason,
        reasonLabel: reasonMap[fine.reason] || fine.reason,
        amount: Number(fine.amount),
        status: fine.status,
        statusLabel: statusMap[fine.status]?.label || fine.status,
        statusColor: statusMap[fine.status]?.color || 'gray',
        fineDate: fine.fineDate.toISOString().split('T')[0],
        paymentProof: fine.paymentProof,
        rejectionReason: fine.rejectionReason,
        note: fine.note,
        fineLevel: {
          id: fine.fineLevel.id,
          name: fine.fineLevel.name,
          amount: Number(fine.fineLevel.amount)
        },
        borrowing: {
          id: fine.borrowing.id,
          borrowDate: fine.borrowing.borrowDate.toISOString().split('T')[0],
          dueDate: fine.borrowing.dueDate.toISOString().split('T')[0],
          returnDate: fine.borrowing.returnDate ? fine.borrowing.returnDate.toISOString().split('T')[0] : null
        },
        confirmedBy: fine.confirmedByUser ? {
          id: fine.confirmedByUser.id,
          name: fine.confirmedByUser.name
        } : null,
        confirmedAt: fine.confirmedAt ? fine.confirmedAt.toISOString() : null,
        rejectedBy: fine.rejectedByUser ? {
          id: fine.rejectedByUser.id,
          name: fine.rejectedByUser.name
        } : null,
        rejectedAt: fine.rejectedAt ? fine.rejectedAt.toISOString() : null,
        createdAt: fine.createdAt.toISOString(),
        canConfirm: fine.status === 'pending',
        canReject: fine.status === 'pending'
      };
    });

    // Get counts for tabs
    const counts = {
      all: await prisma.fine.count(),
      unpaid: await prisma.fine.count({
        where: { status: 'unpaid' }
      }),
      pending: await prisma.fine.count({
        where: { status: 'pending' }
      }),
      rejected: await prisma.fine.count({
        where: { status: 'rejected' }
      }),
      paid: await prisma.fine.count({
        where: { status: 'paid' }
      })
    };

    res.json({
      success: true,
      data: formattedFines,
      counts
    });
  } catch (error) {
    console.error('Get all fines error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách phiếu phạt'
    });
  }
};

/**
 * Confirm fine payment (for librarian/admin)
 * PATCH /api/fines/:id/confirm
 */
const confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const librarianId = req.user.id;

    // Find fine
    const fine = await prisma.fine.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        borrowing: {
          select: {
            id: true,
            book: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!fine) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu phạt'
      });
    }

    // Check if fine is in pending status
    if (fine.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Không thể xác nhận phiếu phạt ở trạng thái "${fine.status === 'paid' ? 'Đã thanh toán' : fine.status === 'unpaid' ? 'Chưa thanh toán' : 'Từ chối'}"`
      });
    }

    // Update fine status to paid
    const updatedFine = await prisma.fine.update({
      where: { id },
      data: {
        status: 'paid',
        confirmedBy: librarianId,
        confirmedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Xác nhận thanh toán thành công!',
      data: {
        id: updatedFine.id,
        status: updatedFine.status,
        confirmedAt: updatedFine.confirmedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xác nhận thanh toán'
    });
  }
};

/**
 * Reject fine payment (for librarian/admin)
 * PATCH /api/fines/:id/reject
 */
const rejectPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const librarianId = req.user.id;

    // Validate rejection reason
    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập lý do từ chối'
      });
    }

    if (rejectionReason.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Lý do từ chối không được vượt quá 500 ký tự'
      });
    }

    // Find fine
    const fine = await prisma.fine.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        borrowing: {
          select: {
            id: true,
            book: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!fine) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu phạt'
      });
    }

    // Check if fine is in pending status
    if (fine.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Không thể từ chối phiếu phạt ở trạng thái "${fine.status === 'paid' ? 'Đã thanh toán' : fine.status === 'unpaid' ? 'Chưa thanh toán' : 'Từ chối'}"`
      });
    }

    // Update fine status to rejected
    const updatedFine = await prisma.fine.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
        rejectedBy: librarianId,
        rejectedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Đã từ chối thanh toán',
      data: {
        id: updatedFine.id,
        status: updatedFine.status,
        rejectionReason: updatedFine.rejectionReason,
        rejectedAt: updatedFine.rejectedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Reject payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi từ chối thanh toán'
    });
  }
};

module.exports = {
  getMyFines,
  payFine,
  getFineDetail,
  getAllFines,
  confirmPayment,
  rejectPayment
};

