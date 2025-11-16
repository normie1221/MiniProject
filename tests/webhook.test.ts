import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import crypto from 'crypto'
import * as webhook from '../pages/api/webhooks/clerk'
import prisma from '../lib/prisma'

vi.mock('../lib/prisma', () => ({
  default: {
    user: {
      upsert: vi.fn()
    }
  }
}))

describe('Clerk webhook helpers', () => {
  const secret = 'test_webhook_secret'
  beforeEach(() => {
    process.env.CLERK_WEBHOOK_SECRET = secret
    ;(prisma.user.upsert as unknown as ReturnType<typeof vi.fn>).mockClear()
  })

  afterEach(() => {
    delete process.env.CLERK_WEBHOOK_SECRET
  })

  it('verifySignature returns true for valid signature', () => {
    const raw = Buffer.from(JSON.stringify({ hello: 'world' }))
    const h = (crypto as any).createHmac('sha256', secret).update(raw).digest('hex')
    const header = `sha256=${h}`
    const ok = webhook.verifySignature(raw, header)
    expect(ok).toBe(true)
  })

  it('verifySignature returns false for invalid signature', () => {
    const raw = Buffer.from('nope')
    const header = 'sha256=deadbeef'
    const ok = webhook.verifySignature(raw, header)
    expect(ok).toBe(false)
  })

  it('upsertUserFromPayload calls prisma.user.upsert when userId available', async () => {
    const payload = { data: { id: 'user_abc', attributes: { email: 'a@b.com' } } }
    await webhook.upsertUserFromPayload(payload)
    expect(prisma.user.upsert).toHaveBeenCalled()
    const call = (prisma.user.upsert as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call.where.clerkId).toBe('user_abc')
    expect(call.create.email).toBe('a@b.com')
  })

  it('upsertUserFromPayload does nothing when no userId', async () => {
    const payload = { foo: 'bar' }
    await webhook.upsertUserFromPayload(payload)
    expect(prisma.user.upsert).not.toHaveBeenCalled()
  })
})
