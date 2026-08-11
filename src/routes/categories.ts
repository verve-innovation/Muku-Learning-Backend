import { Router, Response } from 'express';
import { getPrismaForUser } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// User level is computed offline on the client (from XP) and sent as ?level=N.
// A category unlocks when the user's level meets the category's unlockLevel threshold.
function getRequestedLevel(req: AuthRequest): number {
  const parsed = parseInt(req.query.level as string, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

// ── List all Categories (with optional user progress) ─────────────────────────
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const userPrisma = getPrismaForUser(userId);
    const user = await userPrisma.user.findUnique({ where: { id: userId }, select: { xp: true } });
    const userXp = user?.xp ?? 0;

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
      const progressPct = wordCount > 0 ? Math.min(100, Math.round((wordsLearned / wordCount) * 100)) : 0;

      // Dynamic per-user unlocking based on the user's actual XP from database
      const isLocked = cat.isLocked || userXp < cat.unlockLevel;

      return {
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        emoji: cat.emoji,
        color: cat.color,
        borderColor: cat.borderColor,
        order: cat.order,
        isLocked,
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

// ── List lessons for a category ───────────────────────────────────────────────
router.get('/:slug/lessons', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    const slug = req.params.slug as string;
    const userPrisma = getPrismaForUser(userId);
    const user = await userPrisma.user.findUnique({ where: { id: userId }, select: { xp: true } });
    const userXp = user?.xp ?? 0;

    const category = await userPrisma.category.findUnique({
      where: { slug },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: { _count: { select: { words: true } } },
        },
      },
    });

    if (!category) return res.status(404).json({ error: 'Category not found' });

    // Check if category is locked for this user
    if (category.isLocked || userXp < category.unlockLevel) {
      return res.status(403).json({ error: 'Category is locked' });
    }

    const lessons = (category as any).lessons.map((lesson: any) => ({
      id: lesson.id,
      slug: lesson.slug,
      name: lesson.name,
      order: lesson.order,
      wordCount: lesson._count.words,
    }));

    return res.json({
      category: { id: category.id, slug: category.slug, name: category.name },
      lessons,
    });
  } catch (e) {
    console.error('Error fetching lessons:', e);
    return res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// ── Get Words for a Lesson ────────────────────────────────────────────────────
router.get('/:slug/lessons/:lessonSlug/words', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    const categorySlug = req.params.slug as string;
    const lessonSlug = req.params.lessonSlug as string;
    const userPrisma = getPrismaForUser(userId);
    const user = await userPrisma.user.findUnique({ where: { id: userId }, select: { xp: true } });
    const userXp = user?.xp ?? 0;

    const category = await userPrisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) return res.status(404).json({ error: 'Category not found' });

    if (category.isLocked || userXp < category.unlockLevel) {
      return res.status(403).json({ error: 'Category is locked' });
    }

    const lesson = await userPrisma.lesson.findFirst({
      where: { slug: lessonSlug, categoryId: category.id },
      include: {
        words: { orderBy: { order: 'asc' } },
        fillBlanks: { orderBy: { order: 'asc' } },
      },
    });

    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    return res.json({
      category: { id: category.id, slug: category.slug, name: category.name },
      lesson: { id: lesson.id, slug: lesson.slug, name: lesson.name, order: lesson.order },
      words: (lesson as any).words,
      fillBlanks: (lesson as any).fillBlanks,
    });
  } catch (e) {
    console.error('Error fetching lesson words:', e);
    return res.status(500).json({ error: 'Failed to fetch lesson words' });
  }
});

// ── Get Words for a Category (legacy — all words, first lesson if lessons exist) ─
router.get('/:slug/words', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    const slug = req.params.slug as string;
    const userPrisma = getPrismaForUser(userId);
    const user = await userPrisma.user.findUnique({ where: { id: userId }, select: { xp: true } });
    const userXp = user?.xp ?? 0;

    const category = await userPrisma.category.findUnique({
      where: { slug },
      include: {
        words: { orderBy: { order: 'asc' } },
        lessons: {
          orderBy: { order: 'asc' },
          include: { words: { orderBy: { order: 'asc' } } },
        },
      },
    });

    if (!category) return res.status(404).json({ error: 'Category not found' });

    if (category.isLocked || userXp < category.unlockLevel) {
      return res.status(403).json({ error: 'Category is locked' });
    }

    const lessons = (category as any).lessons ?? [];
    const words = lessons.length > 0
      ? lessons[0].words
      : (category as any).words;

    return res.json({
      category: { id: category.id, slug: category.slug, name: category.name },
      words,
    });
  } catch (e) {
    console.error('Error fetching words:', e);
    return res.status(500).json({ error: 'Failed to fetch words' });
  }
});

export default router;
