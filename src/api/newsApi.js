// 新闻业务 API：全站唯一获取新闻数据的入口
import { request } from './http.js'
import { NEWS_URL, MOCK_NEWS_URL, resolveForcedSource } from '../constants/config.js'
import storage from '../utils/storage.js'

const NEWS_CACHE_KEY = 'newsCache'

/**
 * 获取每日 AI 新闻（三级降级：网络 → 缓存 → mock）
 * 永不 throw；全部失败返回 { ok:false }
 * @param {function} [onRetry] 重试进度回调 (attempt, total) => void
 */
export async function getNews(onRetry = null) {
  try {
    const forced = resolveForcedSource()

    // 强制来源：network（跳过缓存与 mock 降级）
    if (forced === 'network') {
      return await request({
        url: NEWS_URL,
        retries: 3,
        timeoutMs: 8000,
        useCache: false,
        onRetry,
      })
    }

    // 强制来源：cache（直接读缓存）
    if (forced === 'cache') {
      try {
        const hit = storage.getJSON(NEWS_CACHE_KEY)
        if (hit?.data) return { ok: true, data: hit.data, source: 'cache', cacheAt: hit.at }
      } catch {
        // 缓存不可用，继续走正常链路
      }
    }

    // 强制来源：mock（直接读 mock 文件，失败时用内置 mock，演示离线模式）
    if (forced === 'mock') {
      try {
        const res = await fetch(MOCK_NEWS_URL, { cache: 'no-cache' })
        if (res.ok) {
          const data = await res.json()
          return { ok: true, data, source: 'mock' }
        }
      } catch {
        // 文件读不到时用内置 mock
      }
      try {
        const { MOCK_NEWS } = await import('../mock/mockNews.js')
        if (MOCK_NEWS) return { ok: true, data: MOCK_NEWS, source: 'mock' }
      } catch {
        // 落入最终兜底
      }
    }

    // 正常链路：网络 → 缓存 → mock（缓存键用 NEWS_CACHE_KEY 以便强制 cache 模式也能命中）
    const result = await request({
      url: NEWS_URL,
      retries: 3,
      timeoutMs: 8000,
      mockUrl: MOCK_NEWS_URL,
      useCache: true,
      onRetry,
    })

    // 网络成功后同步业务缓存（供 VITE_FORCE_SOURCE=cache 直接读取）
    if (result?.ok && result?.source === 'network') {
      try {
        storage.setJSON(NEWS_CACHE_KEY, { at: Date.now(), data: result.data })
      } catch {
        // 忽略
      }
    }
    return result
  } catch (e) {
    // 终极兜底：任何未预期异常都转为失败对象，绝不 throw 到 UI 层
    return { ok: false, code: 'UNEXPECTED', error: e }
  }
}

export default getNews
