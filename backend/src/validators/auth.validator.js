const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Email không đúng định dạng',
      'string.empty': 'Email không được để trống',
      'any.required': 'Email không được để trống'
    }),
  
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
  
  password: Joi.string()
    .min(8)
    .max(16)
    .required()
    .messages({
      'string.empty': 'Mật khẩu không được để trống',
      'string.min': 'Mật khẩu phải có ít nhất 8 ký tự',
      'string.max': 'Mật khẩu không được vượt quá 16 ký tự',
      'any.required': 'Mật khẩu không được để trống'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Mật khẩu xác nhận không khớp',
      'string.empty': 'Mật khẩu xác nhận không được để trống',
      'any.required': 'Mật khẩu xác nhận không được để trống'
    })
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Email không đúng định dạng',
      'string.empty': 'Email không được để trống',
      'any.required': 'Email không được để trống'
    }),
  
  password: Joi.string()
    .min(8)
    .max(16)
    .required()
    .messages({
      'string.empty': 'Mật khẩu không được để trống',
      'string.min': 'Mật khẩu phải từ 8-16 ký tự',
      'string.max': 'Mật khẩu phải từ 8-16 ký tự',
      'any.required': 'Mật khẩu không được để trống'
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
  registerSchema,
  loginSchema,
  validate
};

