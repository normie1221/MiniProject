import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../lib/prisma'
import { getAuth } from '@clerk/nextjs/server'
import withAuthDb from '../../lib/auth'

interface FinancialHealth {
  score: number // 0-100
  grade: string // A, B, C, D, F
  metrics: {
    monthlyIncome: number
    monthlyExpenses: number
    savingsRate: number
    expenseToIncomeRatio: number
    budgetAdherence: number
  }
  insights: string[]
  recommendations: string[]
  explanation: string
}

async function calculateFinancialHealth(userId: string): Promise<FinancialHealth> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  // Get current month data
  const expenses = await prisma.expense.findMany({
    where: { userId, date: { gte: startOfMonth, lte: endOfMonth } }
  })

  const incomes = await prisma.income.findMany({
    where: { userId, date: { gte: startOfMonth, lte: endOfMonth } }
  })

  const monthlyIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0)
  const monthlyExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0
  const expenseToIncomeRatio = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 100

  // Calculate budget adherence
  const budget = await prisma.budget.findFirst({
    where: { userId, month: now.getMonth() + 1, year: now.getFullYear() },
    orderBy: { createdAt: 'desc' }
  })

  let budgetAdherence = 100
  if (budget) {
    // Simple adherence: if under budget = 100%, over by 10% = 90%, etc.
    const allocations = budget.allocations as Record<string, number>
    const totalBudget = Object.values(allocations).reduce((a, b) => a + b, 0)
    if (totalBudget > 0) {
      budgetAdherence = Math.max(0, 100 - Math.abs(monthlyExpenses - totalBudget) / totalBudget * 100)
    }
  }

  // Calculate overall score (weighted average)
  let score = 0
  score += Math.min(savingsRate * 2, 40) // 40% weight: savings rate
  score += Math.max(0, 30 - expenseToIncomeRatio * 0.3) // 30% weight: expense ratio
  score += budgetAdherence * 0.3 // 30% weight: budget adherence

  score = Math.round(Math.max(0, Math.min(100, score)))

  // Grade
  let grade = 'F'
  if (score >= 90) grade = 'A'
  else if (score >= 80) grade = 'B'
  else if (score >= 70) grade = 'C'
  else if (score >= 60) grade = 'D'

  // Insights
  const insights: string[] = []
  if (savingsRate > 20) insights.push('Excellent savings rate! You are saving over 20% of your income.')
  else if (savingsRate > 10) insights.push('Good savings rate. Try to increase it to 20% or more.')
  else if (savingsRate > 0) insights.push('Your savings rate is low. Consider reducing expenses.')
  else insights.push('Warning: You are spending more than you earn this month.')

  if (expenseToIncomeRatio > 90) insights.push('You are spending almost all your income.')
  if (budgetAdherence < 50) insights.push('You are significantly over or under your budget.')

  // Recommendations
  const recommendations: string[] = []
  if (savingsRate < 15) recommendations.push('Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.')
  if (expenseToIncomeRatio > 80) recommendations.push('Look for ways to reduce discretionary spending.')
  if (monthlyIncome === 0) recommendations.push('Add your income sources to get accurate analysis.')
  
  const explanation = `Score based on: savings rate (${savingsRate.toFixed(1)}%), expense ratio (${expenseToIncomeRatio.toFixed(1)}%), and budget adherence (${budgetAdherence.toFixed(1)}%).`

  return {
    score,
    grade,
    metrics: {
      monthlyIncome,
      monthlyExpenses,
      savingsRate: Number(savingsRate.toFixed(2)),
      expenseToIncomeRatio: Number(expenseToIncomeRatio.toFixed(2)),
      budgetAdherence: Number(budgetAdherence.toFixed(2))
    },
    insights,
    recommendations,
    explanation
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const health = await calculateFinancialHealth(userId)
    return res.status(200).json(health)
  }

  res.setHeader('Allow', ['GET'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}

export default withAuthDb(handler)
