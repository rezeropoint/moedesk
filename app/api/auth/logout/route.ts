import { getSession, clearSessionCookie } from "@/lib/auth/session"
import { db } from "@/lib/db"

export async function POST() {
  const session = await getSession()

  if (session) {
    // 删除数据库中的会话
    await db.session.delete({ where: { id: session.sessionId } })
  }

  await clearSessionCookie()

  return Response.json({ success: true })
}
