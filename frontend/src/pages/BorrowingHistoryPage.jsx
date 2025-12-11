import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { borrowingsAPI } from '../services/api'
import dayjs from 'dayjs'
import {
  HiOutlineBookOpen,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineCheckCircle,
  HiOutlineArrowLeft,
  HiOutlineRefresh,
  HiOutlineEye,
  HiOutlineX
} from 'react-icons/hi'

const BorrowingHistoryPage = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('borrowing')
  const [borrowings, setBorrowings] = useState([])
  const [counts, setCounts] = useState({
    borrowing: 0,
    returned: 0,
    pending: 0,
    rejected: 0
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState({})
  const [showReturnModal, setShowReturnModal] = useState(null)
  const [showExtendModal, setShowExtendModal] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(null)
  const [showRejectionReason, setShowRejectionReason] = useState(null)

  useEffect(() => {
    fetchBorrowings()
  }, [activeTab])

  const fetchBorrowings = async () => {
    try {
      setLoading(true)
      const response = await borrowingsAPI.getHistory(activeTab)
      if (response.data.success) {
        setBorrowings(response.data.data)
        setCounts(response.data.counts)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể tải lịch sử mượn sách'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleReturn = async (borrowingId) => {
    try {
      setActionLoading({ ...actionLoading, return: borrowingId })
      const response = await borrowingsAPI.createReturnRequest(borrowingId)
      if (response.data.success) {
        toast.success(response.data.message)
        setShowReturnModal(null)
        fetchBorrowings()
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể tạo yêu cầu trả sách'
      toast.error(errorMessage)
    } finally {
      setActionLoading({ ...actionLoading, return: null })
    }
  }

  const handleExtend = async (borrowingId) => {
    try {
      setActionLoading({ ...actionLoading, extend: borrowingId })
      const response = await borrowingsAPI.extend(borrowingId)
      if (response.data.success) {
        toast.success(response.data.message)
        setShowExtendModal(null)
        fetchBorrowings()
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể gia hạn sách'
      toast.error(errorMessage)
    } finally {
      setActionLoading({ ...actionLoading, extend: null })
    }
  }

  const handleCancel = async (borrowingId) => {
    try {
      setActionLoading({ ...actionLoading, cancel: borrowingId })
      const response = await borrowingsAPI.cancel(borrowingId)
      if (response.data.success) {
        toast.success(response.data.message)
        setShowCancelModal(null)
        fetchBorrowings()
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể hủy đơn mượn'
      toast.error(errorMessage)
    } finally {
      setActionLoading({ ...actionLoading, cancel: null })
    }
  }

  const getStatusBadge = (status, daysRemaining, isOverdue) => {
    if (status === 'borrowed' || status === 'overdue' || isOverdue) {
      if (isOverdue) {
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Quá hạn</span>
      } else if (daysRemaining <= 3) {
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Sắp hết hạn</span>
      } else {
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Đang mượn</span>
      }
    } else if (status === 'returned') {
      return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Đã trả</span>
    } else if (status === 'pending') {
      return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Chờ xác nhận</span>
    } else if (status === 'rejected') {
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Bị từ chối</span>
    }
    return null
  }

  const tabs = [
    { id: 'borrowing', label: 'Đang mượn', count: counts.borrowing },
    { id: 'returned', label: 'Đã trả', count: counts.returned },
    { id: 'pending', label: 'Chờ xác nhận', count: counts.pending },
    { id: 'rejected', label: 'Bị từ chối', count: counts.rejected }
  ]

  if (loading && borrowings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            Lịch sử mượn sách
          </h1>
          <p className="text-gray-600">
            Xem và quản lý các đơn mượn sách của bạn
          </p>
        </div>
        <button
          onClick={() => navigate('/books')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <HiOutlineBookOpen className="w-5 h-5" />
          Duyệt sách
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {borrowings.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineBookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                {activeTab === 'borrowing' && 'Bạn chưa mượn sách nào'}
                {activeTab === 'returned' && 'Bạn chưa trả sách nào'}
                {activeTab === 'pending' && 'Không có đơn mượn chờ xác nhận'}
                {activeTab === 'rejected' && 'Không có đơn mượn bị từ chối'}
              </p>
              {activeTab === 'borrowing' && (
                <button
                  onClick={() => navigate('/books')}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Duyệt sách ngay
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {borrowings.map((borrowing) => (
                <div
                  key={borrowing.id}
                  className="bg-gray-50 rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {borrowing.bookTitle}
                          </h3>
                          <p className="text-sm text-gray-600">Tác giả: {borrowing.author}</p>
                        </div>
                        {getStatusBadge(
                          borrowing.status,
                          borrowing.daysRemaining,
                          borrowing.isOverdue
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1">Ngày mượn</p>
                          <p className="font-medium text-gray-900">
                            {dayjs(borrowing.borrowDate).format('DD/MM/YYYY')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Ngày hết hạn</p>
                          <p className="font-medium text-gray-900">
                            {dayjs(borrowing.dueDate).format('DD/MM/YYYY')}
                          </p>
                        </div>
                        {activeTab === 'borrowing' && (
                          <div>
                            <p className="text-gray-500 mb-1">Còn lại</p>
                            <p className={`font-medium ${
                              borrowing.isOverdue
                                ? 'text-red-600'
                                : borrowing.daysRemaining <= 3
                                ? 'text-yellow-600'
                                : 'text-gray-900'
                            }`}>
                              {borrowing.isOverdue
                                ? `${Math.abs(borrowing.daysRemaining)} ngày quá hạn`
                                : `${borrowing.daysRemaining} ngày`}
                            </p>
                          </div>
                        )}
                        {activeTab === 'returned' && borrowing.returnDate && (
                          <div>
                            <p className="text-gray-500 mb-1">Ngày trả</p>
                            <p className="font-medium text-gray-900">
                              {dayjs(borrowing.returnDate).format('DD/MM/YYYY')}
                            </p>
                          </div>
                        )}
                        {activeTab === 'pending' && (
                          <div>
                            <p className="text-gray-500 mb-1">Ngày tạo đơn</p>
                            <p className="font-medium text-gray-900">
                              {dayjs(borrowing.createdAt).format('DD/MM/YYYY')}
                            </p>
                          </div>
                        )}
                        {activeTab === 'rejected' && borrowing.rejectedAt && (
                          <div>
                            <p className="text-gray-500 mb-1">Ngày từ chối</p>
                            <p className="font-medium text-gray-900">
                              {dayjs(borrowing.rejectedAt).format('DD/MM/YYYY')}
                            </p>
                          </div>
                        )}
                      </div>

                      {activeTab === 'rejected' && borrowing.rejectionReason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800">
                            <span className="font-medium">Lý do từ chối:</span>{' '}
                            {borrowing.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      {activeTab === 'borrowing' && (
                        <>
                          {borrowing.canReturn && (
                            <button
                              onClick={() => setShowReturnModal(borrowing.id)}
                              disabled={actionLoading.return === borrowing.id}
                              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {actionLoading.return === borrowing.id ? 'Đang xử lý...' : 'Xin trả sách'}
                            </button>
                          )}
                          {borrowing.canExtend && (
                            <button
                              onClick={() => setShowExtendModal(borrowing)}
                              disabled={actionLoading.extend === borrowing.id}
                              className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {actionLoading.extend === borrowing.id ? 'Đang xử lý...' : 'Gia hạn'}
                            </button>
                          )}
                          {borrowing.hasPendingReturnRequest && (
                            <span className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg cursor-not-allowed">
                              Đang chờ xác nhận trả
                            </span>
                          )}
                        </>
                      )}
                      {activeTab === 'pending' && borrowing.canCancel && (
                        <button
                          onClick={() => setShowCancelModal(borrowing.id)}
                          disabled={actionLoading.cancel === borrowing.id}
                          className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {actionLoading.cancel === borrowing.id ? 'Đang xử lý...' : 'Hủy đơn'}
                        </button>
                      )}
                      {(activeTab === 'returned' || activeTab === 'rejected') && (
                        <button
                          onClick={() => navigate(`/books/${borrowing.bookId}`)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          {activeTab === 'rejected' ? 'Mượn lại' : 'Xem chi tiết'}
                        </button>
                      )}
                      {activeTab === 'rejected' && borrowing.rejectionReason && (
                        <button
                          onClick={() => setShowRejectionReason(borrowing)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          Xem lý do
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Return Confirmation Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Xác nhận trả sách</h3>
            <p className="text-gray-600 mb-6">
              Bạn có muốn gửi yêu cầu trả sách này không? Vui lòng mang sách đến thư viện để hoàn tất.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleReturn(showReturnModal)}
                disabled={actionLoading.return === showReturnModal}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading.return === showReturnModal ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
              <button
                onClick={() => setShowReturnModal(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extend Confirmation Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Xác nhận gia hạn</h3>
            <p className="text-gray-600 mb-2">
              Bạn sẽ gia hạn thêm 7 ngày cho sách này.
            </p>
            <p className="text-gray-600 mb-4">
              Ngày hết hạn mới: <span className="font-medium">{dayjs(showExtendModal.dueDate).add(7, 'day').format('DD/MM/YYYY')}</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleExtend(showExtendModal.id)}
                disabled={actionLoading.extend === showExtendModal.id}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading.extend === showExtendModal.id ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
              <button
                onClick={() => setShowExtendModal(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Xác nhận hủy đơn</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn hủy đơn mượn này?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleCancel(showCancelModal)}
                disabled={actionLoading.cancel === showCancelModal}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading.cancel === showCancelModal ? 'Đang xử lý...' : 'Xác nhận hủy'}
              </button>
              <button
                onClick={() => setShowCancelModal(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Không hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectionReason && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Lý do từ chối</h3>
              <button
                onClick={() => setShowRejectionReason(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiOutlineX className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Sách: {showRejectionReason.bookTitle}</p>
              <p className="text-sm text-gray-500 mb-2">
                Ngày từ chối: {dayjs(showRejectionReason.rejectedAt).format('DD/MM/YYYY')}
              </p>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-gray-900">{showRejectionReason.rejectionReason}</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => navigate(`/books/${showRejectionReason.bookId}`)}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                Mượn lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BorrowingHistoryPage

