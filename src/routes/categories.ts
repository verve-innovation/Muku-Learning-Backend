import { Router, Response } from 'express';
import { getPrismaForUser } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// ── List all Categories (with optional user progress) ─────────────────────────
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const userPrisma = getPrismaForUser(userId);
    const categories = await userPrisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { words: true } },
        progress: {
          where: { userId },
        },
      },
    });

    const result = categories.map((cat) => {
      const progress = (cat as any).progress?.[0];
      const wordCount = cat._count.words;
      const wordsLearned = progress?.wordsLearned ?? 0;
      const progressPct = wordCount > 0 ? Math.round((wordsLearned / wordCount) * 100) : 0;

      return {
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        emoji: cat.emoji,
        color: cat.color,
        borderColor: cat.borderColor,
        order: cat.order,
        isLocked: cat.isLocked,
        unlockLevel: cat.unlockLevel,
        wordCount,
        wordsLearned,
        progressPct,
      };
    });

    return res.json(result);
  } catch (e) {
    console.error('Error fetching categories:', e);
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ── Get Words for a Category ──────────────────────────────────────────────────
router.get('/:slug/words', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    const slug = req.params.slug as string;
    const userPrisma = getPrismaForUser(userId);
    const category = await userPrisma.category.findUnique({
      where: { slug },
      include: {
        words: { orderBy: { order: 'asc' } },
      },
    });

    if (!category) return res.status(404).json({ error: 'Category not found' });
    return res.json({
      category: { id: category.id, slug: category.slug, name: category.name },
      words: (category as any).words,
    });
  } catch (e) {
    console.error('Error fetching words:', e);
    return res.status(500).json({ error: 'Failed to fetch words' });
  }
});

export default router;
