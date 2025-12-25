/**
 * IP 列表 API
 * GET /api/ips - 获取已入库 IP 列表
 */

import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db"
import { IpListReq } from "./schema"

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 })
  }

  const params = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = IpListReq.safeParse(params)

  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { type, source, search, page, pageSize, sortBy, sortOrder } =
    parsed.data

  try {
    const where = {
      ...(type && { type }),
      ...(source && { source }),
      ...(search && {
        OR: [
          { titleOriginal: { contains: search, mode: "insensitive" as const } },
          { titleChinese: { contains: search, mode: "insensitive" as const } },
          { titleEnglish: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    }

    const [items, total] = await Promise.all([
      db.ip.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          type: true,
          source: true,
          titleOriginal: true,
          titleChinese: true,
          titleEnglish: true,
          coverImage: true,
          tags: true,
          releaseDate: true,
          totalScore: true,
          syncedAt: true,
        },
      }),
      db.ip.count({ where }),
    ])

    return Response.json({
      data: {
        items: items.map((item) => ({
          ...item,
          releaseDate: item.releaseDate?.toISOString() || null,
          syncedAt: item.syncedAt.toISOString(),
        })),
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total,
      },
    })
  } catch (error) {
    console.error("Failed to fetch IPs:", error)
    return Response.json({ error: "获取 IP 列表失败" }, { status: 500 })
  }
}
