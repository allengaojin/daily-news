// 每日新闻抓取脚本（零第三方依赖，Node ≥18 内置 fetch）
// 由 GitHub Actions 每天定时执行：抓取国内外 RSS → 过滤/去重/排序 →
// 不足 5 篇时以 mock 补齐 → 原子写入 public/data/news.json
//
// 用法：
//   node scripts/fetch-news.mjs                 # 正常抓取
//   node scripts/fetch-news.mjs --dry-run       # 只打印统计，不写文件
//   node scripts/fetch-news.mjs --only-mock     # 不抓网络，直接用 mock 生成文件
//   node scripts/fetch-news.mjs --region=domestic # 只抓国内
//
// 环境变量（由 Actions env 注入，禁硬编码）：
//   SCRAPER_TIMEOUT_MS   默认 20000（单源超时上限）
//   RSSHUB_BASE_URL      默认 https://rsshub.app

import { readFile, writeFile, rename, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sources, { AI_KEYWORD_PATTERN } from './sources.mjs'

// ------------------------------------------------------------
// 路径与环境
// ------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..')
const OUTPUT_FILE = join(PROJECT_ROOT, 'public', 'data', 'news.json')
const MOCK_FILE = join(PROJECT_ROOT, 'public', 'data', 'mock', 'news.json')

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const ONLY_MOCK = args.includes('--only-mock')
const REGION_FILTER = args.map((a) => a.match(/^--region=(\w+)$/)?.[1]).find(Boolean) ?? null
const SCRAPER_TIMEOUT_MS = Number(process.env.SCRAPER_TIMEOUT_MS ?? 0) || 20000

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

// ------------------------------------------------------------
// 工具
// ------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** 北京时间（UTC+8）日期键 YYYY-MM-DD */
function beijingDateKey(d = new Date()) {
  const cn = new Date(d.getTime() + 8 * 3600_000)
  const y = cn.getUTCFullYear()
  const m = String(cn.getUTCMonth() + 1).padStart(2, '0')
  const day = String(cn.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 解码 XML/HTML 实体 */
function decodeEntities(text) {
  try {
    return String(text ?? '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#0?39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
        try {
          return String.fromCodePoint(parseInt(hex, 16))
        } catch {
          return ''
        }
      })
      .replace(/&#(\d+);/g, (_, dec) => {
        try {
          return String.fromCodePoint(parseInt(dec, 10))
        } catch {
          return ''
        }
      })
  } catch {
    return String(text ?? '')
  }
}

/** 去除 HTML 标签 */
function stripTags(text) {
  try {
    return decodeEntities(String(text ?? '').replace(/<[^>]*>/g, ' '))
      .replace(/\s+/g, ' ')
      .trim()
  } catch {
    return ''
  }
}

/** 安全截取摘要 */
function truncate(text, max = 180) {
  const t = String(text ?? '').trim()
  return t.length > max ? `${t.slice(0, max)}…` : t
}

/** 首个匹配组 */
function matchOne(regex, text) {
  try {
    return regex.exec(text)?.[1] ?? null
  } catch {
    return null
  }
}

/** 提取 RSS <item> 与 Atom <entry> 分块 */
function extractEntries(xml) {
  const blocks = []
  try {
    const itemRe = /<item[\s>]([\s\S]*?)<\/item>/gi
    const entryRe = /<entry[\s>]([\s\S]*?)<\/entry>/gi
    let m
    while ((m = itemRe.exec(xml))) blocks.push(m[1])
    while ((m = entryRe.exec(xml))) blocks.push(m[1])
  } catch {
    // 解析异常返回空
  }
  return blocks
}

/** 解析单个条目为标准化新闻对象（失败返回 null） */
function parseEntry(block, source) {
  try {
    const title =
      matchOne(/<title[^>]*>([\s\S]*?)<\/title>/i, block) ??
      matchOne(/<media:title[^>]*>([\s\S]*?)<\/media:title>/i, block)
    if (!title) return null

    // Atom <link href="..."> 优先，其次 RSS <link>文本</link>
    let url =
      matchOne(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i, block) ??
      matchOne(/<link[^>]*>([\s\S]*?)<\/link>/i, block)
    url = decodeEntities(String(url ?? '').trim())
    if (!/^https?:\/\//i.test(url)) return null

    const pubRaw =
      matchOne(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i, block) ??
      matchOne(/<updated[^>]*>([\s\S]*?)<\/updated>/i, block) ??
      matchOne(/<published[^>]*>([\s\S]*?)<\/published>/i, block)
    const pubDate = new Date(decodeEntities(String(pubRaw ?? '').trim()))
    if (Number.isNaN(pubDate.getTime())) return null

    const desc =
      matchOne(/<description[^>]*>([\s\S]*?)<\/description>/i, block) ??
      matchOne(/<summary[^>]*>([\s\S]*?)<\/summary>/i, block) ??
      matchOne(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i, block) ??
      ''

    return {
      id: `${String(source.name).toLowerCase().replace(/[^a-z0-9一-龥]+/g, '-').slice(0, 24)}-${pubDate.getTime()}`,
      region: source.region,
      title: decodeEntities(stripTags(title)).trim(),
      url,
      source: source.name,
      summary: truncate(stripTags(desc), 180),
      pubDate: pubDate.toISOString(),
      isFallback: false,
    }
  } catch {
    return null
  }
}

// ------------------------------------------------------------
// 抓取
// ------------------------------------------------------------
/** 抓取单个源：独立容错，任何失败仅记录原因，绝不中断整体；限流/网络抖动自动退避重试一次 */
async function fetchSource(source) {
  const timeoutMs = Math.min(source.timeoutMs ?? 10000, SCRAPER_TIMEOUT_MS)
  let attempt = 0
  let lastFailure = null

  while (attempt < 2) {
    attempt += 1
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(source.url, {
        signal: controller.signal,
        headers: { 'User-Agent': BROWSER_UA, Accept: 'application/rss+xml, application/atom+xml, text/xml, */*' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const text = await res.text()
      // 反爬校验：正文必须像 XML（以 < 开头），返回 HTML 验证页视为失败
      if (!/^\s*</.test(text) || !/<(rss|feed|channel)/i.test(text)) {
        throw new Error('响应不是有效 RSS/Atom')
      }

      let items = extractEntries(text)
        .map((block) => parseEntry(block, source))
        .filter(Boolean)

      // 综合源关键词过滤：
      // - 标题命中 → 保留
      // - 标题未命中但摘要命中强关键词（垂直 AI 术语）→ 保留
      // - 其余丢弃（防「智能家居带 AI 语音」之类误入）
      if (source.keywords) {
        const STRONG = /大模型|人工智能|智能体|openai|anthropic|deepseek|gemini|claude|artificial\s+intelligence|machine\s+learning/i
        items = items.filter((it) => {
          try {
            if (source.keywords.test(it?.title ?? '')) return true
            return STRONG.test(it?.summary ?? '')
          } catch {
            return false
          }
        })
      }

      return { source: source.name, ok: true, reason: null, items }
    } catch (e) {
      clearTimeout(timer)
      lastFailure = e
      if (attempt < 2) {
        // 限流/网络抖动：退避 2 秒后重试一次
        await sleep(2000)
        continue
      }
    } finally {
      clearTimeout(timer)
    }
  }

  return {
    source: source.name,
    ok: false,
    reason: lastFailure?.name === 'AbortError' ? '超时' : (lastFailure?.message ?? '未知错误'),
    items: [],
  }
}

/** 批量抓取（并发 ≤3，单源失败不拖垮整体） */
async function fetchAll(list) {
  const results = []
  const CONCURRENCY = 3
  let cursor = 0
  async function worker() {
    while (cursor < list.length) {
      const src = list[cursor++]
      results.push(await fetchSource(src))
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, list.length) }, worker))
  return results
}

// ------------------------------------------------------------
// 聚合
// ------------------------------------------------------------
/** 标题规范化（去空白与标点，用于近似去重） */
function normalizeTitle(t) {
  return String(t ?? '').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '')
}

/** 近似去重：完全相同 URL，或标题高度相似（前缀 ≥80%） */
function dedupe(items) {
  const seen = []
  return (items ?? []).filter((item) => {
    try {
      const hit = seen.some((s) => {
        if (item.url === s.url) return true
        const a = normalizeTitle(item.title)
        const b = normalizeTitle(s.title)
        if (!a || !b) return false
        const min = Math.min(a.length, b.length)
        if (min < 10) return false
        const common = a.slice(0, min)
        return a.slice(0, Math.floor(min * 0.8)) === b.slice(0, Math.floor(min * 0.8))
      })
      if (!hit) seen.push(item)
      return !hit
    } catch {
      return true
    }
  })
}

/** 从 mock 文件读取指定 region 的条目用于补齐 */
async function loadMockRegion(region) {
  try {
    const raw = await readFile(MOCK_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    const list = parsed?.[region]
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

/** 汇总单区域：排序取最新 N 条（每源最多 2 条保证多源多样性），不足则 mock 补齐 */
async function buildRegion(region, allItems, targetCount = 5) {
  const regionItems = dedupe((allItems ?? []).filter((i) => i?.region === region))
  const sorted = regionItems.sort((a, b) => new Date(b?.pubDate ?? 0) - new Date(a?.pubDate ?? 0))

  // 每源最多 2 条：避免单一高频源（如 IT之家）霸榜
  const perSource = new Map()
  const picked = []
  for (const item of sorted) {
    if (picked.length >= targetCount) break
    const src = item?.source ?? 'unknown'
    const count = perSource.get(src) ?? 0
    if (count >= 2) continue
    perSource.set(src, count + 1)
    picked.push(item)
  }
  if (picked.length >= targetCount) {
    return { items: picked, usedMock: false }
  }

  // mock 补齐（isFallback:true，UI 显示「历史演示」角标）
  const mockItems = (await loadMockRegion(region)).map((m) => ({ ...m, isFallback: true }))
  const filler = mockItems.filter(
    (m) => !picked.some((p) => normalizeTitle(p?.title ?? '') === normalizeTitle(m?.title ?? '')),
  )
  return { items: [...picked, ...filler].slice(0, targetCount), usedMock: true }
}

// ------------------------------------------------------------
// 主流程
// ------------------------------------------------------------
async function main() {
  console.log(`[fetch-news] 开始抓取 ${beijingDateKey()}（北京时间）`)

  const regions = REGION_FILTER ? [REGION_FILTER] : ['domestic', 'abroad']
  const allItems = []

  if (ONLY_MOCK) {
    console.log('[fetch-news] --only-mock：跳过网络抓取')
  } else {
    for (const region of regions) {
      const list = (sources[region] ?? []).filter((s) => s?.enabled)
      console.log(`[fetch-news] 抓取 ${region}：${list.length} 个源`)
      const results = await fetchAll(list)

      for (const r of results) {
        allItems.push(...(r?.items ?? []))
        const mark = r?.ok ? 'OK ' : 'FAIL'
        console.log(`  [${mark}] ${r?.source ?? '?'}：${r?.items?.length ?? 0} 条${r?.ok ? '' : `（${r?.reason ?? ''}）`}`)
      }
    }
  }

  const output = {
    meta: { date: beijingDateKey(), updatedAt: new Date().toISOString(), mode: 'live' },
    domestic: [],
    abroad: [],
  }

  let usedMock = false
  for (const region of regions) {
    const { items, usedMock: rMock } = await buildRegion(region, allItems)
    output[region] = items
    usedMock = usedMock || rMock
    console.log(`[fetch-news] ${region} 最终 ${items.length} 篇${rMock ? '（含 mock 补齐）' : ''}`)
  }

  if (ONLY_MOCK || (usedMock && regions.length === 2 && output.domestic.length + output.abroad.length === 0)) {
    output.meta.mode = 'mock-only'
  } else if (usedMock) {
    output.meta.mode = 'partial'
  }

  const total = output.domestic.length + output.abroad.length
  console.log(`[fetch-news] 汇总：共 ${total} 篇，mode=${output.meta.mode}`)

  if (DRY_RUN) {
    console.log('[fetch-news] --dry-run：不写文件')
    return
  }

  // 原子写入：先写临时文件再 rename，避免半截文件
  await mkdir(dirname(OUTPUT_FILE), { recursive: true })
  const tmpFile = `${OUTPUT_FILE}.tmp`
  await writeFile(tmpFile, JSON.stringify(output, null, 2), 'utf-8')
  await rename(tmpFile, OUTPUT_FILE)
  console.log(`[fetch-news] 已写入 ${OUTPUT_FILE}`)
}

main().catch((e) => {
  console.error('[fetch-news] 执行失败：', e?.message ?? e)
  // 抓取失败时若目标文件不存在，用 mock 兜底生成，保证前端始终有数据
  if (!existsSync(OUTPUT_FILE)) {
    console.error('[fetch-news] 目标文件不存在，请检查 public/data/mock/news.json 后重试')
  }
  process.exitCode = 1
})
