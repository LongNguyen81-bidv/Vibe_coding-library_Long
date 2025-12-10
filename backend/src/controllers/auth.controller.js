const { supabaseAdmin } = require('../config/supabase');

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
  register,
  checkEmail
};

