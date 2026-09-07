// 错误边界（类组件）：捕获子树渲染期异常，渲染兜底 UI，杜绝白屏
// 用法：每个异步数据组件必须单独包裹：
//   <ErrorBoundary key={refreshKey}><NewsSection region="domestic" /></ErrorBoundary>
// key 变化会重挂载整棵子树，等价于「重试复位」
import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    // 渲染期抛出异常 → 进入兜底态
    return { error: error ?? new Error('未知渲染错误') }
  }

  componentDidCatch(error, info) {
    // 只记录日志，绝不向上抛出
    try {
      console.error('[ErrorBoundary]', error?.message ?? error, info?.componentStack ?? '')
    } catch {
      // 忽略
    }
  }

  handleReset = () => {
    try {
      this.setState({ error: null })
      // 兜底重试：若父级提供了 onReset 回调（通常是重新拉取数据），一并触发
      this.props?.onReset?.()
    } catch {
      // 忽略
    }
  }

  render() {
    const { children, fallback, title } = this.props
    if (this.state.error) {
      if (fallback) {
        return typeof fallback === 'function' ? fallback(this.state.error, this.handleReset) : fallback
      }
      return (
        <div className="section-fallback" role="alert">
          <div className="section-fallback-icon">⚠️</div>
          <h3>{title ?? '该模块暂时无法显示'}</h3>
          <p className="section-fallback-msg">{this.state.error?.message ?? '发生未知错误'}</p>
          <div className="section-fallback-actions">
            <button className="btn" onClick={this.handleReset}>
              重试
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                try {
                  window?.location?.assign?.('#/home')
                } catch {
                  // 忽略
                }
              }}
            >
              返回首页
            </button>
          </div>
        </div>
      )
    }
    return children ?? null
  }
}
