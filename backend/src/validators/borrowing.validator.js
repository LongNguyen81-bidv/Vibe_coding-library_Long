const Joi = require('joi');

const createBorrowingSchema = Joi.object({
  bookId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'ID sách không hợp lệ',
      'any.required': 'ID sách không được để trống'
    }),
  
  borrowDays: Joi.number()
    .integer()
    .min(7)
    .max(30)
    .default(14)
    .messages({
      'number.base': 'Thời hạn mượn phải là số',
      'number.integer': 'Thời hạn mượn phải là số nguyên',
      'number.min': 'Thời hạn mượn tối thiểu là 7 ngày',
      'number.max': 'Thời hạn mượn tối đa là 30 ngày'
    })
});

const rejectBorrowingSchema = Joi.object({
  rejectionReason: Joi.string()
    .required()
    .max(500)
    .messages({
      'string.empty': 'Vui lòng nhập lý do từ chối',
      'any.required': 'Vui lòng nhập lý do từ chối',
      'string.max': 'Lý do không được vượt quá 500 ký tự'
    })
});

const confirmReturnSchema = Joi.object({
  bookCondition: Joi.string()
    .valid('normal', 'damaged', 'lost')
    .required()
    .messages({
      'any.only': 'Tình trạng sách phải là: bình thường, hư hỏng hoặc mất',
      'any.required': 'Vui lòng chọn tình trạng sách'
    }),
  
  fineLevelId: Joi.string()
    .uuid()
    .allow(null, '')
    .messages({
      'string.guid': 'ID mức phạt không hợp lệ'
    }),
  
  lateFineLevelId: Joi.string()
    .uuid()
    .allow(null, '')
    .messages({
      'string.guid': 'ID mức phạt trả muộn không hợp lệ'
    }),
  
  note: Joi.string()
    .max(500)
    .allow(null, '')
    .messages({
      'string.max': 'Ghi chú không được vượt quá 500 ký tự'
    })
}).custom((value, helpers) => {
  // Custom validation: note is required for damaged/lost
  if ((value.bookCondition === 'damaged' || value.bookCondition === 'lost') && (!value.note || value.note.trim().length === 0)) {
    return helpers.error('any.custom', { message: 'Vui lòng nhập ghi chú khi sách hư hỏng hoặc mất' });
  }
  return value;
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
  createBorrowingSchema,
  rejectBorrowingSchema,
  confirmReturnSchema,
  validate
};

