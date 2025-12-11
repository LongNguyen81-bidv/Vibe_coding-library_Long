import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { booksAPI, categoriesAPI } from '../services/api'
import { 
  HiOutlineSearch,
  HiOutlineBookOpen,
  HiOutlineChevronLeft,
  HiOutlineChevronRight
} from 'react-icons/hi'

const BookListPage = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [books, setBooks] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(true)
  
  // Filter states
  const [searchInput, setSearchInput] = useState(searchParams.get('keyword') || '')
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'name')
  const [order, setOrder] = useState(searchParams.get('order') || 'ASC')
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1)
  
  // Pagination info
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchBooks()
  }, [page, categoryId, sortBy, order, keyword])

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true)
      const response = await categoriesAPI.getAll()
      if (response.data.success) {
        setCategories(response.data.data)
      }
    } catch (error) {
      console.error('Fetch categories error:', error)
    } finally {
      setLoadingCategories(false)
    }
  }

  const fetchBooks = async () => {
    try {
      setLoading(true)
      
      const params = {
        page,
        limit: 10,
        sortBy,
        order
      }
      
      if (keyword.trim()) {
        params.keyword = keyword.trim()
      }
      
      if (categoryId) {
        params.categoryId = categoryId
      }

      const response = await booksAPI.getAll(params)
      
      if (response.data.success) {
        setBooks(response.data.data)
        setPagination(response.data.pagination)
        
        // Update URL params
        const newParams = new URLSearchParams()
        if (keyword.trim()) newParams.set('keyword', keyword.trim())
        if (categoryId) newParams.set('categoryId', categoryId)
        if (sortBy !== 'name') newParams.set('sortBy', sortBy)
        if (order !== 'ASC') newParams.set('order', order)
        if (page > 1) newParams.set('page', page.toString())
        setSearchParams(newParams)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể tải danh sách sách'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setKeyword(searchInput.trim())
    setPage(1)
  }

  const handleCategoryChange = (e) => {
    const newCategoryId = e.target.value
    setCategoryId(newCategoryId)
    setPage(1)
  }

  const handleSortChange = (e) => {
    const value = e.target.value
    if (value === 'name-asc') {
      setSortBy('name')
      setOrder('ASC')
    } else if (value === 'name-desc') {
      setSortBy('name')
      setOrder('DESC')
    } else if (value === 'publishYear-desc') {
      setSortBy('publishYear')
      setOrder('DESC')
    } else if (value === 'borrowCount-desc') {
      setSortBy('borrowCount')
      setOrder('DESC')
    }
    setPage(1)
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBookClick = (bookId) => {
    navigate(`/books/${bookId}`)
  }

  const getSortValue = () => {
    if (sortBy === 'name' && order === 'ASC') return 'name-asc'
    if (sortBy === 'name' && order === 'DESC') return 'name-desc'
    if (sortBy === 'publishYear' && order === 'DESC') return 'publishYear-desc'
    if (sortBy === 'borrowCount' && order === 'DESC') return 'borrowCount-desc'
    return 'name-asc'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Danh Sách Sách</h1>
        <p className="text-gray-600">Khám phá kho sách phong phú của thư viện</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="md:col-span-2">
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(e)
                  }
                }}
                placeholder="Tìm kiếm theo tên sách hoặc tác giả..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </form>

          {/* Category Filter */}
          <div>
            <select
              value={categoryId}
              onChange={handleCategoryChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tất cả thể loại</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <select
              value={getSortValue()}
              onChange={handleSortChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="name-asc">Tên (A-Z)</option>
              <option value="name-desc">Tên (Z-A)</option>
              <option value="publishYear-desc">Năm xuất bản (Mới nhất)</option>
              <option value="borrowCount-desc">Phổ biến nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Books List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : books.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
          <HiOutlineBookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {keyword || categoryId ? 'Không tìm thấy sách phù hợp' : 'Chưa có sách nào'}
          </h3>
          <p className="text-gray-600">
            {keyword || categoryId 
              ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc' 
              : 'Hãy thêm sách mới vào hệ thống'}
          </p>
        </div>
      ) : (
        <>
          {/* Books Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {books.map((book) => (
              <div
                key={book.id}
                onClick={() => handleBookClick(book.id)}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <HiOutlineBookOpen className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors">
                      {book.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">Tác giả: {book.author}</p>
                    <p className="text-xs text-gray-500">Năm: {book.publishYear}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Thể loại:</span>
                    <span className="font-medium text-gray-900">{book.category.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Có sẵn:</span>
                    <span className={`font-medium ${book.availableQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {book.availableQuantity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Đang mượn:</span>
                    <span className="font-medium text-gray-900">{book.borrowedQuantity}</span>
                  </div>
                  {book.borrowCount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Lượt mượn:</span>
                      <span className="font-medium text-primary-600">{book.borrowCount}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total} sách
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <HiOutlineChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => {
                      // Show first page, last page, current page, and pages around current
                      if (
                        pageNum === 1 ||
                        pageNum === pagination.totalPages ||
                        (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-1 border rounded-lg transition-colors ${
                              pageNum === pagination.page
                                ? 'bg-primary-600 text-white border-primary-600'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      } else if (
                        pageNum === pagination.page - 2 ||
                        pageNum === pagination.page + 2
                      ) {
                        return <span key={pageNum} className="px-2">...</span>
                      }
                      return null
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <HiOutlineChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default BookListPage

