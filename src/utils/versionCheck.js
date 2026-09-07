// 应用启动时的版本检查：localStorage.app_version 与当前版本不一致时
// 清空全部旧存储数据并刷新页面（需求硬性条款）
import { APP_VERSION } from '../constants/version.js'

/**
 * 检查并处理版本不匹配。必须在应用最早阶段同步调用（main.jsx 第一行）。
 * 防死循环：先写入新版本号再 reload；写入失败（存储不可用）则不 reload，
 * 由 storage 层内存降级兜底，应用仍可正常启动。
 */
export function checkAppVersion() {
  try {
    const storedVersion = window?.localStorage?.getItem?.('app_version') ?? null
    if (storedVersion === APP_VERSION) {
      return // 版本一致，无需处理
    }

    // 版本不一致（含首次访问）：清除所有旧存储数据
    try {
      window?.localStorage?.clear?.()
    } catch {
      // 清除失败不阻断启动
    }

    // 先写入新版本号，成功才刷新（避免每次启动都清库+刷新的死循环）
    let writeOk = false
    try {
      window?.localStorage?.setItem?.('app_version', APP_VERSION)
      writeOk = true
    } catch {
      console.warn('[versionCheck] localStorage 不可用，跳过页面刷新')
    }

    if (writeOk) {
      window?.location?.reload?.()
    }
  } catch (e) {
    // 绝不因版本检查导致启动崩溃
    console.warn('[versionCheck] 检查失败，已忽略', e)
  }
}
