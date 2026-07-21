import { Router, Response } from 'express';
import { getPrismaForUser } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// ── List all Categories (with optional user progress) ─────────────────────────
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const userPrisma = getPrismaForUser(userId);
    const user = await userPrisma.user.findUnique({
      where: { id: userId },
      select: { xp: true },
    });
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

      // Dynamic unlocking based on XP
      let isLocked = cat.isLocked;
      if (cat.order === 1) {
        isLocked = false;
      } else if (cat.order === 2 && userXp >= 50) {
        isLocked = false;
      } else if (cat.order === 3 && userXp >= 100) {
        isLocked = false;
      } else if (cat.order === 4 && userXp >= 150) {
        isLocked = false;
      } else if (cat.order === 5 && userXp >= 200) {
        isLocked = false;
      }

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

    const category = await userPrisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) return res.status(404).json({ error: 'Category not found' });

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
