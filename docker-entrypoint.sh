#!/bin/sh
set -e

# 确保上传目录存在且有正确权限
mkdir -p /app/uploads
chown -R nextjs:nodejs /app/uploads 2>/dev/null || true

# 以 nextjs 用户运行应用
exec su-exec nextjs node server.js
