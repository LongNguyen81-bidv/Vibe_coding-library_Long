import { Link } from 'react-router-dom'
import { 
  HiOutlineBookOpen,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker
} from 'react-icons/hi'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    'Khám phá': [
      { name: 'Danh sách sách', path: '/books' },
      { name: 'Thể loại', path: '/categories' },
      { name: 'Sách phổ biến', path: '/popular' },
    ],
    'Tài khoản': [
      { name: 'Đăng nhập', path: '/login' },
      { name: 'Đăng ký', path: '/register' },
      { name: 'Lịch sử mượn', path: '/history' },
    ],
    'Hỗ trợ': [
      { name: 'Hướng dẫn', path: '/guide' },
      { name: 'Câu hỏi thường gặp', path: '/faq' },
      { name: 'Liên hệ', path: '/contact' },
    ],
  }

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white">
      {/* Main Footer */}
      <div className="section-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
                <HiOutlineBookOpen className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-display font-bold">LibraHub</span>
            </Link>
            <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
              Hệ thống quản lý thư viện hiện đại, giúp bạn dễ dàng mượn và quản lý sách 
              trực tuyến mọi lúc mọi nơi.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-400">
                <HiOutlineMail className="w-5 h-5 text-primary-400" />
                <span>support@librahub.vn</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <HiOutlinePhone className="w-5 h-5 text-primary-400" />
                <span>1900 1234</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <HiOutlineLocationMarker className="w-5 h-5 text-primary-400" />
                <span>123 Đường Sách, Q.1, TP.HCM</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-semibold text-lg mb-4">{title}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.path}>
                    <Link 
                      to={link.path}
                      className="text-gray-400 hover:text-primary-400 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="section-container py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © {currentYear} LibraHub. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link to="/privacy" className="hover:text-primary-400 transition-colors">
                Chính sách bảo mật
              </Link>
              <Link to="/terms" className="hover:text-primary-400 transition-colors">
                Điều khoản sử dụng
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer


