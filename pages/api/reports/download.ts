import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'
import { getAuth } from '@clerk/nextjs/server'
import withAuthDb from '../../../lib/auth'

function generateCSV(data: any[], headers: string[]): string {
  const rows = [headers.join(',')]
  data.forEach((item) => {
    const row = headers.map((h) => {
      const val = item[h]
      return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
    })
    rows.push(row.join(','))
  })
  return rows.join('\n')
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const { format = 'json', startDate, endDate } = req.query

    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1)
    const end = endDate ? new Date(endDate as string) : new Date()

    const expenses = await prisma.expense.findMany({
      where: { userId, date: { gte: start, lte: end } },
      orderBy: { date: 'desc' }
    })

    const goals = await prisma.goal.findMany({ where: { userId } })

    const reportData = {
      generatedAt: new Date().toISOString(),
      period: { start: start.toISOString(), end: end.toISOString() },
      summary: {
        totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
        expenseCount: expenses.length,
        averageExpense: expenses.length > 0 ? expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length : 0,
        categories: [...new Set(expenses.map((e) => e.category))].length
      },
      expenses: expenses.map((e) => ({
        date: e.date.toISOString().split('T')[0],
        amount: e.amount,
        category: e.category,
        description: e.description,
        currency: e.currency
      })),
      goals: goals.map((g) => ({
        title: g.title,
        target: g.targetAmt,
        current: g.currentAmt,
        status: g.status,
        deadline: g.deadline ? g.deadline.toISOString().split('T')[0] : null
      }))
    }

    if (format === 'csv') {
      const csv = generateCSV(
        reportData.expenses,
        ['date', 'amount', 'category', 'description', 'currency']
      )
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="finance-report-${Date.now()}.csv"`)
      return res.status(200).send(csv)
    }

    // JSON format (default)
    return res.status(200).json(reportData)
  }

  res.setHeader('Allow', ['GET'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}

export default withAuthDb(handler)
