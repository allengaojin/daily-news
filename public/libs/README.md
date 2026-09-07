# public/libs — 本地化静态资源目录

本项目遵循「零运行时外部 CDN 依赖」原则：

- `index.html` 无任何 CDN 外链，字体使用系统字体栈
- 若将来引入任何外部静态资源（字体文件、图标库、图片等），一律：
  1. 优先从 cdnjs（https://cdnjs.cloudflare.com）或 BootCDN（https://www.bootcdn.cn）下载原始文件
  2. 放入本目录，在代码中以相对路径引用（如 `./libs/xxx/yyy.js`）
  3. 禁止在 HTML 中直接写 CDN 域名外链

当前状态：无外部静态资源（React 等依赖均由 npm 打包进构建产物）。
