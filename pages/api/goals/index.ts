import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'
import { getAuth } from '@clerk/nextjs/server'
import withAuthDb from '../../../lib/auth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
    
    // Calculate progress percentage for each goal
    const goalsWithProgress = goals.map((goal) => ({
      ...goal,
      progressPercentage: goal.targetAmt > 0 ? Math.round((goal.currentAmt / goal.targetAmt) * 100) : 0,
      remainingAmount: Math.max(0, goal.targetAmt - goal.currentAmt)
    }))

    return res.status(200).json({ goals: goalsWithProgress })
  }

  if (req.method === 'POST') {
    const { title, targetAmt, currentAmt, deadline } = req.body
    
    if (!title || !targetAmt) {
      return res.status(400).json({ error: 'Title and target amount are required' })
    }

    const goal = await prisma.goal.create({
      data: {
        userId,
        title: String(title),
        targetAmt: parseFloat(targetAmt),
        currentAmt: currentAmt ? parseFloat(currentAmt) : 0,
        deadline: deadline ? new Date(deadline) : null
      }
    })

    return res.status(201).json({ goal })
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}

export default withAuthDb(handler)
