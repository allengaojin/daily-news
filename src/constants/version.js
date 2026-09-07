// 应用版本号：以 package.json 为单一事实来源，避免多处维护不一致
import pkg from '../../package.json'

export const APP_VERSION = pkg?.version ?? '1.0.0'
