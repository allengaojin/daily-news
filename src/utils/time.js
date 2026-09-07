// 时间工具：统一按北京时间（UTC+8）计算「今天」，与抓取脚本 meta.date 保持一致

const CN_OFFSET_MS = 8 * 60 * 60 * 1000

/** 将任意时间点换算为北京时间的日期键（YYYY-MM-DD） */
export function toDateKey(dateInput) {
  try {
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput)
    if (Number.isNaN(d?.getTime?.())) return null
    const cn = new Date(d.getTime() + CN_OFFSET_MS)
    const y = cn.getUTCFullYear()
    const m = String(cn.getUTCMonth() + 1).padStart(2, '0')
    const day = String(cn.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  } catch {
    return null
  }
}

/** 今天（北京时间）的日期键 */
export function todayKey() {
  return toDateKey(new Date()) ?? ''
}

/** 判断 ISO 日期键是否为今天 */
export function isToday(dateKey) {
  try {
    return Boolean(dateKey) && dateKey === todayKey()
  } catch {
    return false
  }
}

/** 相对时间文案：「刚刚 / n 分钟前 / n 小时前 / n 天前 / 日期」 */
export function relativeTime(iso) {
  try {
    const t = new Date(iso)?.getTime?.()
    if (!t || Number.isNaN(t)) return ''
    const diff = Date.now() - t
    if (diff < 60_000) return '刚刚'
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
    if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)} 天前`
    return toDateKey(iso) ?? ''
  } catch {
    return ''
  }
}

/** 格式化展示日期（YYYY年M月D日） */
export function formatDate(dateKey) {
  try {
    const [y, m, d] = String(dateKey ?? '').split('-')
    if (!y || !m || !d) return '—'
    return `${y}年${Number(m)}月${Number(d)}日`
  } catch {
    return '—'
  }
}
