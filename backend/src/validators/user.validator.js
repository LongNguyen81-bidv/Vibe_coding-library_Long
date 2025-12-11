const Joi = require('joi');

const rejectUserSchema = Joi.object({
  rejectionReason: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Lý do từ chối không được để trống',
      'string.min': 'Lý do từ chối không được để trống',
      'any.required': 'Lý do từ chối không được để trống'
    })
});

const assignRoleSchema = Joi.object({
  role: Joi.string()
    .valid('reader', 'librarian', 'admin')
    .required()
    .messages({
      'any.only': 'Vai trò không hợp lệ. Vai trò phải là reader, librarian hoặc admin',
      'any.required': 'Vai trò không được để trống'
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
  rejectUserSchema,
  assignRoleSchema,
  validate
};

