const Joi = require('joi');

// Helper function to validate ISBN format
const validateISBN = (value, helpers) => {
  if (!value || value.trim() === '') {
    return value; // ISBN is optional
  }

  // Remove hyphens and spaces
  const cleanedISBN = value.replace(/[-\s]/g, '');

  // Check ISBN-10 format (10 digits)
  if (/^\d{10}$/.test(cleanedISBN)) {
    return cleanedISBN;
  }

  // Check ISBN-13 format (13 digits, starting with 978 or 979)
  if (/^(978|979)\d{10}$/.test(cleanedISBN)) {
    return cleanedISBN;
  }

  // Check formatted ISBN-10: X-XXX-XXXXX-X
  if (/^\d{1}-\d{3}-\d{5}-\d{1}$/.test(value)) {
    return value.replace(/[-\s]/g, '');
  }

  // Check formatted ISBN-13: XXX-X-XXX-XXXXX-X
  if (/^\d{3}-\d{1}-\d{3}-\d{5}-\d{1}$/.test(value)) {
    return value.replace(/[-\s]/g, '');
  }

  return helpers.error('string.isbn');
};

const createBookSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Tên sách không được để trống',
      'string.min': 'Tên sách không được để trống',
      'string.max': 'Tên sách không được vượt quá 100 ký tự',
      'any.required': 'Tên sách không được để trống'
    }),
  
  author: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Tác giả không được để trống',
      'string.min': 'Tác giả không được để trống',
      'string.max': 'Tác giả không được vượt quá 100 ký tự',
      'any.required': 'Tác giả không được để trống'
    }),
  
  publishYear: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear())
    .required()
    .messages({
      'number.base': 'Năm xuất bản phải là số',
      'number.integer': 'Năm xuất bản phải là số nguyên',
      'number.min': 'Năm xuất bản không hợp lệ',
      'number.max': 'Năm xuất bản không thể ở tương lai',
      'any.required': 'Năm xuất bản không được để trống'
    }),
  
  isbn: Joi.string()
    .max(17)
    .custom(validateISBN, 'ISBN validation')
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'ISBN không được vượt quá 17 ký tự',
      'string.isbn': 'ISBN không đúng định dạng'
    }),
  
  categoryId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Thể loại không hợp lệ',
      'any.required': 'Vui lòng chọn thể loại sách'
    }),
  
  description: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Mô tả không được để trống',
      'string.min': 'Mô tả không được để trống',
      'string.max': 'Mô tả không được vượt quá 255 ký tự',
      'any.required': 'Mô tả không được để trống'
    }),
  
  totalQuantity: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'Số lượng phải là số',
      'number.integer': 'Số lượng phải là số nguyên',
      'number.min': 'Số lượng phải lớn hơn 0',
      'any.required': 'Số lượng không được để trống'
    })
});

const updateBookSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Tên sách không được để trống',
      'string.min': 'Tên sách không được để trống',
      'string.max': 'Tên sách không được vượt quá 100 ký tự',
      'any.required': 'Tên sách không được để trống'
    }),
  
  author: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Tác giả không được để trống',
      'string.min': 'Tác giả không được để trống',
      'string.max': 'Tác giả không được vượt quá 100 ký tự',
      'any.required': 'Tác giả không được để trống'
    }),
  
  publishYear: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear())
    .required()
    .messages({
      'number.base': 'Năm xuất bản phải là số',
      'number.integer': 'Năm xuất bản phải là số nguyên',
      'number.min': 'Năm xuất bản không hợp lệ',
      'number.max': 'Năm xuất bản không thể ở tương lai',
      'any.required': 'Năm xuất bản không được để trống'
    }),
  
  isbn: Joi.string()
    .max(17)
    .custom(validateISBN, 'ISBN validation')
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'ISBN không được vượt quá 17 ký tự',
      'string.isbn': 'ISBN không đúng định dạng'
    }),
  
  categoryId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Thể loại không hợp lệ',
      'any.required': 'Vui lòng chọn thể loại sách'
    }),
  
  description: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Mô tả không được để trống',
      'string.min': 'Mô tả không được để trống',
      'string.max': 'Mô tả không được vượt quá 255 ký tự',
      'any.required': 'Mô tả không được để trống'
    }),
  
  totalQuantity: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'Số lượng phải là số',
      'number.integer': 'Số lượng phải là số nguyên',
      'number.min': 'Số lượng phải lớn hơn 0',
      'any.required': 'Số lượng không được để trống'
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
  createBookSchema,
  updateBookSchema,
  validate
};

