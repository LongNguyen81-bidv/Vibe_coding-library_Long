import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardAPI } from '../services/api'
import toast from 'react-hot-toast'
import {
  HiOutlineBookOpen,
  HiOutlineUserGroup,
  HiOutlineClock,
  HiOutlineRefresh,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExclamationCircle,
  HiOutlineBan,
  HiOutlineChartBar
} from 'react-icons/hi'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const DashboardPage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchStats()
    
    // Auto refresh every 5 minutes
    let interval
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchStats()
      }, 5 * 60 * 1000) // 5 minutes
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await dashboardAPI.getStats()
      if (response.data.success) {
        setStats(response.data.data)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể tải dữ liệu thống kê'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = {
    available: '#10b981', // Green
    borrowed: '#f59e0b', // Yellow
    lost: '#ef4444', // Red
    damaged: '#f97316', // Orange
    active: '#10b981',
    disabled: '#ef4444',
    pending: '#f59e0b',
    confirmed: '#10b981',
    rejected: '#ef4444'
  }

  // Prepare data for pie charts
  const booksChartData = stats ? [
    { name: 'Có sẵn', value: stats.books.available, color: COLORS.available },
    { name: 'Đang mượn', value: stats.books.borrowed, color: COLORS.borrowed },
    { name: 'Bị mất', value: stats.books.lost, color: COLORS.lost },
    { name: 'Hư hỏng', value: stats.books.damaged, color: COLORS.damaged }
  ].filter(item => item.value > 0) : []

  const readersChartData = stats ? [
    { name: 'Hoạt động', value: stats.readers.active, color: COLORS.active },
    { name: 'Vô hiệu hóa', value: stats.readers.disabled, color: COLORS.disabled },
    { name: 'Chờ xác nhận', value: stats.readers.pending, color: COLORS.pending }
  ].filter(item => item.value > 0) : []

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  if (loading && !stats) {
    return (
      <div className="section-container py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="section-container py-12">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Không thể tải dữ liệu thống kê</p>
          <button
            onClick={fetchStats}
            className="btn-primary"
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="section-container py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Báo Cáo Tổng Quan</h1>
          <p className="text-gray-600">Tổng quan về tình trạng thư viện</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/reports')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <HiOutlineChartBar className="w-5 h-5" />
            <span>Báo cáo chi tiết</span>
          </button>
          <button
            onClick={fetchStats}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <HiOutlineRefresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Widget 1: Thống kê sách */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/books')}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <HiOutlineBookOpen className="w-6 h-6 text-blue-600" />
              Thống kê sách
            </h2>
            <HiOutlineArrowRight className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tổng số sách:</span>
              <span className="text-lg font-bold text-blue-600">{stats.books.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center gap-1">
                <HiOutlineCheckCircle className="w-4 h-4 text-green-500" />
                Có sẵn:
              </span>
              <span className="font-semibold text-green-600">{stats.books.available}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center gap-1">
                <HiOutlineClock className="w-4 h-4 text-yellow-500" />
                Đang mượn:
              </span>
              <span className="font-semibold text-yellow-600">{stats.books.borrowed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center gap-1">
                <HiOutlineXCircle className="w-4 h-4 text-red-500" />
                Bị mất:
              </span>
              <span className="font-semibold text-red-600">{stats.books.lost}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center gap-1">
                <HiOutlineExclamationCircle className="w-4 h-4 text-orange-500" />
                Hư hỏng:
              </span>
              <span className="font-semibold text-orange-600">{stats.books.damaged}</span>
            </div>
          </div>

          {booksChartData.length > 0 && (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={booksChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {booksChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Widget 2: Thống kê độc giả */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/users')}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <HiOutlineUserGroup className="w-6 h-6 text-blue-600" />
              Thống kê độc giả
            </h2>
            <HiOutlineArrowRight className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tổng số:</span>
              <span className="text-lg font-bold text-blue-600">{stats.readers.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center gap-1">
                <HiOutlineCheckCircle className="w-4 h-4 text-green-500" />
                Hoạt động:
              </span>
              <span className="font-semibold text-green-600">{stats.readers.active}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center gap-1">
                <HiOutlineBan className="w-4 h-4 text-red-500" />
                Vô hiệu hóa:
              </span>
              <span className="font-semibold text-red-600">{stats.readers.disabled}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center gap-1">
                <HiOutlineClock className="w-4 h-4 text-yellow-500" />
                Chờ xác nhận:
              </span>
              <span className="font-semibold text-yellow-600">{stats.readers.pending}</span>
            </div>
          </div>

          {readersChartData.length > 0 && (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={readersChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {readersChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Widget 3: Đơn mượn hôm nay */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/borrowings')}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <HiOutlineClock className="w-6 h-6 text-blue-600" />
              Đơn mượn hôm nay
            </h2>
            <HiOutlineArrowRight className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tổng đơn:</span>
              <span className="text-lg font-bold text-blue-600">{stats.todayBorrowings.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center gap-1">
                <HiOutlineCheckCircle className="w-4 h-4 text-green-500" />
                Đã xác nhận:
              </span>
              <span className="font-semibold text-green-600">{stats.todayBorrowings.confirmed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center gap-1">
                <HiOutlineClock className="w-4 h-4 text-yellow-500" />
                Chờ xác nhận:
              </span>
              <span className="font-semibold text-yellow-600">{stats.todayBorrowings.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center gap-1">
                <HiOutlineXCircle className="w-4 h-4 text-red-500" />
                Từ chối:
              </span>
              <span className="font-semibold text-red-600">{stats.todayBorrowings.rejected}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget 4: Top 5 sách phổ biến */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <HiOutlineChartBar className="w-6 h-6 text-blue-600" />
              Top 5 sách phổ biến
            </h2>
            <button
              onClick={() => navigate('/books')}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              Xem tất cả
              <HiOutlineArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          {stats.topBooks.length > 0 ? (
            <div className="space-y-3">
              {stats.topBooks.map((book) => (
                <div
                  key={book.rank}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => book.id && navigate(`/books/${book.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                      {book.rank}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{book.name}</p>
                      <p className="text-sm text-gray-600">{book.author}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary-600">{book.borrowCount}</p>
                    <p className="text-xs text-gray-500">lượt mượn</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Chưa có dữ liệu</p>
          )}
        </div>

        {/* Widget 5: Độc giả nợ quá hạn */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <HiOutlineExclamationCircle className="w-6 h-6 text-red-600" />
              Độc giả nợ quá hạn
            </h2>
            <button
              onClick={() => navigate('/fines/management')}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              Xem tất cả
              <HiOutlineArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          {stats.overdueReaders.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stats.overdueReaders.map((reader, index) => (
                <div
                  key={index}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{reader.name}</p>
                      <p className="text-sm text-gray-600">{reader.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Sách quá hạn</p>
                      <p className="font-semibold text-red-600">{reader.overdueBooks}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Ngày trễ</p>
                      <p className="font-semibold text-red-600">{reader.maxOverdueDays}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Tổng phạt</p>
                      <p className="font-semibold text-red-600">{formatCurrency(reader.totalFine)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Không có độc giả nợ quá hạn</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage

