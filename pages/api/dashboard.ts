import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../lib/prisma'
import { getAuth } from '@clerk/nextjs/server'
import withAuthDb from '../../lib/auth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOf6MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)

    // Fetch all data in parallel
    const [
      expenses,
      incomes,
      goals,
      fraudAlerts,
      recentExpenses
    ] = await Promise.all([
      prisma.expense.findMany({ where: { userId, date: { gte: startOfMonth } } }),
      prisma.income.findMany({ where: { userId, date: { gte: startOfMonth } } }),
      prisma.goal.findMany({ where: { userId, status: 'active' } }),
      prisma.fraudAlert.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.expense.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 10 })
    ])

    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const currentSavings = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? (currentSavings / totalIncome) * 100 : 0

    // Calculate expense by category
    const categoryTotals: Record<string, number> = {}
    expenses.forEach((e) => {
      const cat = e.category || 'uncategorized'
      categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount
    })

    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }))

    // Calculate goal progress
    const goalsProgress = goals.map((g) => ({
      id: g.id,
      title: g.title,
      progress: g.targetAmt > 0 ? Math.round((g.currentAmt / g.targetAmt) * 100) : 0,
      remaining: g.targetAmt - g.currentAmt
    }))

    // Upcoming bills / recurring expenses (placeholder - would need recurring expense tracking)
    const upcomingBills: any[] = []

    return res.status(200).json({
      summary: {
        totalIncome,
        totalExpenses,
        currentSavings,
        savingsRate: Number(savingsRate.toFixed(2)),
        transactionCount: expenses.length + incomes.length
      },
      topCategories,
      goals: goalsProgress,
      recentTransactions: recentExpenses.map((e) => ({
        id: e.id,
        type: 'expense',
        amount: e.amount,
        category: e.category,
        description: e.description,
        date: e.date
      })),
      alerts: {
        fraudAlerts: fraudAlerts.length,
        recentAlerts: fraudAlerts.slice(0, 3).map((a) => ({
          id: a.id,
          score: a.score,
          reason: a.reason,
          date: a.createdAt
        }))
      },
      upcomingBills
    })
  }

  res.setHeader('Allow', ['GET'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}

export default withAuthDb(handler)
