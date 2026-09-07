// 登录页：演示级 Mock 登录；读取 ?reason=expired 显示「登录已过期」提示
import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'
import { MOCK_USER } from '../constants/config.js'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const expiredNotice = searchParams?.get?.('reason') === 'expired'
  // 被守卫拦截前的目标地址（默认首页）
  const from = location?.state?.from ?? '/home'

  const handleSubmit = (e) => {
    e?.preventDefault?.()
    try {
      if (submitting) return
      setSubmitting(true)
      setError('')

      const result = login(username?.trim?.() ?? '', password ?? '')
      if (result?.ok) {
        navigate(from, { replace: true })
      } else {
        setError(result?.message ?? '登录失败，请重试')
        setSubmitting(false)
      }
    } catch {
      setError('登录过程中发生异常，请重试')
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🤖</div>
        <h1 className="login-title">AI 前沿观察</h1>
        <p className="login-subtitle">每日国内外 AI 发展新闻聚合</p>

        {expiredNotice ? (
          <div className="login-notice" role="alert">
            ⏰ 登录已过期，请重新登录
          </div>
        ) : null}

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>用户名</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e?.target?.value ?? '')}
              placeholder={`演示账号：${MOCK_USER}`}
              autoComplete="username"
              required
            />
          </label>
          <label className="login-field">
            <span>密码</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e?.target?.value ?? '')}
              placeholder="演示密码见 README"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? (
            <p className="login-error" role="alert">
              {error}
            </p>
          ) : null}

          <button className="btn btn-primary login-submit" type="submit" disabled={submitting}>
            {submitting ? '登录中…' : '登 录'}
          </button>
        </form>

        <p className="login-hint">演示环境：Token 有效期内免登录，过期后自动返回本页</p>
      </div>
    </div>
  )
}
