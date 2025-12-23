import "dotenv/config"
import bcrypt from "bcryptjs"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../lib/generated/prisma/client.js"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
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
    await pool.end()
  }
}

main()
