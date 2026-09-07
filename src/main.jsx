// 应用入口：第 0 行逻辑先执行版本检查（需求硬性条款），再挂载根部错误边界
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { checkAppVersion } from './utils/versionCheck.js'
import RootBoundary from './components/RootBoundary.jsx'
import App from './App.jsx'
import './styles/index.css'

// 启动时检查 localStorage.app_version：不匹配 → 清空全部旧存储并刷新页面
checkAppVersion()

try {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    // 兜底：根节点缺失时写入可见提示，避免静默白屏
    document.body.innerHTML =
      '<div style="padding:40px;text-align:center;font-family:sans-serif">页面初始化失败：缺少根节点</div>'
  } else {
    const root = createRoot(rootElement)
    root.render(
      <StrictMode>
        <RootBoundary>
          <App />
        </RootBoundary>
      </StrictMode>,
    )
  }
} catch (e) {
  // 挂载失败的最后一道防线：显示可读错误而非白屏
  console.error('[main] 应用挂载失败', e)
  try {
    document.body.innerHTML = `<div style="padding:40px;text-align:center;font-family:sans-serif">
      <h2>应用启动失败</h2><p>${String(e?.message ?? e ?? '未知错误')}</p>
      <button onclick="location.reload()">刷新页面</button></div>`
  } catch {
    // 忽略
  }
}
