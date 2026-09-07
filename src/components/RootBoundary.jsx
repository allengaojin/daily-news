// 根部错误边界：整页级兜底 UI（任何子树未捕获的渲染异常在此收口，绝不白屏）
import { Component } from 'react'

export default class RootBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error: error ?? new Error('应用发生未知错误') }
  }

  componentDidCatch(error, info) {
    try {
      console.error('[RootBoundary]', error?.message ?? error, info?.componentStack ?? '')
    } catch {
      // 忽略
    }
  }

  handleReload = () => {
    try {
      window?.location?.reload?.()
    } catch {
      // 忽略
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="root-fallback">
          <div className="root-fallback-card">
            <div className="root-fallback-icon">🛠️</div>
            <h1>页面遇到了一点问题</h1>
            <p>别担心，数据没有丢失，点击下方按钮刷新即可恢复。</p>
            <p className="root-fallback-detail">{this.state.error?.message ?? '未知错误'}</p>
            <button className="btn btn-primary" onClick={this.handleReload}>
              刷新页面
            </button>
          </div>
        </div>
      )
    }
    return this.props?.children ?? null
  }
}
