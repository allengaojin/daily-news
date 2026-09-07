// 集中读取环境变量并提供默认值 —— 全站唯一的取配置入口，严禁在业务代码中硬编码地址

// 读取 Vite 环境变量（防御：env 可能缺失时全部回退默认值）
const env = import.meta.env ?? {}

/** 新闻 JSON 数据地址 */
export const NEWS_URL = env.VITE_NEWS_URL ?? './data/news.json'

/** Mock 数据基础目录 */
export const MOCK_BASE = env.VITE_MOCK_BASE ?? './data/mock/'

/** Mock 新闻数据完整地址 */
export const MOCK_NEWS_URL = `${MOCK_BASE}news.json`

/** 预留：真实后端 API 地址（空串表示未配置） */
export const API_BASE_URL = env.VITE_API_BASE_URL ?? ''

/** Mock 登录账号（演示用途） */
export const MOCK_USER = env.VITE_MOCK_USER ?? 'admin'

/** Mock 登录密码（演示用途） */
export const MOCK_PASSWORD = env.VITE_MOCK_PASSWORD ?? 'admin123'

/** Token 有效期（毫秒），解析失败时默认 2 小时 */
export const TOKEN_TTL_MS = Number(env.VITE_TOKEN_TTL_MS ?? 0) || 7200000

/** 数据来源强制开关：auto | network | cache | mock */
export const FORCE_SOURCE = env.VITE_FORCE_SOURCE ?? 'auto'

/** 是否处于强制来源模式（非 auto） */
export const isForcedSource = () => FORCE_SOURCE !== 'auto'

// 通过 URL query 支持一键演示：?source=mock 等价于强制离线演示模式
export const resolveForcedSource = () => {
  try {
    const qs = new URLSearchParams(window?.location?.search ?? '')
    const fromQuery = qs?.get?.('source') ?? null
    if (fromQuery === 'mock' || fromQuery === 'cache' || fromQuery === 'network') {
      return fromQuery
    }
  } catch {
    // 忽略 query 解析异常
  }
  return FORCE_SOURCE
}
