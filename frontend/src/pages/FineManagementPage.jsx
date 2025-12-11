import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { finesAPI } from '../services/api'
import dayjs from 'dayjs'
import {
  HiOutlineCurrencyDollar,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineExclamationCircle
} from 'react-icons/hi'

const FineManagementPage = () => {
  const [activeTab, setActiveTab] = useState('all')
  const [fines, setFines] = useState([])
  const [counts, setCounts] = useState({
    all: 0,
    unpaid: 0,
    pending: 0,
    rejected: 0,
    paid: 0
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState({})
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedFine, setSelectedFine] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    fetchFines()
  }, [activeTab])

  const fetchFines = async () => {
    try {
      setLoading(true)
      const status = activeTab === 'all' ? undefined : activeTab
      const response = await finesAPI.getAllFines(status)
      if (response.data.success) {
        setFines(response.data.data)
        setCounts(response.data.counts)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể tải danh sách phiếu phạt'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmPayment = async (fineId) => {
    try {
      setActionLoading({ ...actionLoading, confirm: fineId })
      const response = await finesAPI.confirmPayment(fineId)
      if (response.data.success) {
        toast.success(response.data.message)
        setShowConfirmModal(false)
        setSelectedFine(null)
        fetchFines()
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể xác nhận thanh toán'
      toast.error(errorMessage)
    } finally {
      setActionLoading({ ...actionLoading, confirm: null })
    }
  }

  const handleRejectPayment = async (fineId) => {
    if (!rejectionReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối')
      return
    }

    if (rejectionReason.trim().length > 500) {
      toast.error('Lý do từ chối không được vượt quá 500 ký tự')
      return
    }

    try {
      setActionLoading({ ...actionLoading, reject: fineId })
      const response = await finesAPI.rejectPayment(fineId, { rejectionReason: rejectionReason.trim() })
      if (response.data.success) {
        toast.success(response.data.message)
        setShowRejectModal(false)
        setRejectionReason('')
        setSelectedFine(null)
        fetchFines()
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể từ chối thanh toán'
      toast.error(errorMessage)
    } finally {
      setActionLoading({ ...actionLoading, reject: null })
    }
  }

  const handleViewDetail = async (fineId) => {
    try {
      const response = await finesAPI.getFineDetail(fineId)
      if (response.data.success) {
        setSelectedFine(response.data.data)
        setShowDetailModal(true)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể tải thông tin phiếu phạt'
      toast.error(errorMessage)
    }
  }

  const getStatusBadge = (status, statusColor) => {
    const colorClasses = {
      red: 'bg-red-100 text-red-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      orange: 'bg-orange-100 text-orange-800',
      green: 'bg-green-100 text-green-800'
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClasses[statusColor] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    )
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const tabs = [
    { id: 'all', label: 'Tất cả', count: counts.all },
    { id: 'pending', label: 'Chờ xác nhận', count: counts.pending },
    { id: 'unpaid', label: 'Chưa thanh toán', count: counts.unpaid },
    { id: 'paid', label: 'Đã thanh toán', count: counts.paid },
    { id: 'rejected', label: 'Từ chối', count: counts.rejected }
  ]

  if (loading && fines.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            Quản lý khoản phạt
          </h1>
          <p className="text-gray-600">
            Xem và xác nhận thanh toán các khoản phạt từ độc giả
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors relative ${
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
          {fines.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineCurrencyDollar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                {activeTab === 'all' && 'Không có phiếu phạt nào'}
                {activeTab === 'pending' && 'Không có phiếu phạt chờ xác nhận'}
                {activeTab === 'unpaid' && 'Không có phiếu phạt chưa thanh toán'}
                {activeTab === 'paid' && 'Không có phiếu phạt đã thanh toán'}
                {activeTab === 'rejected' && 'Không có phiếu phạt bị từ chối'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Mã phiếu</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tên độc giả</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tên sách</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nguyên nhân</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Số tiền</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Ngày phạt</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Trạng thái</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {fines.map((fine) => (
                    <tr key={fine.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900 font-mono">{fine.id.substring(0, 8)}...</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{fine.userName}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{fine.userEmail}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{fine.bookName}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{fine.reasonLabel}</td>
                      <td className="py-3 px-4 text-sm text-right font-semibold text-red-600">{formatCurrency(fine.amount)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{dayjs(fine.fineDate).format('DD/MM/YYYY')}</td>
                      <td className="py-3 px-4">{getStatusBadge(fine.statusLabel, fine.statusColor)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewDetail(fine.id)}
                            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <HiOutlineEye className="w-5 h-5" />
                          </button>
                          {fine.canConfirm && (
                            <button
                              onClick={() => {
                                setSelectedFine(fine)
                                setShowConfirmModal(true)
                              }}
                              disabled={actionLoading.confirm === fine.id}
                              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Xác nhận thanh toán"
                            >
                              <HiOutlineCheckCircle className="w-5 h-5" />
                            </button>
                          )}
                          {fine.canReject && (
                            <button
                              onClick={() => {
                                setSelectedFine(fine)
                                setRejectionReason('')
                                setShowRejectModal(true)
                              }}
                              disabled={actionLoading.reject === fine.id}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Từ chối thanh toán"
                            >
                              <HiOutlineXCircle className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedFine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Chi tiết phiếu phạt</h3>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedFine(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiOutlineX className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Mã phiếu</p>
                  <p className="font-medium text-gray-900 text-xs font-mono">{selectedFine.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Trạng thái</p>
                  {getStatusBadge(selectedFine.statusLabel, selectedFine.statusColor)}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tên độc giả</p>
                  <p className="font-medium text-gray-900">{selectedFine.userName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="font-medium text-gray-900">{selectedFine.userEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Số điện thoại</p>
                  <p className="font-medium text-gray-900">{selectedFine.userPhone || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Sách</p>
                  <p className="font-medium text-gray-900">{selectedFine.bookName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tác giả</p>
                  <p className="font-medium text-gray-900">{selectedFine.bookAuthor}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">ISBN</p>
                  <p className="font-medium text-gray-900">{selectedFine.bookIsbn || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Nguyên nhân</p>
                  <p className="font-medium text-gray-900">{selectedFine.reasonLabel}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Mức phạt</p>
                  <p className="font-medium text-gray-900">{selectedFine.fineLevel?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Số tiền</p>
                  <p className="font-medium text-red-600 text-lg">{formatCurrency(selectedFine.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Ngày phạt</p>
                  <p className="font-medium text-gray-900">{dayjs(selectedFine.fineDate).format('DD/MM/YYYY')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Ngày mượn</p>
                  <p className="font-medium text-gray-900">{dayjs(selectedFine.borrowing?.borrowDate).format('DD/MM/YYYY')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Hạn trả</p>
                  <p className="font-medium text-gray-900">{dayjs(selectedFine.borrowing?.dueDate).format('DD/MM/YYYY')}</p>
                </div>
                {selectedFine.borrowing?.returnDate && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Ngày trả</p>
                    <p className="font-medium text-gray-900">{dayjs(selectedFine.borrowing.returnDate).format('DD/MM/YYYY')}</p>
                  </div>
                )}
              </div>

              {selectedFine.note && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Ghi chú</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedFine.note}</p>
                </div>
              )}

              {selectedFine.paymentProof && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Bằng chứng thanh toán</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedFine.paymentProof}</p>
                </div>
              )}

              {selectedFine.rejectionReason && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm font-medium text-orange-800 mb-1">Lý do từ chối</p>
                  <p className="text-sm text-orange-900">{selectedFine.rejectionReason}</p>
                </div>
              )}

              {selectedFine.confirmedAt && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800 mb-1">Đã xác nhận</p>
                  <p className="text-sm text-green-900">
                    Bởi: {selectedFine.confirmedBy?.name || 'N/A'} vào {dayjs(selectedFine.confirmedAt).format('DD/MM/YYYY HH:mm')}
                  </p>
                </div>
              )}

              {selectedFine.rejectedAt && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-1">Đã từ chối</p>
                  <p className="text-sm text-red-900">
                    Bởi: {selectedFine.rejectedBy?.name || 'N/A'} vào {dayjs(selectedFine.rejectedAt).format('DD/MM/YYYY HH:mm')}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedFine(null)
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Payment Modal */}
      {showConfirmModal && selectedFine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Xác nhận thanh toán</h3>
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  setSelectedFine(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiOutlineX className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Mã phiếu</p>
                  <p className="font-medium text-gray-900 text-xs font-mono">{selectedFine.id}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Độc giả</p>
                  <p className="font-medium text-gray-900">{selectedFine.userName}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Sách</p>
                  <p className="font-medium text-gray-900">{selectedFine.bookName}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Số tiền</p>
                  <p className="font-medium text-red-600 text-lg">{formatCurrency(selectedFine.amount)}</p>
                </div>
              </div>
            </div>

            {selectedFine.paymentProof && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Bằng chứng thanh toán</p>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedFine.paymentProof}</p>
                </div>
              </div>
            )}

            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <HiOutlineExclamationCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Lưu ý:</p>
                  <p>Vui lòng kiểm tra kỹ bằng chứng thanh toán trước khi xác nhận. Sau khi xác nhận, phiếu phạt sẽ được đánh dấu là đã thanh toán.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleConfirmPayment(selectedFine.id)}
                disabled={actionLoading.confirm === selectedFine.id}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading.confirm === selectedFine.id ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  setSelectedFine(null)
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Modal */}
      {showRejectModal && selectedFine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Từ chối thanh toán</h3>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectionReason('')
                  setSelectedFine(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiOutlineX className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Mã phiếu</p>
                  <p className="font-medium text-gray-900 text-xs font-mono">{selectedFine.id}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Độc giả</p>
                  <p className="font-medium text-gray-900">{selectedFine.userName}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Sách</p>
                  <p className="font-medium text-gray-900">{selectedFine.bookName}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Số tiền</p>
                  <p className="font-medium text-red-600 text-lg">{formatCurrency(selectedFine.amount)}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Nhập lý do từ chối thanh toán..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                rows={4}
              />
              <p className="mt-1 text-xs text-gray-500">
                {rejectionReason.length}/500 ký tự
              </p>
            </div>

            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2">
                <HiOutlineExclamationCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium mb-1">Lưu ý:</p>
                  <p>Độc giả sẽ nhận được thông báo về lý do từ chối và có thể thanh toán lại sau khi sửa lỗi.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleRejectPayment(selectedFine.id)}
                disabled={actionLoading.reject === selectedFine.id || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading.reject === selectedFine.id ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectionReason('')
                  setSelectedFine(null)
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FineManagementPage

