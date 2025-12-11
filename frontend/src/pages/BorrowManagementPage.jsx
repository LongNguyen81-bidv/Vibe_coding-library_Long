import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { borrowingsAPI } from '../services/api'
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineX,
  HiOutlineClock,
  HiOutlineBookOpen,
  HiOutlineUser,
  HiOutlineArrowLeft
} from 'react-icons/hi'

const BorrowManagementPage = () => {
  const [activeTab, setActiveTab] = useState('borrow') // 'borrow' or 'return'
  const [borrowings, setBorrowings] = useState([])
  const [returnRequests, setReturnRequests] = useState([])
  const [fineLevels, setFineLevels] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmingId, setConfirmingId] = useState(null)
  const [confirmingReturnId, setConfirmingReturnId] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
    watch
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      bookCondition: '',
      fineLevelId: '',
      lateFineLevelId: '',
      note: ''
    }
  })

  const bookCondition = watch('bookCondition')
  const isOverdue = confirmingReturnId ? returnRequests.find(r => r.id === confirmingReturnId)?.isOverdue : false

  useEffect(() => {
    fetchPendingBorrowings()
    fetchFineLevels()
  }, [])

  useEffect(() => {
    if (activeTab === 'return') {
      fetchPendingReturnRequests()
    }
  }, [activeTab])

  const fetchPendingBorrowings = async () => {
    try {
      setLoading(true)
      const response = await borrowingsAPI.getPending()
      if (response.data.success) {
        setBorrowings(response.data.data)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể tải danh sách đơn mượn'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingReturnRequests = async () => {
    try {
      const response = await borrowingsAPI.getPendingReturnRequests()
      if (response.data.success) {
        setReturnRequests(response.data.data)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể tải danh sách yêu cầu trả'
      toast.error(errorMessage)
    }
  }

  const fetchFineLevels = async () => {
    try {
      const response = await borrowingsAPI.getFineLevels()
      if (response.data.success) {
        setFineLevels(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch fine levels:', error)
    }
  }

  const handleConfirmClick = (id) => {
    setConfirmingId(id)
  }

  const handleConfirmSubmit = async () => {
    try {
      setIsSubmitting(true)
      const response = await borrowingsAPI.confirm(confirmingId)
      if (response.data.success) {
        toast.success(response.data.message || 'Xác nhận mượn sách thành công!')
        setConfirmingId(null)
        fetchPendingBorrowings()
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Xác nhận thất bại'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmReturnClick = (id) => {
    setConfirmingReturnId(id)
    reset({
      bookCondition: '',
      fineLevelId: '',
      lateFineLevelId: '',
      note: ''
    })
  }

  const handleConfirmReturnSubmit = async (data) => {
    try {
      setIsSubmitting(true)
      const response = await borrowingsAPI.confirmReturn(confirmingReturnId, {
        bookCondition: data.bookCondition,
        fineLevelId: data.fineLevelId || null,
        lateFineLevelId: data.lateFineLevelId || null,
        note: data.note || null
      })
      if (response.data.success) {
        toast.success(response.data.message || 'Xác nhận trả sách thành công!')
        setConfirmingReturnId(null)
        reset()
        fetchPendingReturnRequests()
      }
    } catch (error) {
      const errorData = error.response?.data
      if (errorData?.errors) {
        errorData.errors.forEach(err => {
          setError(err.field, {
            type: 'manual',
            message: err.message
          })
        })
      } else {
        toast.error(errorData?.message || 'Xác nhận trả sách thất bại')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRejectClick = (id) => {
    setRejectingId(id)
    reset()
  }

  const handleRejectSubmit = async (data) => {
    try {
      setIsSubmitting(true)
      const response = await borrowingsAPI.reject(rejectingId, {
        rejectionReason: data.rejectionReason
      })
      if (response.data.success) {
        toast.success(response.data.message || 'Đã từ chối yêu cầu mượn sách')
        setRejectingId(null)
        reset()
        fetchPendingBorrowings()
      }
    } catch (error) {
      const errorData = error.response?.data
      if (errorData?.errors) {
        errorData.errors.forEach(err => {
          if (err.field === 'rejectionReason') {
            setError('rejectionReason', {
              type: 'manual',
              message: err.message
            })
          }
        })
      } else {
        toast.error(errorData?.message || 'Từ chối thất bại')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN')
  }

  if (loading && activeTab === 'borrow') {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4">
        <div className="section-container">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    )
  }

  const selectedReturnRequest = confirmingReturnId ? returnRequests.find(r => r.id === confirmingReturnId) : null

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="section-container">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">
            Quản lý mượn trả
          </h1>
          <p className="text-gray-600">
            Xác nhận hoặc từ chối các yêu cầu mượn và trả sách từ độc giả
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('borrow')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'borrow'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Chờ xác nhận mượn
            </button>
            <button
              onClick={() => setActiveTab('return')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'return'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Chờ xác nhận trả
            </button>
          </div>
        </div>

        {/* Tab Content: Borrow */}
        {activeTab === 'borrow' && (
          <div className="card">
            <div className="mb-6">
              <h2 className="text-2xl font-display font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <HiOutlineClock className="w-6 h-6 text-primary-600" />
                Chờ xác nhận mượn
              </h2>
              <p className="text-gray-600">
                {borrowings.length} {borrowings.length === 1 ? 'đơn mượn' : 'đơn mượn'} đang chờ xác nhận
              </p>
            </div>

            {borrowings.length === 0 ? (
              <div className="text-center py-12">
                <HiOutlineBookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Không có yêu cầu mượn sách nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Mã đơn</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Độc giả</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Sách</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Ngày yêu cầu</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Thời hạn mượn</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {borrowings.map((borrowing) => (
                      <tr key={borrowing.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <span className="text-sm font-mono text-gray-600">
                            {borrowing.id.substring(0, 8)}...
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <HiOutlineUser className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{borrowing.userName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600">{borrowing.userEmail}</td>
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{borrowing.bookName}</div>
                            <div className="text-sm text-gray-500">{borrowing.bookAuthor}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              Còn lại: {borrowing.availableQuantity} bản
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600">{formatDate(borrowing.borrowDate)}</td>
                        <td className="py-4 px-4">
                          <span className="text-gray-600">{borrowing.borrowDays} ngày</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleConfirmClick(borrowing.id)}
                              disabled={borrowing.availableQuantity === 0}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                borrowing.availableQuantity === 0
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-green-50 text-green-700 hover:bg-green-100'
                              }`}
                            >
                              <HiOutlineCheckCircle className="w-4 h-4" />
                              Xác nhận
                            </button>
                            <button
                              onClick={() => handleRejectClick(borrowing.id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-all"
                            >
                              <HiOutlineXCircle className="w-4 h-4" />
                              Từ chối
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Return */}
        {activeTab === 'return' && (
          <div className="card">
            <div className="mb-6">
              <h2 className="text-2xl font-display font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <HiOutlineClock className="w-6 h-6 text-primary-600" />
                Chờ xác nhận trả
              </h2>
              <p className="text-gray-600">
                {returnRequests.length} {returnRequests.length === 1 ? 'yêu cầu trả' : 'yêu cầu trả'} đang chờ xác nhận
              </p>
            </div>

            {returnRequests.length === 0 ? (
              <div className="text-center py-12">
                <HiOutlineBookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Không có yêu cầu trả sách nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Mã yêu cầu</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Độc giả</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Sách</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Ngày mượn</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Hạn trả</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Ngày yêu cầu</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Trạng thái</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnRequests.map((request) => (
                      <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <span className="text-sm font-mono text-gray-600">
                            {request.id.substring(0, 8)}...
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <HiOutlineUser className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{request.userName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{request.bookName}</div>
                            <div className="text-sm text-gray-500">{request.bookAuthor}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600">{formatDate(request.borrowDate)}</td>
                        <td className="py-4 px-4 text-gray-600">{formatDate(request.dueDate)}</td>
                        <td className="py-4 px-4 text-gray-600">{formatDate(request.requestDate)}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            request.isOverdue
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {request.status}
                            {request.isOverdue && ` (${request.daysOverdue} ngày)`}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleConfirmReturnClick(request.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 transition-all"
                          >
                            <HiOutlineCheckCircle className="w-4 h-4" />
                            Xác nhận trả
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Borrow Modal */}
      {confirmingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-display font-semibold text-gray-900">
                Xác nhận mượn sách
              </h3>
              <button
                onClick={() => setConfirmingId(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <HiOutlineX className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xác nhận giao sách cho độc giả này?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmingId(null)}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium bg-primary-600 text-white hover:bg-primary-700 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Return Modal */}
      {confirmingReturnId && selectedReturnRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-semibold text-gray-900">
                Xác nhận trả sách
              </h3>
              <button
                onClick={() => {
                  setConfirmingReturnId(null)
                  reset()
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isSubmitting}
              >
                <HiOutlineX className="w-6 h-6" />
              </button>
            </div>

            {/* Book Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Độc giả:</span>
                  <span className="ml-2 font-medium">{selectedReturnRequest.userName}</span>
                </div>
                <div>
                  <span className="text-gray-600">Sách:</span>
                  <span className="ml-2 font-medium">{selectedReturnRequest.bookName}</span>
                </div>
                <div>
                  <span className="text-gray-600">Ngày mượn:</span>
                  <span className="ml-2">{formatDate(selectedReturnRequest.borrowDate)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Hạn trả:</span>
                  <span className={`ml-2 ${selectedReturnRequest.isOverdue ? 'text-red-600 font-medium' : ''}`}>
                    {formatDate(selectedReturnRequest.dueDate)}
                    {selectedReturnRequest.isOverdue && ` (Quá hạn ${selectedReturnRequest.daysOverdue} ngày)`}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(handleConfirmReturnSubmit)}>
              {/* Book Condition */}
              <div className="mb-4">
                <label className="label">
                  Tình trạng sách <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('bookCondition', {
                    required: 'Vui lòng chọn tình trạng sách'
                  })}
                  className={`input ${errors.bookCondition ? 'input-error' : ''}`}
                >
                  <option value="">Chọn tình trạng...</option>
                  <option value="normal">Bình thường</option>
                  <option value="damaged">Hư hỏng</option>
                  <option value="lost">Mất</option>
                </select>
                {errors.bookCondition && (
                  <p className="error-message">{errors.bookCondition.message}</p>
                )}
              </div>

              {/* Fine Level (for damaged/lost or overdue) */}
              {(bookCondition === 'damaged' || bookCondition === 'lost' || (bookCondition === 'normal' && isOverdue)) && (
                <div className="mb-4">
                  <label className="label">
                    Mức phạt {bookCondition === 'damaged' || bookCondition === 'lost' ? '(hư hỏng/mất)' : '(trả muộn)'} <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('fineLevelId', {
                      required: 'Vui lòng chọn mức phạt'
                    })}
                    className={`input ${errors.fineLevelId ? 'input-error' : ''}`}
                  >
                    <option value="">Chọn mức phạt...</option>
                    {fineLevels.map(level => (
                      <option key={level.id} value={level.id}>
                        {level.name} - {level.amount.toLocaleString('vi-VN')} VNĐ
                      </option>
                    ))}
                  </select>
                  {errors.fineLevelId && (
                    <p className="error-message">{errors.fineLevelId.message}</p>
                  )}
                </div>
              )}

              {/* Late Fine Level (for damaged + overdue) */}
              {bookCondition === 'damaged' && isOverdue && (
                <div className="mb-4">
                  <label className="label">
                    Mức phạt trả muộn <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('lateFineLevelId')}
                    className="input"
                  >
                    <option value="">Chọn mức phạt trả muộn...</option>
                    {fineLevels.map(level => (
                      <option key={level.id} value={level.id}>
                        {level.name} - {level.amount.toLocaleString('vi-VN')} VNĐ
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Nếu không chọn, sẽ dùng cùng mức phạt với hư hỏng
                  </p>
                </div>
              )}

              {/* Note (for damaged/lost) */}
              {(bookCondition === 'damaged' || bookCondition === 'lost') && (
                <div className="mb-6">
                  <label className="label">
                    Ghi chú <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('note', {
                      required: 'Vui lòng nhập ghi chú',
                      maxLength: {
                        value: 500,
                        message: 'Ghi chú không được vượt quá 500 ký tự'
                      }
                    })}
                    rows={4}
                    className={`input ${errors.note ? 'input-error' : ''}`}
                    placeholder="Mô tả tình trạng sách..."
                  />
                  {errors.note && (
                    <p className="error-message">{errors.note.message}</p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmingReturnId(null)
                    reset()
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium bg-primary-600 text-white hover:bg-primary-700 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Xác nhận trả'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-display font-semibold text-gray-900">
                Từ chối yêu cầu mượn sách
              </h3>
              <button
                onClick={() => {
                  setRejectingId(null)
                  reset()
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isSubmitting}
              >
                <HiOutlineX className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit(handleRejectSubmit)}>
              <div className="mb-4">
                <label className="label">
                  Lý do từ chối <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('rejectionReason', {
                    required: 'Vui lòng nhập lý do từ chối',
                    maxLength: {
                      value: 500,
                      message: 'Lý do không được vượt quá 500 ký tự'
                    }
                  })}
                  rows={4}
                  className={`input ${errors.rejectionReason ? 'input-error' : ''}`}
                  placeholder="Nhập lý do từ chối..."
                />
                {errors.rejectionReason && (
                  <p className="error-message">{errors.rejectionReason.message}</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingId(null)
                    reset()
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BorrowManagementPage
