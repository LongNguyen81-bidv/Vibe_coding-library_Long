import { Link } from 'react-router-dom'
import { 
  HiOutlineBookOpen, 
  HiOutlineUserGroup, 
  HiOutlineClock,
  HiOutlineShieldCheck,
  HiOutlineChartBar,
  HiOutlineDeviceMobile,
  HiOutlineArrowRight,
  HiOutlineCheck,
  HiOutlineStar
} from 'react-icons/hi'

const LandingPage = () => {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        {/* Background */}
        <div className="absolute inset-0 bg-hero-pattern">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/95 via-primary-800/90 to-primary-700/85" />
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-secondary-400/10 rounded-full blur-3xl animate-float animation-delay-300" />
          <div className="absolute top-1/3 right-10 w-64 h-64 bg-primary-400/10 rounded-full blur-3xl animate-float animation-delay-500" />
          
          {/* Floating Books */}
          <div className="hidden xl:block absolute top-32 right-32 animate-float">
            <div className="w-20 h-28 bg-secondary-400 rounded-lg shadow-2xl transform rotate-12" />
          </div>
          <div className="hidden xl:block absolute bottom-40 right-48 animate-float animation-delay-200">
            <div className="w-16 h-24 bg-primary-300 rounded-lg shadow-2xl transform -rotate-6" />
          </div>
          <div className="hidden xl:block absolute top-48 right-64 animate-float animation-delay-400">
            <div className="w-14 h-20 bg-accent-400 rounded-lg shadow-2xl transform rotate-3" />
          </div>
        </div>

        <div className="relative z-10 section-container py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <HiOutlineStar className="w-5 h-5 text-secondary-400" />
                <span className="text-white/90 text-sm font-medium">Hệ thống thư viện số #1 Việt Nam</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-tight">
                Mở rộng 
                <span className="text-secondary-300"> tri thức</span>
                <br />
                chỉ với một cú click
              </h1>
              
              <p className="text-lg text-white/80 max-w-xl leading-relaxed">
                LibraHub mang đến trải nghiệm mượn sách hiện đại, tiện lợi. 
                Khám phá hàng ngàn đầu sách, quản lý việc mượn trả dễ dàng 
                mọi lúc mọi nơi.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="btn-accent text-lg px-8 py-4">
                  Bắt đầu ngay
                  <HiOutlineArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/books" className="btn bg-white/10 backdrop-blur-sm text-white border border-white/30 hover:bg-white/20 text-lg px-8 py-4">
                  Khám phá sách
                </Link>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-8 pt-6">
                {[
                  { value: '10,000+', label: 'Đầu sách' },
                  { value: '5,000+', label: 'Độc giả' },
                  { value: '100+', label: 'Thể loại' },
                ].map((stat, index) => (
                  <div 
                    key={stat.label} 
                    className="animate-slide-up"
                    style={{ animationDelay: `${(index + 2) * 100}ms` }}
                  >
                    <div className="text-3xl font-bold text-white">{stat.value}</div>
                    <div className="text-white/60">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Feature Cards */}
            <div className="hidden lg:block relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-80 h-80 bg-white/5 rounded-full blur-3xl" />
              </div>
              <div className="relative grid grid-cols-2 gap-4">
                {[
                  { 
                    icon: HiOutlineBookOpen, 
                    title: 'Mượn sách online', 
                    desc: 'Đặt mượn sách trực tuyến 24/7',
                    color: 'bg-gradient-to-br from-blue-500 to-blue-600'
                  },
                  { 
                    icon: HiOutlineClock, 
                    title: 'Theo dõi thời hạn', 
                    desc: 'Nhắc nhở trả sách tự động',
                    color: 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                  },
                  { 
                    icon: HiOutlineChartBar, 
                    title: 'Lịch sử đọc sách', 
                    desc: 'Thống kê chi tiết việc đọc',
                    color: 'bg-gradient-to-br from-purple-500 to-purple-600'
                  },
                  { 
                    icon: HiOutlineShieldCheck, 
                    title: 'Bảo mật cao', 
                    desc: 'Dữ liệu được bảo vệ an toàn',
                    color: 'bg-gradient-to-br from-orange-500 to-orange-600'
                  },
                ].map((feature, index) => (
                  <div 
                    key={feature.title}
                    className={`${index % 2 === 1 ? 'translate-y-8' : ''} animate-scale-in`}
                    style={{ animationDelay: `${(index + 3) * 100}ms` }}
                  >
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
                      <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                      <p className="text-white/60 text-sm">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/60 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="section-container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-primary-600 font-semibold mb-2 block">Tính năng nổi bật</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
              Trải nghiệm thư viện số hoàn hảo
            </h2>
            <p className="text-gray-600 text-lg">
              LibraHub được thiết kế với những tính năng hiện đại nhất, 
              giúp việc mượn và quản lý sách trở nên đơn giản hơn bao giờ hết.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: HiOutlineBookOpen,
                title: 'Danh mục sách phong phú',
                description: 'Hơn 10,000 đầu sách đa dạng thể loại từ văn học, khoa học đến kinh tế, công nghệ.',
                color: 'bg-blue-100 text-blue-600'
              },
              {
                icon: HiOutlineUserGroup,
                title: 'Cộng đồng độc giả',
                description: 'Kết nối với cộng đồng yêu sách, chia sẻ cảm nhận và khám phá sách hay.',
                color: 'bg-emerald-100 text-emerald-600'
              },
              {
                icon: HiOutlineClock,
                title: 'Quản lý thời hạn thông minh',
                description: 'Theo dõi thời hạn mượn sách, nhận thông báo nhắc nhở tự động qua email.',
                color: 'bg-orange-100 text-orange-600'
              },
              {
                icon: HiOutlineDeviceMobile,
                title: 'Truy cập mọi thiết bị',
                description: 'Giao diện responsive, sử dụng dễ dàng trên điện thoại, tablet hay máy tính.',
                color: 'bg-purple-100 text-purple-600'
              },
              {
                icon: HiOutlineChartBar,
                title: 'Báo cáo chi tiết',
                description: 'Thống kê chi tiết lịch sử mượn sách, theo dõi thói quen đọc của bạn.',
                color: 'bg-pink-100 text-pink-600'
              },
              {
                icon: HiOutlineShieldCheck,
                title: 'Bảo mật tuyệt đối',
                description: 'Hệ thống bảo mật hiện đại, đảm bảo an toàn thông tin người dùng.',
                color: 'bg-cyan-100 text-cyan-600'
              },
            ].map((feature, index) => (
              <div 
                key={feature.title}
                className="card-hover group"
              >
                <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 bg-white">
        <div className="section-container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-primary-600 font-semibold mb-2 block">Hướng dẫn</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
              Mượn sách chỉ với 4 bước
            </h2>
            <p className="text-gray-600 text-lg">
              Quy trình mượn sách đơn giản, nhanh chóng, tiết kiệm thời gian của bạn.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Đăng ký tài khoản',
                description: 'Tạo tài khoản miễn phí chỉ với email và thông tin cơ bản.',
              },
              {
                step: '02',
                title: 'Tìm kiếm sách',
                description: 'Duyệt danh mục sách phong phú hoặc tìm kiếm theo tên, tác giả.',
              },
              {
                step: '03',
                title: 'Đặt mượn sách',
                description: 'Chọn sách yêu thích và gửi yêu cầu mượn trực tuyến.',
              },
              {
                step: '04',
                title: 'Nhận sách',
                description: 'Đến thư viện nhận sách sau khi được xác nhận.',
              },
            ].map((item, index) => (
              <div key={item.step} className="relative">
                {/* Connector Line */}
                {index < 3 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary-200 to-transparent z-0" />
                )}
                
                <div className="relative z-10 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary-500/25">
                    <span className="text-3xl font-bold text-white">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-24 bg-gray-50">
        <div className="section-container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-primary-600 font-semibold mb-2 block">Đối tượng sử dụng</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
              Dành cho mọi đối tượng
            </h2>
            <p className="text-gray-600 text-lg">
              LibraHub phục vụ đa dạng đối tượng với các tính năng phù hợp.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Độc giả',
                emoji: '📚',
                features: [
                  'Mượn sách trực tuyến',
                  'Theo dõi lịch sử mượn',
                  'Gia hạn sách online',
                  'Thanh toán phạt dễ dàng',
                ],
                color: 'from-blue-500 to-blue-600',
                bgColor: 'bg-blue-50'
              },
              {
                title: 'Nhân viên thư viện',
                emoji: '👨‍💼',
                features: [
                  'Quản lý kho sách',
                  'Xác nhận mượn/trả',
                  'Theo dõi sách quá hạn',
                  'Báo cáo thống kê',
                ],
                color: 'from-emerald-500 to-emerald-600',
                bgColor: 'bg-emerald-50'
              },
              {
                title: 'Quản lý viên',
                emoji: '👨‍💻',
                features: [
                  'Quản lý tài khoản',
                  'Phân quyền người dùng',
                  'Cấu hình hệ thống',
                  'Báo cáo tổng hợp',
                ],
                color: 'from-purple-500 to-purple-600',
                bgColor: 'bg-purple-50'
              },
            ].map((user) => (
              <div key={user.title} className={`${user.bgColor} rounded-3xl p-8 relative overflow-hidden group`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 rounded-bl-full" />
                
                <div className="text-5xl mb-4">{user.emoji}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{user.title}</h3>
                
                <ul className="space-y-3">
                  {user.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-gray-700">
                      <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${user.color} flex items-center justify-center`}>
                        <HiOutlineCheck className="w-3 h-3 text-white" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/95 via-primary-800/90 to-primary-700/85" />
        </div>
        
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 section-container text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-6">
            Sẵn sàng khám phá thế giới sách?
          </h2>
          <p className="text-white/80 text-lg max-w-2xl mx-auto mb-10">
            Đăng ký ngay hôm nay để trở thành thành viên của LibraHub 
            và bắt đầu hành trình khám phá tri thức không giới hạn.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/register" className="btn-accent text-lg px-10 py-4">
              Đăng ký miễn phí
              <HiOutlineArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/books" className="btn bg-white/10 backdrop-blur-sm text-white border border-white/30 hover:bg-white/20 text-lg px-10 py-4">
              Xem danh sách sách
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage


