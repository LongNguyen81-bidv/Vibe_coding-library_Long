import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { booksAPI, borrowingsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { 
  HiOutlineArrowLeft,
  HiOutlineBookOpen,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineUser,
  HiOutlineClock
} from 'react-icons/hi'
import dayjs from 'dayjs'

const BookDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [borrowDays, setBorrowDays] = useState(14)
  const [isBorrowing, setIsBorrowing] = useState(false)

  const isLibrarian = user && (user.role === 'librarian' || user.role === 'admin')
  const isReader = user && user.role === 'reader'

  useEffect(() => {
    fetchBook()
  }, [id])

  const fetchBook = async () => {
    try {
      setLoading(true)
      const response = await booksAPI.getById(id)
      if (response.data.success) {
        setBook(response.data.data)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể tải thông tin sách'
      toast.error(errorMessage)
      if (error.response?.status === 404) {
        navigate('/books')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    navigate(`/books/${id}/edit`)
  }

  const handleDeleteClick = () => {
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true)
      const response = await booksAPI.delete(id)
      if (response.data.success) {
        toast.success(response.data.message || 'Xóa sách thành công!')
        navigate('/books')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Xóa sách thất bại'
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handleBorrowClick = () => {
    setShowBorrowModal(true)
    setBorrowDays(14) // Reset to default
  }

  const handleBorrowConfirm = async () => {
    try {
      setIsBorrowing(true)
      const response = await borrowingsAPI.create({
        bookId: id,
        borrowDays: borrowDays
      })
      
      if (response.data.success) {
        toast.success(response.data.message || 'Yêu cầu mượn sách đã được gửi!')
        setShowBorrowModal(false)
        // Refresh book data to update available quantity
        fetchBook()
        // Navigate to borrowing history page (if exists) or stay on page
        // navigate('/borrowings') // Uncomment when borrowing history page is created
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Tạo yêu cầu mượn sách thất bại'
      toast.error(errorMessage)
    } finally {
      setIsBorrowing(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'BORROWED': { text: 'Đang mượn', color: 'bg-blue-100 text-blue-800' },
      'RETURNED': { text: 'Đã trả', color: 'bg-green-100 text-green-800' },
      'OVERDUE': { text: 'Quá hạn', color: 'bg-red-100 text-red-800' }
    }
    const statusInfo = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <HiOutlineBookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy sách</h3>
          <button
            onClick={() => navigate('/books')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <HiOutlineArrowLeft className="w-5 h-5" />
        <span>Quay lại</span>
      </button>

      {/* Book Info Card */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-28 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <HiOutlineBookOpen className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.name}</h1>
              <p className="text-lg text-gray-600 mb-1">Tác giả: {book.author}</p>
              {book.isbn && (
                <p className="text-sm text-gray-500">ISBN: {book.isbn}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {/* Reader: Borrow Button */}
            {isReader && book.availableQuantity > 0 && (
              <button
                onClick={handleBorrowClick}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <HiOutlineBookOpen className="w-5 h-5" />
                <span>Mượn sách</span>
              </button>
            )}
            
            {/* Guest: Login to Borrow */}
            {!user && book.availableQuantity > 0 && (
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <HiOutlineBookOpen className="w-5 h-5" />
                <span>Đăng nhập để mượn sách</span>
              </button>
            )}

            {/* Reader: Out of Stock */}
            {isReader && book.availableQuantity === 0 && (
              <span className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed">
                <HiOutlineBookOpen className="w-5 h-5" />
                <span>Sách đã hết</span>
              </span>
            )}

            {/* Librarian/Admin: Edit & Delete Buttons */}
            {isLibrarian && (
              <>
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <HiOutlinePencil className="w-5 h-5" />
                  <span>Sửa</span>
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <HiOutlineTrash className="w-5 h-5" />
                  <span>Xóa</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Book Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Năm xuất bản</h3>
            <p className="text-lg text-gray-900">{book.publishYear}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Thể loại</h3>
            <p className="text-lg text-gray-900">{book.category.name}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Số lượng có sẵn</h3>
            <p className={`text-lg font-semibold ${book.availableQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {book.availableQuantity}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Số lượng đang mượn</h3>
            <p className="text-lg font-semibold text-gray-900">{book.borrowedQuantity}</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Mô tả</h3>
          <p className="text-gray-900 leading-relaxed">{book.description}</p>
        </div>
      </div>

      {/* Borrow History (for Librarian/Admin) */}
      {isLibrarian && book.borrowHistory && book.borrowHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Lịch sử mượn sách</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Độc giả</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Ngày mượn</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Hạn trả</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Ngày trả</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {book.borrowHistory.map((history, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <HiOutlineUser className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{history.readerName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {dayjs(history.borrowDate).format('DD/MM/YYYY')}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {dayjs(history.dueDate).format('DD/MM/YYYY')}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {history.returnDate ? dayjs(history.returnDate).format('DD/MM/YYYY') : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(history.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Borrow Modal */}
      {showBorrowModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-full">
                  <HiOutlineBookOpen className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Mượn sách</h3>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  Bạn đang mượn sách: <strong>"{book.name}"</strong>
                </p>
                <p className="text-sm text-gray-500">
                  Vui lòng chọn thời hạn mượn sách
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thời hạn mượn (ngày)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="7"
                    max="30"
                    value={borrowDays}
                    onChange={(e) => setBorrowDays(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-lg font-semibold text-primary-600 min-w-[60px] text-right">
                    {borrowDays} ngày
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Tối thiểu: 7 ngày</span>
                  <span>Tối đa: 30 ngày</span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <HiOutlineClock className="inline w-4 h-4 mr-1" />
                  Hạn trả dự kiến: {dayjs().add(borrowDays, 'day').format('DD/MM/YYYY')}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBorrowModal(false)}
                  disabled={isBorrowing}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  onClick={handleBorrowConfirm}
                  disabled={isBorrowing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBorrowing ? 'Đang xử lý...' : 'Xác nhận mượn'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <HiOutlineTrash className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Xác nhận xóa sách</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Bạn có chắc chắn muốn xóa sách <strong>"{book.name}"</strong> không? Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookDetailPage

