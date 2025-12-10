const { supabaseAdmin } = require('../config/supabase');
const prisma = require('../config/prisma');

/**
 * Get user profile
 * GET /api/profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get profile with statistics
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      include: {
        authUser: {
          select: {
            email: true,
            createdAt: true
          }
        },
        borrowings: {
          select: {
            id: true
          }
        }
      }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    // Calculate statistics
    const borrowCount = profile.borrowings.length;
    const totalFineAmount = Number(profile.totalFineAmount);

    const profileData = {
      id: profile.id,
      name: profile.name,
      email: profile.authUser.email,
      phone: profile.phone,
      address: profile.address,
      role: profile.role,
      joinDate: profile.authUser.createdAt,
      borrowCount,
      totalFineAmount
    };

    res.json({
      success: true,
      data: profileData
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin hồ sơ'
    });
  }
};

/**
 * Update user profile
 * PUT /api/profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, address } = req.body;

    // Update profile
    const updateData = {
      name
    };
    
    if (phone !== undefined && phone !== null && phone !== '') {
      updateData.phone = phone;
    } else {
      updateData.phone = null;
    }
    
    if (address !== undefined && address !== null && address !== '') {
      updateData.address = address;
    } else {
      updateData.address = null;
    }

    const updatedProfile = await prisma.profile.update({
      where: { id: userId },
      data: updateData,
      include: {
        authUser: {
          select: {
            email: true,
            createdAt: true
          }
        }
      }
    });

    // Get statistics
    const borrowings = await prisma.borrowing.findMany({
      where: { userId },
      select: { id: true }
    });

    const borrowCount = borrowings.length;
    const totalFineAmount = Number(updatedProfile.totalFineAmount);

    const profileData = {
      id: updatedProfile.id,
      name: updatedProfile.name,
      email: updatedProfile.authUser.email,
      phone: updatedProfile.phone,
      address: updatedProfile.address,
      role: updatedProfile.role,
      joinDate: updatedProfile.authUser.createdAt,
      borrowCount,
      totalFineAmount
    };

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: profileData
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật thông tin'
    });
  }
};

/**
 * Change password
 * PUT /api/profile/change-password
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Get auth user email
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      include: {
        authUser: {
          select: {
            email: true
          }
        }
      }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: profile.authUser.email,
      password: currentPassword
    });

    if (signInError) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng',
        errors: [{ field: 'currentPassword', message: 'Mật khẩu hiện tại không đúng' }]
      });
    }

    // Update password using Supabase Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        password: newPassword
      }
    );

    if (updateError) {
      console.error('Update password error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi đổi mật khẩu'
      });
    }

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đổi mật khẩu'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword
};

