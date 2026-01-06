import type {
  PublishTask,
  PublishRecord,
  PublishStats,
} from "@/types/publish"

// ============================================================================
// Mock 发布任务数据
// ============================================================================

export const mockTasks: PublishTask[] = [
  {
    id: "task-1",
    title: "鬼灭之刃 第四季 PV 剪辑",
    videoUrl: "/mock/video1.mp4",
    coverUrl: "https://cdn.myanimelist.net/images/anime/1286/99889l.jpg",
    seriesId: "series-kimetsu",
    seriesTitle: "鬼灭之刃",
    platforms: ["INSTAGRAM", "YOUTUBE"],
    mode: "SCHEDULED",
    scheduledAt: "2026-01-07T14:00:00Z",
    status: "SCHEDULED",
    createdAt: "2026-01-06T10:00:00Z",
    updatedAt: "2026-01-06T10:00:00Z",
    createdBy: "user-1",
    platformContents: [
      {
        id: "pc-1",
        taskId: "task-1",
        platform: "INSTAGRAM",
        title: null,
        description: "Demon Slayer Season 4 is coming! The Hashira Training Arc awaits!",
        hashtags: ["#DemonSlayer", "#KimetsuNoYaiba", "#Anime", "#鬼灭之刃"],
      },
      {
        id: "pc-2",
        taskId: "task-1",
        platform: "YOUTUBE",
        title: "Demon Slayer Season 4 - Hashira Training Arc PV",
        description: "The highly anticipated fourth season of Demon Slayer is finally here! Watch the latest PV for the Hashira Training Arc.",
        hashtags: ["#DemonSlayer", "#Anime", "#Shorts"],
      },
    ],
    records: [],
  },
  {
    id: "task-2",
    title: "咒术回战 涩谷事变 名场面",
    videoUrl: "/mock/video2.mp4",
    coverUrl: "https://cdn.myanimelist.net/images/anime/1792/138022l.jpg",
    seriesId: "series-jjk",
    seriesTitle: "咒术回战",
    platforms: ["INSTAGRAM", "THREADS", "YOUTUBE"],
    mode: "SCHEDULED",
    scheduledAt: "2026-01-08T19:00:00Z",
    status: "SCHEDULED",
    createdAt: "2026-01-05T15:30:00Z",
    updatedAt: "2026-01-06T09:00:00Z",
    createdBy: "user-1",
    platformContents: [
      {
        id: "pc-3",
        taskId: "task-2",
        platform: "INSTAGRAM",
        title: null,
        description: "Shibuya Incident - The moment that changed everything! Gojo vs Sukuna incoming?",
        hashtags: ["#JujutsuKaisen", "#呪術廻戦", "#Anime", "#ShibuyaIncident"],
      },
      {
        id: "pc-4",
        taskId: "task-2",
        platform: "THREADS",
        title: null,
        description: "That Shibuya Incident moment hit different...",
        hashtags: ["#JJK", "#Anime"],
      },
      {
        id: "pc-5",
        taskId: "task-2",
        platform: "YOUTUBE",
        title: "Jujutsu Kaisen - Shibuya Incident Best Moments",
        description: "Relive the most intense moments from the Shibuya Incident arc. Which scene was your favorite?",
        hashtags: ["#JujutsuKaisen", "#Anime", "#Shorts"],
      },
    ],
    records: [],
  },
  {
    id: "task-3",
    title: "葬送的芙莉莲 治愈片段",
    videoUrl: "/mock/video3.mp4",
    coverUrl: "https://cdn.myanimelist.net/images/anime/1015/138006l.jpg",
    seriesId: "series-frieren",
    seriesTitle: "葬送的芙莉莲",
    platforms: ["INSTAGRAM"],
    mode: "IMMEDIATE",
    scheduledAt: null,
    status: "PUBLISHED",
    createdAt: "2026-01-04T12:00:00Z",
    updatedAt: "2026-01-04T12:30:00Z",
    createdBy: "user-1",
    platformContents: [
      {
        id: "pc-6",
        taskId: "task-3",
        platform: "INSTAGRAM",
        title: null,
        description: "Frieren moments that heal your soul ✨ This anime is a masterpiece of storytelling.",
        hashtags: ["#Frieren", "#葬送のフリーレン", "#Anime", "#HealingAnime"],
      },
    ],
    records: [
      {
        id: "record-1",
        taskId: "task-3",
        platform: "INSTAGRAM",
        accountId: null,
        status: "PUBLISHED",
        externalId: "ig-post-123456",
        externalUrl: "https://instagram.com/p/123456",
        errorMessage: null,
        publishedAt: "2026-01-04T12:30:00Z",
        createdAt: "2026-01-04T12:30:00Z",
      },
    ],
  },
  {
    id: "task-4",
    title: "我推的孩子 第二季 预告",
    videoUrl: "/mock/video4.mp4",
    coverUrl: "https://cdn.myanimelist.net/images/anime/1908/139870l.jpg",
    seriesId: "series-oshi",
    seriesTitle: "我推的孩子",
    platforms: ["YOUTUBE", "THREADS"],
    mode: "SCHEDULED",
    scheduledAt: "2026-01-06T20:00:00Z",
    status: "PARTIAL_FAILED",
    createdAt: "2026-01-03T08:00:00Z",
    updatedAt: "2026-01-06T20:05:00Z",
    createdBy: "user-1",
    platformContents: [
      {
        id: "pc-7",
        taskId: "task-4",
        platform: "YOUTUBE",
        title: "Oshi no Ko Season 2 - Official Trailer",
        description: "The dark side of the entertainment industry continues. Aqua's revenge is far from over.",
        hashtags: ["#OshiNoKo", "#推しの子", "#Anime"],
      },
      {
        id: "pc-8",
        taskId: "task-4",
        platform: "THREADS",
        title: null,
        description: "Oshi no Ko S2 dropped and I'm not okay",
        hashtags: ["#OshiNoKo", "#Anime"],
      },
    ],
    records: [
      {
        id: "record-2",
        taskId: "task-4",
        platform: "YOUTUBE",
        accountId: null,
        status: "PUBLISHED",
        externalId: "yt-shorts-789",
        externalUrl: "https://youtube.com/shorts/789",
        errorMessage: null,
        publishedAt: "2026-01-06T20:00:00Z",
        createdAt: "2026-01-06T20:00:00Z",
      },
      {
        id: "record-3",
        taskId: "task-4",
        platform: "THREADS",
        accountId: null,
        status: "FAILED",
        externalId: null,
        externalUrl: null,
        errorMessage: "API rate limit exceeded",
        publishedAt: null,
        createdAt: "2026-01-06T20:05:00Z",
      },
    ],
  },
  {
    id: "task-5",
    title: "间谍过家家 阿尼亚表情包",
    videoUrl: null,
    coverUrl: "https://cdn.myanimelist.net/images/anime/1441/128290l.jpg",
    seriesId: "series-spy",
    seriesTitle: "间谍过家家",
    platforms: ["INSTAGRAM", "THREADS"],
    mode: "MANUAL",
    scheduledAt: null,
    status: "DRAFT",
    createdAt: "2026-01-06T16:00:00Z",
    updatedAt: "2026-01-06T16:00:00Z",
    createdBy: "user-1",
    platformContents: [
      {
        id: "pc-9",
        taskId: "task-5",
        platform: "INSTAGRAM",
        title: null,
        description: "Anya's expressions are a whole mood 😂 Which one is your favorite?",
        hashtags: ["#SpyxFamily", "#Anya", "#AnimeMemes"],
      },
      {
        id: "pc-10",
        taskId: "task-5",
        platform: "THREADS",
        title: null,
        description: "POV: You're trying to keep a secret but you're Anya",
        hashtags: ["#SpyxFamily", "#Memes"],
      },
    ],
    records: [],
  },
  {
    id: "task-6",
    title: "蓝色监狱 史诗进球集锦",
    videoUrl: "/mock/video6.mp4",
    coverUrl: "https://cdn.myanimelist.net/images/anime/1970/124096l.jpg",
    seriesId: "series-bluelock",
    seriesTitle: "蓝色监狱",
    platforms: ["YOUTUBE"],
    mode: "SCHEDULED",
    scheduledAt: "2026-01-09T15:00:00Z",
    status: "SCHEDULED",
    createdAt: "2026-01-06T11:00:00Z",
    updatedAt: "2026-01-06T11:00:00Z",
    createdBy: "user-2",
    platformContents: [
      {
        id: "pc-11",
        taskId: "task-6",
        platform: "YOUTUBE",
        title: "Blue Lock - Most Epic Goal Moments Compilation",
        description: "Witness the ego of the world's best strikers! These goals will blow your mind.",
        hashtags: ["#BlueLock", "#ブルーロック", "#Anime", "#Soccer"],
      },
    ],
    records: [],
  },
]

