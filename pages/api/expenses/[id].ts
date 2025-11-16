import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'
import { getAuth } from '@clerk/nextjs/server'
import withAuthDb from '../../../lib/auth'
import { decrypt } from '../../../utils/crypto'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.query
  if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' })

  if (req.method === 'GET') {
    const expense = await prisma.expense.findUnique({ where: { id } })
    if (!expense || expense.userId !== userId) return res.status(404).json({ error: 'Not found' })
    const note = expense.encryptedNote ? decrypt(expense.encryptedNote) : null
    return res.status(200).json({ ...expense, note })
  }

  if (req.method === 'PUT') {
    const body = req.body
    const updated = await prisma.expense.update({ where: { id }, data: body })
    return res.status(200).json({ updated })
  }

  if (req.method === 'DELETE') {
    await prisma.expense.delete({ where: { id } })
    return res.status(204).end()
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}

export default withAuthDb(handler)
