/**
 * 标题解析工具 - 从完整标题提取基础名称和季度信息
 */

export interface ParsedTitle {
  baseName: string // 基础名称（如"鬼灭之刃"）
  seasonNumber: number | null // 季度编号
  seasonLabel: string | null // 季度标签（如"柱训练篇"、"剧场版"）
  confidence: number // 解析置信度 0-1
}

// 中文数字映射
const CHINESE_NUMBERS: Record<string, number> = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
  十一: 11,
  十二: 12,
}

/**
 * 中文数字转阿拉伯数字
 */
function chineseToNumber(chinese: string): number {
  // 直接匹配
  if (CHINESE_NUMBERS[chinese]) {
    return CHINESE_NUMBERS[chinese]
  }

  // 数字字符串
  const num = parseInt(chinese, 10)
  if (!isNaN(num)) {
    return num
  }

  // 处理"十X"形式
  if (chinese.startsWith("十") && chinese.length === 2) {
    const second = CHINESE_NUMBERS[chinese[1]]
    return second ? 10 + second : 10
  }

  // 处理"X十"形式
  if (chinese.endsWith("十") && chinese.length === 2) {
    const first = CHINESE_NUMBERS[chinese[0]]
    return first ? first * 10 : 10
  }

  return 1
}

// 季度后缀模式（按优先级排序）
const SEASON_PATTERNS: Array<{
  pattern: RegExp
  type: "season" | "part" | "arc" | "subtitle" | "special"
}> = [
  // 中文季度 - 最常见
  { pattern: /^(.+?)\s*第([一二三四五六七八九十\d]+)季$/, type: "season" },
  { pattern: /^(.+?)\s*第([一二三四五六七八九十\d]+)期$/, type: "season" },
  // 英文季度
  { pattern: /^(.+?)\s*Season\s*(\d+)$/i, type: "season" },
  { pattern: /^(.+?)\s*S(\d+)$/i, type: "season" },
  { pattern: /^(.+?)\s*Part\s*(\d+)$/i, type: "part" },
  // 2nd Season 形式
  { pattern: /^(.+?)\s*(\d+)(?:st|nd|rd|th)\s*Season$/i, type: "season" },
  // 日文季度
  { pattern: /^(.+?)\s*(\d+)期$/, type: "season" },
  // 特殊篇章 - 带括号
  { pattern: /^(.+?)\s*[「『](.+?)[」』]$/, type: "arc" },
  // 特殊篇章 - 冒号分隔
  { pattern: /^(.+?)\s*[:：]\s*(.+)$/, type: "subtitle" },
  // 剧场版/OVA/特别篇
  {
    pattern: /^(.+?)\s*(剧场版|劇場版|Movie|OVA|OAD|特别篇|総集編)(.*)$/i,
    type: "special",
  },
]

/**
 * 解析标题，提取基础名称和季度信息
 */
export function parseTitle(title: string): ParsedTitle {
  const trimmed = title.trim()

  for (const { pattern, type } of SEASON_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match) {
      const baseName = match[1].trim()
      const captured = match[2]

      let seasonNumber: number | null = null
      let seasonLabel: string | null = null

      switch (type) {
        case "season":
          seasonNumber = /^\d+$/.test(captured)
            ? parseInt(captured, 10)
            : chineseToNumber(captured)
          seasonLabel = `第${seasonNumber}季`
          break
        case "part":
          seasonNumber = parseInt(captured, 10)
          seasonLabel = `Part ${seasonNumber}`
          break
        case "arc":
        case "subtitle":
          seasonLabel = captured
          break
        case "special":
          seasonLabel = captured + (match[3] || "")
          break
      }

      return {
        baseName,
        seasonNumber,
        seasonLabel,
        confidence: 0.9,
      }
    }
  }

  // 未匹配到模式，返回原标题
  return {
    baseName: trimmed,
    seasonNumber: null,
    seasonLabel: null,
    confidence: 0.5,
  }
}

/**
 * 清理搜索关键词，移除季度后缀
 */
export function cleanSearchKeyword(keyword: string): string {
  const parsed = parseTitle(keyword)
  return parsed.baseName
}

/**
 * 生成去重后的搜索关键词列表
 */
export function generateSearchKeywords(
  titleOriginal: string,
  titleChinese?: string | null,
  titleEnglish?: string | null
): string[] {
  const keywords = new Set<string>()

  // 添加基础名称
  keywords.add(cleanSearchKeyword(titleOriginal))

  if (titleChinese) {
    keywords.add(cleanSearchKeyword(titleChinese))
  }

  if (titleEnglish) {
    keywords.add(cleanSearchKeyword(titleEnglish))
  }

  return Array.from(keywords).filter(Boolean)
}
