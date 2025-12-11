import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { categoriesAPI } from '../services/api'
import { 
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineX,
  HiOutlineCheck
} from 'react-icons/hi'

const CategoryManagementPage = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
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
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await categoriesAPI.getAll()
      if (response.data.success) {
        setCategories(response.data.data)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể tải danh sách thể loại'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const onSubmitAdd = async (data) => {
    try {
      setIsSubmitting(true)
      const response = await categoriesAPI.create(data)
      if (response.data.success) {
        toast.success(response.data.message || 'Thêm thể loại thành công!')
        reset()
        setShowAddForm(false)
        fetchCategories()
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Thêm thể loại thất bại'
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

  const startEdit = (category) => {
    setEditingId(category.id)
    setEditingName(category.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  const saveEdit = async (id) => {
    const name = editingName.trim()
    
    if (!name) {
      toast.error('Tên thể loại không được để trống')
      return
    }

    if (name.length > 50) {
      toast.error('Tên thể loại không được vượt quá 50 ký tự')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await categoriesAPI.update(id, { name })
      if (response.data.success) {
        toast.success(response.data.message || 'Cập nhật thành công!')
        setEditingId(null)
        setEditingName('')
        fetchCategories()
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Cập nhật thể loại thất bại'
      const errors = error.response?.data?.errors || []
      
      if (errors.length > 0) {
        const nameError = errors.find(err => err.field === 'name')
        if (nameError) {
          toast.error(nameError.message)
        } else {
          toast.error(errorMessage)
        }
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
      const response = await categoriesAPI.delete(deleteConfirmId)
      if (response.data.success) {
        toast.success(response.data.message || 'Xóa thể loại thành công!')
        setDeleteConfirmId(null)
        fetchCategories()
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Xóa thể loại thất bại'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e, id) => {
    if (e.key === 'Enter') {
      saveEdit(id)
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý thể loại sách</h1>
        <p className="text-gray-600">Quản lý danh mục thể loại sách trong hệ thống</p>
      </div>

      {/* Add Category Form */}
      <div className="mb-6">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <HiOutlinePlus className="w-5 h-5" />
            <span>Thêm thể loại sách</span>
          </button>
        ) : (
          <form onSubmit={handleSubmit(onSubmitAdd)} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Tên thể loại
                </label>
                <input
                  {...register('name', {
                    required: 'Tên thể loại không được để trống',
                    maxLength: {
                      value: 50,
                      message: 'Tên thể loại không được vượt quá 50 ký tự'
                    }
                  })}
                  type="text"
                  id="name"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nhập tên thể loại"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
              <div className="flex gap-2 items-end">
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
            </div>
          </form>
        )}
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên thể loại
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                    Chưa có thể loại nào. Hãy thêm thể loại mới.
                  </td>
                </tr>
              ) : (
                categories.map((category, index) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === category.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => handleKeyPress(e, category.id)}
                            className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                            autoFocus
                          />
                          <button
                            onClick={() => saveEdit(category.id)}
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
                        <div
                          className="text-sm text-gray-900 cursor-pointer hover:text-primary-600"
                          onClick={() => startEdit(category)}
                          title="Click để sửa"
                        >
                          {category.name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingId !== category.id && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(category)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                            title="Sửa"
                          >
                            <HiOutlinePencil className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(category.id)}
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
              Xác nhận xóa thể loại
            </h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc muốn xóa thể loại này? Hành động này không thể hoàn tác.
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

export default CategoryManagementPage

