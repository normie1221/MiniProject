import crypto from 'crypto'

const ALGO = 'aes-256-gcm'
const KEY = process.env.ENCRYPTION_KEY || 'replace_with_32_byte_key___________'

function getKey() {
  // Expect hex or base64, allow fallback
  if (KEY.length === 32) return Buffer.from(KEY)
  // if base64
  try {
    return Buffer.from(KEY, 'base64')
  } catch (e) {
    return Buffer.from(KEY, 'hex')
  }
}

export function encrypt(text: string) {
  const iv = crypto.randomBytes(12)
  const cipher = (crypto as any).createCipheriv(ALGO, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()] as any)
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted] as any).toString('base64')
}

export function decrypt(payload: string) {
  const data = Buffer.from(payload, 'base64')
  const iv = data.slice(0, 12)
  const tag = data.slice(12, 28)
  const encrypted = data.slice(28)
  const decipher = (crypto as any).createDecipheriv(ALGO, getKey(), iv)
  decipher.setAuthTag(tag)
  const out = Buffer.concat([decipher.update(encrypted), decipher.final()] as any)
  return out.toString('utf8')
}
