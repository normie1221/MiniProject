import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../lib/prisma'
import { getAuth } from '@clerk/nextjs/server'
import withAuthDb from '../../lib/auth'

// Very simple anomaly detector using z-score on amount for the user's history
function detectAnomalies(arr: number[], value: number) {
  const n = arr.length
  if (n === 0) return { score: 0 }
  const mean = arr.reduce((a, b) => a + b, 0) / n
  const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / n
  const std = Math.sqrt(variance)
  const z = std === 0 ? 0 : Math.abs((value - mean) / std)
  return { score: z }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  if (req.method !== 'POST') return res.status(405).end('Only POST')

  const { amount, category } = req.body
  const all = await prisma.expense.findMany({ where: { userId, category: category || undefined } })
  const arr = all.map((e) => e.amount)
  const { score } = detectAnomalies(arr, Number(amount))
  const threshold = 3 // z > 3 considered anomaly
  const isAnomaly = score > threshold
  if (isAnomaly) {
    const alert = await prisma.fraudAlert.create({ data: { userId, score, reason: 'z-score anomaly' } })
    return res.status(200).json({ isAnomaly: true, score, alert })
  }
  return res.status(200).json({ isAnomaly: false, score })
}

export default withAuthDb(handler)
