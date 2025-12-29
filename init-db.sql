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

-- CreateTable: series (系列表)
CREATE TABLE IF NOT EXISTS "series" (
    "id" TEXT NOT NULL,
    "titleOriginal" TEXT NOT NULL,
    "titleChinese" TEXT,
    "titleEnglish" TEXT,
    "type" "IpType" NOT NULL,
    "coverImage" TEXT,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "searchKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "totalSeasons" INTEGER NOT NULL DEFAULT 0,
    "aggregatedScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "series_pkey" PRIMARY KEY ("id")
);

-- CreateTable: entries (IP 条目表)
CREATE TABLE IF NOT EXISTS "entries" (
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
    "seriesId" TEXT,
    "seasonNumber" INTEGER,
    "seasonLabel" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable: trendings (热度追踪数据，关联到系列)
CREATE TABLE IF NOT EXISTS "trendings" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
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

-- CreateTable: trending_history (热度历史时序数据)
CREATE TABLE IF NOT EXISTS "trending_history" (
    "id" TEXT NOT NULL,
    "trendingId" TEXT NOT NULL,
    "source" "TrendingSource" NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'GLOBAL',
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

-- series 索引
CREATE INDEX IF NOT EXISTS "series_type_idx" ON "series"("type");
CREATE INDEX IF NOT EXISTS "series_aggregatedScore_idx" ON "series"("aggregatedScore");

-- entries 索引
CREATE INDEX IF NOT EXISTS "entries_status_idx" ON "entries"("status");
CREATE INDEX IF NOT EXISTS "entries_type_idx" ON "entries"("type");
CREATE INDEX IF NOT EXISTS "entries_totalScore_idx" ON "entries"("totalScore");
CREATE INDEX IF NOT EXISTS "entries_seriesId_idx" ON "entries"("seriesId");

-- trendings 索引
CREATE UNIQUE INDEX IF NOT EXISTS "trendings_seriesId_key" ON "trendings"("seriesId");
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

-- entries -> series
DO $$ BEGIN
  ALTER TABLE "entries" ADD CONSTRAINT "entries_seriesId_fkey"
    FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- trendings -> series
DO $$ BEGIN
  ALTER TABLE "trendings" ADD CONSTRAINT "trendings_seriesId_fkey"
    FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE CASCADE ON UPDATE CASCADE;
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

-- ============================================
-- 系统配置表
-- ============================================

-- CreateTable: system_configs
CREATE TABLE IF NOT EXISTS "system_configs" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("key")
);

-- 插入默认配置
INSERT INTO "system_configs" ("key", "value", "updatedAt")
SELECT 'surge_config', '{"threshold": 50, "limit": 5, "weights": {"anilist": 0.30, "google": 0.25, "reddit": 0.20, "twitter": 0.15, "bilibili": 0.10}}', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "system_configs" WHERE "key" = 'surge_config');
