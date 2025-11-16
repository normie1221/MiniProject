import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../lib/prisma'
import { getAuth } from '@clerk/nextjs/server'
import withAuthDb from '../../lib/auth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const { period = '6' } = req.query // months to analyze
    const months = parseInt(period as string) || 6

    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1)

    // Get expenses for the period
    const expenses = await prisma.expense.findMany({
      where: { userId, date: { gte: startDate } },
      orderBy: { date: 'asc' }
    })

    // Monthly trend data
    const monthlyData: Record<string, { expenses: number; month: string }> = {}
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyData[key] = {
        month: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
        expenses: 0
      }
    }

    expenses.forEach((exp) => {
      const d = new Date(exp.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (monthlyData[key]) {
        monthlyData[key].expenses += exp.amount
      }
    })

    const monthlyTrend = Object.values(monthlyData)

    // Category breakdown (current month)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthExpenses = expenses.filter((e) => e.date >= startOfMonth)
    
    const categoryBreakdown: Record<string, number> = {}
    currentMonthExpenses.forEach((exp) => {
      const cat = exp.category || 'uncategorized'
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + exp.amount
    })

    const categoryData = Object.entries(categoryBreakdown).map(([name, value]) => ({
      category: name,
      amount: value,
      percentage: Number(((value / currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0)) * 100).toFixed(1))
    }))

    // Top expenses
    const topExpenses = [...expenses]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
      .map((e) => ({
        id: e.id,
        description: e.description || 'No description',
        amount: e.amount,
        category: e.category,
        date: e.date
      }))

    // Weekly spending pattern (current month)
    const weeklyPattern: Record<string, number> = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0
    }

    currentMonthExpenses.forEach((exp) => {
      const dayName = new Date(exp.date).toLocaleDateString('en-US', { weekday: 'long' })
      weeklyPattern[dayName] = (weeklyPattern[dayName] || 0) + exp.amount
    })

    const weeklyData = Object.entries(weeklyPattern).map(([day, amount]) => ({ day, amount }))

    return res.status(200).json({
      period: `${months} months`,
      monthlyTrend,
      categoryBreakdown: categoryData,
      topExpenses,
      weeklySpendingPattern: weeklyData,
      totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
      averageMonthly: expenses.reduce((sum, e) => sum + e.amount, 0) / months
    })
  }

  res.setHeader('Allow', ['GET'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}

export default withAuthDb(handler)
