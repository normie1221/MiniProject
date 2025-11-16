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
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Current month data
    const currentExpenses = await prisma.expense.findMany({
      where: { userId, date: { gte: startOfMonth } }
    })
    const currentIncome = await prisma.income.findMany({
      where: { userId, date: { gte: startOfMonth } }
    })

    // Last month data
    const lastMonthExpensesData = await prisma.expense.findMany({
      where: { userId, date: { gte: startOfLastMonth, lte: endOfLastMonth } }
    })
    const lastMonthIncomeData = await prisma.income.findMany({
      where: { userId, date: { gte: startOfLastMonth, lte: endOfLastMonth } }
    })

    const currentMonthIncome = currentIncome.reduce((sum, i) => sum + i.amount, 0)
    const currentMonthExpenses = currentExpenses.reduce((sum, e) => sum + e.amount, 0)
    const currentSavings = currentMonthIncome - currentMonthExpenses

    const lastMonthIncome = lastMonthIncomeData.reduce((sum, i) => sum + i.amount, 0)
    const lastMonthExpenses = lastMonthExpensesData.reduce((sum, e) => sum + e.amount, 0)
    const lastMonthSavings = lastMonthIncome - lastMonthExpenses

    const savingsRate = currentMonthIncome > 0 ? (currentSavings / currentMonthIncome) * 100 : 0
    const savingsGrowth = lastMonthSavings > 0 ? ((currentSavings - lastMonthSavings) / lastMonthSavings) * 100 : 0

    // Get active goals
    const goals = await prisma.goal.findMany({
      where: { userId, status: 'active' },
      orderBy: { deadline: 'asc' }
    })

    // Calculate how much to save monthly for each goal
    const goalRecommendations = goals.map((goal) => {
      const remaining = goal.targetAmt - goal.currentAmt
      const monthsLeft = goal.deadline
        ? Math.max(1, Math.ceil((goal.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)))
        : 12 // default to 12 months if no deadline
      
      return {
        goalId: goal.id,
        goalTitle: goal.title,
        remainingAmount: remaining,
        suggestedMonthlySaving: Math.ceil(remaining / monthsLeft),
        monthsLeft
      }
    })

    const totalMonthlySavingsNeeded = goalRecommendations.reduce((sum, g) => sum + g.suggestedMonthlySaving, 0)

    // Savings tips
    const tips: string[] = []
    if (savingsRate < 10) {
      tips.push('Try to save at least 10-20% of your income each month.')
      tips.push('Review your subscriptions and cancel unused services.')
    }
    if (savingsRate >= 20) {
      tips.push('Excellent! You\'re saving over 20% of your income.')
    }
    if (currentSavings < 0) {
      tips.push('Warning: You\'re spending more than you earn this month.')
      tips.push('Consider creating a budget and tracking expenses carefully.')
    }
    if (goals.length === 0) {
      tips.push('Set financial goals to stay motivated and focused.')
    }

    return res.status(200).json({
      currentMonth: {
        income: currentMonthIncome,
        expenses: currentMonthExpenses,
        savings: currentSavings,
        savingsRate: Number(savingsRate.toFixed(2))
      },
      lastMonth: {
        income: lastMonthIncome,
        expenses: lastMonthExpenses,
        savings: lastMonthSavings
      },
      trends: {
        savingsGrowth: Number(savingsGrowth.toFixed(2)),
        expenseChange: lastMonthExpenses > 0 ? Number((((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100).toFixed(2)) : 0
      },
      goalProgress: goalRecommendations,
      totalMonthlySavingsNeeded,
      savingsShortfall: Math.max(0, totalMonthlySavingsNeeded - currentSavings),
      tips
    })
  }

  res.setHeader('Allow', ['GET'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}

export default withAuthDb(handler)
