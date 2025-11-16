import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'
import { getAuth } from '@clerk/nextjs/server'
import withAuthDb from '../../../lib/auth'
import { encrypt } from '../../../utils/crypto'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const expenses = await prisma.expense.findMany({ where: { userId } })
    return res.status(200).json({ expenses })
  }

  if (req.method === 'POST') {
    const { amount, currency, category, description, note, date } = req.body
    const encryptedNote = note ? encrypt(String(note)) : null
    const expense = await prisma.expense.create({
      data: {
        userId,
        amount: parseFloat(amount),
        currency: currency || 'USD',
        category,
        description,
        encryptedNote,
        date: date ? new Date(date) : undefined
      }
    })
    return res.status(201).json({ expense })
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}

export default withAuthDb(handler)
