# n8n 工作流开发规范

本文档记录 n8n 工作流开发中遇到的问题和最佳实践，供后续开发参考。

## 常见问题与解决方案

### 1. Postgres 节点 Upsert 配置问题

**问题**: 使用 `Insert` 操作配合 `On Conflict` 选项时报错：
```
Column to match on not found in input item
```

**原因**: n8n 的 Postgres 节点在处理 upsert 时，内置的列映射机制对复杂场景支持不佳。

**解决方案**: 使用 `Execute Query` 操作，直接执行原生 SQL：
```sql
INSERT INTO table (...) VALUES (...)
ON CONFLICT (id) DO UPDATE SET ...
```

---

### 2. NOT NULL 约束报错

**问题**:
```
null value in column "updatedAt" of relation "ips" violates not-null constraint
```

**原因**: 即使数据库定义了 `DEFAULT CURRENT_TIMESTAMP`，INSERT 语句中未显式指定的列可能不会使用默认值。

**解决方案**: 在 INSERT 语句中显式包含 `createdAt` 和 `updatedAt` 列：
```sql
INSERT INTO table (..., "createdAt", "updatedAt")
VALUES (..., NOW(), NOW())
```

---

### 3. Webhook Respond 节点未使用报错

**问题**:
```
Unused Respond to Webhook node found in the workflow
```

**原因**: 多分支工作流中，Respond to Webhook 节点没有被所有分支正确连接。

**解决方案**:
1. Webhook 触发节点设置 `responseMode: "responseNode"`
2. 使用 Merge 节点合并所有分支后再连接到 Respond to Webhook

---

### 4. 跨节点数据引用报错

**问题**:
```
Multiple matches found
```

**原因**: 使用 `$('节点名').item.json` 引用数据时，如果该节点有多条数据流过，n8n 无法确定引用哪一条。

**解决方案**:
1. 在同一个 SQL 语句中执行多个相关操作，避免跨节点引用
2. 或使用 `$json` 直接引用当前项数据
3. 如果必须跨节点引用，确保数据是一对一关系

---

### 5. Merge 节点配置问题

**问题**:
```
You need to define at least one pair of fields in "Fields to Match" to match on
```

**原因**: `combine` + `multiplex` 模式需要配置匹配字段。

**解决方案**: 如果只是想等待多个分支完成后继续，使用 `append` 模式：
```json
{
  "parameters": {
    "mode": "append"
  }
}
```

---

### 6. Execute Query 后数据丢失

**问题**: Postgres `Execute Query` 执行后，原始输入数据不会传递到下一个节点。

**解决方案**:
1. 在一个 SQL 语句中完成所有相关操作（用分号分隔多条 SQL）
2. 或在 Code 节点中预先准备好所有需要的数据

---

## 最佳实践

### SQL 值预处理

在 Code 节点中预处理 SQL 值，避免 SQL 注入和格式问题：

```javascript
// 字符串转义（处理单引号）
const escapeStr = (s) => s ? `'${String(s).replace(/'/g, "''")}'` : 'NULL';

// 数组转 PostgreSQL 格式
const tagsArray = tags?.length
  ? `ARRAY[${tags.map(g => escapeStr(g)).join(',')}]::TEXT[]`
  : 'ARRAY[]::TEXT[]';

// 日期格式化
let releaseDate = 'NULL';
if (date?.year) {
  releaseDate = `'${date.year}-${String(date.month || 1).padStart(2, '0')}-${String(date.day || 1).padStart(2, '0')}'`;
}

// 输出预处理好的 SQL 值
return [{
  json: {
    sql_id: escapeStr('anilist_12345'),
    sql_tags: tagsArray,
    sql_releaseDate: releaseDate,
    // ...
  }
}];
```

### PostgreSQL 驼峰列名

PostgreSQL 中驼峰命名的列需要用双引号包裹：
```sql
INSERT INTO table ("titleOriginal", "createdAt", "updatedAt")
VALUES (...)
```

### 合并多条 SQL

在一个 Execute Query 中执行多条相关 SQL：
```sql
-- 第一条 INSERT
INSERT INTO ips (...) VALUES (...) ON CONFLICT (id) DO UPDATE SET ...;

-- 第二条 INSERT（依赖第一条）
INSERT INTO trendings (...) VALUES (...) ON CONFLICT ("ipId") DO NOTHING;
```

---

## 工作流模板结构

```
Webhook/Schedule 触发
       │
       ▼
   HTTP Request (外部 API)
       │
       ▼
   Code (数据处理 + SQL 值预处理)
       │
       ▼
   Switch (条件分流)
       │
   ┌───┼───┐
   ▼   ▼   ▼
 分支1 分支2 分支3
 (Postgres Execute Query)
   │   │   │
   └───┼───┘
       ▼
   Merge (mode: append)
       │
       ▼
   Code (生成响应)
       │
       ▼
   Respond to Webhook
```

---

## 文件清单

| 文件 | 说明 |
|-----|------|
| `sop-01-anilist-sync.json` | AniList 新番同步（定时触发） |
| `sop-01-anilist-sync-manual.json` | AniList 新番同步（Webhook 手动触发） |
