const Joi = require('joi');

const createFineLevelSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(25)
    .required()
    .messages({
      'string.empty': 'Tên mức phạt không được để trống',
      'string.min': 'Tên mức phạt không được để trống',
      'string.max': 'Tên không được vượt quá 25 ký tự',
      'any.required': 'Tên mức phạt không được để trống'
    }),
  amount: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'Số tiền phạt phải là số',
      'number.positive': 'Số tiền phạt phải lớn hơn 0',
      'any.required': 'Số tiền phạt không được để trống'
    }),
  description: Joi.string()
    .allow('', null)
    .optional()
});

const updateFineLevelSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(25)
    .optional()
    .messages({
      'string.empty': 'Tên mức phạt không được để trống',
      'string.min': 'Tên mức phạt không được để trống',
      'string.max': 'Tên không được vượt quá 25 ký tự'
    }),
  amount: Joi.number()
    .positive()
    .optional()
    .messages({
      'number.base': 'Số tiền phạt phải là số',
      'number.positive': 'Số tiền phạt phải lớn hơn 0'
    }),
  description: Joi.string()
    .allow('', null)
    .optional()
}).min(1).messages({
  'object.min': 'Phải có ít nhất một trường để cập nhật'
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
  createFineLevelSchema,
  updateFineLevelSchema,
  validate
};

