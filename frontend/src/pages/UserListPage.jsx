import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { userAPI } from '../services/api'
import { 
  HiOutlineSearch,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineXCircle,
  HiOutlineBan,
  HiOutlineCheckCircle,
  HiOutlineUserGroup
} from 'react-icons/hi'
import dayjs from 'dayjs'

const UserListPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [disableConfirmId, setDisableConfirmId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [roleAssignModal, setRoleAssignModal] = useState(null)
  const [newRole, setNewRole] = useState('')
  const [userRoleStates, setUserRoleStates] = useState({})
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    fetchUsers()
  }, [selectedRole, pagination.page])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.page,
        limit: pagination.limit
      }
      
      if (selectedRole !== 'all') {
        params.role = selectedRole
      }
      
      if (searchKeyword.trim()) {
        params.keyword = searchKeyword.trim()
      }

      const response = await userAPI.getAll(params)
      if (response.data.success) {
        setUsers(response.data.data)
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages
        }))
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể tải danh sách người dùng'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchUsers()
  }

  const handleRoleFilter = (role) => {
    setSelectedRole(role)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleActivate = async (userId) => {
    try {
      setIsSubmitting(true)
      const response = await userAPI.activate(userId)
      if (response.data.success) {
        toast.success(response.data.message || 'Kích hoạt thành công!')
        fetchUsers()
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Kích hoạt thất bại'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDisable = async () => {
    if (!disableConfirmId) return

    try {
      setIsSubmitting(true)
      const response = await userAPI.disable(disableConfirmId)
      if (response.data.success) {
        toast.success(response.data.message || 'Vô hiệu hóa thành công!')
        setDisableConfirmId(null)
        fetchUsers()
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Vô hiệu hóa thất bại'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = async (userId) => {
    try {
      setIsSubmitting(true)
      const response = await userAPI.approve(userId)
      if (response.data.success) {
        toast.success(response.data.message || 'Xác nhận thành công!')
        fetchUsers()
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Xác nhận thất bại'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!rejectModal) return

    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await userAPI.reject(rejectModal, { rejectionReason: rejectReason.trim() })
      if (response.data.success) {
        toast.success(response.data.message || 'Từ chối thành công!')
        setRejectModal(null)
        setRejectReason('')
        fetchUsers()
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Từ chối thất bại'
      const errors = error.response?.data?.errors || []
      
      if (errors.length > 0) {
        errors.forEach(err => {
          if (err.field === 'rejectionReason') {
            toast.error(err.message)
          }
        })
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRoleChange = (userId, currentRole, newRoleValue) => {
    // Update dropdown display immediately
    setUserRoleStates(prev => ({ ...prev, [userId]: newRoleValue }))

    // If same role, do nothing
    if (currentRole === newRoleValue) {
      return
    }

    // Set modal state
    setRoleAssignModal({ userId, currentRole, newRole: newRoleValue })
    setNewRole(newRoleValue)
  }

  const handleAssignRole = async () => {
    if (!roleAssignModal) return

    try {
      setIsSubmitting(true)
      const response = await userAPI.assignRole(roleAssignModal.userId, { role: newRole })
      if (response.data.success) {
        toast.success(response.data.message || 'Thay đổi vai trò thành công!')
        setRoleAssignModal(null)
        setNewRole('')
        setUserRoleStates({})
        fetchUsers()
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Thay đổi vai trò thất bại'
      toast.error(errorMessage)
      // Reset dropdown to original value on error
      if (roleAssignModal) {
        setUserRoleStates(prev => ({ ...prev, [roleAssignModal.userId]: roleAssignModal.currentRole }))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRoleChangeMessage = () => {
    if (!roleAssignModal) return ''

    const { currentRole, newRole: targetRole } = roleAssignModal
    const roleLabels = {
      reader: 'Độc giả',
      librarian: 'Nhân viên',
      admin: 'Quản lý viên'
    }

    // If promoting to Admin
    if (targetRole === 'admin' && currentRole !== 'admin') {
      return `Nâng cấp lên Admin sẽ cho phép toàn quyền quản lý hệ thống.`
    }

    // If demoting from Admin
    if (currentRole === 'admin' && targetRole !== 'admin') {
      return `Hạ cấp từ Admin sẽ thu hồi quyền quản lý hệ thống.`
    }

    // Normal role change
    return `Bạn có chắc muốn thay đổi vai trò từ ${roleLabels[currentRole]} thành ${roleLabels[targetRole]}?`
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800' },
      active: { label: 'Đã kích hoạt', color: 'bg-green-100 text-green-800' },
      disabled: { label: 'Vô hiệu hóa', color: 'bg-red-100 text-red-800' },
      rejected: { label: 'Bị từ chối', color: 'bg-gray-100 text-gray-800' }
    }

    const config = statusConfig[status] || statusConfig.pending
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getRoleBadge = (role) => {
    const roleConfig = {
      reader: { label: 'Độc giả', color: 'bg-blue-100 text-blue-800' },
      librarian: { label: 'Nhân viên', color: 'bg-purple-100 text-purple-800' },
      admin: { label: 'Quản lý viên', color: 'bg-orange-100 text-orange-800' }
    }

    const config = roleConfig[role] || roleConfig.reader
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <HiOutlineUserGroup className="w-8 h-8 text-primary-600" />
          Quản lý người dùng
        </h1>
        <p className="text-gray-600">Quản lý danh sách người dùng trong hệ thống</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Tìm kiếm theo email hoặc tên..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              {searchKeyword && (
                <button
                  onClick={() => {
                    setSearchKeyword('')
                    setPagination(prev => ({ ...prev, page: 1 }))
                    setTimeout(fetchUsers, 100)
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <HiOutlineX className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Role Filter */}
          <div className="md:w-48">
            <select
              value={selectedRole}
              onChange={(e) => handleRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="reader">Độc giả</option>
              <option value="librarian">Nhân viên</option>
              <option value="admin">Quản lý viên</option>
            </select>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vai trò
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tham gia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    {searchKeyword || selectedRole !== 'all' 
                      ? 'Không tìm thấy người dùng phù hợp'
                      : 'Chưa có người dùng nào'}
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(pagination.page - 1) * pagination.limit + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.status === 'active' ? (
                        <select
                          value={userRoleStates[user.id] !== undefined ? userRoleStates[user.id] : user.role}
                          onChange={(e) => handleRoleChange(user.id, user.role, e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                          style={{
                            backgroundColor: (userRoleStates[user.id] !== undefined ? userRoleStates[user.id] : user.role) === 'reader' ? '#dbeafe' : (userRoleStates[user.id] !== undefined ? userRoleStates[user.id] : user.role) === 'librarian' ? '#f3e8ff' : '#fed7aa',
                            color: (userRoleStates[user.id] !== undefined ? userRoleStates[user.id] : user.role) === 'reader' ? '#1e40af' : (userRoleStates[user.id] !== undefined ? userRoleStates[user.id] : user.role) === 'librarian' ? '#6b21a8' : '#9a3412'
                          }}
                        >
                          <option value="reader">Độc giả</option>
                          <option value="librarian">Nhân viên</option>
                          <option value="admin">Quản lý viên</option>
                        </select>
                      ) : (
                        getRoleBadge(user.role)
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dayjs(user.joinDate).format('DD/MM/YYYY')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {user.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(user.id)}
                              disabled={isSubmitting}
                              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                              title="Xác nhận"
                            >
                              <HiOutlineCheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setRejectModal(user.id)}
                              disabled={isSubmitting}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                              title="Từ chối"
                            >
                              <HiOutlineXCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        {user.status === 'active' && (
                          <button
                            onClick={() => setDisableConfirmId(user.id)}
                            disabled={isSubmitting}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                            title="Vô hiệu hóa"
                          >
                            <HiOutlineBan className="w-5 h-5" />
                          </button>
                        )}
                        {user.status === 'disabled' && (
                          <button
                            onClick={() => handleActivate(user.id)}
                            disabled={isSubmitting}
                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                            title="Kích hoạt"
                          >
                            <HiOutlineCheckCircle className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Hiển thị {(pagination.page - 1) * pagination.limit + 1} đến{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số{' '}
              {pagination.total} người dùng
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Disable Confirmation Modal */}
      {disableConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Xác nhận vô hiệu hóa tài khoản
            </h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc muốn vô hiệu hóa tài khoản này? Người dùng sẽ không thể đăng nhập sau khi bị vô hiệu hóa.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDisableConfirmId(null)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDisable}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Vô hiệu hóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Từ chối tài khoản
            </h3>
            <div className="mb-4">
              <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                id="rejectionReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Nhập lý do từ chối..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setRejectModal(null)
                  setRejectReason('')
                }}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                disabled={isSubmitting || !rejectReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {roleAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Xác nhận thay đổi vai trò
            </h3>
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                {getRoleChangeMessage()}
              </p>
              {roleAssignModal.newRole === 'admin' && roleAssignModal.currentRole !== 'admin' && (
                <p className="text-orange-600 text-sm mt-2">
                  ⚠️ Người dùng này sẽ có toàn quyền quản lý hệ thống.
                </p>
              )}
              {roleAssignModal.currentRole === 'admin' && roleAssignModal.newRole !== 'admin' && (
                <p className="text-orange-600 text-sm mt-2">
                  ⚠️ Người dùng này sẽ mất quyền quản lý hệ thống.
                </p>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  // Reset dropdown to original value
                  if (roleAssignModal) {
                    setUserRoleStates(prev => ({ ...prev, [roleAssignModal.userId]: roleAssignModal.currentRole }))
                  }
                  setRoleAssignModal(null)
                  setNewRole('')
                }}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleAssignRole}
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserListPage

