import { useState, useEffect } from 'react'
import { reportAPI } from '../services/api'
import toast from 'react-hot-toast'
import {
  HiOutlineBookOpen,
  HiOutlineRefresh,
  HiOutlineDownload,
  HiOutlineCalendar,
  HiOutlineChartBar
} from 'react-icons/hi'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import dayjs from 'dayjs'

const DetailedReportPage = () => {
  const [activeTab, setActiveTab] = useState('books')
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('thisMonth')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [customDateRange, setCustomDateRange] = useState(false)
  const [reportData, setReportData] = useState(null)

  useEffect(() => {
    fetchReport()
  }, [activeTab, period, startDate, endDate])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const params = customDateRange && startDate && endDate
        ? { startDate, endDate }
        : { period }

      let response
      switch (activeTab) {
        case 'books':
          response = await reportAPI.getBooksReport(params)
          break
        case 'borrowings':
          response = await reportAPI.getBorrowingsReport(params)
          break
        case 'fines':
          response = await reportAPI.getFinesReport(params)
          break
        case 'lost-damaged':
          response = await reportAPI.getLostDamagedReport(params)
          break
        default:
          return
      }

      if (response.data.success) {
        setReportData(response.data.data)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể tải báo cáo'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      const params = customDateRange && startDate && endDate
        ? { startDate, endDate }
        : { period }

      if (!period && !startDate && !endDate) {
        toast.error('Vui lòng chọn khoảng thời gian')
        return
      }

      const response = await reportAPI.exportCSV({
        reportType: activeTab,
        ...params
      })

      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      
      const filename = `bao-cao-${activeTab}-${dayjs().format('YYYY-MM-DD')}.csv`
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Xuất báo cáo thành công!')
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể xuất báo cáo'
      toast.error(errorMessage)
    }
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  return (
    <div className="section-container py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Báo Cáo Chi Tiết</h1>
          <p className="text-gray-600">Xem và xuất các báo cáo chi tiết của thư viện</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={loading || !reportData}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <HiOutlineDownload className="w-5 h-5" />
          <span>Xuất CSV</span>
        </button>
      </div>

      {/* Time Filter */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <HiOutlineCalendar className="w-5 h-5 text-gray-500" />
            <span className="font-semibold text-gray-700">Khoảng thời gian:</span>
          </div>
          
          {!customDateRange ? (
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value)
                setCustomDateRange(false)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="today">Hôm nay</option>
              <option value="thisWeek">Tuần này</option>
              <option value="thisMonth">Tháng này</option>
              <option value="thisQuarter">Quý này</option>
              <option value="thisYear">Năm này</option>
              <option value="custom">Tùy chỉnh</option>
            </select>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <span className="text-gray-500">đến</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                onClick={() => {
                  setCustomDateRange(false)
                  setStartDate('')
                  setEndDate('')
                  setPeriod('thisMonth')
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Hủy
              </button>
            </div>
          )}

          {period === 'custom' && !customDateRange && (
            <button
              onClick={() => setCustomDateRange(true)}
              className="px-4 py-2 text-sm text-primary-600 hover:text-primary-700"
            >
              Chọn ngày
            </button>
          )}

          <button
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <HiOutlineRefresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'books', label: 'Báo cáo Sách', icon: HiOutlineBookOpen },
            { id: 'borrowings', label: 'Báo cáo Mượn Trả', icon: HiOutlineRefresh },
            { id: 'fines', label: 'Báo cáo Phạt', icon: HiOutlineChartBar },
            { id: 'lost-damaged', label: 'Báo cáo Sách Mất/Hư', icon: HiOutlineBookOpen }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Report Content */}
      {loading && !reportData ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div>
          {activeTab === 'books' && reportData && (
            <BooksReport data={reportData} colors={COLORS} />
          )}
          {activeTab === 'borrowings' && reportData && (
            <BorrowingsReport data={reportData} colors={COLORS} />
          )}
          {activeTab === 'fines' && reportData && (
            <FinesReport data={reportData} colors={COLORS} formatCurrency={formatCurrency} />
          )}
          {activeTab === 'lost-damaged' && reportData && (
            <LostDamagedReport data={reportData} colors={COLORS} formatCurrency={formatCurrency} />
          )}
        </div>
      )}
    </div>
  )
}

