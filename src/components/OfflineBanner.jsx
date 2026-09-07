// 数据来源横幅：按 http.js 返回的 source 显示对应提示
// - network：正常，不显示
// - cache  ：网络不可用，展示本地缓存
// - mock   ：当前为离线演示模式（需求硬性文案）
import { relativeTime } from '../utils/time.js'

export default function OfflineBanner({ source, cacheAt }) {
  if (!source || source === 'network') return null

  const isMock = source === 'mock'
  const timeText = relativeTime(cacheAt ?? null)

  return (
    <div className={`offline-banner ${isMock ? 'offline-banner-mock' : 'offline-banner-cache'}`} role="status">
      <span className="offline-banner-icon">{isMock ? '📡' : '🗂️'}</span>
      {isMock ? (
        <span>
          <strong>当前为离线演示模式</strong>
          ：网络连接失败，正在展示内置演示数据（非实时内容）
        </span>
      ) : (
        <span>
          网络不可用，正在展示本地缓存内容
          {timeText ? `（更新于 ${timeText}）` : ''}
        </span>
      )}
    </div>
  )
}
