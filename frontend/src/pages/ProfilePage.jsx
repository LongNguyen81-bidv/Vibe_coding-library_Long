import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { profileAPI } from '../services/api'
import { 
  HiOutlineUser, 
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineCalendar,
  HiOutlineBookOpen,
  HiOutlineCurrencyDollar,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineCheckCircle
} from 'react-icons/hi'
import dayjs from 'dayjs'

const ProfilePage = () => {
  const { user, login } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile
  } = useForm({
    mode: 'onChange'
  })

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch: watchPassword
  } = useForm({
    mode: 'onChange'
  })

  const newPasswordValue = watchPassword('newPassword')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await profileAPI.getProfile()
      if (response.data.success) {
        setProfile(response.data.data)
        resetProfile({
          name: response.data.data.name,
          phone: response.data.data.phone || '',
          address: response.data.data.address || ''
        })
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể tải thông tin hồ sơ'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const onUpdateProfile = async (data) => {
    try {
      setIsUpdating(true)
      const response = await profileAPI.updateProfile(data)
      if (response.data.success) {
        setProfile(response.data.data)
        setIsEditing(false)
        toast.success('Cập nhật thông tin thành công!')
        
        // Update user in context
        login({
          ...user,
          name: response.data.data.name,
          phone: response.data.data.phone,
          address: response.data.data.address
        }, localStorage.getItem('token'))
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Cập nhật thông tin thất bại'
      const errors = error.response?.data?.errors || []
      
      if (errors.length > 0) {
        errors.forEach(err => {
          toast.error(err.message)
        })
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const onChangePassword = async (data) => {
    try {
      setIsChangingPassword(true)
      const response = await profileAPI.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      })
      if (response.data.success) {
        toast.success('Đổi mật khẩu thành công!')
        setShowPasswordForm(false)
        resetPassword()
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Đổi mật khẩu thất bại'
      const errors = error.response?.data?.errors || []
      
      if (errors.length > 0) {
        errors.forEach(err => {
          toast.error(err.message)
        })
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Không thể tải thông tin hồ sơ</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            Hồ sơ cá nhân
          </h1>
          <p className="text-gray-600">
            Quản lý thông tin cá nhân và tài khoản của bạn
          </p>
        </div>
      </div>

      {/* Profile Information Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Thông tin cá nhân</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              Chỉnh sửa
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="label">
                Tên <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="name"
                  className={`input pl-12 ${profileErrors.name ? 'input-error' : ''}`}
                  {...registerProfile('name', {
                    required: 'Tên không được để trống',
                    maxLength: {
                      value: 50,
                      message: 'Tên không được vượt quá 50 ký tự'
                    }
                  })}
                />
              </div>
              {profileErrors.name && (
                <p className="error-message">{profileErrors.name.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="label">
                Số điện thoại
              </label>
              <div className="relative">
                <HiOutlinePhone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  id="phone"
                  placeholder="0123456789"
                  className={`input pl-12 ${profileErrors.phone ? 'input-error' : ''}`}
                  {...registerProfile('phone', {
                    pattern: {
                      value: /^[0-9]{10,11}$/,
                      message: 'Số điện thoại không hợp lệ'
                    }
                  })}
                />
              </div>
              {profileErrors.phone && (
                <p className="error-message">{profileErrors.phone.message}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="label">
                Địa chỉ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <HiOutlineLocationMarker className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="address"
                  placeholder="Nhập địa chỉ"
                  className={`input pl-12 ${profileErrors.address ? 'input-error' : ''}`}
                  {...registerProfile('address', {
                    required: 'Địa chỉ không được để trống',
                    maxLength: {
                      value: 255,
                      message: 'Địa chỉ không được vượt quá 255 ký tự'
                    }
                  })}
                />
              </div>
              {profileErrors.address && (
                <p className="error-message">{profileErrors.address.message}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={isUpdating}
                className="btn-primary px-6 py-2.5"
              >
                {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  resetProfile({
                    name: profile.name,
                    phone: profile.phone || '',
                    address: profile.address || ''
                  })
                }}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Hủy
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Name */}
            <div className="flex items-start gap-4">
              <HiOutlineUser className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Tên</p>
                <p className="text-gray-900 font-medium">{profile.name}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-4">
              <HiOutlineMail className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <p className="text-gray-900 font-medium">{profile.email}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-4">
              <HiOutlinePhone className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Số điện thoại</p>
                <p className="text-gray-900 font-medium">{profile.phone || 'Chưa cập nhật'}</p>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-4">
              <HiOutlineLocationMarker className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Địa chỉ</p>
                <p className="text-gray-900 font-medium">{profile.address || 'Chưa cập nhật'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <HiOutlineCalendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ngày tham gia</p>
              <p className="text-lg font-semibold text-gray-900">
                {dayjs(profile.joinDate).format('DD/MM/YYYY')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <HiOutlineBookOpen className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Số lần mượn</p>
              <p className="text-lg font-semibold text-gray-900">{profile.borrowCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <HiOutlineCurrencyDollar className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng tiền phạt</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Intl.NumberFormat('vi-VN').format(profile.totalFineAmount)} đ
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Đổi mật khẩu</h2>
            <p className="text-sm text-gray-500 mt-1">
              Thay đổi mật khẩu để bảo mật tài khoản của bạn
            </p>
          </div>
          {!showPasswordForm && (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              Đổi mật khẩu
            </button>
          )}
        </div>

        {showPasswordForm && (
          <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-5">
            {/* Current Password */}
            <div>
              <label htmlFor="currentPassword" className="label">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  id="currentPassword"
                  placeholder="••••••••"
                  className={`input pl-12 pr-12 ${passwordErrors.currentPassword ? 'input-error' : ''}`}
                  {...registerPassword('currentPassword', {
                    required: 'Mật khẩu hiện tại không được để trống'
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? (
                    <HiOutlineEyeOff className="w-5 h-5" />
                  ) : (
                    <HiOutlineEye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="error-message">{passwordErrors.currentPassword.message}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="label">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="newPassword"
                  placeholder="••••••••"
                  className={`input pl-12 pr-12 ${passwordErrors.newPassword ? 'input-error' : ''}`}
                  {...registerPassword('newPassword', {
                    required: 'Mật khẩu mới không được để trống',
                    minLength: {
                      value: 8,
                      message: 'Mật khẩu mới phải có ít nhất 8 ký tự'
                    },
                    maxLength: {
                      value: 16,
                      message: 'Mật khẩu mới không được vượt quá 16 ký tự'
                    }
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? (
                    <HiOutlineEyeOff className="w-5 h-5" />
                  ) : (
                    <HiOutlineEye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {passwordErrors.newPassword && (
                <p className="error-message">{passwordErrors.newPassword.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="label">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  placeholder="••••••••"
                  className={`input pl-12 pr-12 ${passwordErrors.confirmPassword ? 'input-error' : ''}`}
                  {...registerPassword('confirmPassword', {
                    required: 'Mật khẩu xác nhận không được để trống',
                    validate: (value) => {
                      return value === newPasswordValue || 'Mật khẩu xác nhận không khớp'
                    }
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <HiOutlineEyeOff className="w-5 h-5" />
                  ) : (
                    <HiOutlineEye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {passwordErrors.confirmPassword && (
                <p className="error-message">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="btn-primary px-6 py-2.5"
              >
                {isChangingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false)
                  resetPassword()
                }}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Hủy
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ProfilePage

