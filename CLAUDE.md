# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

MoeDesk 是一个二次元跨境电商社媒运营工作台，核心功能是统一管理多平台消息、AI辅助内容生成、工作流自动化。

**架构设计：**
- 前端：Next.js 16 (App Router) + React 19 提供运营界面
- 后端逻辑：n8n 工作流引擎（通过 HTTP Webhook 通信）
- 数据存储：SQLite（本地开发）/ PostgreSQL（Docker）+ Prisma ORM

**核心理念：前端只负责展示和交互，绝大部分业务逻辑放 n8n 工作流。**

## 常用命令

```bash
# Docker 启动（推荐）
docker-compose up -d              # 启动所有服务
docker-compose down               # 停止所有服务
docker-compose logs -f            # 查看日志
docker-compose up -d --build      # 重新构建并启动
docker-compose ps                 # 查看服务状态

# 本地开发
npm run dev

# 数据库
npx prisma db push                # 同步 schema
npx prisma studio                 # 可视化管理

# 代码检查
npx tsc --noEmit                  # 类型检查
npm run lint                      # ESLint 检查
npm run build                     # 构建测试
```

## 技术栈

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui (new-york)
- Prisma ORM + SQLite/PostgreSQL
- react-hook-form + zod（表单验证）
- Lucide React 图标
- n8n 中文版 (blowsnow/n8n-chinese)

## 核心编码规范

### React 19 必须使用的新特性

```tsx
// ✅ ref 作为 prop（不再需要 forwardRef）
function Input({ ref, ...props }: { ref?: React.Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} />
}

// ✅ use() hook 替代 useEffect 数据获取
const comments = use(commentsPromise)

// ✅ useActionState 替代手动管理表单状态
const [state, action, isPending] = useActionState(submitForm, initialState)

// ✅ useOptimistic 乐观更新
const [optimisticMessages, addOptimistic] = useOptimistic(messages, reducer)
```

### 禁止使用的废弃 API

| 废弃 API | 替代方案 |
|----------|----------|
| `forwardRef` | 直接传 ref prop |
| `defaultProps` | ES6 默认参数 |
| `useEffect` 数据获取 | `use()` + Suspense |
| `pages/` 目录 | `app/` 目录 |
| `getServerSideProps` | Server Component 直接 fetch |
| `/pages/api/*.ts` | `/app/api/*/route.ts` |

### 组件规范

- **禁止原生 HTML 交互元素**：用 shadcn/ui（`<Button>` 而非 `<button>`）
- **禁止 default export**（页面除外）
- **禁止 any 类型**
- **优先 Server Component**，必要时才用 `"use client"`
- 事件处理：`handle + 动作`（handleReply, handleSubmit）
- 文件命名：kebab-case（message-list.tsx）

### 样式规范

```tsx
// ✅ 正确：使用语义化 Tailwind class
<div className="flex items-center gap-4 p-4 bg-card text-muted-foreground">

// ✅ 正确：条件样式用 cn()
<div className={cn("px-4 py-2", isActive && "bg-primary")}>

// ❌ 禁止：硬编码颜色
<div className="bg-[#ffffff] text-[#333]">

// ❌ 禁止：内联 style（动态计算值除外）
<div style={{ padding: '16px' }}>
```

语义化颜色：`bg-background`、`bg-card`、`bg-muted`、`text-foreground`、`text-muted-foreground`、`bg-primary`、`bg-destructive`、`border-border`

### Route Handler 规范

```ts
// app/api/messages/[id]/route.ts
type RouteContext = { params: Promise<{ id: string }> }

// ✅ Next.js 15+：params 是 Promise
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  // ...
  return Response.json({ data: message })
}
```

### Server Actions 规范

```ts
"use server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export async function sendReply(prevState: unknown, formData: FormData) {
  const validated = schema.safeParse(Object.fromEntries(formData))
  if (!validated.success) return { error: validated.error.flatten() }

  await db.message.update({ ... })
  revalidatePath("/messages")
  return { success: true }
}
```

### Node.js 现代写法

```ts
// ✅ 使用
import { db } from "@/lib/db"     // ES Modules
const response = await fetch(url) // 原生 fetch
const id = crypto.randomUUID()    // 非 uuid 库
const copy = structuredClone(obj) // 非 JSON.parse(JSON.stringify())

// ❌ 禁止
const db = require("./db")        // CommonJS
```