// ============================================================================
// Mock 发布记录数据
// ============================================================================

export const mockRecords: PublishRecord[] = [
  {
    id: "record-1",
    taskId: "task-3",
    platform: "INSTAGRAM",
    accountId: null,
    status: "PUBLISHED",
    externalId: "ig-post-123456",
    externalUrl: "https://instagram.com/p/123456",
    errorMessage: null,
    publishedAt: "2026-01-04T12:30:00Z",
    createdAt: "2026-01-04T12:30:00Z",
  },
  {
    id: "record-2",
    taskId: "task-4",
    platform: "YOUTUBE",
    accountId: null,
    status: "PUBLISHED",
    externalId: "yt-shorts-789",
    externalUrl: "https://youtube.com/shorts/789",
    errorMessage: null,
    publishedAt: "2026-01-06T20:00:00Z",
    createdAt: "2026-01-06T20:00:00Z",
  },
  {
    id: "record-3",
    taskId: "task-4",
    platform: "THREADS",
    accountId: null,
    status: "FAILED",
    externalId: null,
    externalUrl: null,
    errorMessage: "API rate limit exceeded",
    publishedAt: null,
    createdAt: "2026-01-06T20:05:00Z",
  },
]

// ============================================================================
// Mock 统计数据
// ============================================================================

export const mockStats: PublishStats = {
  draft: 1,
  scheduled: 3,
  publishedToday: 1,
  failed: 1,
}

// ============================================================================
// 辅助函数
// ============================================================================

/** 根据状态筛选任务 */
export function filterTasksByStatus(
  tasks: PublishTask[],
  status?: string
): PublishTask[] {
  if (!status || status === "ALL") return tasks
  return tasks.filter((task) => task.status === status)
}

/** 根据平台筛选任务 */
export function filterTasksByPlatform(
  tasks: PublishTask[],
  platform?: string
): PublishTask[] {
  if (!platform || platform === "ALL") return tasks
  return tasks.filter((task) => task.platforms.includes(platform as "INSTAGRAM" | "THREADS" | "YOUTUBE"))
}

/** 搜索任务 */
export function searchTasks(tasks: PublishTask[], query: string): PublishTask[] {
  if (!query) return tasks
  const lowerQuery = query.toLowerCase()
  return tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(lowerQuery) ||
      task.seriesTitle?.toLowerCase().includes(lowerQuery)
  )
}
