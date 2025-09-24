import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Lock, User, Eye, EyeOff, Shield, Users, CheckCircle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(username, password, showPassword)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-full blur-3xl animate-spin-slow"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }}></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Hero content */}
          <div className={cn(
            "text-white space-y-8 transition-all duration-1000 transform",
            isVisible ? "translate-x-0 opacity-100" : "-translate-x-8 opacity-0"
          )}>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-2xl p-2">
                    <img 
                      src="/logo/logo.png" 
                      alt="Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                    Hệ thống Quản lý
                  </h1>
                  <p className="text-xl lg:text-2xl text-blue-200 font-medium">
                    Văn bản & Điều hành Công việc
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-lg font-semibold text-emerald-300">Xã Khánh Cường</span>
                  </div>
                </div>
              </div>
              
              <p className="text-lg text-blue-100 leading-relaxed max-w-lg">
                Nền tảng quản lý văn bản và điều hành công việc hiện đại, 
                được thiết kế đặc biệt cho Công An Xã với quy trình làm việc tối ưu.
              </p>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                {[
                  { icon: FileText, title: "Quản lý văn bản", desc: "Số hóa và theo dõi văn bản" },
                  { icon: Users, title: "Phân công công việc", desc: "Giao việc và theo dõi tiến độ" },
                  { icon: Shield, title: "Bảo mật cao", desc: "Phân quyền theo vai trò" },
                  { icon: CheckCircle, title: "Báo cáo thống kê", desc: "Thống kê và phân tích dữ liệu" }
                ].map((feature, index) => (
                  <div 
                    key={index}
                    className={cn(
                      "flex items-start space-x-3 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-700 transform hover:bg-white/10 hover:scale-105",
                      isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                    )}
                    style={{ transitionDelay: `${300 + index * 100}ms` }}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{feature.title}</h3>
                      <p className="text-sm text-blue-200">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right side - Login form */}
          <div className={cn(
            "transition-all duration-1000 transform",
            isVisible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
          )}
          style={{ transitionDelay: "200ms" }}>
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-xl">
              <CardHeader className="text-center pb-8">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <User className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-800">
                  Đăng nhập hệ thống
                </CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  Nhập thông tin tài khoản để truy cập
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center">
                      <User className="w-4 h-4 mr-2 text-blue-600" />
                      Tên đăng nhập
                    </label>
                    <div className="relative group">
                      <User className={cn(
                        "absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors duration-200",
                        focusedField === 'username' ? "text-blue-600" : "text-gray-400"
                      )} />
                      <Input
                        type="text"
                        placeholder="Nhập tên đăng nhập"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onFocus={() => setFocusedField('username')}
                        onBlur={() => setFocusedField(null)}
                        className={cn(
                          "pl-12 h-12 text-base border-2 transition-all duration-200 bg-gray-50/50",
                          focusedField === 'username' 
                            ? "border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-500/20" 
                            : "border-gray-200 hover:border-gray-300"
                        )}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center">
                      <Lock className="w-4 h-4 mr-2 text-blue-600" />
                      Mật khẩu
                    </label>
                    <div className="relative group">
                      <Lock className={cn(
                        "absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors duration-200",
                        focusedField === 'password' ? "text-blue-600" : "text-gray-400"
                      )} />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Nhập mật khẩu"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        className={cn(
                          "pl-12 pr-12 h-12 text-base border-2 transition-all duration-200 bg-gray-50/50",
                          focusedField === 'password' 
                            ? "border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-500/20" 
                            : "border-gray-200 hover:border-gray-300"
                        )}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg shadow-sm animate-shake">
                      <div className="flex items-center">
                        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-xs font-bold">!</span>
                        </div>
                        <span className="font-medium">{error}</span>
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className={cn(
                      "w-full h-12 text-base font-semibold transition-all duration-300 transform group",
                      "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
                      "shadow-lg hover:shadow-xl hover:shadow-blue-500/25 hover:scale-[1.02]",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    )}
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                        Đang đăng nhập...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center group">
                        Đăng nhập
                        <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                      </div>
                    )}
                  </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="text-center mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center justify-center">
                      <Users className="w-4 h-4 mr-2 text-blue-600" />
                      Tài khoản demo
                    </h3>
                    <p className="text-xs text-gray-500">Chọn tài khoản để đăng nhập nhanh</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { role: "Admin", username: "admin", password: "admin123", color: "from-purple-500 to-purple-600", icon: Shield },
                      { role: "Văn thư", username: "secretary", password: "secretary123", color: "from-green-500 to-green-600", icon: FileText },
                      { role: "Trưởng Công An Xã", username: "teamleader", password: "team123", color: "from-red-500 to-red-600", icon: Users },
                      { role: "Phó Công An Xã", username: "deputy", password: "deputy123", color: "from-orange-500 to-orange-600", icon: Users },
                      { role: "Cán bộ", username: "officer", password: "officer123", color: "from-blue-500 to-blue-600", icon: User }
                    ].map((account, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setUsername(account.username)
                          setPassword(account.password)
                        }}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 group hover:shadow-md",
                          "bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50"
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r",
                            account.color
                          )}>
                            <account.icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-800">{account.role}</p>
                            <p className="text-xs text-gray-500">{account.username}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-700 text-center">
                      💡 <strong>Mẹo:</strong> Nhấp vào tài khoản demo để tự động điền thông tin đăng nhập
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}