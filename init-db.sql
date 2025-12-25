-- MoeDesk 数据库初始化脚本
-- 由 PostgreSQL 容器首次启动时自动执行

-- 创建 n8n 数据库
CREATE DATABASE n8n;

-- ============================================
-- 以下在 moedesk 数据库中执行（POSTGRES_DB 默认值）
-- DDL 基于 prisma/schema.prisma 生成
-- ============================================

-- ============================================
-- 枚举类型
-- ============================================

-- CreateEnum: Role
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERATOR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum: IpType
DO $$ BEGIN
  CREATE TYPE "IpType" AS ENUM ('ANIME', 'GAME', 'MANGA', 'LIGHT_NOVEL', 'VTUBER', 'MOVIE', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum: IpSource
DO $$ BEGIN
  CREATE TYPE "IpSource" AS ENUM ('AUTO', 'MANUAL_APPROVED', 'MANUAL_ADDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum: ReviewStatus
DO $$ BEGIN
  CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum: TrendingStatus
DO $$ BEGIN
  CREATE TYPE "TrendingStatus" AS ENUM ('WATCHING', 'FOCUSED', 'IN_PROGRESS', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 用户与会话表
-- ============================================

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

-- ============================================
-- IP 相关表（泛宅文化：番剧、游戏、漫画等）
-- ============================================

-- CreateTable: ips (正式入库的 IP 数据)
CREATE TABLE IF NOT EXISTS "ips" (
    "id" TEXT NOT NULL,
    "type" "IpType" NOT NULL,
    "source" "IpSource" NOT NULL DEFAULT 'AUTO',
    "titleOriginal" TEXT NOT NULL,
    "titleChinese" TEXT,
    "titleEnglish" TEXT,
    "description" TEXT,
    "coverImage" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "releaseDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "popularityScore" INTEGER,
    "ratingScore" INTEGER,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "externalUrls" JSONB,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ips_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ip_reviews (待审核的 IP 数据)
CREATE TABLE IF NOT EXISTS "ip_reviews" (
    "id" TEXT NOT NULL,
    "type" "IpType" NOT NULL,
    "titleOriginal" TEXT NOT NULL,
    "titleChinese" TEXT,
    "titleEnglish" TEXT,
    "description" TEXT,
    "coverImage" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "releaseDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "popularityScore" INTEGER,
    "ratingScore" INTEGER,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "externalUrls" JSONB,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ip_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable: trendings (热度追踪数据)
CREATE TABLE IF NOT EXISTS "trendings" (
    "id" TEXT NOT NULL,
    "ipId" TEXT NOT NULL,
    "redditKarma" INTEGER,
    "googleTrend" INTEGER,
    "twitterMentions" INTEGER,
    "biliDanmaku" INTEGER,
    "merchandiseScore" INTEGER,
    "aiAnalysis" JSONB,
    "status" "TrendingStatus" NOT NULL DEFAULT 'WATCHING',
    "evaluatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trendings_pkey" PRIMARY KEY ("id")
);

-- ============================================
-- 索引
-- ============================================

-- users 索引
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- sessions 索引
CREATE INDEX IF NOT EXISTS "sessions_userId_idx" ON "sessions"("userId");

-- ips 索引
CREATE INDEX IF NOT EXISTS "ips_type_idx" ON "ips"("type");
CREATE INDEX IF NOT EXISTS "ips_totalScore_idx" ON "ips"("totalScore");
CREATE INDEX IF NOT EXISTS "ips_releaseDate_idx" ON "ips"("releaseDate");

-- ip_reviews 索引
CREATE INDEX IF NOT EXISTS "ip_reviews_status_idx" ON "ip_reviews"("status");
CREATE INDEX IF NOT EXISTS "ip_reviews_type_idx" ON "ip_reviews"("type");
CREATE INDEX IF NOT EXISTS "ip_reviews_totalScore_idx" ON "ip_reviews"("totalScore");

-- trendings 索引
CREATE UNIQUE INDEX IF NOT EXISTS "trendings_ipId_key" ON "trendings"("ipId");
CREATE INDEX IF NOT EXISTS "trendings_status_idx" ON "trendings"("status");
CREATE INDEX IF NOT EXISTS "trendings_merchandiseScore_idx" ON "trendings"("merchandiseScore");

-- ============================================
-- 外键约束
-- ============================================

-- sessions -> users
DO $$ BEGIN
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- trendings -> ips
DO $$ BEGIN
  ALTER TABLE "trendings" ADD CONSTRAINT "trendings_ipId_fkey"
    FOREIGN KEY ("ipId") REFERENCES "ips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
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
