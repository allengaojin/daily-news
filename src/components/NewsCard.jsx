// 新闻卡片（纯展示组件）：所有字段取值一律使用可选链（?.）与空值合并（??）
import { relativeTime } from '../utils/time.js'

export default function NewsCard({ item, index }) {
  const title = item?.title ?? '（无标题）'
  const url = item?.url ?? '#'
  const summary = item?.summary ?? ''
  const source = item?.source ?? '未知来源'
  const pubDate = item?.pubDate ?? null
  const timeText = relativeTime(pubDate) ?? ''

  const href = /^https?:\/\//i.test(url) ? url : '#'

  return (
    <a className="news-card" href={href} target="_blank" rel="noopener noreferrer">
      <div className="news-card-head">
        <span className="news-card-index">{String((index ?? 0) + 1).padStart(2, '0')}</span>
        <span className="news-card-source">{source}</span>
        {item?.isFallback === true ? <span className="news-card-badge">历史演示</span> : null}
        {timeText ? <time className="news-card-time">{timeText}</time> : null}
      </div>
      <h3 className="news-card-title">{title}</h3>
      {summary ? <p className="news-card-summary">{summary}</p> : null}
    </a>
  )
}
