import "dotenv/config"
import bcrypt from "bcryptjs"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

async function main() {
  // 创建 SQLite adapter factory
  const dbPath = process.env.DATABASE_URL || "file:./prisma/dev.db"
  const adapter = new PrismaBetterSqlite3({ url: dbPath.replace("file:", "") })

  // 动态导入 Prisma Client
  const { PrismaClient } = await import("../lib/generated/prisma/client.js")
  const prisma = new PrismaClient({ adapter })

  try {
    const adminEmail = "admin@moedesk.com"

    const existing = await prisma.user.findUnique({
      where: { email: adminEmail },
    })

    if (!existing) {
      const passwordHash = await bcrypt.hash("admin123", 12)

      await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          name: "系统管理员",
          role: "ADMIN",
        },
      })

      console.log("管理员账号已创建:")
      console.log("  邮箱: admin@moedesk.com")
      console.log("  密码: admin123")
      console.log("  请在生产环境中修改密码!")
    } else {
      console.log("管理员账号已存在")
    }
  } catch (error) {
    console.error("执行种子脚本时出错:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