// Books Report Component
const BooksReport = ({ data, colors }) => {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Tổng số sách</h3>
          <p className="text-3xl font-bold text-gray-900">{data.summary?.totalBooks || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Tổng thể loại</h3>
          <p className="text-3xl font-bold text-gray-900">{data.summary?.totalCategories || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Tổng lượt mượn</h3>
          <p className="text-3xl font-bold text-gray-900">{data.summary?.totalBorrows || 0}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Chart */}
        {data.categoryChart && data.categoryChart.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sách theo thể loại</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.categoryChart}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.categoryChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Status Chart */}
        {data.statusChart && data.statusChart.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tình trạng sách</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.statusChart}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.statusChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Books Table */}
      {data.books && data.books.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Danh sách sách</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên sách</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tác giả</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thể loại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tình trạng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lần mượn</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.books.map((book, index) => (
                  <tr key={book.id || index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{book.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{book.author}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{book.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{book.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{book.totalQuantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{book.borrowCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Borrowings Report Component
const BorrowingsReport = ({ data, colors }) => {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Tổng lượt mượn</h3>
          <p className="text-3xl font-bold text-gray-900">{data.summary?.totalBorrows || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Tổng lượt trả</h3>
          <p className="text-3xl font-bold text-gray-900">{data.summary?.totalReturns || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Số quá hạn</h3>
          <p className="text-3xl font-bold text-red-600">{data.summary?.totalOverdue || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Tỷ lệ đúng hạn</h3>
          <p className="text-3xl font-bold text-green-600">{data.summary?.onTimeRate || '0%'}</p>
        </div>
      </div>

      {/* Trend Chart */}
      {data.trendChart && data.trendChart.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Xu hướng mượn/trả theo thời gian</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data.trendChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="borrows" stroke={colors[0]} name="Số lượt mượn" />
              <Line type="monotone" dataKey="returns" stroke={colors[1]} name="Số lượt trả" />
              <Line type="monotone" dataKey="overdue" stroke={colors[2]} name="Số quá hạn" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Daily Data Table */}
      {data.dailyData && data.dailyData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Chi tiết mượn trả</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượt mượn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượt trả</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số quá hạn</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.dailyData.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dayjs(item.date).format('DD/MM/YYYY')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.borrows}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.returns}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{item.overdue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Fines Report Component
const FinesReport = ({ data, colors, formatCurrency }) => {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Tổng doanh thu</h3>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(data.summary?.totalRevenue || 0)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Đã thanh toán</h3>
          <p className="text-3xl font-bold text-gray-900">{data.summary?.paidCount || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Chưa thanh toán</h3>
          <p className="text-3xl font-bold text-yellow-600">{data.summary?.unpaidCount || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Tổng nợ chưa thu</h3>
          <p className="text-3xl font-bold text-red-600">{formatCurrency(data.summary?.totalUnpaid || 0)}</p>
        </div>
      </div>

      {/* Reason Chart */}
      {data.reasonChart && data.reasonChart.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân loại phạt theo nguyên nhân</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.reasonChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="value" fill={colors[0]} name="Số tiền (VNĐ)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Fines Detail Table */}
      {data.finesDetail && data.finesDetail.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Chi tiết phiếu phạt</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Độc giả</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lý do</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày phạt</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.finesDetail.map((fine, index) => (
                  <tr key={fine.id || index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fine.reader}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fine.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fine.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(fine.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        fine.status === 'Đã thanh toán' ? 'bg-green-100 text-green-800' :
                        fine.status === 'Chờ xác nhận' ? 'bg-yellow-100 text-yellow-800' :
                        fine.status === 'Từ chối' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {fine.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dayjs(fine.fineDate).format('DD/MM/YYYY')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Overdue Debtors */}
      {data.overdueDebtors && data.overdueDebtors.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Danh sách người nợ quá hạn</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên độc giả</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng nợ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.overdueDebtors.map((debtor, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{debtor.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{debtor.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">{formatCurrency(debtor.totalDebt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Lost/Damaged Report Component
const LostDamagedReport = ({ data, colors, formatCurrency }) => {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Tổng sách mất</h3>
          <p className="text-3xl font-bold text-red-600">{data.summary?.totalLost || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Tổng sách hư</h3>
          <p className="text-3xl font-bold text-orange-600">{data.summary?.totalDamaged || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Tổng giá trị thiệt hại</h3>
          <p className="text-3xl font-bold text-red-600">{formatCurrency(data.summary?.totalDamageValue || 0)}</p>
        </div>
      </div>

      {/* Trend Chart */}
      {data.trendChart && data.trendChart.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Xu hướng mất/hư theo thời gian</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data.trendChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="lost" stroke={colors[2]} name="Sách mất" />
              <Line type="monotone" dataKey="damaged" stroke={colors[3]} name="Sách hư" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Books to Replace Table */}
      {data.booksToReplace && data.booksToReplace.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Danh sách sách cần thay thế</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên sách</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tác giả</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thể loại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tình trạng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày ghi nhận</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Độc giả</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.booksToReplace.map((book, index) => (
                  <tr key={book.id || index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{book.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{book.author}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{book.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        book.condition === 'Mất' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {book.condition}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dayjs(book.recordedDate).format('DD/MM/YYYY')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{book.reader}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default DetailedReportPage

