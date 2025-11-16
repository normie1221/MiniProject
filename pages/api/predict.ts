import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../lib/prisma'
import { getAuth } from '@clerk/nextjs/server'
import withAuthDb from '../../lib/auth'

// Very small predictor: linear regression on monthly totals per category
function linearRegression(xs: number[], ys: number[]) {
  const n = xs.length
  if (n === 0) return { m: 0, b: 0 }
  const meanX = xs.reduce((a, b) => a + b, 0) / n
  const meanY = ys.reduce((a, b) => a + b, 0) / n
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY)
    den += (xs[i] - meanX) ** 2
  }
  const m = den === 0 ? 0 : num / den
  const b = meanY - m * meanX
  return { m, b }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  // expects body: { months: number }
  const months = Number(req.body.months || 3)

  // Aggregate monthly totals for last `months`
  const results: Record<string, number[]> = {}
  const now = new Date()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)

    const expenses = await prisma.expense.findMany({ where: { userId, date: { gte: start, lt: end } } })
    const totals: Record<string, number> = {}
    for (const e of expenses) totals[e.category || 'uncategorized'] = (totals[e.category || 'uncategorized'] || 0) + e.amount

    for (const [cat, amt] of Object.entries(totals)) {
      if (!results[cat]) results[cat] = []
      results[cat].push(amt)
    }
  }

  // For each category, fit simple linear reg (x=month index, y=amount) and predict next month
  const predictions: Record<string, { prediction: number; explain: string }> = {}
  for (const [cat, arr] of Object.entries(results)) {
    const xs = arr.map((_, idx) => idx)
    const ys = arr
    const { m, b } = linearRegression(xs, ys)
    const pred = m * arr.length + b
    predictions[cat] = { prediction: Number(pred.toFixed(2)), explain: `Linear reg m=${m.toFixed(4)}, b=${b.toFixed(2)}` }
  }

  return res.status(200).json({ months, predictions })
}

export default withAuthDb(handler)
