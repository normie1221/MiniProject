import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import withAuthDb from '../../../lib/auth'

// Educational modules for financial literacy
const LEARNING_MODULES = [
  {
    id: 'budgeting-basics',
    title: 'Budgeting Basics',
    category: 'Foundations',
    duration: '15 min',
    description: 'Learn how to create and maintain a personal budget.',
    topics: ['50/30/20 rule', 'Fixed vs Variable Expenses', 'Budget Tracking Tools'],
    content: 'A budget helps you understand where your money goes each month. The 50/30/20 rule suggests allocating 50% to needs, 30% to wants, and 20% to savings and debt repayment.'
  },
  {
    id: 'emergency-fund',
    title: 'Building an Emergency Fund',
    category: 'Savings',
    duration: '10 min',
    description: 'Understand the importance of emergency savings and how to build one.',
    topics: ['Why 3-6 months expenses', 'Where to keep emergency fund', 'How to start'],
    content: 'An emergency fund should cover 3-6 months of essential expenses. Keep it in a high-yield savings account for easy access and growth.'
  },
  {
    id: 'debt-management',
    title: 'Smart Debt Management',
    category: 'Debt',
    duration: '20 min',
    description: 'Strategies to manage and eliminate debt effectively.',
    topics: ['Debt Avalanche vs Snowball', 'Good vs Bad Debt', 'Credit Score Impact'],
    content: 'The debt avalanche method (highest interest first) saves more money, while the debt snowball method (smallest balance first) provides psychological wins.'
  },
  {
    id: 'investing-101',
    title: 'Introduction to Investing',
    category: 'Investing',
    duration: '25 min',
    description: 'Basic investment concepts and strategies for beginners.',
    topics: ['Stocks vs Bonds', 'Diversification', 'Risk vs Return', 'Index Funds'],
    content: 'Investing allows your money to grow over time. Start with low-cost index funds for diversification and consider your risk tolerance and time horizon.'
  },
  {
    id: 'retirement-planning',
    title: 'Retirement Planning',
    category: 'Long-term Planning',
    duration: '20 min',
    description: 'Plan for a comfortable retirement with smart strategies.',
    topics: ['401(k) and IRA', 'Compound Interest', 'Retirement Calculators'],
    content: 'Start saving for retirement early to leverage compound interest. Aim to save 15% of your income and take full advantage of employer matching.'
  },
  {
    id: 'tax-basics',
    title: 'Tax Planning Basics',
    category: 'Taxes',
    duration: '18 min',
    description: 'Understand taxes and strategies to minimize your tax burden.',
    topics: ['Tax Deductions', 'Tax Credits', 'Tax-advantaged Accounts'],
    content: 'Maximize tax-advantaged accounts like 401(k) and HSA. Keep records of deductible expenses and consider working with a tax professional.'
  },
  {
    id: 'insurance-guide',
    title: 'Insurance Essentials',
    category: 'Protection',
    duration: '15 min',
    description: 'Types of insurance and how much coverage you need.',
    topics: ['Health Insurance', 'Life Insurance', 'Disability Insurance'],
    content: 'Insurance protects you from financial catastrophe. Essential types include health, auto, home/renters, and life insurance if you have dependents.'
  },
  {
    id: 'credit-score',
    title: 'Understanding Credit Scores',
    category: 'Credit',
    duration: '12 min',
    description: 'How credit scores work and how to improve yours.',
    topics: ['FICO Score Factors', 'Credit Utilization', 'Payment History'],
    content: 'Your credit score affects loan rates and approvals. Pay bills on time, keep credit utilization under 30%, and check your credit report annually.'
  }
]

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    // Return all available modules
    return res.status(200).json({
      modules: LEARNING_MODULES,
      totalModules: LEARNING_MODULES.length,
      categories: [...new Set(LEARNING_MODULES.map(m => m.category))]
    })
  }

  res.setHeader('Allow', ['GET'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}

export default withAuthDb(handler)
