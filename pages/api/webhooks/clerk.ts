import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'
import crypto from 'crypto'

export const config = {
  api: {
    bodyParser: false
  }
}

async function getRawBody(req: NextApiRequest) {
  // Use Buffer to collect raw body; cast to any to avoid strict type mismatches
  const chunks: any[] = []
  return new Promise<Buffer>((resolve, reject) => {
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks as any)))
    req.on('error', (err) => reject(err))
  })
}

export function verifySignature(raw: Buffer, headerSig?: string | string[] | null) {
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) return true
  if (!headerSig || Array.isArray(headerSig)) return false

  const sig = headerSig.startsWith('sha256=') ? headerSig.split('=')[1] : headerSig
  const h = (crypto as any).createHmac('sha256', secret).update(raw as any).digest('hex')
  const hBuf = Buffer.from(h, 'hex')
  const sigBuf = Buffer.from(sig, 'hex')
  if (hBuf.length !== sigBuf.length) return false
  return (crypto as any).timingSafeEqual(hBuf, sigBuf)
}

export async function upsertUserFromPayload(payload: any) {
  const userId =
    payload?.data?.id ||
    payload?.data?.user?.id ||
    payload?.user?.id ||
    payload?.object?.id ||
    payload?.data?.user_id ||
    payload?.user_id ||
    null

  const email =
    payload?.data?.attributes?.email ||
    payload?.data?.email ||
    payload?.data?.user?.email ||
    (payload?.data?.attributes?.email_addresses && payload.data.attributes.email_addresses[0]?.email_address) ||
    null

  if (userId) {
    try {
      await prisma.user.upsert({
        where: { clerkId: String(userId) },
        create: { clerkId: String(userId), email: email || null },
        update: { email: email || undefined }
      })
    } catch (err) {
      console.error('Webhook upsert user failed', err)
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Only POST allowed')

  const raw = await getRawBody(req)
  const sigHeader = req.headers['x-clerk-signature'] || req.headers['clerk-signature']

  const ok = verifySignature(raw as Buffer, sigHeader as string | undefined)
  if (!ok) return res.status(401).json({ error: 'Invalid signature' })

  let payload: any = null
  try {
    payload = JSON.parse((raw as Buffer).toString())
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON payload' })
  }

  await upsertUserFromPayload(payload)

  return res.status(200).json({ received: true })
}
