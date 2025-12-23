-- MoeDesk 数据库初始化脚本
-- 由 PostgreSQL 容器首次启动时自动执行

-- 创建 n8n 数据库
CREATE DATABASE n8n;

-- ============================================
-- 以下在 moedesk 数据库中执行（POSTGRES_DB 默认值）
-- DDL 基于 prisma/schema.prisma 生成
-- ============================================

-- CreateEnum: Role
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERATOR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable: users
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OPERATOR',
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: sessions
CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE INDEX IF NOT EXISTS "sessions_userId_idx" ON "sessions"("userId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 种子数据：创建默认管理员账号
-- 密码: admin123 (bcrypt hash, cost=12)
-- ============================================
INSERT INTO "users" ("id", "email", "passwordHash", "name", "role", "isActive", "createdAt", "updatedAt")
SELECT
  'admin_default_001',
  'admin@moedesk.com',
  '$2b$12$NV66wF5FHDxiOxYuT.9xce7iw190htZDOqbKVBxTuTrXmxmHCz.ie',
  '系统管理员',
  'ADMIN',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "users" WHERE "email" = 'admin@moedesk.com');
