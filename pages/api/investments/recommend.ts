import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import withAuthDb from '../../../lib/auth'

// Investment recommendation engine based on risk profile
interface InvestmentRecommendation {
  type: string
  name: string
  allocation: number // percentage
  expectedReturn: string
  risk: string
  description: string
}

function generateRecommendations(riskAppetite: 'low' | 'medium' | 'high', monthlyIncome: number): InvestmentRecommendation[] {
  const recommendations: InvestmentRecommendation[] = []

  if (riskAppetite === 'low') {
    recommendations.push({
      type: 'savings',
      name: 'High-Yield Savings Account',
      allocation: 40,
      expectedReturn: '3-5%',
      risk: 'Very Low',
      description: 'Safe option with guaranteed returns and easy liquidity.'
    })
    recommendations.push({
      type: 'bonds',
      name: 'Government Bonds',
      allocation: 30,
      expectedReturn: '4-6%',
      risk: 'Low',
      description: 'Stable returns backed by government securities.'
    })
    recommendations.push({
      type: 'mutual_funds',
      name: 'Debt Mutual Funds',
      allocation: 20,
      expectedReturn: '6-8%',
      risk: 'Low',
      description: 'Diversified debt instruments with stable returns.'
    })
    recommendations.push({
      type: 'stocks',
      name: 'Blue-chip Stocks',
      allocation: 10,
      expectedReturn: '8-12%',
      risk: 'Medium',
      description: 'Established companies with steady growth potential.'
    })
  } else if (riskAppetite === 'medium') {
    recommendations.push({
      type: 'mutual_funds',
      name: 'Balanced Mutual Funds',
      allocation: 35,
      expectedReturn: '8-12%',
      risk: 'Medium',
      description: 'Mix of equity and debt for balanced growth.'
    })
    recommendations.push({
      type: 'stocks',
      name: 'Large-cap Stocks',
      allocation: 30,
      expectedReturn: '10-15%',
      risk: 'Medium',
      description: 'Established companies with growth potential.'
    })
    recommendations.push({
      type: 'index_funds',
      name: 'Index Funds',
      allocation: 20,
      expectedReturn: '10-14%',
      risk: 'Medium',
      description: 'Track market indices with lower fees.'
    })
    recommendations.push({
      type: 'bonds',
      name: 'Corporate Bonds',
      allocation: 15,
      expectedReturn: '6-9%',
      risk: 'Low-Medium',
      description: 'Higher yields than government bonds with acceptable risk.'
    })
  } else {
    recommendations.push({
      type: 'stocks',
      name: 'Growth Stocks',
      allocation: 40,
      expectedReturn: '15-25%',
      risk: 'High',
      description: 'High-growth companies with significant upside potential.'
    })
    recommendations.push({
      type: 'mutual_funds',
      name: 'Equity Mutual Funds',
      allocation: 25,
      expectedReturn: '12-18%',
      risk: 'High',
      description: 'Aggressive equity portfolios for maximum growth.'
    })
    recommendations.push({
      type: 'crypto',
      name: 'Cryptocurrency',
      allocation: 15,
      expectedReturn: '20-50%',
      risk: 'Very High',
      description: 'Digital assets with high volatility and potential returns.'
    })
    recommendations.push({
      type: 'stocks',
      name: 'Small-cap Stocks',
      allocation: 20,
      expectedReturn: '18-30%',
      risk: 'High',
      description: 'Emerging companies with explosive growth potential.'
    })
  }

  return recommendations
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'POST') {
    const { riskAppetite, monthlyIncome } = req.body
    
    if (!riskAppetite || !['low', 'medium', 'high'].includes(riskAppetite)) {
      return res.status(400).json({ error: 'Valid riskAppetite required: low, medium, or high' })
    }

    const income = monthlyIncome ? parseFloat(monthlyIncome) : 0
    const recommendations = generateRecommendations(riskAppetite, income)

    const suggestedInvestmentAmount = income * 0.2 // Suggest 20% of income for investments
    
    return res.status(200).json({
      riskProfile: riskAppetite,
      recommendations,
      suggestedMonthlyInvestment: Math.round(suggestedInvestmentAmount),
      explanation: `Based on your ${riskAppetite} risk appetite, we recommend a diversified portfolio. Consider investing around 20% of your monthly income (${Math.round(suggestedInvestmentAmount)}) across these options.`,
      disclaimer: 'Investment recommendations are for educational purposes only. Consult a financial advisor before making investment decisions.'
    })
  }

  res.setHeader('Allow', ['POST'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}

export default withAuthDb(handler)
