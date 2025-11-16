import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'crypto'
import handler from '../pages/api/webhooks/clerk'
import type { NextApiRequest, NextApiResponse } from 'next'
import { Readable } from 'stream'
import prisma from '../lib/prisma'

vi.mock('../lib/prisma', () => ({
  default: {
    user: {
      upsert: vi.fn()
    }
  }
}))

function createMockRequest(method: string, body: string, headers: Record<string, string> = {}): NextApiRequest {
  const req = new Readable({
    read() {
      this.push(body)
      this.push(null)
    }
  }) as any
  req.method = method
  req.headers = headers
  return req
}

function createMockResponse() {
  const res: any = {
    statusCode: 200,
    _status: 200,
    _json: null,
    _ended: false,
    _endData: undefined,
    status(code: number) {
      res._status = code
      res.statusCode = code
      return res
    },
    json(data: any) {
      res._json = data
      return res
    },
    end(data?: any) {
      res._ended = true
      res._endData = data
      return res
    },
    setHeader: vi.fn()
  }
  return res as NextApiResponse
}

describe('Clerk webhook handler (integration)', () => {
  const secret = 'test_webhook_secret'

  beforeEach(() => {
    process.env.CLERK_WEBHOOK_SECRET = secret
    ;(prisma.user.upsert as unknown as ReturnType<typeof vi.fn>).mockClear()
    ;(prisma.user.upsert as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'db_user_id',
      clerkId: 'user_abc',
      email: 'test@example.com',
      createdAt: new Date()
    })
  })

  it('accepts valid webhook with correct signature and upserts user', async () => {
    const payload = { data: { id: 'user_abc', attributes: { email: 'test@example.com' } } }
    const body = JSON.stringify(payload)
    const h = crypto.createHmac('sha256', secret).update(body).digest('hex')
    const req = createMockRequest('POST', body, { 'x-clerk-signature': `sha256=${h}` })
    const res = createMockResponse()

    await handler(req, res)

    expect((res as any)._status).toBe(200)
    expect((res as any)._json).toEqual({ received: true })
    expect(prisma.user.upsert).toHaveBeenCalledOnce()
  })

  it('rejects webhook with invalid signature', async () => {
    const payload = { data: { id: 'user_abc' } }
    const body = JSON.stringify(payload)
    const req = createMockRequest('POST', body, { 'x-clerk-signature': 'sha256=badsignature' })
    const res = createMockResponse()

    await handler(req, res)

    expect((res as any)._status).toBe(401)
    expect((res as any)._json).toEqual({ error: 'Invalid signature' })
    expect(prisma.user.upsert).not.toHaveBeenCalled()
  })

  it('rejects non-POST requests', async () => {
    const req = createMockRequest('GET', '', {})
    const res = createMockResponse()

    await handler(req, res)

    expect((res as any)._status).toBe(405)
    expect((res as any)._ended).toBe(true)
  })

  it('accepts webhook without signature when CLERK_WEBHOOK_SECRET not set', async () => {
    delete process.env.CLERK_WEBHOOK_SECRET
    const payload = { data: { id: 'user_xyz', email: 'no-secret@example.com' } }
    const body = JSON.stringify(payload)
    const req = createMockRequest('POST', body, {})
    const res = createMockResponse()

    await handler(req, res)

    expect((res as any)._status).toBe(200)
    expect((res as any)._json).toEqual({ received: true })
    expect(prisma.user.upsert).toHaveBeenCalledOnce()
  })

  it('returns 400 for invalid JSON payload', async () => {
    const body = 'not-json'
    const h = crypto.createHmac('sha256', secret).update(body).digest('hex')
    const req = createMockRequest('POST', body, { 'x-clerk-signature': `sha256=${h}` })
    const res = createMockResponse()

    await handler(req, res)

    expect((res as any)._status).toBe(400)
    expect((res as any)._json).toEqual({ error: 'Invalid JSON payload' })
  })
})
