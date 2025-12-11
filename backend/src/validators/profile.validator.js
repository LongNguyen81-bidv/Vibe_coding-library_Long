const Joi = require('joi');

const updateProfileSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Tên không được để trống',
      'string.min': 'Tên không được để trống',
      'string.max': 'Tên không được vượt quá 50 ký tự',
      'any.required': 'Tên không được để trống'
    }),
  
  phone: Joi.string()
    .pattern(/^[0-9]{10,11}$/)
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Số điện thoại không hợp lệ'
    }),
  
  address: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Địa chỉ không được để trống',
      'string.min': 'Địa chỉ không được để trống',
      'string.max': 'Địa chỉ không được vượt quá 255 ký tự',
      'any.required': 'Địa chỉ không được để trống'
    })
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'string.empty': 'Mật khẩu hiện tại không được để trống',
      'any.required': 'Mật khẩu hiện tại không được để trống'
    }),
  
  newPassword: Joi.string()
    .min(8)
    .max(16)
    .required()
    .messages({
      'string.empty': 'Mật khẩu mới không được để trống',
      'string.min': 'Mật khẩu mới phải có ít nhất 8 ký tự',
      'string.max': 'Mật khẩu mới không được vượt quá 16 ký tự',
      'any.required': 'Mật khẩu mới không được để trống'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Mật khẩu xác nhận không khớp',
      'string.empty': 'Mật khẩu xác nhận không được để trống',
      'any.required': 'Mật khẩu xác nhận không được để trống'
    })
});

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors
      });
    }
    
    next();
  };
};

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
  validate
};

