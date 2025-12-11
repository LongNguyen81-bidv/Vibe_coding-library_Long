import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { finesAPI } from '../services/api'
import dayjs from 'dayjs'
import {
  HiOutlineCurrencyDollar,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineCheckCircle,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineExclamationCircle
} from 'react-icons/hi'

const MyFinesPage = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('unpaid')
  const [fines, setFines] = useState([])
  const [counts, setCounts] = useState({
    unpaid: 0,
    pending: 0,
    rejected: 0,
    paid: 0
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState({})
  const [showPayModal, setShowPayModal] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(null)
  const [paymentProof, setPaymentProof] = useState('')
  const [selectedFine, setSelectedFine] = useState(null)

  useEffect(() => {
    fetchFines()
  }, [activeTab])

  const fetchFines = async () => {
    try {
      setLoading(true)
      const response = await finesAPI.getMyFines(activeTab)
      if (response.data.success) {
        setFines(response.data.data)
        setCounts(response.data.counts)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể tải danh sách khoản phạt'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handlePay = async (fineId) => {
    if (!paymentProof.trim()) {
      toast.error('Vui lòng nhập thông tin thanh toán')
      return
    }

    try {
      setActionLoading({ ...actionLoading, pay: fineId })
      const response = await finesAPI.payFine(fineId, { paymentProof: paymentProof.trim() })
      if (response.data.success) {
        toast.success(response.data.message)
        setShowPayModal(null)
        setPaymentProof('')
        fetchFines()
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể gửi yêu cầu thanh toán'
      toast.error(errorMessage)
    } finally {
      setActionLoading({ ...actionLoading, pay: null })
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
    { id: 'unpaid', label: 'Chưa thanh toán', count: counts.unpaid },
    { id: 'pending', label: 'Chờ xác nhận', count: counts.pending },
    { id: 'rejected', label: 'Từ chối', count: counts.rejected },
    { id: 'paid', label: 'Đã thanh toán', count: counts.paid }
  ]

  if (loading && fines.length === 0) {
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
            Khoản phạt của tôi
          </h1>
          <p className="text-gray-600">
            Xem và thanh toán các khoản phạt
          </p>
        </div>
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
          {fines.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineCurrencyDollar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                {activeTab === 'unpaid' && 'Bạn không có khoản phạt nào'}
                {activeTab === 'pending' && 'Không có khoản phạt chờ xác nhận'}
                {activeTab === 'rejected' && 'Không có khoản phạt bị từ chối'}
                {activeTab === 'paid' && 'Bạn chưa thanh toán khoản phạt nào'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {fines.map((fine) => (
                <div
                  key={fine.id}
                  className="bg-gray-50 rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {fine.bookName}
                          </h3>
                          <p className="text-sm text-gray-600">Tác giả: {fine.bookAuthor}</p>
                        </div>
                        {getStatusBadge(fine.statusLabel, fine.statusColor)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-gray-500 mb-1">Nguyên nhân</p>
                          <p className="font-medium text-gray-900">{fine.reasonLabel}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Số tiền</p>
                          <p className="font-medium text-red-600">{formatCurrency(fine.amount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Ngày phạt</p>
                          <p className="font-medium text-gray-900">
                            {dayjs(fine.fineDate).format('DD/MM/YYYY')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Mã phiếu phạt</p>
                          <p className="font-medium text-gray-900 text-xs">{fine.id.substring(0, 8)}...</p>
                        </div>
                      </div>

                      {fine.rejectionReason && (
                        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <p className="text-sm text-orange-800">
                            <span className="font-medium">Lý do từ chối:</span>{' '}
                            {fine.rejectionReason}
                          </p>
                        </div>
                      )}

                      {fine.status === 'pending' && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            Đang chờ nhân viên xác nhận thanh toán
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      {fine.canPay && (
                        <button
                          onClick={() => {
                            setShowPayModal(fine.id)
                            setSelectedFine(fine)
                          }}
                          disabled={actionLoading.pay === fine.id}
                          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {fine.status === 'rejected' ? 'Thanh toán lại' : 'Thanh toán'}
                        </button>
                      )}
                      <button
                        onClick={() => handleViewDetail(fine.id)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <HiOutlineEye className="w-4 h-4" />
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPayModal && selectedFine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Thanh toán khoản phạt</h3>
              <button
                onClick={() => {
                  setShowPayModal(null)
                  setPaymentProof('')
                  setSelectedFine(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiOutlineX className="w-6 h-6" />
              </button>
            </div>

            {/* Fine Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Sách</p>
                  <p className="font-medium text-gray-900">{selectedFine.bookName}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Nguyên nhân</p>
                  <p className="font-medium text-gray-900">{selectedFine.reasonLabel}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Số tiền cần thanh toán</p>
                  <p className="font-medium text-red-600 text-lg">{formatCurrency(selectedFine.amount)}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Mã phiếu phạt</p>
                  <p className="font-medium text-gray-900 text-xs">{selectedFine.id}</p>
                </div>
              </div>
            </div>

            {/* Bank Transfer Info */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <HiOutlineCurrencyDollar className="w-5 h-5 text-blue-600" />
                Thông tin chuyển khoản
              </h4>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Ngân hàng:</span> [Tên ngân hàng thư viện]</p>
                <p><span className="font-medium">Số tài khoản:</span> [Số tài khoản]</p>
                <p><span className="font-medium">Chủ tài khoản:</span> [Tên chủ TK]</p>
                <p><span className="font-medium">Số tiền:</span> <span className="text-red-600 font-semibold">{formatCurrency(selectedFine.amount)}</span></p>
                <p><span className="font-medium">Nội dung:</span> {selectedFine.id.substring(0, 8)} - [Tên độc giả]</p>
              </div>
            </div>

            {/* Payment Proof Form */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thông tin thanh toán <span className="text-red-500">*</span>
              </label>
              <textarea
                value={paymentProof}
                onChange={(e) => setPaymentProof(e.target.value)}
                placeholder="Nhập mã giao dịch hoặc mô tả về bằng chứng thanh toán (ảnh chứng từ, mã giao dịch ngân hàng, v.v.)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                rows={4}
              />
              <p className="mt-1 text-xs text-gray-500">
                Vui lòng cung cấp mã giao dịch hoặc mô tả về bằng chứng thanh toán
              </p>
            </div>

            {/* Instructions */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <HiOutlineExclamationCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Hướng dẫn:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Thực hiện chuyển khoản theo thông tin trên</li>
                    <li>Nhập mã giao dịch hoặc mô tả bằng chứng thanh toán vào ô trên</li>
                    <li>Nhấn "Xác nhận thanh toán" để gửi yêu cầu</li>
                    <li>Nhân viên sẽ kiểm tra và xác nhận thanh toán của bạn</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => handlePay(showPayModal)}
                disabled={actionLoading.pay === showPayModal || !paymentProof.trim()}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading.pay === showPayModal ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
              </button>
              <button
                onClick={() => {
                  setShowPayModal(null)
                  setPaymentProof('')
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

      {/* Detail Modal */}
      {showDetailModal && selectedFine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
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
                  <p className="text-sm text-gray-500 mb-1">Sách</p>
                  <p className="font-medium text-gray-900">{selectedFine.bookName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tác giả</p>
                  <p className="font-medium text-gray-900">{selectedFine.bookAuthor}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Nguyên nhân</p>
                  <p className="font-medium text-gray-900">{selectedFine.reasonLabel}</p>
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
                  <p className="text-sm text-gray-500 mb-1">Trạng thái</p>
                  {getStatusBadge(selectedFine.statusLabel, selectedFine.statusColor)}
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 mb-1">Mã phiếu phạt</p>
                  <p className="font-medium text-gray-900 text-xs">{selectedFine.id}</p>
                </div>
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
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedFine.paymentProof}</p>
                </div>
              )}

              {selectedFine.rejectionReason && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm font-medium text-orange-800 mb-1">Lý do từ chối</p>
                  <p className="text-sm text-orange-900">{selectedFine.rejectionReason}</p>
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
    </div>
  )
}

export default MyFinesPage

