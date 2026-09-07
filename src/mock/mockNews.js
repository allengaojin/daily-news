// 内置 Mock 新闻数据（构建时打包进 JS bundle）
// 用途：完全离线（连静态托管服务器都不可达）时的终极兜底，
// 保证「离线演示模式」在任何网络状况下都能渲染出数据。
// 注意：与 public/data/mock/news.json 内容保持一致
//（后者供抓取脚本在数据不足时读取补齐，改动任一处需同步另一处）。
export const MOCK_NEWS = {
  meta: {
    date: '2026-08-10',
    updatedAt: '2026-08-10T00:00:00Z',
    mode: 'mock-only',
  },
  domestic: [
    {
      id: 'mock-domestic-01',
      region: 'domestic',
      title: '国内多家人工智能实验室发布新一代开源大模型，推理成本下降超六成',
      url: 'https://www.jiqizhixin.com/',
      source: '机器之心',
      summary:
        '多家国内 AI 实验室联合发布新一代开源大模型系列，在多项基准测试中表现接近闭源旗舰模型，同时通过混合专家架构与推理优化，将单次推理成本降低超过 60%，引发开源社区广泛关注。',
      pubDate: '2026-08-10T06:00:00Z',
      isFallback: true,
    },
    {
      id: 'mock-domestic-02',
      region: 'domestic',
      title: '智能体（Agent）加速落地：多家企业将 AI 助手接入核心业务流程',
      url: 'https://www.qbitai.com/',
      source: '量子位',
      summary:
        '随着多模态与工具调用能力成熟，AI 智能体正在从演示走向生产环境。多家大型企业已将其接入客服、研发与供应链环节，报告显示自动化处理率平均提升超过 40%。',
      pubDate: '2026-08-09T08:30:00Z',
      isFallback: true,
    },
    {
      id: 'mock-domestic-03',
      region: 'domestic',
      title: '国家人工智能产业政策加码：算力基础设施与数据要素市场同步推进',
      url: 'https://www.ithome.com/',
      source: 'IT之家',
      summary:
        '相关部门发布新一轮人工智能产业支持政策，重点覆盖算力基础设施建设、高质量数据集开放与行业大模型应用示范，多个城市同步出台配套补贴与人才引进措施。',
      pubDate: '2026-08-08T10:00:00Z',
      isFallback: true,
    },
    {
      id: 'mock-domestic-04',
      region: 'domestic',
      title: 'AI 编程助手渗透率创新高：国内开发者人均节省工时报告发布',
      url: 'https://www.ithome.com/',
      source: 'IT之家',
      summary:
        '最新开发者生态报告显示，国内开发者 AI 编程助手使用率突破新高，人均每周节省编码时间超过 5 小时，代码审查与测试环节的自动化程度显著提升。',
      pubDate: '2026-08-07T09:00:00Z',
      isFallback: true,
    },
    {
      id: 'mock-domestic-05',
      region: 'domestic',
      title: '多模态视频生成模型迎来新突破：分钟级长视频生成进入产品化阶段',
      url: 'https://www.qbitai.com/',
      source: '量子位',
      summary:
        '国内视频生成赛道密集发布新品，多款模型支持分钟级连贯长视频生成，物理一致性与角色一致性大幅改善，创作者工具与影视制作流程开始批量接入。',
      pubDate: '2026-08-06T07:00:00Z',
      isFallback: true,
    },
  ],
  abroad: [
    {
      id: 'mock-abroad-01',
      region: 'abroad',
      title: 'Frontier AI labs race to extend context windows as enterprise demand grows',
      url: 'https://techcrunch.com/',
      source: 'TechCrunch',
      summary:
        'Major AI labs are competing to extend context windows into the millions of tokens, driven by enterprise demand for document-level reasoning and codebase-scale analysis in production workloads.',
      pubDate: '2026-08-10T12:00:00Z',
      isFallback: true,
    },
    {
      id: 'mock-abroad-02',
      region: 'abroad',
      title: 'EU AI Act enforcement begins: what developers need to know',
      url: 'https://www.theverge.com/',
      source: 'The Verge',
      summary:
        'The first wave of EU AI Act obligations took effect this month, requiring transparency disclosures and risk assessments for general-purpose AI systems, with significant implications for developers worldwide.',
      pubDate: '2026-08-09T14:00:00Z',
      isFallback: true,
    },
    {
      id: 'mock-abroad-03',
      region: 'abroad',
      title: 'Venture funding in AI infrastructure hits record quarter',
      url: 'https://venturebeat.com/',
      source: 'VentureBeat',
      summary:
        'AI infrastructure startups raised record funding this quarter, with data center networking, inference optimization and synthetic data companies leading the surge, according to new market data.',
      pubDate: '2026-08-08T15:00:00Z',
      isFallback: true,
    },
    {
      id: 'mock-abroad-04',
      region: 'abroad',
      title: 'Open-source models close the gap on proprietary benchmarks',
      url: 'https://techcrunch.com/',
      source: 'TechCrunch',
      summary:
        'New evaluation results show top open-weight models now trail the best closed models by single-digit percentage points across major benchmarks, intensifying the open vs. closed debate.',
      pubDate: '2026-08-07T13:00:00Z',
      isFallback: true,
    },
    {
      id: 'mock-abroad-05',
      region: 'abroad',
      title: 'AI agents move into enterprise workflows at scale',
      url: 'https://venturebeat.com/',
      source: 'VentureBeat',
      summary:
        'Enterprise adoption of autonomous AI agents accelerated this quarter, with major software vendors shipping agentic features for finance, support and operations, and CIOs reporting measurable productivity gains.',
      pubDate: '2026-08-06T16:00:00Z',
      isFallback: true,
    },
  ],
}

export default MOCK_NEWS
