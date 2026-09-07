# AI 前沿观察 · 每日 AI 新闻聚合站

每天自动更新**国内外共 10 篇**最新 AI 发展新闻（国内 5 篇 + 海外 5 篇），中国大陆用户**无需 VPN** 即可访问。

## 工作原理

```
GitHub Actions（每天 07:25 / 19:25 北京时间，海外服务器）
   │  node scripts/fetch-news.mjs 抓取国内外 RSS（零第三方依赖）
   ▼
生成 public/data/news.json → 提交仓库 → 构建 → 部署 GitHub Pages
   ▼
用户访问的只是静态页面 + 已抓好的 JSON 数据（浏览器端零外部 API 依赖，无需翻墙）
```

## 演示账号

| 项目 | 值 |
|---|---|
| 用户名 | `admin` |
| 密码 | `admin123` |
| Token 有效期 | 2 小时（过期后自动跳转登录页） |

> 演示用途：登录为纯前端 Mock（凭据由 `.env` 的 `VITE_MOCK_USER` / `VITE_MOCK_PASSWORD` 管理），无真实后端。

## 本地开发

```bash
npm install          # 已配置 npmmirror 镜像
npm run dev          # 开发服务器
npm run build        # 构建（产物带 Hash，相对路径）
npm run preview      # 预览构建产物
npm run fetch:news   # 手动抓取一次新闻数据
```

## 部署到 GitHub Pages

1. 在 GitHub 新建仓库（如 `ai-news`），将本项目推送上去：
   ```bash
   git init && git add -A && git commit -m "init"
   git remote add origin https://github.com/<你的用户名>/ai-news.git
   git push -u origin main
   ```
2. 打开仓库 **Settings → Pages → Build and deployment**，Source 选择 **GitHub Actions**
3. 到 **Actions** 页手动运行一次 `daily-news` 工作流（workflow_dispatch）
4. 完成后访问 `https://<你的用户名>.github.io/ai-news/`

之后每天定时任务会自动抓取、部署，无需任何人工操作。

## 架构特性（防御性编程）

- **三级数据降级**：网络 → 本地缓存 → 内置 Mock；请求失败自动重试 3 次（指数退避），全部失败显示「当前为离线演示模式」横幅，页面永不白屏
- **Error Boundary**：每个异步数据组件独立包裹 + 根部整页兜底，局部异常不影响整页
- **版本检查**：启动时校验 `localStorage.app_version`，不匹配自动清理旧数据并刷新
- **Token 过期四时机检测**：路由守卫 / 请求拦截器 / 定时轮询 / 页面回前台复查，过期自动跳登录页
- **环境变量管理**：所有 API 地址经 `.env` 配置（见 `.env.example`），代码零硬编码
- **零 CDN 外链**：所有资源由构建产物自带；若引入外部静态资源一律下载至 `public/libs/` 本地化（见 [public/libs/README.md](public/libs/README.md)）

## 新闻源（`scripts/sources.mjs`）

| 区域 | 来源 |
|---|---|
| 国内 | 机器之心、量子位、IT之家（AI 关键词过滤）、36氪、少数派 |
| 海外 | TechCrunch AI、The Verge、VentureBeat AI、MIT Tech Review AI、Wired AI、Google News |

每个源独立容错：抓取失败自动跳过，数量不足时用内置演示数据补齐（页面标注「历史演示」角标）。

## 常见问题

- **GitHub Pages 数据没更新**：静态文件有约 10 分钟缓存，前端已用 `cache:'no-cache'` 规避；等待片刻刷新即可
- **某个新闻源持续失败**：在 Actions 运行日志中查看各源抓取统计，将持续失败的源在 `scripts/sources.mjs` 中置 `enabled:false`
- **GitHub 在国内访问不稳**：开发期 push/pull 如遇网络问题需自备代理；线上页面仅依赖 github.io 静态托管
- **想换部署平台**（Vercel / Cloudflare Pages 等）：直接部署构建产物即可，如需换数据地址只需修改 `.env` 的 `VITE_NEWS_URL`

## 免责声明

本项目为学习演示用途，新闻内容版权归各原始来源所有；演示数据（mock）仅为展示界面效果，非实时新闻。
