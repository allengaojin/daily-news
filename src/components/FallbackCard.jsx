// 数据完全获取失败时的兜底卡片（含手动重试），替代该区块内容
export default function FallbackCard({ message = '新闻数据加载失败，请检查网络后重试', onRetry }) {
  return (
    <div className="section-fallback" role="alert">
      <div className="section-fallback-icon">📰</div>
      <h3>新闻加载失败</h3>
      <p className="section-fallback-msg">{message}</p>
      <div className="section-fallback-actions">
        {typeof onRetry === 'function' ? (
          <button className="btn" onClick={onRetry}>
            重新加载
          </button>
        ) : null}
      </div>
    </div>
  )
}
