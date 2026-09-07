// 新闻区块：异步数据组件样板 —— 必须被 <ErrorBoundary> 包裹使用
// 三态渲染：加载（骨架屏）/ 就绪（新闻列表）/ 出错（兜底卡片）
import Spinner from './Spinner.jsx'
import NewsCard from './NewsCard.jsx'
import FallbackCard from './FallbackCard.jsx'

const REGION_META = {
  domestic: { title: '国内 AI 动态', desc: '国内人工智能领域最新进展' },
  abroad: { title: '海外 AI 前沿', desc: '国际人工智能领域最新进展' },
}

export default function NewsSection({ region, status, data, retryMsg, onReload }) {
  const meta = REGION_META?.[region] ?? REGION_META?.domestic
  const items = data?.[region] ?? []

  // 渲染期防御：items 异常结构一律视为空数组
  const safeItems = Array.isArray(items) ? items : []

  let body = null
  if (status === 'loading') {
    body = <Spinner text={retryMsg ?? '加载中…'} />
  } else if (status === 'error') {
    body = <FallbackCard onRetry={onReload} />
  } else {
    body = safeItems.length > 0 ? (
      <div className="news-list">
        {safeItems.map((item, i) => (
          <NewsCard key={item?.id ?? `${region}-${i}`} item={item} index={i} />
        ))}
      </div>
    ) : (
      <FallbackCard message="暂无该区域新闻数据" onRetry={onReload} />
    )
  }

  return (
    <section className="news-section">
      <div className="news-section-head">
        <h2 className="news-section-title">{meta?.title ?? '新闻'}</h2>
        <p className="news-section-desc">{meta?.desc ?? ''}</p>
      </div>
      {body}
    </section>
  )
}
