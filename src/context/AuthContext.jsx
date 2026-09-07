// 全局登录态管理：
// - Mock 登录（凭据来自环境变量）
// - Token 过期四时机检测：路由守卫 / http 拦截器事件 / 定时器 / 页面回前台复查
// - 过期处理 = 清除登录态 + 跳转登录页（绝不抛异常）
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { issueToken, readAuth, isAuthExpired, clearAuth } from '../utils/auth.js'
import { onUnauthorized } from '../api/http.js'
import { MOCK_USER, MOCK_PASSWORD } from '../constants/config.js'

const CHECK_INTERVAL_MS = 10_000 // 定时器检查周期

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const navigateRef = useRef(navigate)
  // 在 effect 中同步最新 navigate（避免渲染期访问 ref）
  useEffect(() => {
    navigateRef.current = navigate
  }, [navigate])

  const [auth, setAuth] = useState(() => {
    try {
      const stored = readAuth()
      return stored && !isAuthExpired(stored) ? stored : null
    } catch {
      return null
    }
  })

  /** Token 过期处理：清登录态 + 跳转登录页（唯一出口，不抛异常） */
  const handleExpired = useCallback(() => {
    try {
      clearAuth()
      setAuth(null)
      navigateRef.current?.('/login?reason=expired', { replace: true })
    } catch {
      // 导航失败不崩溃
    }
  }, [])

  /** 登录：校验 Mock 凭据，签发 Token；失败返回错误文案 */
  const login = useCallback((username, password) => {
    try {
      const ok = username === MOCK_USER && password === MOCK_PASSWORD
      if (!ok) return { ok: false, message: '用户名或密码错误（演示账号见 README）' }
      const issued = issueToken(username)
      if (!issued) return { ok: false, message: '浏览器存储不可用，无法保存登录状态' }
      setAuth(issued)
      return { ok: true }
    } catch {
      return { ok: false, message: '登录过程中发生异常，请重试' }
    }
  }, [])

  /** 登出 */
  const logout = useCallback(() => {
    try {
      clearAuth()
      setAuth(null)
      navigateRef.current?.('/login', { replace: true })
    } catch {
      // 忽略
    }
  }, [])

  // 时机②：订阅 http 拦截器发出的鉴权失效事件（请求前预检 / HTTP 401）
  useEffect(() => {
    return onUnauthorized(({ why }) => {
      handleExpired()
      if (why === 'http401') console.warn('[auth] 服务器返回 401，已跳转登录页')
    })
  }, [handleExpired])

  // 时机④a：定时器轮询 —— 捕获「挂着页面等过期」的场景
  useEffect(() => {
    if (!auth) return undefined
    const timer = setInterval(() => {
      try {
        if (isAuthExpired(readAuth())) handleExpired()
      } catch {
        // 忽略
      }
    }, CHECK_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [auth, handleExpired])

  // 时机④b：页面从后台回到前台时立即复查（系统休眠等场景）
  useEffect(() => {
    const onVisible = () => {
      try {
        if (document?.visibilityState === 'visible' && isAuthExpired(readAuth())) {
          handleExpired()
        }
      } catch {
        // 忽略
      }
    }
    try {
      document?.addEventListener?.('visibilitychange', onVisible)
    } catch {
      // 忽略
    }
    return () => {
      try {
        document?.removeEventListener?.('visibilitychange', onVisible)
      } catch {
        // 忽略
      }
    }
  }, [handleExpired])

  const value = useMemo(
    () => ({ auth, isLoggedIn: Boolean(auth), login, logout, handleExpired }),
    [auth, login, logout, handleExpired],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
