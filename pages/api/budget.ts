import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../lib/prisma'
import { getAuth } from '@clerk/nextjs/server'
import withAuthDb from '../../lib/auth'

// Simple budget generator: proportionally allocate by historical spending categories
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'POST') {
    const { month, year } = req.body
    // Fetch last 3 months expenses
    const from = new Date(year, month - 3, 1)
    const to = new Date(year, month, 1)
    const expenses = await prisma.expense.findMany({ where: { userId, date: { gte: from, lt: to } } })

    const totalsByCat: Record<string, number> = {}
    let total = 0
    for (const e of expenses) {
      const cat = e.category || 'uncategorized'
      totalsByCat[cat] = (totalsByCat[cat] || 0) + e.amount
      total += e.amount
    }

    const allocations: Record<string, number> = {}
    for (const k of Object.keys(totalsByCat)) {
      allocations[k] = Number(((totalsByCat[k] / total) * 100).toFixed(2))
    }

    const budget = await prisma.budget.create({ data: { userId, month, year, allocations } })
    return res.status(201).json({ budget })
  }

  res.setHeader('Allow', ['POST'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}

export default withAuthDb(handler)
