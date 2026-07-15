import { Router, Response } from 'express';
import prisma from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// ── GET /api/leaderboard?scope=locality|neighborhood|global&locality=X&limit=20
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const scope = (req.query.scope as string) || 'locality';
  const locality = (req.query.locality as string) || '';
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

  try {
    let where: Record<string, unknown> = {};

    if (scope === 'locality' && locality) {
      where = { locality };
    } else if (scope === 'neighborhood' && locality) {
      const cityPrefix = locality.split(' ')[0];
      where = { locality: { startsWith: cityPrefix } };
    }

    // We query using the main prisma instance as the API layer has authenticated
    // the request and leaderboard is a cross-user feature.
    const users = await prisma.user.findMany({
      where,
      orderBy: { xp: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        avatar: true,
        xp: true,
        streak: true,
        locality: true,
        badges: {
          select: { badge: { select: { emoji: true } } },
          orderBy: { awardedAt: 'desc' },
          take: 1,
        },
      },
    });

    const ranked = users.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      xp: user.xp,
      streak: user.streak,
      locality: user.locality,
      topBadgeEmoji: user.badges[0]?.badge.emoji ?? null,
    }));

    return res.json({ scope, locality, entries: ranked });
  } catch (e) {
    console.error('Error fetching leaderboard:', e);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;
