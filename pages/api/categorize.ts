import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import withAuthDb from '../../lib/auth'

// Lightweight keyword-based categorizer with fallback
const KEYWORDS: Record<string, string[]> = {
  groceries: ['grocery', 'supermarket', 'aldi', 'walmart', 'whole foods'],
  transport: ['uber', 'lyft', 'taxi', 'bus', 'train', 'gas', 'petrol'],
  dining: ['restaurant', 'cafe', 'coffee', 'diner'],
  utilities: ['electricity', 'water', 'gas bill', 'internet', 'phone'],
  entertainment: ['netflix', 'spotify', 'hulu', 'movie', 'concert']
}

function categorize(description: string | undefined) {
  if (!description) return 'uncategorized'
  const desc = description.toLowerCase()
  for (const [cat, kws] of Object.entries(KEYWORDS)) {
    for (const k of kws) if (desc.includes(k)) return cat
  }
  // fallback: unknown
  return 'uncategorized'
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method !== 'POST') return res.status(405).end('Only POST')
  const { description } = req.body
  const category = categorize(description)
  return res.status(200).json({ category, explain: 'keyword-match' })
}

export default withAuthDb(handler)
