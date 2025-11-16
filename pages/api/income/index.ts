import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'
import { getAuth } from '@clerk/nextjs/server'
import withAuthDb from '../../../lib/auth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const incomes = await prisma.income.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    })
    return res.status(200).json({ incomes })
  }

  if (req.method === 'POST') {
    const { amount, source, description, date, recurring } = req.body
    
    if (!amount || !source) {
      return res.status(400).json({ error: 'Amount and source are required' })
    }

    const income = await prisma.income.create({
      data: {
        userId,
        amount: parseFloat(amount),
        source: String(source),
        description: description || null,
        date: date ? new Date(date) : undefined,
        recurring: recurring === true
      }
    })

    return res.status(201).json({ income })
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}

export default withAuthDb(handler)
