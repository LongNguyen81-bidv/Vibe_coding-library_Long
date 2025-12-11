const Joi = require('joi');

const createCategorySchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Tên thể loại không được để trống',
      'string.min': 'Tên thể loại không được để trống',
      'string.max': 'Tên thể loại không được vượt quá 50 ký tự',
      'any.required': 'Tên thể loại không được để trống'
    })
});

const updateCategorySchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Tên thể loại không được để trống',
      'string.min': 'Tên thể loại không được để trống',
      'string.max': 'Tên thể loại không được vượt quá 50 ký tự',
      'any.required': 'Tên thể loại không được để trống'
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
  createCategorySchema,
  updateCategorySchema,
  validate
};

