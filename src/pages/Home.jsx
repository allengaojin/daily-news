// 首页：头部 + 新鲜度徽标 + 离线横幅 + 国内/国外两个新闻区块（各自独立 Error Boundary）
import { useCallback, useState } from 'react'
import ErrorBoundary from '../components/ErrorBoundary.jsx'
import NewsSection from '../components/NewsSection.jsx'
import OfflineBanner from '../components/OfflineBanner.jsx'
import FreshnessTag from '../components/FreshnessTag.jsx'
import useNews from '../hooks/useNews.js'
import useAuth from '../hooks/useAuth.js'
import { APP_VERSION } from '../constants/version.js'

export default function Home() {
  const { auth, logout } = useAuth()
  const { status, data, source, retryMsg, reload } = useNews()
  // 手动重试：自增 key 重挂载 ErrorBoundary 子树 + 重新拉取数据
  const [refreshKey, setRefreshKey] = useState(0)

  const handleReload = useCallback(() => {
    setRefreshKey((k) => k + 1)
    reload?.()
  }, [reload])

  const meta = data?.meta ?? {}
  const username = auth?.username ?? ''

  return (
    <div className="home">
      <header className="site-header">
        <div className="site-header-inner">
          <div className="site-brand">
            <span className="site-logo">🤖</span>
            <div>
              <h1 className="site-title">AI 前沿观察</h1>
              <p className="site-subtitle">每日国内外 AI 发展新闻 · 共 10 篇</p>
            </div>
          </div>
          <div className="site-actions">
            {username ? <span className="site-user">👤 {username}</span> : null}
            <button className="btn btn-ghost" onClick={logout}>
              退出登录
            </button>
          </div>
        </div>
      </header>

      <main className="site-main">
        <div className="site-meta-row">
          <FreshnessTag meta={meta} />
          <span className="site-version">v{APP_VERSION}</span>
        </div>

        <OfflineBanner source={source} cacheAt={null} />

        <div className="news-columns">
          <ErrorBoundary key={`domestic-${refreshKey}`} title="国内新闻模块异常">
            <NewsSection
              region="domestic"
              status={status}
              data={data}
              retryMsg={retryMsg}
              onReload={handleReload}
            />
          </ErrorBoundary>
          <ErrorBoundary key={`abroad-${refreshKey}`} title="海外新闻模块异常">
            <NewsSection
              region="abroad"
              status={status}
              data={data}
              retryMsg={retryMsg}
              onReload={handleReload}
            />
          </ErrorBoundary>
        </div>
      </main>

      <footer className="site-footer">
        <p>新闻来源：TechCrunch / The Verge / VentureBeat / 机器之心 / 量子位 / IT之家 等公开 RSS</p>
        <p>每日自动更新 · 演示项目 · 仅作学习交流使用</p>
      </footer>
    </div>
  )
}
