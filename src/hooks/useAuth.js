// 读取全局登录态的 hook（与 Provider 分离，保证 Fast Refresh 正常工作）
import { useContext } from 'react'
import AuthContext from '../context/AuthContext.jsx'

export default function useAuth() {
  return useContext(AuthContext)
}
