const prisma = require('../config/prisma');
const { supabaseAdmin } = require('../config/supabase');

/**
 * Get list of users with filters
 * GET /api/users
 */
const getUsers = async (req, res) => {
  try {
    const { keyword, role, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where = {};

    // Filter by role
    if (role && role !== 'all') {
      where.role = role;
    }

    // Search by keyword (email or name)
    if (keyword && keyword.trim()) {
      const keywordTrimmed = keyword.trim();
      where.OR = [
        {
          name: {
            contains: keywordTrimmed,
            mode: 'insensitive'
          }
        },
        {
          authUser: {
            email: {
              contains: keywordTrimmed,
              mode: 'insensitive'
            }
          }
        }
      ];
    }

    // Get total count
    const total = await prisma.profile.count({ where });

    // Get users with pagination
    const users = await prisma.profile.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        authUser: {
          select: {
            email: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format response
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.authUser.email,
      name: user.name,
      role: user.role,
      status: user.status,
      joinDate: user.authUser.createdAt,
      rejectionReason: user.rejectionReason
    }));

    res.json({
      success: true,
      data: formattedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách người dùng'
    });
  }
};

/**
 * Get user by ID
 * GET /api/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.profile.findUnique({
      where: { id },
      include: {
        authUser: {
          select: {
            email: true,
            createdAt: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const formattedUser = {
      id: user.id,
      email: user.authUser.email,
      name: user.name,
      phone: user.phone,
      address: user.address,
      role: user.role,
      status: user.status,
      joinDate: user.authUser.createdAt,
      rejectionReason: user.rejectionReason,
      borrowCount: user.borrowCount,
      totalFineAmount: Number(user.totalFineAmount)
    };

    res.json({
      success: true,
      data: formattedUser
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin người dùng'
    });
  }
};

/**
 * Activate user account
 * PATCH /api/users/:id/activate
 */
const activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.profile.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Update status to active
    await prisma.profile.update({
      where: { id },
      data: {
        status: 'active',
        rejectionReason: null
      }
    });

    res.json({
      success: true,
      message: 'Kích hoạt tài khoản thành công!'
    });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi kích hoạt tài khoản'
    });
  }
};

/**
 * Disable user account
 * PATCH /api/users/:id/disable
 */
const disableUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    // Check if user exists
    const user = await prisma.profile.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Check if trying to disable self
    if (id === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'Không thể vô hiệu hóa tài khoản của chính mình'
      });
    }

    // Check if this is the last admin
    if (user.role === 'admin') {
      const adminCount = await prisma.profile.count({
        where: {
          role: 'admin',
          status: 'active'
        }
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Không thể vô hiệu hóa Admin cuối cùng trong hệ thống'
        });
      }
    }

    // Update status to disabled
    await prisma.profile.update({
      where: { id },
      data: {
        status: 'disabled'
      }
    });

    // Sign out all sessions for this user
    try {
      await supabaseAdmin.auth.admin.signOut(id);
    } catch (signOutError) {
      console.error('Sign out error:', signOutError);
      // Continue even if sign out fails
    }

    res.json({
      success: true,
      message: 'Vô hiệu hóa tài khoản thành công!'
    });
  } catch (error) {
    console.error('Disable user error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi vô hiệu hóa tài khoản'
    });
  }
};

/**
 * Approve pending user account
 * PATCH /api/users/:id/approve
 */
const approveUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.profile.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Check if user is pending
    if (user.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản không ở trạng thái chờ xác nhận'
      });
    }

    // Update status to active
    await prisma.profile.update({
      where: { id },
      data: {
        status: 'active',
        rejectionReason: null
      }
    });

    res.json({
      success: true,
      message: 'Đã xác nhận tài khoản!'
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xác nhận tài khoản'
    });
  }
};

/**
 * Reject pending user account
 * PATCH /api/users/:id/reject
 */
const rejectUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    // Validate rejection reason
    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập lý do từ chối',
        errors: [{ field: 'rejectionReason', message: 'Vui lòng nhập lý do từ chối' }]
      });
    }

    // Check if user exists
    const user = await prisma.profile.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Check if user is pending
    if (user.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản không ở trạng thái chờ xác nhận'
      });
    }

    // Update status to rejected
    await prisma.profile.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectionReason: rejectionReason.trim()
      }
    });

    res.json({
      success: true,
      message: 'Đã từ chối tài khoản!'
    });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi từ chối tài khoản'
    });
  }
};

/**
 * Assign role to user
 * PATCH /api/users/:id/assign-role
 */
const assignRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Check if user exists
    const user = await prisma.profile.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Không thể gán vai trò cho tài khoản chưa kích hoạt'
      });
    }

    // Check if role is the same
    if (user.role === role) {
      return res.status(400).json({
        success: false,
        message: 'Người dùng đã có vai trò này'
      });
    }

    // Check if trying to demote last admin
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await prisma.profile.count({
        where: {
          role: 'admin',
          status: 'active'
        }
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Không thể hạ cấp Admin cuối cùng. Hệ thống cần ít nhất 1 Admin.'
        });
      }
    }

    // Update role
    await prisma.profile.update({
      where: { id },
      data: {
        role: role
      }
    });

    const roleLabels = {
      reader: 'Độc giả',
      librarian: 'Nhân viên',
      admin: 'Quản lý viên'
    };

    res.json({
      success: true,
      message: `Đã thay đổi vai trò thành ${roleLabels[role]}!`
    });
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thay đổi vai trò'
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  activateUser,
  disableUser,
  approveUser,
  rejectUser,
  assignRole
};

