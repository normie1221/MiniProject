import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'
import { getAuth } from '@clerk/nextjs/server'
import withAuthDb from '../../../lib/auth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { id } = req.query
  if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' })

  if (req.method === 'GET') {
    const goal = await prisma.goal.findUnique({ where: { id } })
    if (!goal || goal.userId !== userId) return res.status(404).json({ error: 'Not found' })
    return res.status(200).json({ goal })
  }

  if (req.method === 'PUT') {
    const { title, targetAmt, currentAmt, deadline, status } = req.body
    const goal = await prisma.goal.findUnique({ where: { id } })
    if (!goal || goal.userId !== userId) return res.status(404).json({ error: 'Not found' })

    const updated = await prisma.goal.update({
      where: { id },
      data: {
        title: title !== undefined ? String(title) : undefined,
        targetAmt: targetAmt !== undefined ? parseFloat(targetAmt) : undefined,
        currentAmt: currentAmt !== undefined ? parseFloat(currentAmt) : undefined,
        deadline: deadline !== undefined ? (deadline ? new Date(deadline) : null) : undefined,
        status: status || undefined
      }
    })

    return res.status(200).json({ goal: updated })
  }

  if (req.method === 'DELETE') {
    const goal = await prisma.goal.findUnique({ where: { id } })
    if (!goal || goal.userId !== userId) return res.status(404).json({ error: 'Not found' })
    
    await prisma.goal.delete({ where: { id } })
    return res.status(204).end()
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}

export default withAuthDb(handler)
