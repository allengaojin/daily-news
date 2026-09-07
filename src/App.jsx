// 应用入口：HashRouter（base:'./' 下相对路径 fetch 与 GitHub Pages 刷新均安全）
// 路由守卫（Token 过期时机①）：进入受保护路由前检查，过期即重定向登录页（不抛异常）
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import useAuth from './hooks/useAuth.js'
import { readAuth, isAuthExpired } from './utils/auth.js'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'

/** 受保护路由守卫：未登录/已过期 → 重定向登录页并携带过期原因 */
function RequireAuth({ children }) {
  const location = useLocation()
  const { isLoggedIn } = useAuth()

  if (!isLoggedIn) {
    let expired = false
    try {
      expired = isAuthExpired(readAuth())
    } catch {
      expired = false
    }
    const reason = expired ? '?reason=expired' : ''
    return <Navigate to={`/login${reason}`} replace state={{ from: location?.pathname ?? '/home' }} />
  }
  return children ?? null
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/home"
        element={
          <RequireAuth>
            <Home />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  )
}
