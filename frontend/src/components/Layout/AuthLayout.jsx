import { Outlet, Link } from 'react-router-dom'
import { HiOutlineBookOpen, HiOutlineArrowLeft } from 'react-icons/hi'

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-hero-pattern">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/90 via-primary-800/80 to-primary-700/70" />
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-32 right-20 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl animate-float animation-delay-300" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-secondary-400/10 rounded-full blur-3xl animate-float animation-delay-500" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <HiOutlineBookOpen className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-display font-bold text-white">LibraHub</span>
          </Link>

          {/* Main Content */}
          <div className="space-y-8">
            <div className="max-w-md">
              <h1 className="text-4xl font-display font-bold text-white mb-6 leading-tight">
                Khám phá thế giới 
                <span className="text-secondary-300"> tri thức</span> 
                <br />ngay hôm nay
              </h1>
              <p className="text-white/80 text-lg leading-relaxed">
                Hệ thống thư viện số hiện đại giúp bạn tiếp cận hàng ngàn đầu sách 
                một cách dễ dàng và tiện lợi.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 max-w-md">
              {[
                { number: '10K+', label: 'Đầu sách' },
                { number: '5K+', label: 'Độc giả' },
                { number: '100+', label: 'Thể loại' },
                { number: '24/7', label: 'Hỗ trợ' },
              ].map((stat, index) => (
                <div 
                  key={stat.label}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="text-2xl font-bold text-white">{stat.number}</div>
                  <div className="text-white/70 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Quote */}
          <div className="max-w-md">
            <blockquote className="border-l-4 border-secondary-400 pl-4">
              <p className="text-white/90 italic mb-2">
                "Sách là người bạn trung thành nhất. Khi tất cả đã quay lưng, sách vẫn ở bên bạn."
              </p>
              <cite className="text-white/60 text-sm">— Ngạn ngữ</cite>
            </blockquote>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Back Button */}
        <div className="p-6">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <HiOutlineArrowLeft className="w-5 h-5" />
            <span>Về trang chủ</span>
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>

        {/* Mobile Logo */}
        <div className="lg:hidden p-6 flex justify-center">
          <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-primary-600 transition-colors">
            <HiOutlineBookOpen className="w-5 h-5" />
            <span className="font-semibold">LibraHub</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout



