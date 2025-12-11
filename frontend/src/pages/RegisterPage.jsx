import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { 
  HiOutlineMail, 
  HiOutlineUser, 
  HiOutlineLockClosed, 
  HiOutlineEye, 
  HiOutlineEyeOff,
  HiOutlineCheck,
  HiOutlineExclamationCircle
} from 'react-icons/hi'
import { authAPI } from '../services/api'

const RegisterPage = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    mode: 'onChange'
  })

  const password = watch('password')

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const response = await authAPI.register({
        email: data.email,
        name: data.name,
        password: data.password,
        confirmPassword: data.confirmPassword
      })
      
      if (response.data.success) {
        toast.success(response.data.message || 'Đăng ký thành công!')
        navigate('/login', { 
          state: { 
            message: 'Đăng ký thành công! Vui lòng chờ xác nhận từ quản trị viên.' 
          } 
        })
      }
    } catch (error) {
      const errorData = error.response?.data
      if (errorData?.errors) {
        errorData.errors.forEach(err => {
          toast.error(err.message)
        })
      } else {
        toast.error(errorData?.message || 'Đăng ký thất bại. Vui lòng thử lại.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Password strength indicator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { strength: 0, label: '', color: '' }
    let strength = 0
    if (pwd.length >= 8) strength++
    if (pwd.match(/[a-z]/)) strength++
    if (pwd.match(/[A-Z]/)) strength++
    if (pwd.match(/[0-9]/)) strength++
    if (pwd.match(/[^a-zA-Z0-9]/)) strength++
    
    const levels = [
      { strength: 0, label: '', color: '' },
      { strength: 1, label: 'Rất yếu', color: 'bg-red-500' },
      { strength: 2, label: 'Yếu', color: 'bg-orange-500' },
      { strength: 3, label: 'Trung bình', color: 'bg-yellow-500' },
      { strength: 4, label: 'Mạnh', color: 'bg-green-500' },
      { strength: 5, label: 'Rất mạnh', color: 'bg-emerald-500' },
    ]
    
    return levels[strength]
  }

  const passwordStrength = getPasswordStrength(password)

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
          Tạo tài khoản mới
        </h1>
        <p className="text-gray-600">
          Đăng ký để trở thành thành viên của LibraHub
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="label">
            Địa chỉ email
          </label>
          <div className="relative">
            <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              id="email"
              placeholder="example@email.com"
              className={`input pl-12 ${errors.email ? 'input-error' : ''}`}
              {...register('email', {
                required: 'Email không được để trống',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email không đúng định dạng'
                }
              })}
            />
            {errors.email && (
              <HiOutlineExclamationCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
            )}
          </div>
          {errors.email && (
            <p className="error-message">{errors.email.message}</p>
          )}
        </div>

        {/* Name Field */}
        <div>
          <label htmlFor="name" className="label">
            Họ và tên
          </label>
          <div className="relative">
            <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              id="name"
              placeholder="Nguyễn Văn A"
              className={`input pl-12 ${errors.name ? 'input-error' : ''}`}
              {...register('name', {
                required: 'Tên không được để trống',
                maxLength: {
                  value: 50,
                  message: 'Tên không được vượt quá 50 ký tự'
                }
              })}
            />
            {errors.name && (
              <HiOutlineExclamationCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
            )}
          </div>
          {errors.name && (
            <p className="error-message">{errors.name.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="label">
            Mật khẩu
          </label>
          <div className="relative">
            <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              placeholder="••••••••"
              className={`input pl-12 pr-12 ${errors.password ? 'input-error' : ''}`}
              {...register('password', {
                required: 'Mật khẩu không được để trống',
                minLength: {
                  value: 8,
                  message: 'Mật khẩu phải có ít nhất 8 ký tự'
                },
                maxLength: {
                  value: 16,
                  message: 'Mật khẩu không được vượt quá 16 ký tự'
                }
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? (
                <HiOutlineEyeOff className="w-5 h-5" />
              ) : (
                <HiOutlineEye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="error-message">{errors.password.message}</p>
          )}
          
          {/* Password Strength */}
          {password && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${passwordStrength.color} transition-all duration-300`}
                    style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{passwordStrength.label}</span>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="label">
            Xác nhận mật khẩu
          </label>
          <div className="relative">
            <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              placeholder="••••••••"
              className={`input pl-12 pr-12 ${errors.confirmPassword ? 'input-error' : ''}`}
              {...register('confirmPassword', {
                required: 'Mật khẩu xác nhận không được để trống',
                validate: value =>
                  value === password || 'Mật khẩu xác nhận không khớp'
              })}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirmPassword ? (
                <HiOutlineEyeOff className="w-5 h-5" />
              ) : (
                <HiOutlineEye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="error-message">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Terms */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="terms"
            className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            {...register('terms', {
              required: 'Bạn phải đồng ý với điều khoản sử dụng'
            })}
          />
          <label htmlFor="terms" className="text-sm text-gray-600">
            Tôi đồng ý với{' '}
            <Link to="/terms" className="link">
              Điều khoản sử dụng
            </Link>{' '}
            và{' '}
            <Link to="/privacy" className="link">
              Chính sách bảo mật
            </Link>{' '}
            của LibraHub
          </label>
        </div>
        {errors.terms && (
          <p className="error-message -mt-3">{errors.terms.message}</p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full py-3.5"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Đang xử lý...
            </>
          ) : (
            <>
              Đăng ký
              <HiOutlineCheck className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {/* Login Link */}
      <div className="mt-8 text-center">
        <p className="text-gray-600">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
            Đăng nhập ngay
          </Link>
        </p>
      </div>

      {/* Info Box */}
      <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <HiOutlineExclamationCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Lưu ý</h4>
            <p className="text-sm text-blue-700">
              Sau khi đăng ký, tài khoản của bạn cần được quản trị viên phê duyệt 
              trước khi có thể đăng nhập và sử dụng các tính năng của hệ thống.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage



