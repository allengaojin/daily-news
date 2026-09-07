// 数据新鲜度徽标：meta.date 是否为今天（北京时间）
import { isToday, formatDate } from '../utils/time.js'

export default function FreshnessTag({ meta }) {
  const date = meta?.date ?? null
  const fresh = isToday(date)

  return (
    <span className={`freshness-tag ${fresh ? 'freshness-tag-fresh' : 'freshness-tag-old'}`} title={formatDate(date)}>
      {fresh ? '✅ 今日已更新' : `数据更新至 ${formatDate(date)}（每日自动更新）`}
    </span>
  )
}
