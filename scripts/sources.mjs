// 新闻源清单：分层配置（core 优先抓取，backup 按需补充）
// enabled:false 表示预置但暂不启用（如 RSSHub 备用路由）
// keywords 仅综合源需要（AI 关键词过滤），垂直 AI 源留空
//
// 说明：GitHub Actions runner 位于海外，国内源可达性参差，
// 抓取脚本对每个源独立容错，失败自动跳过并按序启用备用源。

export const AI_KEYWORD_PATTERN =
  /ai|artificial\s+intelligence|machine\s+learning|\bllm\b|大模型|人工智能|智能体|openai|anthropic|deepseek|gemini|claude|\bgpt\b|具身智能/i

const abroad = [
  {
    name: 'TechCrunch AI',
    region: 'abroad',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    tier: 'core',
    enabled: true,
    timeoutMs: 10000,
  },
  {
    name: 'The Verge AI',
    region: 'abroad',
    // 注：Verge 原 AI 专属 feed（/rss/ai/index.xml）已失效返回空 feed，
    // 改用总站 feed + AI 关键词过滤（实测有效）
    url: 'https://www.theverge.com/rss/index.xml',
    tier: 'core',
    enabled: true,
    timeoutMs: 10000,
    keywords: AI_KEYWORD_PATTERN,
  },
  {
    name: 'VentureBeat AI',
    region: 'abroad',
    url: 'https://venturebeat.com/category/ai/feed/',
    tier: 'core',
    enabled: true,
    timeoutMs: 10000,
  },
  {
    name: 'MIT Tech Review AI',
    region: 'abroad',
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed/',
    tier: 'core',
    enabled: true,
    timeoutMs: 10000,
  },
  {
    name: 'Wired AI',
    region: 'abroad',
    url: 'https://www.wired.com/feed/tag/ai/latest/rss',
    tier: 'backup',
    enabled: true,
    timeoutMs: 10000,
  },
  {
    name: 'Google News AI',
    region: 'abroad',
    url: 'https://news.google.com/rss/search?q=AI+OR+%22artificial+intelligence%22+when:2d&hl=en-US&gl=US&ceid=US:en',
    tier: 'backup',
    enabled: true,
    timeoutMs: 15000,
  },
]

const domestic = [
  {
    name: '机器之心',
    region: 'domestic',
    url: 'https://www.jiqizhixin.com/rss',
    tier: 'core',
    enabled: true,
    timeoutMs: 20000,
  },
  {
    name: '量子位',
    region: 'domestic',
    url: 'https://www.qbitai.com/feed',
    tier: 'core',
    enabled: true,
    timeoutMs: 20000,
  },
  {
    name: 'IT之家',
    region: 'domestic',
    url: 'https://www.ithome.com/rss/',
    tier: 'core',
    enabled: true,
    timeoutMs: 20000,
    keywords: AI_KEYWORD_PATTERN,
  },
  {
    name: '36氪',
    region: 'domestic',
    url: 'https://36kr.com/feed',
    tier: 'backup',
    enabled: true,
    timeoutMs: 20000,
    keywords: AI_KEYWORD_PATTERN,
  },
  {
    name: '少数派',
    region: 'domestic',
    url: 'https://sspai.com/feed',
    tier: 'backup',
    enabled: true,
    timeoutMs: 20000,
    keywords: AI_KEYWORD_PATTERN,
  },
  // RSSHub 公共实例备用路由（公共实例稳定性一般，默认关闭；需要时置 enabled:true）
  {
    name: 'RSSHub-量子位',
    region: 'domestic',
    url: `${process.env.RSSHUB_BASE_URL ?? 'https://rsshub.app'}/qbitai`,
    tier: 'backup',
    enabled: false,
    timeoutMs: 20000,
  },
  {
    name: 'RSSHub-36氪',
    region: 'domestic',
    url: `${process.env.RSSHUB_BASE_URL ?? 'https://rsshub.app'}/36kr/news/latest`,
    tier: 'backup',
    enabled: false,
    timeoutMs: 20000,
    keywords: AI_KEYWORD_PATTERN,
  },
]

export default { domestic, abroad }
