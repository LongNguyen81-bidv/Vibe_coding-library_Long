import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { fineLevelsAPI } from '../services/api'
import { 
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineCheck
} from 'react-icons/hi'

const FineLevelManagementPage = () => {
  const [fineLevels, setFineLevels] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editingData, setEditingData] = useState({ name: '', amount: '', description: '' })
  const [showAddForm, setShowAddForm] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError
  } = useForm({
    mode: 'onChange'
  })

  useEffect(() => {
    fetchFineLevels()
  }, [])

  const fetchFineLevels = async () => {
    try {
      setLoading(true)
      const response = await fineLevelsAPI.getAll()
      if (response.data.success) {
        setFineLevels(response.data.data)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể tải danh sách mức phạt'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const onSubmitAdd = async (data) => {
    try {
      setIsSubmitting(true)
      const response = await fineLevelsAPI.create(data)
      if (response.data.success) {
        toast.success(response.data.message || 'Thêm mức phạt thành công!')
        reset()
        setShowAddForm(false)
        fetchFineLevels()
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Thêm mức phạt thất bại'
      const errors = error.response?.data?.errors || []
      
      if (errors.length > 0) {
        errors.forEach(err => {
          setError(err.field, { message: err.message })
        })
        toast.error(errorMessage)
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEdit = (fineLevel) => {
    setEditingId(fineLevel.id)
    setEditingData({
      name: fineLevel.name,
      amount: fineLevel.amount.toString(),
      description: fineLevel.description || ''
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingData({ name: '', amount: '', description: '' })
  }

  const saveEdit = async (id) => {
    const name = editingData.name.trim()
    const amount = editingData.amount.trim()
    const description = editingData.description.trim()
    
    // Validation
    if (!name) {
      toast.error('Tên mức phạt không được để trống')
      return
    }

    if (name.length > 25) {
      toast.error('Tên không được vượt quá 25 ký tự')
      return
    }

    if (!amount) {
      toast.error('Số tiền phạt không được để trống')
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Số tiền phạt phải lớn hơn 0')
      return
    }

    try {
      setIsSubmitting(true)
      const updateData = {
        name,
        amount: amountNum,
        description: description || null
      }
      const response = await fineLevelsAPI.update(id, updateData)
      if (response.data.success) {
        toast.success(response.data.message || 'Cập nhật thành công!')
        setEditingId(null)
        setEditingData({ name: '', amount: '', description: '' })
        fetchFineLevels()
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Cập nhật mức phạt thất bại'
      const errors = error.response?.data?.errors || []
      
      if (errors.length > 0) {
        const firstError = errors[0]
        toast.error(firstError.message || errorMessage)
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirmId) return

    try {
      setIsSubmitting(true)
      const response = await fineLevelsAPI.delete(deleteConfirmId)
      if (response.data.success) {
        toast.success(response.data.message || 'Xóa mức phạt thành công!')
        setDeleteConfirmId(null)
        fetchFineLevels()
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Xóa mức phạt thất bại'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e, id, field) => {
    if (e.key === 'Enter') {
      // Save when Enter is pressed
      saveEdit(id)
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý mức phạt</h1>
        <p className="text-gray-600">Quản lý các mức phạt áp dụng trong hệ thống</p>
      </div>

      {/* Add Fine Level Form */}
      <div className="mb-6">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <HiOutlinePlus className="w-5 h-5" />
            <span>Thêm mức phạt</span>
          </button>
        ) : (
          <form onSubmit={handleSubmit(onSubmitAdd)} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Tên mức phạt <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('name', {
                    required: 'Tên mức phạt không được để trống',
                    maxLength: {
                      value: 25,
                      message: 'Tên không được vượt quá 25 ký tự'
                    }
                  })}
                  type="text"
                  id="name"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ví dụ: Trả muộn 1-7 ngày"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Số tiền (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('amount', {
                    required: 'Số tiền phạt không được để trống',
                    min: {
                      value: 0.01,
                      message: 'Số tiền phạt phải lớn hơn 0'
                    },
                    valueAsNumber: true
                  })}
                  type="number"
                  id="amount"
                  step="0.01"
                  min="0.01"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="10000"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <input
                  {...register('description')}
                  type="text"
                  id="description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Mô tả chi tiết (tùy chọn)"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Lưu
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  reset()
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Hủy
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Fine Levels Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên mức phạt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mô tả
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fineLevels.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    Chưa có mức phạt nào. Hãy thêm mức phạt mới.
                  </td>
                </tr>
              ) : (
                fineLevels.map((fineLevel, index) => (
                  <tr key={fineLevel.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === fineLevel.id ? (
                        <input
                          type="text"
                          value={editingData.name}
                          onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                          onKeyDown={(e) => handleKeyPress(e, fineLevel.id, 'name')}
                          className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                          maxLength={25}
                          autoFocus
                        />
                      ) : (
                        <div
                          className="text-sm text-gray-900 cursor-pointer hover:text-primary-600"
                          onClick={() => startEdit(fineLevel)}
                          title="Click để sửa"
                        >
                          {fineLevel.name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === fineLevel.id ? (
                        <input
                          type="number"
                          value={editingData.amount}
                          onChange={(e) => setEditingData({ ...editingData, amount: e.target.value })}
                          onKeyDown={(e) => handleKeyPress(e, fineLevel.id, 'amount')}
                          className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                          step="0.01"
                          min="0.01"
                        />
                      ) : (
                        <div
                          className="text-sm text-gray-900 cursor-pointer hover:text-primary-600"
                          onClick={() => startEdit(fineLevel)}
                          title="Click để sửa"
                        >
                          {formatCurrency(Number(fineLevel.amount))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === fineLevel.id ? (
                        <input
                          type="text"
                          value={editingData.description}
                          onChange={(e) => setEditingData({ ...editingData, description: e.target.value })}
                          onKeyDown={(e) => handleKeyPress(e, fineLevel.id, 'description')}
                          className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      ) : (
                        <div
                          className="text-sm text-gray-600 cursor-pointer hover:text-primary-600"
                          onClick={() => startEdit(fineLevel)}
                          title="Click để sửa"
                        >
                          {fineLevel.description || '-'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(fineLevel.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingId === fineLevel.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => saveEdit(fineLevel.id)}
                            disabled={isSubmitting}
                            className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                            title="Lưu"
                          >
                            <HiOutlineCheck className="w-5 h-5" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={isSubmitting}
                            className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50"
                            title="Hủy"
                          >
                            <HiOutlineX className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(fineLevel)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                            title="Sửa"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(fineLevel.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Xóa"
                          >
                            <HiOutlineTrash className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Xác nhận xóa mức phạt
            </h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc muốn xóa mức phạt này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FineLevelManagementPage

