import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { booksAPI, categoriesAPI } from '../services/api'
import { 
  HiOutlineArrowLeft,
  HiOutlineBookOpen
} from 'react-icons/hi'

const AddBookPage = () => {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    reset
  } = useForm({
    mode: 'onChange'
  })

  const watchISBN = watch('isbn')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true)
      const response = await categoriesAPI.getAll()
      if (response.data.success) {
        setCategories(response.data.data)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể tải danh sách thể loại'
      toast.error(errorMessage)
    } finally {
      setLoadingCategories(false)
    }
  }

  // Validate ISBN format
  const validateISBN = (isbn) => {
    if (!isbn || isbn.trim() === '') {
      return true // ISBN is optional
    }

    const cleanedISBN = isbn.replace(/[-\s]/g, '')

    // Check ISBN-10 format (10 digits)
    if (/^\d{10}$/.test(cleanedISBN)) {
      return true
    }

    // Check ISBN-13 format (13 digits, starting with 978 or 979)
    if (/^(978|979)\d{10}$/.test(cleanedISBN)) {
      return true
    }

    // Check formatted ISBN-10: X-XXX-XXXXX-X
    if (/^\d{1}-\d{3}-\d{5}-\d{1}$/.test(isbn)) {
      return true
    }

    // Check formatted ISBN-13: XXX-X-XXX-XXXXX-X
    if (/^\d{3}-\d{1}-\d{3}-\d{5}-\d{1}$/.test(isbn)) {
      return true
    }

    return false
  }

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true)

      // Validate ISBN format
      if (data.isbn && data.isbn.trim() !== '' && !validateISBN(data.isbn)) {
        setError('isbn', { message: 'ISBN không đúng định dạng' })
        toast.error('ISBN không đúng định dạng')
        return
      }

      // Prepare data
      const bookData = {
        name: data.name.trim(),
        author: data.author.trim(),
        publishYear: parseInt(data.publishYear),
        isbn: data.isbn && data.isbn.trim() !== '' ? data.isbn.trim() : null,
        categoryId: data.categoryId,
        description: data.description.trim(),
        totalQuantity: parseInt(data.totalQuantity)
      }

      const response = await booksAPI.create(bookData)
      
      if (response.data.success) {
        toast.success(response.data.message || 'Thêm sách thành công!')
        
        // Ask if user wants to continue adding
        const continueAdding = window.confirm('Thêm sách thành công! Bạn có muốn tiếp tục thêm sách khác không?')
        
        if (continueAdding) {
          // Reset form
          reset({
            name: '',
            author: '',
            publishYear: '',
            isbn: '',
            categoryId: '',
            description: '',
            totalQuantity: ''
          })
        } else {
          // Navigate to books list (or home for now)
          navigate('/')
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Thêm sách thất bại'
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

  const currentYear = new Date().getFullYear()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <HiOutlineArrowLeft className="w-5 h-5" />
          <span>Quay lại</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-100 rounded-lg">
            <HiOutlineBookOpen className="w-8 h-8 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Thêm Sách Mới</h1>
            <p className="text-gray-600 mt-1">Thêm sách mới vào kho thư viện</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Tên sách */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Tên sách <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name', {
                required: 'Tên sách không được để trống',
                maxLength: {
                  value: 100,
                  message: 'Tên sách không được vượt quá 100 ký tự'
                }
              })}
              type="text"
              id="name"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nhập tên sách"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Tác giả */}
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
              Tác giả <span className="text-red-500">*</span>
            </label>
            <input
              {...register('author', {
                required: 'Tác giả không được để trống',
                maxLength: {
                  value: 100,
                  message: 'Tác giả không được vượt quá 100 ký tự'
                }
              })}
              type="text"
              id="author"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.author ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nhập tên tác giả"
            />
            {errors.author && (
              <p className="mt-1 text-sm text-red-600">{errors.author.message}</p>
            )}
          </div>

          {/* Năm xuất bản và ISBN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="publishYear" className="block text-sm font-medium text-gray-700 mb-1">
                Năm xuất bản <span className="text-red-500">*</span>
              </label>
              <input
                {...register('publishYear', {
                  required: 'Năm xuất bản không được để trống',
                  min: {
                    value: 1900,
                    message: 'Năm xuất bản không hợp lệ'
                  },
                  max: {
                    value: currentYear,
                    message: 'Năm xuất bản không thể ở tương lai'
                  },
                  valueAsNumber: true
                })}
                type="number"
                id="publishYear"
                min="1900"
                max={currentYear}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.publishYear ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nhập năm xuất bản"
              />
              {errors.publishYear && (
                <p className="mt-1 text-sm text-red-600">{errors.publishYear.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="isbn" className="block text-sm font-medium text-gray-700 mb-1">
                ISBN <span className="text-gray-500 text-xs">(Tùy chọn)</span>
              </label>
              <input
                {...register('isbn', {
                  maxLength: {
                    value: 17,
                    message: 'ISBN không được vượt quá 17 ký tự'
                  },
                  validate: (value) => {
                    if (!value || value.trim() === '') return true
                    return validateISBN(value) || 'ISBN không đúng định dạng'
                  }
                })}
                type="text"
                id="isbn"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.isbn ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="ISBN-10 hoặc ISBN-13"
              />
              {errors.isbn && (
                <p className="mt-1 text-sm text-red-600">{errors.isbn.message}</p>
              )}
              {watchISBN && watchISBN.trim() !== '' && !errors.isbn && (
                <p className="mt-1 text-xs text-gray-500">
                  Định dạng: X-XXX-XXXXX-X hoặc XXXXXXXXXX (ISBN-10) hoặc XXX-X-XXX-XXXXX-X (ISBN-13)
                </p>
              )}
            </div>
          </div>

          {/* Thể loại */}
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
              Thể loại <span className="text-red-500">*</span>
            </label>
            {loadingCategories ? (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                <span>Đang tải danh sách thể loại...</span>
              </div>
            ) : (
              <>
                <select
                  {...register('categoryId', {
                    required: 'Vui lòng chọn thể loại sách'
                  })}
                  id="categoryId"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.categoryId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">-- Chọn thể loại --</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
                )}
                {categories.length === 0 && (
                  <p className="mt-1 text-sm text-yellow-600">
                    Chưa có thể loại nào. Vui lòng thêm thể loại trước.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Mô tả */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('description', {
                required: 'Mô tả không được để trống',
                maxLength: {
                  value: 255,
                  message: 'Mô tả không được vượt quá 255 ký tự'
                }
              })}
              id="description"
              rows="4"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nhập mô tả về nội dung sách"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Số lượng */}
          <div>
            <label htmlFor="totalQuantity" className="block text-sm font-medium text-gray-700 mb-1">
              Số lượng bản sách <span className="text-red-500">*</span>
            </label>
            <input
              {...register('totalQuantity', {
                required: 'Số lượng không được để trống',
                min: {
                  value: 1,
                  message: 'Số lượng phải lớn hơn 0'
                },
                valueAsNumber: true
              })}
              type="number"
              id="totalQuantity"
              min="1"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.totalQuantity ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nhập số lượng bản sách"
            />
            {errors.totalQuantity && (
              <p className="mt-1 text-sm text-red-600">{errors.totalQuantity.message}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || loadingCategories || categories.length === 0}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? 'Đang thêm...' : 'Thêm sách'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddBookPage

