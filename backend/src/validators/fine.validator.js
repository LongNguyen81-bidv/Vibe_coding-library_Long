const Joi = require('joi');

const payFineSchema = Joi.object({
  paymentProof: Joi.string()
    .required()
    .min(1)
    .max(1000)
    .messages({
      'string.empty': 'Vui lòng cung cấp thông tin thanh toán',
      'any.required': 'Vui lòng cung cấp thông tin thanh toán',
      'string.min': 'Thông tin thanh toán không được để trống',
      'string.max': 'Thông tin thanh toán không được vượt quá 1000 ký tự'
    })
});

const rejectPaymentSchema = Joi.object({
  rejectionReason: Joi.string()
    .required()
    .min(1)
    .max(500)
    .messages({
      'string.empty': 'Vui lòng nhập lý do từ chối',
      'any.required': 'Vui lòng nhập lý do từ chối',
      'string.min': 'Lý do từ chối không được để trống',
      'string.max': 'Lý do từ chối không được vượt quá 500 ký tự'
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
  payFineSchema,
  rejectPaymentSchema,
  validate
};

