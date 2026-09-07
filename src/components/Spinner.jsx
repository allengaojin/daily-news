// 骨架屏加载态
export default function Spinner({ text = '加载中…' }) {
  return (
    <div className="news-skeleton" aria-busy="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line" />
          <div className="skeleton-line skeleton-short" />
        </div>
      ))}
      <div className="skeleton-hint">{text}</div>
    </div>
  )
}