## 项目结构

```
app/                    # Next.js App Router
├── (dashboard)/        # 认证后的仪表盘路由组
│   ├── inbox/          # 消息收件箱（待开发）
│   ├── review/         # 内容审核
│   ├── content/        # 内容排期（待开发）
│   ├── trending/       # 热点雷达
│   │   └── analytics/  # 热度分析（Recharts 图表）
│   ├── workflows/      # 工作流配置
│   └── admin/users/    # 用户管理
├── api/                # Route Handlers
│   ├── trendings/      # 热度 API
│   │   ├── analytics/  # 分析 API（history/compare/sources）
│   │   └── search/     # IP 搜索 API
│   └── workflows/      # 工作流 API（含 toggle）
└── login/              # 登录页
components/
├── ui/                 # shadcn/ui 组件
├── layout/             # 布局组件（Sidebar、UserNav）
├── trending/           # 热点雷达组件
│   └── analytics/      # 分析图表组件
└── workflows/          # 工作流组件
lib/
├── auth/               # 认证逻辑（JWT、Session、密码）
├── validations/        # Zod Schema
├── generated/prisma/   # Prisma 生成的客户端
├── db.ts               # 数据库单例
└── n8n.ts              # n8n API 封装
types/                  # TypeScript 类型定义
prisma/                 # Prisma Schema 和种子数据
```

## 数据模型

核心表（见 `prisma/schema.prisma`）：
- **User/Session** - 用户认证（JWT + 数据库会话）
- **Series** - 系列表（如鬼灭之刃整个系列，含聚合评分、搜索关键词）
- **Entry** - IP 条目表（单个作品/季度，含审核状态、外部平台 ID）
- **Trending** - 系列级热度追踪（多源热度 + AI 周边潜力评估）
- **TrendingHistory** - 热度历史时序数据（TimescaleDB hypertable）
- **SystemConfig** - 系统配置键值存储

关键枚举：`IpType`（ANIME/GAME/MANGA/LIGHT_NOVEL/VTUBER/MOVIE/OTHER）、`ReviewStatus`（PENDING/APPROVED/REJECTED）、`TrendingStatus`（WATCHING/FOCUSED/IN_PROGRESS/ARCHIVED）、`TrendingSource`

## n8n 集成

`lib/n8n.ts` 包含：
- `SOP_WORKFLOW_DEFINITIONS` - 所有 SOP 工作流静态定义（4 阶段 20+ 工作流）
- `PHASE_CONFIG` - 阶段配置（内容生产/内容分发/用户互动/转化闭环）
- `getWorkflowRuntimeStates()` - 获取工作流运行时状态
- `triggerWorkflow()` - 触发 Webhook 工作流
- `toggleN8NWorkflow()` - 激活/停用工作流

**实际部署的工作流：**

| 文件 | 触发方式 | 功能 |
|------|---------|------|
| `sop-01-anilist-sync.json` | 每周一 09:00 | AniList 新番同步 → entries |
| `sop-02-popularity-refresh.json` | 每天 03:00 | 热度全量刷新 |
| `sop-02-google-trends.json` | 每天 04:00 | Google Trends 采集 |
| `sop-02-reddit-monitor.json` | 每天 05:00 | Reddit Karma 采集 |

**审核流程：** n8n 同步 → entries (PENDING) → 人工审核 → 通过后创建 Series + Trending → 实时热点显示

## Docker 服务

| 服务 | 端口映射 | 说明 |
|------|----------|------|
| app | 3443:3000 | Next.js 前端 |
| n8n | 5678:5678 | 工作流引擎（中文版） |
| db | 15432:5432 | PostgreSQL 数据库 |

## 环境变量

```env
# 本地开发
DATABASE_URL="file:./dev.db"
N8N_WEBHOOK_URL="http://localhost:5678"
N8N_API_KEY=""                              # n8n API Key（工作流控制必需）
NEXT_PUBLIC_N8N_URL="http://localhost:5678" # 客户端可访问的 n8n 地址

# Docker 环境
DATABASE_URL="postgresql://postgres:postgres@db:5432/moedesk"
N8N_WEBHOOK_URL="http://n8n:5678"
```

## 设计参考

`diagram/` 目录包含 HTML 原型设计稿（inbox.html、review.html、trends.html）
