// 安全 localStorage 封装：所有读写均 try-catch，不可用时降级为内存存储
// 业务键统一加 "ainews:" 前缀（版本键 app_version 为裸键，见 versionCheck.js）

const PREFIX = 'ainews:'

// 内存降级仓库（localStorage 被禁用/隐私模式/配额满时兜底）
const memoryStore = new Map()

/** 检测 localStorage 是否可用（只检测一次并缓存结果） */
const storageAvailable = (() => {
  try {
    const testKey = `${PREFIX}__test__`
    window.localStorage.setItem(testKey, '1')
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
})()

const rawGet = (key) => {
  try {
    if (storageAvailable) return window.localStorage.getItem(key)
  } catch {
    // 读取异常时走内存
  }
  return memoryStore.has(key) ? memoryStore.get(key) : null
}

const rawSet = (key, value) => {
  try {
    if (storageAvailable) {
      window.localStorage.setItem(key, value)
      return true
    }
  } catch {
    // 写入异常时降级内存
  }
  memoryStore.set(key, value)
  return true
}

const rawRemove = (key) => {
  try {
    if (storageAvailable) window.localStorage.removeItem(key)
  } catch {
    // 忽略
  }
  memoryStore.delete(key)
}

const rawClear = () => {
  try {
    if (storageAvailable) window.localStorage.clear()
  } catch {
    // 忽略
  }
  memoryStore.clear()
}

export const storage = {
  /** 读取字符串，失败返回 null */
  get(key) {
    try {
      return rawGet(`${PREFIX}${key}`)
    } catch {
      return null
    }
  },

  /** 写入字符串，失败返回 false */
  set(key, value) {
    try {
      return rawSet(`${PREFIX}${key}`, String(value ?? ''))
    } catch {
      return false
    }
  },

  /** 读取 JSON 对象，任何异常返回 null */
  getJSON(key) {
    try {
      const raw = rawGet(`${PREFIX}${key}`)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  /** 写入 JSON 对象，失败返回 false */
  setJSON(key, value) {
    try {
      return rawSet(`${PREFIX}${key}`, JSON.stringify(value ?? null))
    } catch {
      return false
    }
  },

  /** 删除键 */
  remove(key) {
    try {
      rawRemove(`${PREFIX}${key}`)
    } catch {
      // 忽略
    }
  },

  /** 清空全部存储（含裸键 app_version，供版本升级时整体清理） */
  clearAll() {
    try {
      rawClear()
      try {
        if (storageAvailable) window.localStorage.removeItem('app_version')
      } catch {
        // 忽略
      }
    } catch {
      // 忽略
    }
  },
}

export default storage
