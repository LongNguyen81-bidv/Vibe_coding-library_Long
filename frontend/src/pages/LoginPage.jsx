import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { 
  HiOutlineMail, 
  HiOutlineLockClosed, 
  HiOutlineEye, 
  HiOutlineEyeOff,
  HiOutlineArrowRight,
  HiOutlineCheckCircle
} from 'react-icons/hi'
import { useAuth } from '../contexts/AuthContext'

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    mode: 'onChange'
  })

  // Show message from registration
  useEffect(() => {
    if (location.state?.message) {
      toast.success(location.state.message, {
        duration: 5000,
        icon: '🎉'
      })
      // Clear the message from state
      window.history.replaceState({}, document.title)
    }
  }, [location])

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      // TODO: Implement login API when backend is ready
      // const response = await authAPI.login(data)
      // login(response.data.user, response.data.token)
      
      // Temporary: Show message that login is not implemented yet
      toast.error('Chức năng đăng nhập đang được phát triển')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đăng nhập thất bại')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Success Message from Registration */}
      {location.state?.message && (
        <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-100 animate-scale-in">
          <div className="flex items-center gap-3">
            <HiOutlineCheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
            <p className="text-green-700 text-sm">{location.state.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
          Chào mừng trở lại
        </h1>
        <p className="text-gray-600">
          Đăng nhập để tiếp tục khám phá thư viện
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
          </div>
          {errors.email && (
            <p className="error-message">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="label mb-0">
              Mật khẩu
            </label>
            <Link 
              to="/forgot-password" 
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Quên mật khẩu?
            </Link>
          </div>
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
        </div>

        {/* Remember Me */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="remember"
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            {...register('remember')}
          />
          <label htmlFor="remember" className="text-sm text-gray-600">
            Ghi nhớ đăng nhập
          </label>
        </div>

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
              Đăng nhập
              <HiOutlineArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {/* Register Link */}
      <div className="mt-8 text-center">
        <p className="text-gray-600">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
            Đăng ký ngay
          </Link>
        </p>
      </div>

      {/* Demo Account Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <h4 className="font-medium text-gray-900 mb-3">Tài khoản demo:</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center justify-between p-2 bg-white rounded-lg">
            <span>Reader:</span>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">reader@demo.com</code>
          </div>
          <div className="flex items-center justify-between p-2 bg-white rounded-lg">
            <span>Librarian:</span>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">librarian@demo.com</code>
          </div>
          <div className="flex items-center justify-between p-2 bg-white rounded-lg">
            <span>Admin:</span>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">admin@demo.com</code>
          </div>
          <p className="text-xs text-gray-500 mt-2">Password: 12345678</p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage


