import { getAuth, clerkClient } from '@clerk/nextjs/server'
import prisma from './prisma'
import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'

export function withAuthDb(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const { userId } = getAuth(req)
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      const clerk = await clerkClient()
      const cUser = await clerk.users.getUser(userId)
      const email =
        (cUser.emailAddresses && cUser.emailAddresses[0] && cUser.emailAddresses[0].emailAddress) ||
        // @ts-ignore
        cUser.primaryEmailAddress?.emailAddress ||
        null

      await prisma.user.upsert({
        where: { clerkId: userId },
        create: { clerkId: userId, email },
        update: { email }
      })
    } catch (err) {
      console.error('withAuthDb: failed to sync Clerk user to DB', err)
    }

    return handler(req, res)
  }
}

export default withAuthDb
