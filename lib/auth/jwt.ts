import { SignJWT, jwtVerify } from "jose"
import { JWT_SECRET, JWT_EXPIRES_IN } from "./constants"

export interface JWTPayload {
  userId: string
  email: string
  role: "ADMIN" | "OPERATOR"
  sessionId: string
}

const secret = new TextEncoder().encode(JWT_SECRET)

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secret)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}
