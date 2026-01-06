/**
 * Token 加密/解密工具
 * 使用 AES-256-GCM 算法加密存储 OAuth Token
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16

/**
 * 获取加密密钥
 * 如果环境变量未配置，返回 null（开发环境可不加密）
 */
function getEncryptionKey(): Buffer | null {
  const key = process.env.TOKEN_ENCRYPTION_KEY
  if (!key) {
    console.warn("[crypto] TOKEN_ENCRYPTION_KEY 未配置，Token 将以明文存储")
    return null
  }
  if (key.length !== 64) {
    throw new Error("TOKEN_ENCRYPTION_KEY 必须是 64 位 hex 字符串（32 字节）")
  }
  return Buffer.from(key, "hex")
}

/**
 * 加密 Token
 * @param plaintext 明文 token
 * @returns 加密后的字符串（格式：iv:authTag:encrypted）或原文（未配置密钥时）
 */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey()
  if (!key) {
    return plaintext
  }

  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, "utf8", "hex")
  encrypted += cipher.final("hex")

  const authTag = cipher.getAuthTag().toString("hex")

  // 格式: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag}:${encrypted}`
}

/**
 * 解密 Token
 * @param ciphertext 加密后的字符串
 * @returns 解密后的明文 token
 */
export function decryptToken(ciphertext: string): string {
  const key = getEncryptionKey()
  if (!key) {
    return ciphertext
  }

  const parts = ciphertext.split(":")
  if (parts.length !== 3) {
    // 可能是未加密的旧数据
    return ciphertext
  }

  const [ivHex, authTagHex, encrypted] = parts

  try {
    const decipher = createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(ivHex, "hex")
    )

    decipher.setAuthTag(Buffer.from(authTagHex, "hex"))

    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch {
    // 解密失败，可能是未加密的旧数据
    console.warn("[crypto] Token 解密失败，返回原文")
    return ciphertext
  }
}

/**
 * 检查 Token 是否已过期
 * @param expiry Token 过期时间
 * @param bufferMinutes 缓冲分钟数（默认 5 分钟）
 */
export function isTokenExpired(expiry: Date | null, bufferMinutes = 5): boolean {
  if (!expiry) return true
  const bufferMs = bufferMinutes * 60 * 1000
  return new Date().getTime() > expiry.getTime() - bufferMs
}

// ============================================================================
// 临时数据加密（用于 OAuth 多频道选择流程）
// ============================================================================

/**
 * 加密临时数据（JSON 对象）
 * 用于 OAuth 流程中临时存储敏感数据到 Cookie
 */
export function encryptTempData(data: unknown): string {
  const json = JSON.stringify(data)
  return encryptToken(json)
}

/**
 * 解密临时数据
 * @returns 解密后的对象，或 null 表示解密失败
 */
export function decryptTempData<T = unknown>(ciphertext: string): T | null {
  try {
    const json = decryptToken(ciphertext)
    return JSON.parse(json) as T
  } catch {
    console.warn("[crypto] 临时数据解密失败")
    return null
  }
}
