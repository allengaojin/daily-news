// 认证纯函数：签发/校验/解析 Token（无副作用，便于测试）
// Token 结构：{ token, username, expiresAt }（expiresAt 为毫秒时间戳）
import storage from './storage.js'
import { TOKEN_TTL_MS } from '../constants/config.js'

const AUTH_KEY = 'auth'

/** 生成随机 Token（演示用，非加密安全实现） */
function generateToken() {
  try {
    const rand = crypto?.getRandomValues?.(new Uint8Array(16)) ?? new Uint8Array(16)
    return Array.from(rand, (b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return `tk-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

/**
 * 签发 Token 并持久化。返回完整 auth 对象；任何异常返回 null。
 * @param {string} username 用户名
 * @param {number} ttlMs 有效期（默认取环境变量 TOKEN_TTL_MS）
 */
export function issueToken(username, ttlMs = TOKEN_TTL_MS) {
  try {
    const auth = {
      token: generateToken(),
      username: String(username ?? ''),
      expiresAt: Date.now() + Number(ttlMs ?? 0),
    }
    if (!storage.setJSON(AUTH_KEY, auth)) return null
    return auth
  } catch {
    return null
  }
}

/** 读取当前 auth 对象，不存在或损坏返回 null */
export function readAuth() {
  try {
    const auth = storage.getJSON(AUTH_KEY)
    if (!auth?.token || typeof auth?.expiresAt !== 'number') return null
    return auth
  } catch {
    return null
  }
}

/** 判断 auth 是否已过期（不存在视为过期） */
export function isAuthExpired(auth = readAuth()) {
  try {
    return !auth?.expiresAt || auth.expiresAt <= Date.now()
  } catch {
    return true
  }
}

/** 清除登录态 */
export function clearAuth() {
  try {
    storage.remove(AUTH_KEY)
  } catch {
    // 忽略
  }
}

export { AUTH_KEY }
