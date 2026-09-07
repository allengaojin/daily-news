// 新闻数据状态机：loading → ready(source) | error
// - 所有异步异常在此 catch 并转为 state（Error Boundary 无法捕获异步 throw，二者互补）
// - 组件卸载后不再 setState（防护）
import { useCallback, useEffect, useRef, useState } from 'react'
import { getNews } from '../api/newsApi.js'

export default function useNews() {
  // 初始状态即 loading；重置 loading 只在事件路径（reload）中执行
  const [state, setState] = useState({ status: 'loading', result: null, retryMsg: '' })
  const aliveRef = useRef(true)
  const requestIdRef = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current

    const onRetry = (attempt, total) => {
      try {
        if (aliveRef.current && requestId === requestIdRef.current) {
          setState((s) => ({ ...s, retryMsg: `网络连接失败，自动重试 ${attempt}/${total}…` }))
        }
      } catch {
        // 忽略
      }
    }

    let result = null
    try {
      result = await getNews(onRetry)
    } catch (e) {
      // 兜底：getNews 设计上不抛异常，此处防御未来改动
      result = { ok: false, code: 'UNEXPECTED', error: e }
    }

    try {
      if (!aliveRef.current || requestId !== requestIdRef.current) return
      if (result?.ok) {
        setState({ status: 'ready', result, retryMsg: '' })
      } else {
        setState({ status: 'error', result, retryMsg: '' })
      }
    } catch {
      // 忽略
    }
  }, [])

  // 手动重试（事件路径）：先重置 loading 再重新拉取
  const reload = useCallback(() => {
    setState({ status: 'loading', result: null, retryMsg: '' })
    load()
  }, [load])

  useEffect(() => {
    aliveRef.current = true
    load()
    return () => {
      aliveRef.current = false
    }
  }, [load])

  return {
    ...state,
    reload,
    source: state?.result?.source ?? null,
    data: state?.result?.data ?? null,
  }
}
