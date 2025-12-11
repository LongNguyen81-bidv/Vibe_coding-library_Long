const { supabaseAdmin, supabase } = require('../config/supabase');
const prisma = require('../config/prisma');
const jwt = require('jsonwebtoken');

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      // Generic error message for security
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác'
      });
    }

    // Get user profile from database
    const profile = await prisma.profile.findUnique({
      where: { id: authData.user.id }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    // Check account status
    if (profile.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản chưa được xác nhận'
      });
    }

    if (profile.status === 'disabled') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa'
      });
    }

    if (profile.status === 'rejected') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị từ chối'
      });
    }

    // Only allow login if status is 'active'
    if (profile.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản không thể đăng nhập'
      });
    }

    // Create JWT token (24 hours expiry)
    const token = jwt.sign(
      {
        userId: profile.id,
        email: authData.user.email,
        name: profile.name,
        role: profile.role
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '24h' }
    );

    // Prepare user data
    const userData = {
      id: profile.id,
      email: authData.user.email,
      name: profile.name,
      role: profile.role,
      phone: profile.phone,
      address: profile.address
    };

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: userData,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.'
    });
  }
};

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { email, name, password } = req.body;

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email since admin will approve
      user_metadata: {
        name
      }
    });

    if (authError) {
      // Check if email already exists
      if (authError.message.includes('already') || authError.message.includes('exists')) {
        return res.status(409).json({
          success: false,
          message: 'Email đã được sử dụng',
          errors: [{ field: 'email', message: 'Email đã được sử dụng' }]
        });
      }
      
      console.error('Auth error:', authError);
      return res.status(400).json({
        success: false,
        message: authError.message
      });
    }

    // The profile is automatically created via the trigger in schema.sql
    // with status 'pending' and role 'reader'
    
    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Vui lòng chờ xác nhận từ quản trị viên.',
      data: {
        id: authData.user.id,
        email: authData.user.email,
        name: name
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.'
    });
  }
};

/**
 * Check if email exists
 * GET /api/auth/check-email/:email
 */
const checkEmail = async (req, res) => {
  try {
    const { email } = req.params;

    // Check in profiles table
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', (
        await supabaseAdmin.auth.admin.listUsers()
      ).data.users.find(u => u.email === email)?.id)
      .single();

    // Also check in auth.users
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = users.users.some(u => u.email === email);

    res.json({
      success: true,
      exists: userExists
    });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi kiểm tra email.'
    });
  }
};

module.exports = {
  login,
  register,
  checkEmail
};

