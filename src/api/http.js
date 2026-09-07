// 统一请求封装：拦截器 + 超时 + 重试3次（指数退避）+ 三级降级（网络→缓存→mock）
// 核心原则：绝不向调用方 throw —— 全部失败返回 { ok:false }，由 UI 层兜底渲染
import storage from '../utils/storage.js'
import { isAuthExpired, clearAuth } from '../utils/auth.js'

const CACHE_PREFIX = 'httpCache:'

// ------------------------------------------------------------
// 事件总线：Token 过期通知（AuthContext 订阅后执行跳转，绝不抛异常）
// ------------------------------------------------------------
const listeners = new Set()

/** 订阅鉴权失效事件（过期/401），返回取消订阅函数 */
export function onUnauthorized(callback) {
  try {
    if (typeof callback === 'function') listeners.add(callback)
  } catch {
    // 忽略
  }
  return () => {
    try {
      listeners.delete(callback)
    } catch {
      // 忽略
    }
  }
}

function notifyUnauthorized(why) {
  try {
    clearAuth() // 清登录态
    listeners.forEach((cb) => {
      try {
        cb({ why })
      } catch {
        // 单个订阅者异常不影响其他订阅者
      }
    })
  } catch {
    // 忽略
  }
}

// ------------------------------------------------------------
// 工具
// ------------------------------------------------------------
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** 指数退避：400ms * 2^attempt + 随机抖动(≤200ms) */
function backoff(attempt) {
  return 400 * 2 ** attempt + Math.random() * 200
}

/** 安全解析 JSON，失败返回 null */
function safeParse(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/** 生成请求的缓存键 */
function cacheKey(url) {
  return `${CACHE_PREFIX}${String(url ?? '')}`
}

/** 读取缓存（含解析防御） */
function readCache(url) {
  try {
    const hit = storage.getJSON(cacheKey(url))
    return hit?.data ? hit : null
  } catch {
    return null
  }
}

/** 写入缓存（静默失败） */
function writeCache(url, data) {
  try {
    storage.setJSON(cacheKey(url), { at: Date.now(), data })
  } catch {
    // 忽略
  }
}

/**
 * 统一请求入口
 * @param {object} cfg
 * @param {string} cfg.url 请求地址（来自环境变量，严禁硬编码）
 * @param {string} [cfg.method='GET']
 * @param {number} [cfg.retries=3] 失败重试次数（指数退避）
 * @param {number} [cfg.timeoutMs=8000] 单次超时（毫秒）
 * @param {string} [cfg.mockUrl] 本地 Mock 数据地址（最终兜底）
 * @param {boolean} [cfg.useCache=true] 是否启用缓存降级
 * @param {boolean} [cfg.requireAuth=false] 是否需要登录态（请求前预检 Token）
 * @param {function} [cfg.onRetry] 重试回调 (attempt, total) => void，用于 UI 提示
 * @returns {Promise<{ok:boolean, data?:any, source?:string, code?:string, error?:Error}>}
 *          source: 'network' | 'cache' | 'mock'
 */
export async function request(cfg = {}) {
  const {
    url,
    method = 'GET',
    retries = 3,
    timeoutMs = 8000,
    mockUrl = null,
    useCache = true,
    requireAuth = false,
    onRetry = null,
  } = cfg

  if (!url) {
    return { ok: false, code: 'NO_URL' }
  }

  // ---- 拦截器① 请求前：Token 过期预检 ----
  if (requireAuth && isAuthExpired()) {
    notifyUnauthorized('expired')
    return { ok: false, code: 'UNAUTHORIZED' }
  }

  // ---- 带重试的网络请求 ----
  let lastError = null
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, {
        method,
        signal: controller.signal,
        cache: 'no-cache', // 绕过静态托管平台缓存，保证拿到最新数据
      })

      if (res.status === 401) {
        // ---- 拦截器② 响应：401 视为登录态失效 ----
        notifyUnauthorized('http401')
        return { ok: false, code: 'UNAUTHORIZED' }
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const data = safeParse(await res.text())
      if (data == null) {
        throw new Error('RESPONSE_PARSE_FAILED')
      }

      if (useCache) writeCache(url, data)
      return { ok: true, data, source: 'network' }
    } catch (e) {
      lastError = e
      clearTimeout(timer)
      if (attempt < retries) {
        try {
          onRetry?.(attempt + 1, retries)
        } catch {
          // 回调异常不影响重试
        }
        await sleep(backoff(attempt))
      }
    }
  }

  // ---- 降级① 本地缓存（上次成功的真实数据） ----
  if (useCache) {
    const hit = readCache(url)
    if (hit?.data) {
      return { ok: true, data: hit.data, source: 'cache', cacheAt: hit.at }
    }
  }

  // ---- 降级② 本地静态 Mock 文件（离线演示模式） ----
  if (mockUrl) {
    try {
      const res = await fetch(mockUrl, { cache: 'no-cache' })
      if (res.ok) {
        const data = safeParse(await res.text())
        if (data != null) {
          return { ok: true, data, source: 'mock' }
        }
      }
    } catch {
      // 文件也读不到，进入内置 mock 分支
    }
  }

  // ---- 降级③ 内置 Mock（打包进 JS bundle，完全离线也可用） ----
  try {
    const { MOCK_NEWS } = await import('../mock/mockNews.js')
    if (MOCK_NEWS) {
      return { ok: true, data: MOCK_NEWS, source: 'mock' }
    }
  } catch {
    // 内置 mock 导入异常，进入最终失败分支
  }

  return { ok: false, code: 'ALL_FAILED', error: lastError }
}

export default request
