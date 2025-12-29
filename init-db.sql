-- MoeDesk 数据库初始化脚本
-- 由 TimescaleDB 容器首次启动时自动执行

-- 创建 n8n 数据库
CREATE DATABASE n8n;

-- 启用 TimescaleDB 扩展
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

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

-- CreateEnum: TrendingSource
DO $$ BEGIN
  CREATE TYPE "TrendingSource" AS ENUM ('GOOGLE_TRENDS', 'REDDIT', 'TWITTER', 'BILIBILI', 'ANILIST');
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

-- CreateTable: ip_reviews (所有 IP 数据，通过 status 控制审核状态)
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
    "anilistChange" DOUBLE PRECISION,
    "googleTrendChange" DOUBLE PRECISION,
    "redditKarmaChange" DOUBLE PRECISION,
    "twitterChange" DOUBLE PRECISION,
    "biliDanmakuChange" DOUBLE PRECISION,
    "merchandiseScore" INTEGER,
    "aiAnalysis" JSONB,
    "status" "TrendingStatus" NOT NULL DEFAULT 'WATCHING',
    "evaluatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trendings_pkey" PRIMARY KEY ("id")
);

-- CreateTable: trending_history (热度历史时序数据)
CREATE TABLE IF NOT EXISTS "trending_history" (
    "id" TEXT NOT NULL,
    "trendingId" TEXT NOT NULL,
    "source" "TrendingSource" NOT NULL,
    "popularity" INTEGER NOT NULL,
    "rating" INTEGER,
    "metadata" JSONB,
    "recordedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trending_history_pkey" PRIMARY KEY ("id", "recordedAt")
);

-- 转换为 TimescaleDB hypertable（按 recordedAt 自动分区）
SELECT create_hypertable('trending_history', 'recordedAt',
  chunk_time_interval => INTERVAL '7 days',
  if_not_exists => TRUE
);

-- 启用压缩（先启用 columnstore，再添加策略）
ALTER TABLE "trending_history" SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = '"trendingId", source'
);

-- 添加压缩策略（7天后压缩）
SELECT add_compression_policy('trending_history', INTERVAL '7 days', if_not_exists => TRUE);

-- 添加数据保留策略（保留1年）
SELECT add_retention_policy('trending_history', INTERVAL '1 year', if_not_exists => TRUE);

-- ============================================
-- 索引
-- ============================================

-- users 索引
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- sessions 索引
CREATE INDEX IF NOT EXISTS "sessions_userId_idx" ON "sessions"("userId");

-- ip_reviews 索引
CREATE INDEX IF NOT EXISTS "ip_reviews_status_idx" ON "ip_reviews"("status");
CREATE INDEX IF NOT EXISTS "ip_reviews_type_idx" ON "ip_reviews"("type");
CREATE INDEX IF NOT EXISTS "ip_reviews_totalScore_idx" ON "ip_reviews"("totalScore");

-- trendings 索引
CREATE UNIQUE INDEX IF NOT EXISTS "trendings_ipId_key" ON "trendings"("ipId");
CREATE INDEX IF NOT EXISTS "trendings_status_idx" ON "trendings"("status");
CREATE INDEX IF NOT EXISTS "trendings_merchandiseScore_idx" ON "trendings"("merchandiseScore");

-- trending_history 索引
CREATE INDEX IF NOT EXISTS "trending_history_trendingId_source_idx"
  ON "trending_history"("trendingId", "source");
CREATE INDEX IF NOT EXISTS "trending_history_source_recordedAt_idx"
  ON "trending_history"("source", "recordedAt" DESC);
CREATE INDEX IF NOT EXISTS "trending_history_trendingId_source_recordedAt_idx"
  ON "trending_history"("trendingId", "source", "recordedAt" DESC);

-- ============================================
-- 外键约束
-- ============================================

-- sessions -> users
DO $$ BEGIN
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- trendings -> ip_reviews
DO $$ BEGIN
  ALTER TABLE "trendings" ADD CONSTRAINT "trendings_ipId_fkey"
    FOREIGN KEY ("ipId") REFERENCES "ip_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- trending_history -> trendings
DO $$ BEGIN
  ALTER TABLE "trending_history" ADD CONSTRAINT "trending_history_trendingId_fkey"
    FOREIGN KEY ("trendingId") REFERENCES "trendings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
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
