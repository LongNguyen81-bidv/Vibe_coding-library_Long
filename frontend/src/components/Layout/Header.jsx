import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  HiOutlineMenuAlt3, 
  HiOutlineX, 
  HiOutlineBookOpen,
  HiOutlineLogin,
  HiOutlineUserAdd,
  HiOutlineLogout,
  HiOutlineUser,
  HiOutlineCollection,
  HiOutlinePlus,
  HiOutlineTag,
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiOutlineUserGroup
} from 'react-icons/hi'

const Header = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Trang chủ', path: '/', icon: HiOutlineBookOpen },
    { name: 'Danh sách sách', path: '/books', icon: HiOutlineCollection },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg' 
          : 'bg-transparent'
      }`}
    >
      <div className="section-container">
        <nav className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
              scrolled ? 'bg-primary-600' : 'bg-white/20 backdrop-blur-sm'
            } group-hover:scale-110`}>
              <HiOutlineBookOpen className={`w-6 h-6 ${scrolled ? 'text-white' : 'text-white'}`} />
            </div>
            <span className={`text-2xl font-display font-bold transition-colors ${
              scrolled ? 'text-primary-800' : 'text-white'
            }`}>
              LibraHub
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive(link.path)
                    ? scrolled 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'bg-white/20 text-white'
                    : scrolled 
                      ? 'text-gray-600 hover:bg-gray-100' 
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <link.icon className="w-5 h-5" />
                {link.name}
              </Link>
            ))}
            
            {/* Management Menu for Librarian/Admin */}
            {isAuthenticated && (user?.role === 'librarian' || user?.role === 'admin') && (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
                <Link
                  to="/books/add"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive('/books/add')
                      ? scrolled 
                        ? 'bg-primary-100 text-primary-700' 
                        : 'bg-white/20 text-white'
                      : scrolled 
                        ? 'text-gray-600 hover:bg-gray-100' 
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <HiOutlinePlus className="w-5 h-5" />
                  Thêm sách
                </Link>
                    <Link
                      to="/categories"
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        isActive('/categories')
                          ? scrolled 
                            ? 'bg-primary-100 text-primary-700' 
                            : 'bg-white/20 text-white'
                          : scrolled 
                            ? 'text-gray-600 hover:bg-gray-100' 
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <HiOutlineTag className="w-5 h-5" />
                      Thể loại
                    </Link>
                    <Link
                      to="/borrowings"
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        isActive('/borrowings')
                          ? scrolled 
                            ? 'bg-primary-100 text-primary-700' 
                            : 'bg-white/20 text-white'
                          : scrolled 
                            ? 'text-gray-600 hover:bg-gray-100' 
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <HiOutlineClipboardList className="w-5 h-5" />
                      Quản lý mượn trả
                    </Link>
                    <Link
                      to="/fines/management"
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        isActive('/fines/management')
                          ? scrolled 
                            ? 'bg-primary-100 text-primary-700' 
                            : 'bg-white/20 text-white'
                          : scrolled 
                            ? 'text-gray-600 hover:bg-gray-100' 
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <HiOutlineCurrencyDollar className="w-5 h-5" />
                      Quản lý khoản phạt
                    </Link>
                    {user?.role === 'admin' && (
                      <>
                        <Link
                          to="/fine-levels"
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                            isActive('/fine-levels')
                              ? scrolled 
                                ? 'bg-primary-100 text-primary-700' 
                                : 'bg-white/20 text-white'
                              : scrolled 
                                ? 'text-gray-600 hover:bg-gray-100' 
                                : 'text-white/80 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <HiOutlineCurrencyDollar className="w-5 h-5" />
                          Mức phạt
                        </Link>
                        <Link
                          to="/users"
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                            isActive('/users')
                              ? scrolled 
                                ? 'bg-primary-100 text-primary-700' 
                                : 'bg-white/20 text-white'
                              : scrolled 
                                ? 'text-gray-600 hover:bg-gray-100' 
                                : 'text-white/80 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <HiOutlineUserGroup className="w-5 h-5" />
                          Quản lý người dùng
                        </Link>
                      </>
                    )}
                  </div>
            )}
          </div>

          {/* Auth Buttons / User Menu */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {user?.role === 'reader' && (
                  <>
                    <Link
                      to="/borrowings/history"
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        isActive('/borrowings/history')
                          ? scrolled 
                            ? 'bg-primary-100 text-primary-700' 
                            : 'bg-white/20 text-white'
                          : scrolled 
                            ? 'text-gray-600 hover:bg-gray-100' 
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <HiOutlineClock className="w-5 h-5" />
                      Lịch sử mượn
                    </Link>
                    <Link
                      to="/fines"
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        isActive('/fines')
                          ? scrolled 
                            ? 'bg-primary-100 text-primary-700' 
                            : 'bg-white/20 text-white'
                          : scrolled 
                            ? 'text-gray-600 hover:bg-gray-100' 
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <HiOutlineCurrencyDollar className="w-5 h-5" />
                      Khoản phạt
                    </Link>
                  </>
                )}
                <Link
                  to="/profile"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    scrolled 
                      ? 'text-gray-700 hover:bg-gray-100' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <HiOutlineUser className="w-5 h-5" />
                  {user?.name}
                </Link>
                <button
                  onClick={logout}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    scrolled 
                      ? 'text-red-600 hover:bg-red-50' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <HiOutlineLogout className="w-5 h-5" />
                  Đăng xuất
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                    scrolled 
                      ? 'text-primary-600 hover:bg-primary-50' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <HiOutlineLogin className="w-5 h-5" />
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                    scrolled 
                      ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/25' 
                      : 'bg-white text-primary-700 hover:bg-white/90'
                  }`}
                >
                  <HiOutlineUserAdd className="w-5 h-5" />
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              scrolled 
                ? 'text-gray-700 hover:bg-gray-100' 
                : 'text-white hover:bg-white/10'
            }`}
          >
            {isOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineMenuAlt3 className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden absolute top-20 left-0 right-0 bg-white shadow-xl animate-slide-down">
            <div className="p-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive(link.path)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  {link.name}
                </Link>
              ))}
              
              {/* Management Menu for Librarian/Admin */}
              {isAuthenticated && (user?.role === 'librarian' || user?.role === 'admin') && (
                <>
                  <div className="border-t border-gray-100 pt-3 mt-3">
                    <p className="px-4 text-xs font-semibold text-gray-500 uppercase mb-2">Quản lý</p>
                    <Link
                      to="/books/add"
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive('/books/add')
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <HiOutlinePlus className="w-5 h-5" />
                      Thêm sách
                    </Link>
                    <Link
                      to="/categories"
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive('/categories')
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <HiOutlineTag className="w-5 h-5" />
                      Quản lý thể loại
                    </Link>
                    <Link
                      to="/borrowings"
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive('/borrowings')
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <HiOutlineClipboardList className="w-5 h-5" />
                      Quản lý mượn trả
                    </Link>
                    <Link
                      to="/fines/management"
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive('/fines/management')
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <HiOutlineCurrencyDollar className="w-5 h-5" />
                      Quản lý khoản phạt
                    </Link>
                    {user?.role === 'admin' && (
                      <>
                        <Link
                          to="/fine-levels"
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                            isActive('/fine-levels')
                              ? 'bg-primary-100 text-primary-700'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <HiOutlineCurrencyDollar className="w-5 h-5" />
                          Quản lý mức phạt
                        </Link>
                        <Link
                          to="/users"
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                            isActive('/users')
                              ? 'bg-primary-100 text-primary-700'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <HiOutlineUserGroup className="w-5 h-5" />
                          Quản lý người dùng
                        </Link>
                      </>
                    )}
                  </div>
                </>
              )}
              
              <div className="border-t border-gray-100 pt-3 mt-3 space-y-2">
                {isAuthenticated ? (
                  <>
                    {user?.role === 'reader' && (
                      <>
                        <Link
                          to="/borrowings/history"
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                            isActive('/borrowings/history')
                              ? 'bg-primary-100 text-primary-700'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <HiOutlineClock className="w-5 h-5" />
                          Lịch sử mượn
                        </Link>
                        <Link
                          to="/fines"
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                            isActive('/fines')
                              ? 'bg-primary-100 text-primary-700'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <HiOutlineCurrencyDollar className="w-5 h-5" />
                          Khoản phạt
                        </Link>
                      </>
                    )}
                    <Link
                      to="/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50"
                    >
                      <HiOutlineUser className="w-5 h-5" />
                      Hồ sơ cá nhân
                    </Link>
                    <button
                      onClick={() => { logout(); setIsOpen(false); }}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50"
                    >
                      <HiOutlineLogout className="w-5 h-5" />
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-primary-600 hover:bg-primary-50"
                    >
                      <HiOutlineLogin className="w-5 h-5" />
                      Đăng nhập
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
                    >
                      <HiOutlineUserAdd className="w-5 h-5" />
                      Đăng ký
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header



